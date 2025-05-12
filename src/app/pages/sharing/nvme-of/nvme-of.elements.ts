import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const nvmeOfElements = {
  hierarchy: [T('Shares'), T('NVMe-oF')],
  anchorRouterLink: ['/sharing', 'nvme-of'],
  elements: {
    config: {
      hierarchy: [T('Global Configuration')],
      anchor: 'global-configuration',
    },
  },
} satisfies UiSearchableElement;
