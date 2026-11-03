export type ProjectImage = { src: string; alt: string }

export type Project = {
  name: string
  images: ProjectImage[]
}

export const projects: Project[] = [
  {
    name: 'safar',
    images: [1, 2, 3, 4, 5].map((index) => ({ src: `/project-images/safar-${index}.svg`, alt: `Safar preview ${index}` })),
  },
  {
    name: 'itqan',
    images: [1, 2, 3, 4, 5].map((index) => ({ src: `/project-images/itqan-${index}.svg`, alt: `Itqan preview ${index}` })),
  },
  {
    name: 'adval',
    images: [1, 2, 3, 4, 5].map((index) => ({ src: `/project-images/adval-${index}.svg`, alt: `Adval preview ${index}` })),
  },
  {
    name: 'noortrack',
    images: [1, 2, 3, 4, 5, 6, 7, 8, 9].map((index) => ({ src: `/project-images/noortrack-${index}.svg`, alt: `Noortrack preview ${index}` })),
  },
  {
    name: 'AS&OI',
    images: [1, 2, 3, 4, 5].map((index) => ({ src: `/project-images/asoi-${index}.svg`, alt: `AS&OI preview ${index}` })),
  },
]
