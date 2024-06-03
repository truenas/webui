import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const topologyCardElements = {
  hierarchy: [T('Storage')],
  anchorRouterLink: ['/storage'],
  elements: {
    topology: {
      hierarchy: [T('Topology')],
    },
    manageDevices: {
      hierarchy: [T('Manage Devices')],
    },
  },
} satisfies UiSearchableElement;
