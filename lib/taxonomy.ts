export const THEMES = {
  ai: 'AI a strojové učenie',
  web: 'Web',
  mobile: 'Mobil',
  web3: 'Web3 a blockchain',
  fintech: 'Fintech',
  health: 'Zdravotníctvo',
  climate: 'Klíma a energia',
  'smart-city': 'Smart city',
  govtech: 'Verejná správa',
  iot: 'IoT',
  games: 'Hry',
  data: 'Dáta',
  security: 'Bezpečnosť',
  edtech: 'Vzdelávanie',
  hardware: 'Hardvér',
  open: 'Bez zadanej témy',
} as const

export type ThemeSlug = keyof typeof THEMES

export const THEME_SLUGS = Object.keys(THEMES) as [ThemeSlug, ...ThemeSlug[]]

export const FORMATS = {
  onsite: 'Na mieste',
  online: 'Online',
  hybrid: 'Hybridný',
} as const

export const ELIGIBILITY = {
  open: 'Pre všetkých',
  students: 'Pre študentov',
  university: 'Pre vysokoškolákov',
  highschool: 'Pre stredoškolákov',
  women: 'Pre ženy',
  company: 'Interný firemný',
} as const

export type EligibilitySlug = keyof typeof ELIGIBILITY

export const ELIGIBILITY_SLUGS = Object.keys(ELIGIBILITY) as [
  EligibilitySlug,
  ...EligibilitySlug[],
]

export const RADIUS_OPTIONS = [10, 25, 50, 100, 200] as const

export type RadiusOption = (typeof RADIUS_OPTIONS)[number]
