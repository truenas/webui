import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const networkConfigurationCardElements = {
  hierarchy: [T('Network')],
  anchorRouterLink: ['/system', 'network'],
  elements: {
    configuration: {
      hierarchy: [T('Network Configuration')],
      synonyms: [T('Global Configuration'), T('Network Settings')],
    },
    nameServers: {
      hierarchy: [T('Nameserver')],
      synonyms: [T('NS')],
    },
    settings: {
      hierarchy: [T('Network Configuration Settings')],
      synonyms: [
        T('Hostname'),
        T('Domain'),
        T('HTTP Proxy'),
        T('Service Announcement'),
        T('Additional Domains'),
        T('Hostname Database'),
        T('Outbound Network'),
        T('Domain Name System'),
        T('DNS Servers'),
        T('DHCP'),
        T('Gateway'),
        T('Lan'),
      ],
    },
  },
} satisfies UiSearchableElement;
