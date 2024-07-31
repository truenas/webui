import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const auditCardElements = {
  hierarchy: [T('System'), T('Advanced Settings'), T('Audit')],
  anchorRouterLink: ['/system', 'advanced'],
  elements: {
    audit: {
      anchor: 'audit-card',
    },
    configure: {
      anchor: 'audit-settings',
      hierarchy: [T('Configure Audit')],
      synonyms: [T('Audit Settings')],
    },
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
