import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { Role } from 'app/enums/role.enum';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const auditFormElements = {
  hierarchy: [T('System'), T('Advanced'), T('Audit')],
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
} satisfies UiSearchableElement;
