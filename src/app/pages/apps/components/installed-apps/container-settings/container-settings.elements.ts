import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const containerSettingsElements = {
  hierarchy: [T('Applications'), T('Installed'), T('Settings')],
  triggerAnchor: 'advanced-settings',
  anchorRouterLink: ['/apps', 'installed', '*'],
  elements: {
    containerImageUpdates: {
      hierarchy: [T('Container Image Updates')],
    },
  },
} satisfies UiSearchableElement;
