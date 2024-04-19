import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const sysctlCardElements = {
  hierarchy: [T('System'), T('Advanced'), T('Sysctl')],
  synonyms: [T('Add Tunable'), T('Add Sysctl')],
  anchorRouterLink: ['/system', 'advanced'],
  elements: {
    sysctl: {
      anchor: 'sysctl',
    },
    addSysctl: {
      hierarchy: [T('Add')],
    },
  },
} satisfies UiSearchableElement;
