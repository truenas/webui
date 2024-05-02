import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const kubernetesSettingsElements = {
  hierarchy: [T('Applications'), T('Installed'), T('Settings')],
  triggerAnchor: 'advanced-settings',
  anchorRouterLink: ['/apps', 'installed'],
  elements: {
    nodeIp: {
      hierarchy: [T('Node IP')],
    },
    routeInterface: {
      hierarchy: [T('Route v4 Interface')],
    },
    routeGateway: {
      hierarchy: [T('Route v4 Gateway')],
    },
  },
} satisfies UiSearchableElement;
