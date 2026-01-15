import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const tunableCardElements = {
  hierarchy: [T('System'), T('Advanced Settings'), T('Tunable')],
  synonyms: [T('Add Tunable'), T('Add Sysctl')],
  anchorRouterLink: ['/system', 'advanced'],
  elements: {
    tunable: {
      anchor: 'tunable',
    },
    addTunable: {
      hierarchy: [T('Add Tunable')],
      anchor: 'add-tunable',
      synonyms: [
        T('Create Tunable'),
        T('New Tunable'),
        T('Tunable'),
        T('Kernel Parameters'),
        T('Add Kernel Parameters'),
        T('Create Kernel Parameters'),
        T('New Kernel Parameters'),
        T('Add Sysctl'),
        T('Create Sysctl'),
        T('New Sysctl'),
        T('Sysctl'),
      ],
    },
  },
} satisfies UiSearchableElement;
