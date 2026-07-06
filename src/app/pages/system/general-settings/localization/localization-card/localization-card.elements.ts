import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const localizationCardElements = {
  hierarchy: [T('System'), T('General Settings'), T('Localization')],
  anchorRouterLink: ['/system', 'general'],
  elements: {
    localization: {
      anchor: 'localization-card',
    },
    settings: {
      anchor: 'localization-settings',
      hierarchy: [T('Localization Settings')],
    },
    consoleKeyboardMap: {
      hierarchy: [T('Console Keyboard Map')],
    },
    timezone: {
      hierarchy: [T('Timezone')],
    },
  },
} satisfies UiSearchableElement;
