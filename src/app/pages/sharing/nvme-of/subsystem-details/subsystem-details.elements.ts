import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const subsystemDetailsElements = {
  hierarchy: [T('Shares'), T('NVMe-oF')],
  anchorRouterLink: ['/sharing', 'nvme-of'],
  elements: {
    detailsCard: { hierarchy: [T('Details')] },
    namespacesCard: { hierarchy: [T('Namespaces')] },
    portsCard: { hierarchy: [T('Ports')] },
    hostsCard: { hierarchy: [T('Associated Hosts')] },
  },
} satisfies UiSearchableElement;
