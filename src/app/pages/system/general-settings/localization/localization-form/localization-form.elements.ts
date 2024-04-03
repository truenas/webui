import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';

export const localizationFormElements = {
  hierarchy: [T('System'), T('General'), T('Localization')],
  triggerAnchor: 'configure-localization',
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
