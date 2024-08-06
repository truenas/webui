import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const syslogCardElements = {
  hierarchy: [T('System'), T('Advanced Settings'), T('Syslog')],
  anchorRouterLink: ['/system', 'advanced'],
  elements: {
    syslog: {
      anchor: 'syslog-card',
    },
    configure: {
      anchor: 'syslog-settings',
      hierarchy: [T('Configure Syslog')],
      synonyms: [T('Syslog Settings')],
    },
    level: {
      hierarchy: [T('Syslog Level')],
    },
    server: {
      hierarchy: [T('Syslog Server')],
    },
    transport: {
      hierarchy: [T('Syslog Transport')],
    },
    includeAuditLogs: {
      hierarchy: [T('Include Audit Logs')],
    },
    UseFQDNForLogging: {
      hierarchy: [T('Use FQDN for Logging')],
    },
  },
} satisfies UiSearchableElement;
