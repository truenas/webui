import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const sysctlCardElements = {
  hierarchy: [T('System'), T('Advanced Settings'), T('Sysctl')],
  synonyms: [T('Add Tunable'), T('Add Sysctl')],
  anchorRouterLink: ['/system', 'advanced'],
  elements: {
    sysctl: {
      anchor: 'sysctl',
    },
    addSysctl: {
      hierarchy: [T('Add Sysctl')],
      anchor: 'add-sysctl',
      synonyms: [
        T('Create Sysctl'),
        T('New Sysctl'),
        T('Sysctl'),
        T('Kernel Parameters'),
        T('Add Kernel Parameters'),
        T('Create Kernel Parameters'),
        T('New Kernel Parameters'),
        T('Add Tunable'),
        T('Create Tunable'),
        T('New Tunable'),
      ],
    },
  },
} satisfies UiSearchableElement;
