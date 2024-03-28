import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { Role } from 'app/enums/role.enum';

export const auditFormElements = {
  hierarchy: [T('System Settings'), T('Advanced'), T('Audit')],
  triggerAnchor: 'configure-audit',
  anchorRouterLink: ['/system', 'advanced'],
  requiredRoles: [Role.SystemAuditWrite],
  elements: {
    retention: {
      hierarchy: [T('Retention')],
    },
    reservation: {
      hierarchy: [T('Reservation')],
    },
    quota: {
      hierarchy: [T('Quota')],
    },
    quotaFillWarning: {
      hierarchy: [T('Quota Fill Warning')],
    },
    quotaFillCritical: {
      hierarchy: [T('Quota Fill Critical')],
    },
  },
};
