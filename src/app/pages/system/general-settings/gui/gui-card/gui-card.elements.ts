import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const guiCardElements = {
  hierarchy: [T('System'), T('General Settings'), T('GUI')],
  anchorRouterLink: ['/system', 'general'],
  elements: {
    gui: {
      anchor: 'gui-card',
    },
    theme: {
      hierarchy: [T('Theme')],
    },
    sslCertificate: {
      hierarchy: [T('SSL Certificate')],
    },
    settings: {
      anchor: 'gui-settings',
      hierarchy: [T('GUI Settings')],
    },
    ipv4Address: {
      hierarchy: [T('IPv4 Address')],
      synonyms: [T('Web Interface Address')],
    },
    ipv6Address: {
      hierarchy: [T('IPv6 Address')],
      synonyms: [T('Web Interface Address')],
    },
    uiHttpPort: {
      hierarchy: [T('HTTP Port')],
      synonyms: [T('Web Interface Port')],
    },
    uiHttpsPort: {
      hierarchy: [T('HTTPS Port')],
      synonyms: [T('Web Interface Port'), T('SSL Web Interface Port')],
    },
    sslProtocols: {
      hierarchy: [T('SSL Protocols')],
    },
    httpsRedirect: {
      hierarchy: [T('HTTPS Redirect')],
    },
    usageCollection: {
      hierarchy: [T('Usage Collection')],
    },
    consoleMsg: {
      hierarchy: [T('Show Console Messages')],
    },
  },
} satisfies UiSearchableElement;
