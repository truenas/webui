import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const elements: Record<string, UiSearchableElement> = {
  addSysctl: {
    hierarchy: [T('System Settings'), T('Advanced'), T('Sysctl'), T('Add')],
    synonyms: [T('Add Tunable'), T('Add Sysctl')],
    triggerAnchor: 'add-sysctl',
    anchorRouterLink: ['/system', 'advanced'],
  },
};
