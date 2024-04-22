import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const networkConfigurationFormElements = {
  hierarchy: [T('Network'), T('Global Configuration')],
  anchorRouterLink: ['/network'],
  triggerAnchor: 'configure-global-network-configuration',
  elements: {
    hostnameAndDomain: {
      triggerAnchor: 'configure-global-network-configuration',
      hierarchy: [T('Hostname And Domain')],
      synonyms: [T('Hostname'), T('Domain')],
    },
    dnsServers: {
      triggerAnchor: 'configure-global-network-configuration',
      hierarchy: [T('DNS Servers')],
    },
    outboundNetwork: {
      triggerAnchor: 'configure-global-network-configuration',
      hierarchy: [T('Outbound Network')],
    },
    serviceAnnouncement: {
      triggerAnchor: 'configure-global-network-configuration',
      hierarchy: [T('Service Announcement')],
    },
    defaultGateway: {
      triggerAnchor: 'configure-global-network-configuration',
      hierarchy: [T('Default Gateway')],
      synonyms: [T('Gateway')],
    },
  },
} satisfies UiSearchableElement;
