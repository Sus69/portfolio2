/**
 * Interactive Fluid Identity Reveal
 * High-performance WebGL Navier-Stokes Fluid Simulation & Reveal Mask Engine
 */

(function () {
  'use strict';

  // Simulation Grid Resolution
  const SIM_RES_X = 256;
  const SIM_RES_Y = 144; // Aspect matching 1670:941

  // Default Fluid Physics & Rendering Parameters
  const CONFIG = {
    velocityDissipation: 0.985, // Higher = keeps swirling longer
    densityDissipation: 0.976,  // Rate at which fluid dissipates
    curlStrength: 34.0,         // Vorticity confinement (organic eddies)
    pressureIterations: 24,     // Jacobi solver iterations
    splatRadius: 0.0075,        // Generous liquid stream width covering whole body
    splatForce: 75.0,           // Force applied by cursor velocity
    meniscusSpec: 0.50,         // Specular highlight on liquid edge
    refraction: 0.010,          // Optical distortion at fluid boundary
    realScale: 0.95              // Subtle scale boost for photorealistic portrait (1.1x)
  };

  const canvas = document.getElementById('fluid-canvas');
  if (!canvas) return;

  // WebGL Context Initialization
  const gl = canvas.getContext('webgl2', {
    alpha: true,
    depth: false,
    stencil: false,
    antialias: false,
    preserveDrawingBuffer: false,
    premultipliedAlpha: true
  }) || canvas.getContext('webgl', {
    alpha: true,
    depth: false,
    stencil: false,
    antialias: false,
    preserveDrawingBuffer: false,
    premultipliedAlpha: true
  });

  if (!gl) {
    console.error('WebGL is not supported by this browser.');
    return;
  }

  const isWebGL2 = ('WebGL2RenderingContext' in window) && (gl instanceof WebGL2RenderingContext);

  // Floating-point texture support detection
  let internalFormat, format, type, linearFilter;

  if (isWebGL2) {
    gl.getExtension('EXT_color_buffer_float');
    const extLinear = gl.getExtension('OES_texture_float_linear');
    internalFormat = gl.RGBA16F;
    format = gl.RGBA;
    type = gl.HALF_FLOAT;
    linearFilter = extLinear ? gl.LINEAR : gl.NEAREST;
  } else {
    const extHalfFloat = gl.getExtension('OES_texture_half_float');
    const extHalfLinear = gl.getExtension('OES_texture_half_float_linear');
    internalFormat = gl.RGBA;
    format = gl.RGBA;
    type = extHalfFloat ? extHalfFloat.HALF_FLOAT_OES : gl.UNSIGNED_BYTE;
    linearFilter = extHalfLinear ? gl.LINEAR : gl.NEAREST;
  }

  // Shader compilation utility
  function compileShader(shaderType, source) {
    const s = gl.createShader(shaderType);
    gl.shaderSource(s, source);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      const err = gl.getShaderInfoLog(s);
      gl.deleteShader(s);
      throw new Error('Shader compilation error: ' + err);
    }
    return s;
  }

  function createProgram(vsSource, fsSource) {
    const prog = gl.createProgram();
    const vs = compileShader(gl.VERTEX_SHADER, vsSource);
    const fs = compileShader(gl.FRAGMENT_SHADER, fsSource);
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.bindAttribLocation(prog, 0, 'aPosition');
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      const err = gl.getProgramInfoLog(prog);
      gl.deleteProgram(prog);
      throw new Error('Program link error: ' + err);
    }
    return prog;
  }

  // Base Vertex Shader for Simulation Passes
  const baseVS = `
    precision highp float;
    attribute vec2 aPosition;
    varying vec2 vUv;
    varying vec2 vL;
    varying vec2 vR;
    varying vec2 vT;
    varying vec2 vB;
    uniform vec2 uTexelSize;

    void main() {
      vUv = aPosition * 0.5 + 0.5;
      vL = vUv - vec2(uTexelSize.x, 0.0);
      vR = vUv + vec2(uTexelSize.x, 0.0);
      vT = vUv + vec2(0.0, uTexelSize.y);
      vB = vUv - vec2(0.0, uTexelSize.y);
      gl_Position = vec4(aPosition, 0.0, 1.0);
    }
  `;

  // Clear Pass Shader
  const clearFS = `
    precision highp float;
    varying vec2 vUv;
    uniform sampler2D uSource;
    uniform float uDecay;
    void main() {
      gl_FragColor = texture2D(uSource, vUv) * uDecay;
    }
  `;

  // Advection Shader
  const advectFS = `
    precision highp float;
    varying vec2 vUv;
    uniform sampler2D uVelocity;
    uniform sampler2D uSource;
    uniform vec2 uTexelSize;
    uniform float uDt;
    uniform float uDissipation;

    void main() {
      vec2 vel = texture2D(uVelocity, vUv).xy;
      vec2 coord = vUv - uDt * vel * uTexelSize;
      gl_FragColor = texture2D(uSource, coord) * uDissipation;
    }
  `;

  // Splatting (Force & Density Injection)
  const splatFS = `
    precision highp float;
    varying vec2 vUv;
    uniform sampler2D uTarget;
    uniform vec2 uPoint;
    uniform vec3 uColor;
    uniform float uRadius;
    uniform float uAspectRatio;

    void main() {
      vec2 p = vUv - uPoint;
      p.x *= uAspectRatio;
      float splat = exp(-dot(p, p) / uRadius);
      vec3 base = texture2D(uTarget, vUv).xyz;
      gl_FragColor = vec4(base + uColor * splat, 1.0);
    }
  `;

  // Vorticity / Curl Calculation
  const curlFS = `
    precision highp float;
    varying vec2 vL;
    varying vec2 vR;
    varying vec2 vT;
    varying vec2 vB;
    uniform sampler2D uVelocity;

    void main() {
      float L = texture2D(uVelocity, vL).y;
      float R = texture2D(uVelocity, vR).y;
      float T = texture2D(uVelocity, vT).x;
      float B = texture2D(uVelocity, vB).x;
      float vorticity = (R - L) - (T - B);
      gl_FragColor = vec4(0.5 * vorticity, 0.0, 0.0, 1.0);
    }
  `;

  // Vorticity Confinement
  const vorticityFS = `
    precision highp float;
    varying vec2 vUv;
    varying vec2 vL;
    varying vec2 vR;
    varying vec2 vT;
    varying vec2 vB;
    uniform sampler2D uVelocity;
    uniform sampler2D uCurl;
    uniform float uCurlStrength;
    uniform float uDt;

    void main() {
      float L = texture2D(uCurl, vL).x;
      float R = texture2D(uCurl, vR).x;
      float T = texture2D(uCurl, vT).x;
      float B = texture2D(uCurl, vB).x;
      float C = texture2D(uCurl, vUv).x;

      vec2 force = 0.5 * vec2(abs(T) - abs(B), abs(R) - abs(L));
      force /= length(force) + 0.0001;
      force *= uCurlStrength * C * vec2(1.0, -1.0);
      vec2 vel = texture2D(uVelocity, vUv).xy;
      gl_FragColor = vec4(vel + force * uDt, 0.0, 1.0);
    }
  `;

  // Velocity Divergence
  const divergenceFS = `
    precision highp float;
    varying vec2 vUv;
    varying vec2 vL;
    varying vec2 vR;
    varying vec2 vT;
    varying vec2 vB;
    uniform sampler2D uVelocity;

    void main() {
      float L = texture2D(uVelocity, vL).x;
      float R = texture2D(uVelocity, vR).x;
      float T = texture2D(uVelocity, vT).y;
      float B = texture2D(uVelocity, vB).y;
      vec2 C = texture2D(uVelocity, vUv).xy;
      if (vL.x < 0.0) L = -C.x;
      if (vR.x > 1.0) R = -C.x;
      if (vB.y < 0.0) B = -C.y;
      if (vT.y > 1.0) T = -C.y;
      float div = 0.5 * (R - L + T - B);
      gl_FragColor = vec4(div, 0.0, 0.0, 1.0);
    }
  `;

  // Pressure Poisson Solver (Jacobi)
  const pressureFS = `
    precision highp float;
    varying vec2 vUv;
    varying vec2 vL;
    varying vec2 vR;
    varying vec2 vT;
    varying vec2 vB;
    uniform sampler2D uPressure;
    uniform sampler2D uDivergence;

    void main() {
      float L = texture2D(uPressure, vL).x;
      float R = texture2D(uPressure, vR).x;
      float T = texture2D(uPressure, vT).x;
      float B = texture2D(uPressure, vB).x;
      float div = texture2D(uDivergence, vUv).x;
      float pressure = (L + R + B + T - div) * 0.25;
      gl_FragColor = vec4(pressure, 0.0, 0.0, 1.0);
    }
  `;

  // Pressure Gradient Subtraction
  const gradSubtractFS = `
    precision highp float;
    varying vec2 vUv;
    varying vec2 vL;
    varying vec2 vR;
    varying vec2 vT;
    varying vec2 vB;
    uniform sampler2D uPressure;
    uniform sampler2D uVelocity;

    void main() {
      float L = texture2D(uPressure, vL).x;
      float R = texture2D(uPressure, vR).x;
      float T = texture2D(uPressure, vT).x;
      float B = texture2D(uPressure, vB).x;
      vec2 vel = texture2D(uVelocity, vUv).xy;
      vel -= vec2(R - L, T - B) * 0.5;
      gl_FragColor = vec4(vel, 0.0, 1.0);
    }
  `;

  // Final Reveal & Surface Lighting Fragment Shader
  const displayVS = `
    precision highp float;
    attribute vec2 aPosition;
    varying vec2 vUv;
    void main() {
      vUv = aPosition * 0.5 + 0.5;
      gl_Position = vec4(aPosition, 0.0, 1.0);
    }
  `;

  const displayFS = `
    precision highp float;
    varying vec2 vUv;
    uniform sampler2D uDensity;
    uniform sampler2D uAnimated;
    uniform sampler2D uReal;
    uniform vec4 uPortraitRect; // x, y, width, height (normalized scene UV)
    uniform vec2 uRealScale;
    uniform vec2 uRealOffset;
    uniform vec2 uResolution;
    uniform float uMeniscusSpec;
    uniform float uRefraction;

    void main() {
      // Sample fluid density
      float density = texture2D(uDensity, vUv).r;

      // Sample density neighborhood to compute fluid surface gradient
      vec2 texel = 1.0 / uResolution;
      float dR = texture2D(uDensity, vUv + vec2(texel.x, 0.0)).r;
      float dL = texture2D(uDensity, vUv - vec2(texel.x, 0.0)).r;
      float dU = texture2D(uDensity, vUv + vec2(0.0, texel.y)).r;
      float dD = texture2D(uDensity, vUv - vec2(0.0, texel.y)).r;
      vec2 grad = vec2(dR - dL, dU - dD);
      float edge = length(grad);

      // Organic fluid reveal threshold curve - responsive across whole body
      float reveal = smoothstep(0.02, 0.22, density);

      // Light direction aligned with the yellow sun in the background (upper-left)
      vec3 lightDir = normalize(vec3(-0.45, 0.75, 0.60));
      vec3 normal = normalize(vec3(-grad * 22.0, 1.0));
      float spec = pow(max(0.0, dot(reflect(-lightDir, normal), vec3(0.0, 0.0, 1.0))), 20.0);

      // Check if current pixel lies within portrait bounds
      vec2 pRectPos = uPortraitRect.xy;
      vec2 pRectSize = uPortraitRect.zw;

      bool inPortrait = (vUv.x >= pRectPos.x && vUv.x <= pRectPos.x + pRectSize.x &&
                         vUv.y >= pRectPos.y && vUv.y <= pRectPos.y + pRectSize.y);

      if (inPortrait) {
        // Map screen UV to portrait UV [0, 1]
        vec2 pUV = (vUv - pRectPos) / pRectSize;
        vec2 animUV = vec2(pUV.x, 1.0 - pUV.y);

        // Subtle chromatic dispersion at the fluid meniscus edge
        float refrFactor = uRefraction * (1.0 - reveal) * smoothstep(0.0, 0.12, density);
        vec2 refrR = animUV + grad * refrFactor * 1.25;
        vec2 refrG = animUV + grad * refrFactor;
        vec2 refrB = animUV + grad * refrFactor * 0.75;

        vec4 colAnim;
        colAnim.r = texture2D(uAnimated, clamp(refrR, 0.0, 1.0)).r;
        colAnim.g = texture2D(uAnimated, clamp(refrG, 0.0, 1.0)).g;
        colAnim.b = texture2D(uAnimated, clamp(refrB, 0.0, 1.0)).b;
        colAnim.a = texture2D(uAnimated, clamp(animUV, 0.0, 1.0)).a;

        // Sample photorealistic portrait with precision geometric alignment
        vec2 realUV = animUV * uRealScale + uRealOffset;
        vec4 colReal = texture2D(uReal, clamp(realUV, 0.0, 1.0));

        // Smooth liquid reveal blend
        vec4 portraitCol = mix(colAnim, colReal, reveal);

        // Liquid meniscus highlight (gleam along the liquid wave edge)
        float meniscus = smoothstep(0.03, 0.18, density) * (1.0 - smoothstep(0.20, 0.45, density)) * edge * 7.5;
        vec3 rimColor = vec3(1.0, 0.98, 0.93) * (meniscus * uMeniscusSpec + spec * 0.35);
        portraitCol.rgb += rimColor;

        // Premultiply alpha for WebGL composition over the background
        portraitCol.rgb *= portraitCol.a;
        gl_FragColor = portraitCol;
      } else {
        // Outside portrait: glassy translucent ripple over the background
        float bgMeniscus = smoothstep(0.03, 0.18, density) * (1.0 - smoothstep(0.20, 0.45, density)) * edge * 4.5;
        float alpha = clamp(bgMeniscus * 0.35 + spec * 0.25, 0.0, 1.0);
        vec3 bgHighlight = vec3(1.0, 0.98, 0.94) * alpha;
        gl_FragColor = vec4(bgHighlight, alpha);
      }
    }
  `;

  // Create Shader Programs
  const clearProg = createProgram(baseVS, clearFS);
  const advectProg = createProgram(baseVS, advectFS);
  const splatProg = createProgram(baseVS, splatFS);
  const curlProg = createProgram(baseVS, curlFS);
  const vorticityProg = createProgram(baseVS, vorticityFS);
  const divergenceProg = createProgram(baseVS, divergenceFS);
  const pressureProg = createProgram(baseVS, pressureFS);
  const gradSubtractProg = createProgram(baseVS, gradSubtractFS);
  const displayProg = createProgram(displayVS, displayFS);

  // Fullscreen Geometry Buffer
  const quadBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
    -1, -1,
    1, -1,
    -1, 1,
    -1, 1,
    1, -1,
    1, 1
  ]), gl.STATIC_DRAW);

  // Framebuffer Factory
  function createFBO(w, h, intFmt, fmt, tp, filter) {
    gl.activeTexture(gl.TEXTURE0);
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, intFmt, w, h, 0, fmt, tp, null);

    const fbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
    gl.viewport(0, 0, w, h);
    gl.clear(gl.COLOR_BUFFER_BIT);

    return {
      fbo,
      texture,
      width: w,
      height: h,
      attach: function (id) {
        gl.activeTexture(gl.TEXTURE0 + id);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        return id;
      }
    };
  }

  function createDoubleFBO(w, h, intFmt, fmt, tp, filter) {
    let fbo1 = createFBO(w, h, intFmt, fmt, tp, filter);
    let fbo2 = createFBO(w, h, intFmt, fmt, tp, filter);
    return {
      width: w,
      height: h,
      texelSizeX: 1.0 / w,
      texelSizeY: 1.0 / h,
      read: function () { return fbo1; },
      write: function () { return fbo2; },
      swap: function () {
        const tmp = fbo1;
        fbo1 = fbo2;
        fbo2 = tmp;
      }
    };
  }

  // Allocate Simulation Framebuffers
  const velocity = createDoubleFBO(SIM_RES_X, SIM_RES_Y, internalFormat, format, type, linearFilter);
  const density = createDoubleFBO(SIM_RES_X, SIM_RES_Y, internalFormat, format, type, linearFilter);
  const pressure = createDoubleFBO(SIM_RES_X, SIM_RES_Y, internalFormat, format, type, gl.NEAREST);
  const divergence = createFBO(SIM_RES_X, SIM_RES_Y, internalFormat, format, type, gl.NEAREST);
  const curl = createFBO(SIM_RES_X, SIM_RES_Y, internalFormat, format, type, gl.NEAREST);

  // Render pass blit helper
  function blit(destFbo) {
    if (destFbo) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, destFbo.fbo);
      gl.viewport(0, 0, destFbo.width, destFbo.height);
    } else {
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, canvas.width, canvas.height);
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(0);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }

  // Splat impulse injection into velocity & density fields
  function splat(x, y, dx, dy, color, radius) {
    const rad = radius || CONFIG.splatRadius;
    gl.useProgram(splatProg);
    gl.uniform1i(gl.getUniformLocation(splatProg, 'uTarget'), velocity.read().attach(0));
    gl.uniform1f(gl.getUniformLocation(splatProg, 'uAspectRatio'), SIM_RES_X / SIM_RES_Y);
    gl.uniform2f(gl.getUniformLocation(splatProg, 'uPoint'), x, y);
    gl.uniform3f(gl.getUniformLocation(splatProg, 'uColor'), dx, dy, 0.0);
    gl.uniform1f(gl.getUniformLocation(splatProg, 'uRadius'), rad);
    blit(velocity.write());
    velocity.swap();

    gl.uniform1i(gl.getUniformLocation(splatProg, 'uTarget'), density.read().attach(0));
    gl.uniform3f(gl.getUniformLocation(splatProg, 'uColor'), color[0], color[1], color[2]);
    blit(density.write());
    density.swap();
  }

  // Texture loading helper
  function loadTexture(source) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const tex = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
        resolve(tex);
      };
      img.onerror = reject;
      img.src = source;
    });
  }

  // Set Background DOM Image
  const bgImg = document.getElementById('bg-img');
  if (bgImg && window.ASSETS && window.ASSETS.BACKGROUND_IMAGE) {
    bgImg.src = window.ASSETS.BACKGROUND_IMAGE;
  }

  let texAnimated = null;
  let texReal = null;

  // Load identity portrait textures
  const animSrc = (window.ASSETS && window.ASSETS.ANIMATED_IMAGE) || 'ANIMATED.svg';
  const realSrc = (window.ASSETS && window.ASSETS.REAL_IMAGE) || 'REAL.webp';

  Promise.all([
    loadTexture(animSrc),
    loadTexture(realSrc)
  ]).then(([tAnim, tReal]) => {
    texAnimated = tAnim;
    texReal = tReal;

    // Trigger auto-demo intro wave across the portrait
    playIntroWave();

    // Start simulation animation loop
    requestAnimationFrame(render);
  }).catch(err => {
    console.error('Failed to load identity portrait textures:', err);
  });

  // Pointer tracking with sub-pixel interpolation for silky ribbons
  const pointer = {
    x: 0.5,
    y: 0.5,
    prevX: 0.5,
    prevY: 0.5,
    dx: 0,
    dy: 0,
    down: false,
    active: false,
    hasUserInteracted: false
  };

  function handlePointerMove(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    if (clientX < rect.left || clientX > rect.right || clientY < rect.top || clientY > rect.bottom) {
      pointer.active = false;
      pointer.dx = 0;
      pointer.dy = 0;
      return;
    }

    const nx = (clientX - rect.left) / rect.width;
    const ny = 1.0 - (clientY - rect.top) / rect.height; // Invert for WebGL

    if (!pointer.active) {
      pointer.x = nx;
      pointer.y = ny;
      pointer.prevX = nx;
      pointer.prevY = ny;
      pointer.active = true;
      return;
    }

    pointer.prevX = pointer.x;
    pointer.prevY = pointer.y;
    pointer.x = nx;
    pointer.y = ny;
    pointer.dx = (pointer.x - pointer.prevX) * CONFIG.splatForce;
    pointer.dy = (pointer.y - pointer.prevY) * CONFIG.splatForce;

    if (!pointer.hasUserInteracted) {
      pointer.hasUserInteracted = true;
      const hint = document.querySelector('.portrait-hint');
      if (hint) hint.style.opacity = '0';
    }

    // Interpolate steps along fast cursor movements for continuous fluid streams
    const dist = Math.hypot(pointer.x - pointer.prevX, pointer.y - pointer.prevY);
    const steps = Math.max(1, Math.min(8, Math.floor(dist * 60.0)));
    for (let i = 1; i <= steps; i++) {
      const alpha = i / steps;
      const px = pointer.prevX + (pointer.x - pointer.prevX) * alpha;
      const py = pointer.prevY + (pointer.y - pointer.prevY) * alpha;
      const rad = CONFIG.splatRadius * (1.0 + Math.min(dist * 5.0, 1.2));
      splat(px, py, pointer.dx, pointer.dy, [1.0, 1.0, 1.0], rad);
    }
  }

  // Event listeners scoped to hero container to avoid interfering with portfolio sections beneath
  const heroContainer = document.getElementById('scene-container') || canvas;

  heroContainer.addEventListener('pointermove', e => {
    handlePointerMove(e.clientX, e.clientY);
  });

  heroContainer.addEventListener('touchmove', e => {
    if (e.touches.length > 0) {
      handlePointerMove(e.touches[0].clientX, e.touches[0].clientY);
    }
  }, { passive: true });

  heroContainer.addEventListener('pointerleave', () => {
    pointer.active = false;
    pointer.dx = 0;
    pointer.dy = 0;
  });

  heroContainer.addEventListener('touchend', () => {
    pointer.active = false;
    pointer.dx = 0;
    pointer.dy = 0;
  });

  window.addEventListener('blur', () => {
    pointer.active = false;
    pointer.dx = 0;
    pointer.dy = 0;
  });

  // Auto-demonstration wave cascading across the whole body from head to shorts
  function playIntroWave() {
    let t = 0;
    const waveInterval = setInterval(() => {
      t += 0.035;
      if (t >= 1.0) {
        clearInterval(waveInterval);
        return;
      }
      // Cascading wave flowing from cat/head (y=0.78) all the way down through chest, torso, and shorts (y=0.08)
      const y = 0.78 - 0.70 * t;
      const xCenter = 0.50 + 0.04 * Math.sin(t * Math.PI * 3.0);
      const vx = 5.0 * Math.cos(t * Math.PI * 3.0);
      const vy = -8.0;

      // Splat center and flank to cover full shoulder and body width
      splat(xCenter, y, vx, vy, [1.0, 1.0, 1.0], CONFIG.splatRadius * 1.6);
      splat(xCenter - 0.035, y, vx - 2.0, vy, [1.0, 1.0, 1.0], CONFIG.splatRadius * 1.4);
      splat(xCenter + 0.035, y, vx + 2.0, vy, [1.0, 1.0, 1.0], CONFIG.splatRadius * 1.4);
    }, 28);
  }

  // Simulation step execution
  let lastTimestamp = performance.now();

  function render(timestamp) {
    const now = (typeof timestamp === 'number' && timestamp > 0) ? timestamp : performance.now();
    const dt = Math.max(0.001, Math.min((now - (lastTimestamp || now)) / 1000.0, 0.033));
    lastTimestamp = now;

    // Viewport resize check
    const displayWidth = canvas.clientWidth;
    const displayHeight = canvas.clientHeight;
    if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
      canvas.width = displayWidth;
      canvas.height = displayHeight;
    }

    // Performance: Pause simulation compute when hero is scrolled completely offscreen
    const rect = canvas.getBoundingClientRect();
    if (rect.bottom < 0 || rect.top > window.innerHeight) {
      requestAnimationFrame(render);
      return;
    }

    // 1. Compute Vorticity / Curl
    gl.useProgram(curlProg);
    gl.uniform2f(gl.getUniformLocation(curlProg, 'uTexelSize'), velocity.texelSizeX, velocity.texelSizeY);
    gl.uniform1i(gl.getUniformLocation(curlProg, 'uVelocity'), velocity.read().attach(0));
    blit(curl);

    // 2. Vorticity Confinement (Swirling Eddies)
    gl.useProgram(vorticityProg);
    gl.uniform2f(gl.getUniformLocation(vorticityProg, 'uTexelSize'), velocity.texelSizeX, velocity.texelSizeY);
    gl.uniform1i(gl.getUniformLocation(vorticityProg, 'uVelocity'), velocity.read().attach(0));
    gl.uniform1i(gl.getUniformLocation(vorticityProg, 'uCurl'), curl.attach(1));
    gl.uniform1f(gl.getUniformLocation(vorticityProg, 'uCurlStrength'), CONFIG.curlStrength);
    gl.uniform1f(gl.getUniformLocation(vorticityProg, 'uDt'), dt);
    blit(velocity.write());
    velocity.swap();

    // 3. Compute Divergence
    gl.useProgram(divergenceProg);
    gl.uniform2f(gl.getUniformLocation(divergenceProg, 'uTexelSize'), velocity.texelSizeX, velocity.texelSizeY);
    gl.uniform1i(gl.getUniformLocation(divergenceProg, 'uVelocity'), velocity.read().attach(0));
    blit(divergence);

    // 4. Pressure Poisson Solve (Jacobi Relaxation)
    gl.useProgram(pressureProg);
    gl.uniform2f(gl.getUniformLocation(pressureProg, 'uTexelSize'), velocity.texelSizeX, velocity.texelSizeY);
    gl.uniform1i(gl.getUniformLocation(pressureProg, 'uDivergence'), divergence.attach(0));
    for (let i = 0; i < CONFIG.pressureIterations; i++) {
      gl.uniform1i(gl.getUniformLocation(pressureProg, 'uPressure'), pressure.read().attach(1));
      blit(pressure.write());
      pressure.swap();
    }

    // 5. Subtract Pressure Gradient from Velocity
    gl.useProgram(gradSubtractProg);
    gl.uniform2f(gl.getUniformLocation(gradSubtractProg, 'uTexelSize'), velocity.texelSizeX, velocity.texelSizeY);
    gl.uniform1i(gl.getUniformLocation(gradSubtractProg, 'uPressure'), pressure.read().attach(0));
    gl.uniform1i(gl.getUniformLocation(gradSubtractProg, 'uVelocity'), velocity.read().attach(1));
    blit(velocity.write());
    velocity.swap();

    // 6. Advect Velocity Field
    gl.useProgram(advectProg);
    gl.uniform2f(gl.getUniformLocation(advectProg, 'uTexelSize'), velocity.texelSizeX, velocity.texelSizeY);
    gl.uniform1i(gl.getUniformLocation(advectProg, 'uVelocity'), velocity.read().attach(0));
    gl.uniform1i(gl.getUniformLocation(advectProg, 'uSource'), velocity.read().attach(0));
    gl.uniform1f(gl.getUniformLocation(advectProg, 'uDt'), dt);
    gl.uniform1f(gl.getUniformLocation(advectProg, 'uDissipation'), CONFIG.velocityDissipation);
    blit(velocity.write());
    velocity.swap();

    // 7. Advect Density (Reveal Mask) Field
    gl.uniform1i(gl.getUniformLocation(advectProg, 'uVelocity'), velocity.read().attach(0));
    gl.uniform1i(gl.getUniformLocation(advectProg, 'uSource'), density.read().attach(1));
    gl.uniform1f(gl.getUniformLocation(advectProg, 'uDissipation'), CONFIG.densityDissipation);
    blit(density.write());
    density.swap();

    // 8. Composite Reveal Pass
    gl.useProgram(displayProg);
    gl.uniform1i(gl.getUniformLocation(displayProg, 'uDensity'), density.read().attach(0));
    if (texAnimated) gl.uniform1i(gl.getUniformLocation(displayProg, 'uAnimated'), 1);
    if (texReal) gl.uniform1i(gl.getUniformLocation(displayProg, 'uReal'), 2);

    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, texAnimated);

    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, texReal);

    // Portrait Framing: Centered horizontally, 85% scene height, sitting at bottom
    const normHeight = 0.85;
    const normWidth = 0.85 * (469.0 / 829.0) * (941.0 / 1670.0);
    const normLeft = 0.5 - normWidth * 0.5;
    const normBottom = 0.0;
    gl.uniform4f(gl.getUniformLocation(displayProg, 'uPortraitRect'), normLeft, normBottom, normWidth, normHeight);

    // Precision Geometric Alignment (Real Image Scaled 1.1x)
    const scale = CONFIG.realScale || 1.1;
    const cx = 0.50;
    const cy = 0.40;
    const baseSx = 0.9613;
    const baseSy = 0.9194;
    const baseOx = 0.0162;
    const baseOy = 0.0133;

    const realSx = baseSx / scale;
    const realSy = baseSy / scale;
    const realOx = cx - (cx - baseOx) / scale;
    const realOy = cy - (cy - baseOy) / scale;

    gl.uniform2f(gl.getUniformLocation(displayProg, 'uRealScale'), realSx, realSy);
    gl.uniform2f(gl.getUniformLocation(displayProg, 'uRealOffset'), realOx, realOy);
    gl.uniform2f(gl.getUniformLocation(displayProg, 'uResolution'), canvas.width, canvas.height);
    gl.uniform1f(gl.getUniformLocation(displayProg, 'uMeniscusSpec'), CONFIG.meniscusSpec);
    gl.uniform1f(gl.getUniformLocation(displayProg, 'uRefraction'), CONFIG.refraction);

    blit(null);

    requestAnimationFrame(render);
  }

})();

