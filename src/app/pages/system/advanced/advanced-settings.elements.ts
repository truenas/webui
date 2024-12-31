import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const advancedSettingsElements = {
  hierarchy: [T('System'), T('Advanced Settings')],
  anchorRouterLink: ['/system', 'advanced'],
  elements: {
    advanced: {
      anchor: 'advanced-settings',
      synonyms: [T('Settings')],
    },
  },
} satisfies UiSearchableElement;
