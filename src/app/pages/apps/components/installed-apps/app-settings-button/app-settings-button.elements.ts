import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const appSettingsButtonElements = {
  hierarchy: [T('Applications'), T('Installed'), T('Settings')],
  anchorRouterLink: ['/apps', 'installed', '*'],
  triggerAnchor: 'app-settings',
  elements: {
    settings: {
      anchor: 'app-settings',
    },
    advancedSettings: {
      hierarchy: [T('Advanced Settings')],
      anchor: 'advanced-settings',
    },
    choosePool: {
      hierarchy: [T('Choose Pool')],
    },
  },
} satisfies UiSearchableElement;
