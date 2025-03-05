import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const allInstancesElements = {
  hierarchy: [T('Instances')],
  synonyms: [T('VM'), T('Virtual Machines'), T('Instances'), T('Incus'), T('Containers')],
  anchorRouterLink: ['/instances/view/def'],
  elements: {
    list: {
      hierarchy: [T('List')],
      synonyms: [T('Containers'), T('Instances'), T('Incus')],
      anchor: 'containers-list',
    },
  },
} satisfies UiSearchableElement;
