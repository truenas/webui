import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const elements: Record<string, UiSearchableElement> = {
  enableFips: {
    hierarchy: [T('System Settings'), T('Advanced'), T('System Security'), T('Enable FIPS')],
    synonyms: [],
    triggerAnchor: 'system-security-settings',
    anchorRouterLink: ['/system', 'advanced'],
  },
};
