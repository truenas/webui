import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const subsystemDetailsCardElements = {
  hierarchy: [T('Shares'), T('NVMe-oF')],
  anchorRouterLink: ['/sharing', 'nvme-of'],
  elements: {
    copyNqn: { hierarchy: [T('Copy NQN')] },
  },
} satisfies UiSearchableElement;
