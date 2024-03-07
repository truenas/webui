import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const elements: Record<string, UiSearchableElement> = {
  theme: {
    hierarchy: [T('System Settings'), T('General'), T('GUI'), T('Theme')],
    synonyms: [],
    triggerAnchor: 'gui-settings',
    anchorRouterLink: ['/system', 'general'],
  },
};
