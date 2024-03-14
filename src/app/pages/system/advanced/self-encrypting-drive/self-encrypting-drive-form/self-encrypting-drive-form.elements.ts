import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const elements: Record<string, UiSearchableElement> = {
  sedUser: {
    hierarchy: [T('System Settings'), T('Advanced'), T('Self-Encrypting Drive'), T('ATA Security User')],
    synonyms: [T('SED User')],
    triggerAnchor: 'sed-settings',
    anchorRouterLink: ['/system', 'advanced'],
  },
  sedPassword: {
    hierarchy: [T('System Settings'), T('Advanced'), T('Self-Encrypting Drive'), T('SED Password')],
    synonyms: [],
    triggerAnchor: 'sed-settings',
    anchorRouterLink: ['/system', 'advanced'],
  },
};
