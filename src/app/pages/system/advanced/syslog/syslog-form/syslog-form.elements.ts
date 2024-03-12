import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const elements: Record<string, UiSearchableElement> = {
  level: {
    hierarchy: [T('System Settings'), T('Advanced'), T('Syslog'), T('Syslog Level')],
    synonyms: [],
    triggerAnchor: 'syslog-settings',
    anchorRouterLink: ['/system', 'advanced'],
  },
  server: {
    hierarchy: [T('System Settings'), T('Advanced'), T('Syslog'), T('Syslog Server')],
    synonyms: [],
    triggerAnchor: 'syslog-settings',
    anchorRouterLink: ['/system', 'advanced'],
  },
  transport: {
    hierarchy: [T('System Settings'), T('Advanced'), T('Syslog'), T('Syslog Transport')],
    synonyms: [],
    triggerAnchor: 'syslog-settings',
    anchorRouterLink: ['/system', 'advanced'],
  },
  includeAuditLogs: {
    hierarchy: [T('System Settings'), T('Advanced'), T('Syslog'), T('Include Audit Logs')],
    synonyms: [],
    triggerAnchor: 'syslog-settings',
    anchorRouterLink: ['/system', 'advanced'],
  },
};
