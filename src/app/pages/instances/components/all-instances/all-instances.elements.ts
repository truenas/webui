import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const allInstancesElements = {
  hierarchy: [T('Virtualization'), T('Containers')],
  synonyms: [T('VM'), T('Virtual Machines')],
  anchorRouterLink: ['/virtualization/view/def'],
  elements: {
    list: {
      hierarchy: [T('Instances')],
      synonyms: [T('Containers')],
      anchor: 'containers-list',
    },
  },
} satisfies UiSearchableElement;
