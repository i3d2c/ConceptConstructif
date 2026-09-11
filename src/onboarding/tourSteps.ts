export type TourPlacement = 'center' | 'right' | 'top' | 'bottom' | 'left'

export interface TourStep {
  id: string
  target: string | null
  title: string
  body: string
  placement: TourPlacement
}

export const TOUR_STEPS: TourStep[] = [
  {
    id: 'welcome',
    target: null,
    title: 'Bienvenue dans ConceptConstructif',
    body: 'Ce petit tour vous montre comment chiffrer un projet, étape par étape : calibrer l\'échelle, associer un ouvrage à une couleur, tracer, puis consulter le chiffrage et la vue 3D.',
    placement: 'center',
  },
  {
    id: 'plan',
    target: '[data-tour="tour-import-plan"]',
    title: 'Importez votre plan',
    body: 'Cliquez ici pour choisir une image, ou collez-la (Ctrl+V)/glissez-la directement sur la zone de dessin.',
    placement: 'right',
  },
  {
    id: 'scale',
    target: '[data-tour="tour-scale"]',
    title: 'Calibrez l\'échelle',
    body: 'Tracez un trait le long d\'une distance connue du plan, puis indiquez sa longueur réelle. Toutes vos mesures futures se baseront sur cette échelle.',
    placement: 'right',
  },
  {
    id: 'ouvrages',
    target: '[data-tour="tour-ouvrages"]',
    title: 'Bibliothèque d\'ouvrages',
    body: 'Gérez ici vos ouvrages et constituants : les éléments chiffrés que vous associez ensuite aux couleurs.',
    placement: 'right',
  },
  {
    id: 'color',
    target: '[data-tour="tour-add-color"]',
    title: 'Ajoutez une couleur',
    body: 'Chaque couleur associe un ouvrage chiffré (mur, dalle, etc.) à une épaisseur et une hauteur. Vous tracerez ensuite avec cette couleur.',
    placement: 'right',
  },
  {
    id: 'trace',
    target: '[data-tour="tour-trace"]',
    title: 'Tracez',
    body: 'Utilisez "Trait" pour les murs et "Surface" pour les surfaces. Sélectionnez d\'abord une couleur, puis dessinez sur le plan.',
    placement: 'right',
  },
  {
    id: 'chiffrage',
    target: '[data-tour="tour-chiffrage"]',
    title: 'Le chiffrage',
    body: 'Ce panneau récapitule le coût total de votre projet, calculé à partir de vos tracés et de vos ouvrages.',
    placement: 'right',
  },
  {
    id: 'scene3d',
    target: '[data-tour="tour-3d"]',
    title: 'Vue 3D',
    body: 'Visualisez votre projet en 3D pour vérifier les volumes et les hauteurs.',
    placement: 'right',
  },
]
