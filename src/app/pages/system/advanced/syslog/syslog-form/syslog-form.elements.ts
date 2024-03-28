import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { Role } from 'app/enums/role.enum';

export const syslogFormElements = {
  hierarchy: [T('System Settings'), T('Advanced'), T('Syslog')],
  triggerAnchor: 'configure-syslog',
  anchorRouterLink: ['/system', 'advanced'],
  requiredRoles: [Role.FullAdmin],
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
