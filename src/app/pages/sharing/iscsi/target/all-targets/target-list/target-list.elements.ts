import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const targetListElements = {
  hierarchy: [T('Shares'), T('iSCSI'), T('Targets')],
  synonyms: [('FC')],
  anchorRouterLink: ['/sharing', 'iscsi', 'targets'],
  elements: {
    list: {
      anchor: 'target-list',
    },
    add: {
      hierarchy: [T('Add Target')],
      synonyms: [T('New Target'), T('Create Target'), T('FC Target')],
      anchor: 'add-target',
    },
  },
} satisfies UiSearchableElement;
