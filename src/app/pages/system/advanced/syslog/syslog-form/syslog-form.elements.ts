import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { Role } from 'app/enums/role.enum';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const syslogFormElements = {
  hierarchy: [T('System'), T('Advanced'), T('Syslog')],
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
} satisfies UiSearchableElement;
