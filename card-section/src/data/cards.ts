export type CardTone =
  | 'yellow'
  | 'white'
  | 'black'
  | 'green'
  | 'slate'
  | 'blue'
  | 'lime'
  | 'gradient'
  | 'figma'
  | 'red'
  | 'maroon'
  | 'indigo'

export type CardSide = {
  title: string
  eyebrow: string
  label: string
  tone: CardTone
  mark?: string
}

export type ToolkitCard = {
  id: string
  front: CardSide
  back: CardSide
}

// The reverse order intentionally makes the edge-on turn land on Figma first,
// then opens into the art-direction fan before ending on the gradient mark.
export const toolkitCards: ToolkitCard[] = [
  {
    id: 'javascript',
    front: { title: 'Java\nscript', eyebrow: '01 / language', label: 'Language', tone: 'yellow' },
    back: { title: 'GL', eyebrow: '08 / transition', label: 'Transition', tone: 'gradient', mark: 'GL' },
  },
  {
    id: 'three',
    front: { title: 'three\n.js', eyebrow: '02 / 3d', label: '3D Library', tone: 'white' },
    back: { title: 'Light\nroom', eyebrow: '07 / photo', label: 'Photo editing', tone: 'slate' },
  },
  {
    id: 'glsl',
    front: { title: 'GLSL', eyebrow: '03 / shader', label: 'Shader language', tone: 'black' },
    back: { title: 'Illustrator', eyebrow: '06 / vector', label: 'Vector design', tone: 'red' },
  },
  {
    id: 'gsap',
    front: { title: 'GSAP', eyebrow: '04 / motion', label: 'Motion library', tone: 'black' },
    back: { title: 'InDesign', eyebrow: '05 / layout', label: 'Layout tool', tone: 'maroon' },
  },
  {
    id: 'vue',
    front: { title: 'Vue', eyebrow: '05 / framework', label: 'Framework', tone: 'green' },
    back: { title: 'After\nEffects', eyebrow: '04 / motion', label: 'Motion design', tone: 'indigo' },
  },
  {
    id: 'react',
    front: { title: 'React', eyebrow: '06 / framework', label: 'Framework', tone: 'slate' },
    back: { title: 'CapCut', eyebrow: '03 / video', label: 'Video editing', tone: 'white' },
  },
  {
    id: 'webflow',
    front: { title: 'Web\nflow', eyebrow: '07 / builder', label: 'Website builder', tone: 'white' },
    back: { title: 'Photo\nshop', eyebrow: '02 / image', label: 'Image editing', tone: 'blue' },
  },
  {
    id: 'shopify',
    front: { title: 'Shopify', eyebrow: '08 / commerce', label: 'E-commerce platform', tone: 'lime' },
    back: { title: 'Figma', eyebrow: '01 / design', label: 'Design tool', tone: 'figma' },
  },
]

export const frontFanOrder = toolkitCards.map((card) => card.id)
export const backFanOrder = [...toolkitCards].reverse().map((card) => card.id)
