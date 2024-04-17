import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

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
} satisfies UiSearchableElement;
