import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const elements: Record<string, UiSearchableElement> = {
  retention: {
    hierarchy: [T('System Settings'), T('Advanced'), T('Audit'), T('Retention')],
    synonyms: [],
    triggerAnchor: 'audit-settings',
    anchorRouterLink: ['/system', 'advanced'],
  },
  reservation: {
    hierarchy: [T('System Settings'), T('Advanced'), T('Audit'), T('Reservation')],
    synonyms: [],
    triggerAnchor: 'audit-settings',
    anchorRouterLink: ['/system', 'advanced'],
  },
  quota: {
    hierarchy: [T('System Settings'), T('Advanced'), T('Audit'), T('Quota')],
    synonyms: [],
    triggerAnchor: 'audit-settings',
    anchorRouterLink: ['/system', 'advanced'],
  },
  quotaFillWarning: {
    hierarchy: [T('System Settings'), T('Advanced'), T('Audit'), T('Quota Fill Warning')],
    synonyms: [],
    triggerAnchor: 'audit-settings',
    anchorRouterLink: ['/system', 'advanced'],
  },
  quotaFillCritical: {
    hierarchy: [T('System Settings'), T('Advanced'), T('Audit'), T('Quota Fill Critical')],
    synonyms: [],
    triggerAnchor: 'audit-settings',
    anchorRouterLink: ['/system', 'advanced'],
  },
};
