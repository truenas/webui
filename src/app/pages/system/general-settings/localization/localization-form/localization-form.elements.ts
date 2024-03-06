import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UiSearchableElement } from 'app/interfaces/ui-searchable-element.interface';

export const elements: Record<string, UiSearchableElement> = {
  language: {
    hierarchy: [T('System Settings'), T('General'), T('Localization'), T('Language')],
    synonyms: [T('Translate App')],
    triggerAnchor: 'localization-settings',
    anchor: 'language-input',
    anchorRouterLink: ['/system', 'general'],
  },
  consoleKeyboardMap: {
    hierarchy: [T('System Settings'), T('General'), T('Localization'), T('Console Keyboard Map')],
    synonyms: [],
    triggerAnchor: 'localization-settings',
    anchor: 'console-keyboard-map-input',
    anchorRouterLink: ['/system', 'general'],
  },
  timezone: {
    hierarchy: [T('System Settings'), T('General'), T('Localization'), T('Timezone')],
    synonyms: [],
    triggerAnchor: 'localization-settings',
    anchor: 'timezone-input',
    anchorRouterLink: ['/system', 'general'],
  },
  dateFormat: {
    hierarchy: [T('System Settings'), T('General'), T('Localization'), T('Date Format')],
    synonyms: [],
    triggerAnchor: 'localization-settings',
    anchor: 'date-format-input',
    anchorRouterLink: ['/system', 'general'],
  },
  timeFormat: {
    hierarchy: [T('System Settings'), T('General'), T('Localization'), T('Time Format')],
    synonyms: [],
    triggerAnchor: 'localization-settings',
    anchor: 'time-format-input',
    anchorRouterLink: ['/system', 'general'],
  },
};
