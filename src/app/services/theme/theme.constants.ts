import { Theme } from 'app/interfaces/theme.interface';

export const defaultTheme: Theme = {
  name: 'ix-dark',
  label: 'iX Dark',
  labelSwatch: 'blue',
  description: 'TrueNAS default theme',
  accentColors: ['blue', 'magenta', 'orange', 'cyan', 'yellow', 'violet', 'red', 'green'],
  primary: 'var(--blue)',
  topbar: '#111111',
  'topbar-txt': 'var(--fg2)',
  accent: 'var(--alt-bg2)',
  bg1: '#1E1E1E',
  bg2: '#282828', // '#242424',
  fg1: '#fff',
  fg2: 'rgba(255,255,255,0.85)',
  'alt-bg1': '#383838',
  'alt-bg2': '#545454',
  'alt-fg1': 'rgba(194,194,194,0.5)',
  'alt-fg2': '#e1e1e1',
  yellow: '#DED142',
  orange: '#E68D37',
  red: '#CE2929',
  magenta: '#C006C7',
  violet: '#7617D8',
  blue: '#0095D5',
  cyan: '#00d0d6',
  green: '#71BF44',
};

export const allThemes: Theme[] = [
  defaultTheme,
  {
    name: 'ix-blue',
    label: 'iX Blue',
    labelSwatch: 'blue',
    description: 'Official iX System Colors on light',
    accentColors: ['blue', 'orange', 'cyan', 'violet', 'yellow', 'magenta', 'red', 'green'],
    primary: 'var(--blue)',
    topbar: 'var(--blue)',
    accent: 'var(--yellow)',
    bg1: '#f2f2f2',
    bg2: '#ffffff',
    fg1: '#585858',
    fg2: '#666666',
    'alt-bg1': '#ababab',
    'alt-bg2': '#cdcdcd',
    'alt-fg1': '#181a26',
    'alt-fg2': '#282a36',
    yellow: '#DED142',
    orange: '#E68D37',
    red: '#CE2929',
    magenta: '#C006C7',
    violet: '#7617D8',
    blue: '#0095D5',
    cyan: '#00d0d6',
    green: '#71BF44',
  },
  {
    name: 'dracula',
    label: 'Dracula',
    labelSwatch: 'blue',
    description: 'Dracula color theme',
    accentColors: ['violet', 'orange', 'cyan', 'blue', 'yellow', 'magenta', 'red', 'green'],
    primary: 'var(--blue)',
    topbar: 'var(--blue)',
    'topbar-txt': 'var(--fg1)',
    accent: 'var(--violet)',
    bg1: '#181a26',
    bg2: '#282a36',
    fg1: '#efefef',
    fg2: '#cacac5',
    'alt-bg1': 'rgba(122,122,122,0.25)',
    'alt-bg2': 'rgba(122,122,122,0.5)',
    'alt-fg1': '#f8f8f2',
    'alt-fg2': '#fafaf5',
    yellow: '#f1fa8c',
    orange: '#ffb86c',
    red: '#ff5555',
    magenta: '#ff79c6',
    violet: '#bd93f9',
    blue: '#6272a4',
    cyan: '#8be9fd',
    green: '#50fa7b',
  },
  {
    name: 'nord',
    label: 'Nord',
    labelSwatch: 'blue',
    description: 'Unofficial nord color theme based on https://www.nordtheme.com/',
    accentColors: ['violet', 'orange', 'cyan', 'blue', 'yellow', 'magenta', 'red', 'green'],
    primary: 'var(--cyan)',
    topbar: 'var(--alt-bg2)',
    'topbar-txt': 'var(--fg2)',
    accent: 'var(--blue)',
    bg1: '#2e3440',
    bg2: '#3b4252',
    fg1: '#eceff4',
    fg2: '#e5e9f0',
    'alt-bg1': '#434c5e',
    'alt-bg2': '#4c566a',
    'alt-fg1': '#d8dee9',
    'alt-fg2': '#d8dee9',
    yellow: '#ebcb8b',
    orange: '#d08770',
    red: '#bf616a',
    magenta: '#b48ead',
    violet: '#775daa',
    blue: '#5e81aC',
    cyan: '#88c0d0',
    green: '#a3be8c',
  },
  {
    name: 'paper',
    label: 'Paper',
    labelSwatch: 'blue',
    description: 'FreeNAS 11.2 default theme',
    accentColors: ['violet', 'orange', 'cyan', 'blue', 'yellow', 'magenta', 'red', 'green'],
    primary: 'var(--blue)',
    topbar: 'var(--blue)',
    accent: 'var(--yellow)',
    bg1: '#F2F2F2',
    bg2: '#FAFAFA',
    fg1: '#3f3f3f',
    fg2: '#666666',
    'alt-bg1': '#ababab',
    'alt-bg2': '#cdcdcd',
    'alt-fg1': '#181a26',
    'alt-fg2': '#282a36',
    yellow: '#f0cb00',
    orange: '#ee9302',
    red: '#ff0013',
    magenta: '#d238ff',
    violet: '#c17ecc',
    blue: '#0D5687',
    cyan: '#00d0d6',
    green: '#1F9642',
  },
  {
    name: 'solarized-dark',
    label: 'Solarized Dark',
    labelSwatch: 'bg2',
    description: 'Solarized dark color scheme',
    accentColors: ['blue', 'magenta', 'cyan', 'violet', 'green', 'orange', 'yellow', 'red'],
    primary: 'var(--fg1)',
    topbar: 'var(--fg1)',
    'topbar-txt': '#cdcdcd',
    accent: 'var(--cyan)',
    bg1: '#002b36',
    bg2: '#073642',
    fg1: '#586e75',
    fg2: '#7f99a2',
    'alt-bg1': 'rgba(122,122,122,0.25)',
    'alt-bg2': '#0b4f60', // '#314c54',
    'alt-fg1': '#839496',
    'alt-fg2': '#282a36',
    yellow: '#b58900',
    orange: '#cb4b16',
    red: '#dc322f',
    magenta: '#d33682',
    violet: '#6c71c4',
    blue: '#268bd2',
    cyan: '#2aa198',
    green: '#859900',
  },
  {
    name: 'midnight',
    label: 'Midnight',
    labelSwatch: 'blue',
    description: 'Dark theme with blues and greys',
    accentColors: ['violet', 'orange', 'cyan', 'blue', 'yellow', 'magenta', 'red', 'green'],
    primary: 'var(--blue)',
    topbar: 'var(--blue)',
    'topbar-txt': 'var(--fg2)',
    accent: 'var(--violet)',
    bg1: '#212a35',
    bg2: '#303d48',
    fg1: '#aaaaaa',
    fg2: '#cccccc',
    'alt-bg1': 'rgba(122,122,122,0.25)',
    'alt-bg2': '#6F6E6C',
    'alt-fg1': '#c1c1c1',
    'alt-fg2': '#e1e1e1',
    yellow: '#f0cb00',
    orange: '#ee9302',
    red: '#ff0013',
    magenta: '#d238ff',
    violet: '#c17ecc',
    blue: '#1274b5',
    cyan: '#00d0d6',
    green: '#1F9642',
  },
  {
    name: 'high-contrast',
    label: 'High Contrast',
    labelSwatch: 'fg1',
    description: 'High contrast theme based on Legacy UI color scheme',
    accentColors: ['green', 'violet', 'orange', 'cyan', 'magenta', 'red', 'yellow', 'blue'],
    primary: 'var(--blue)',
    topbar: 'var(--black)',
    accent: 'var(--magenta)',
    bg1: '#dddddd',
    bg2: '#ffffff',
    fg1: '#222222',
    fg2: '#333333',
    'alt-bg1': '#ababab',
    'alt-bg2': '#cdcdcd',
    'alt-fg1': '#181a26',
    'alt-fg2': '#282a36',
    yellow: '#f0cb00',
    orange: '#ee9302',
    red: '#ff0013',
    magenta: '#d238ff',
    violet: '#9844b1',
    blue: '#4784ac',
    cyan: '#00d0d6',
    green: '#59d600',
  },
];
