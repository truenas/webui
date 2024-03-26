import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';

export const auditFormElements = {
  hierarchy: [T('System Settings'), T('Advanced'), T('Audit')],
  triggerAnchor: 'configure-audit',
  anchorRouterLink: ['/system', 'advanced'],
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
