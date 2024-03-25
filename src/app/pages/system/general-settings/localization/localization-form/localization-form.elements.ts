import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';

export const localizationFormElements = {
  hierarchy: [T('System Settings'), T('General'), T('Localization')],
  triggerAnchor: 'localization-settings',
  anchorRouterLink: ['/system', 'general'],
  elements: {
    language: {
      hierarchy: [T('Language')],
      synonyms: [T('Translate App')],
    },
    consoleKeyboardMap: {
      hierarchy: [T('Console Keyboard Map')],
    },
    timezone: {
      hierarchy: [T('Timezone')],
    },
    dateFormat: {
      hierarchy: [T('Date Format')],
    },
    timeFormat: {
      hierarchy: [T('Time Format')],
    },
  },
};
