import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const subsystemDetailsElements = {
  hierarchy: [T('Shares'), T('NVMe-oF')],
  anchorRouterLink: ['/sharing', 'nvme-of'],
  elements: {
    detailsCard: { hierarchy: [T('Details')], inset: true },
    namespacesCard: { hierarchy: [T('Namespaces')], inset: true },
    portsCard: { hierarchy: [T('Ports')], inset: true },
    hostsCard: { hierarchy: [T('Associated Hosts')], inset: true },
  },
} satisfies UiSearchableElement;
