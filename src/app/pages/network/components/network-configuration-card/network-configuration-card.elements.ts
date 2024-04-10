import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';

export const networkConfigurationCardElements = {
  hierarchy: [T('Network')],
  anchorRouterLink: ['/network'],
  elements: {
    nameservers: {
      hierarchy: [T('Nameservers')],
      synonyms: ['NS', 'DNS', T('Domain Name System')],
      anchor: 'nameservers',
    },
  },
};
