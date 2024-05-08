import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const syslogCardElements = {
  hierarchy: [T('System'), T('Advanced'), T('Syslog')],
  anchorRouterLink: ['/system', 'advanced'],
  elements: {
    syslog: {
      anchor: 'syslog-card',
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
