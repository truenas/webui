import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const generalSettingsElements = {
  hierarchy: [T('System'), T('General Settings')],
  anchorRouterLink: ['/system', 'general'],
  elements: {
    general: {
      anchor: 'general-settings',
      synonyms: [T('Settings')],
    },
  },
} satisfies UiSearchableElement;
