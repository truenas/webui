import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';

export const syslogFormElements = {
  hierarchy: [T('System Settings'), T('Advanced'), T('Syslog')],
  triggerAnchor: 'syslog-settings',
  anchorRouterLink: ['/system', 'advanced'],
  elements: {
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
  },
};
