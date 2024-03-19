import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const elements: Record<string, UiSearchableElement> = {
  tokenLifetime: {
    hierarchy: [T('System Settings'), T('Advanced'), T('Access'), T('Token Lifetime')],
    synonyms: [T('Session Token Lifetime')],
    triggerAnchor: 'access-settings',
    anchorRouterLink: ['/system', 'advanced'],
  },
};
