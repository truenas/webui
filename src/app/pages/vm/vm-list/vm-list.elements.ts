import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const vmListElements = {
  hierarchy: [T('Virtual Machines')],
  anchorRouterLink: ['/vm'],
  elements: {
    vm: {
      synonyms: [T('VM'), T('Virtualization')],
    },
    add: {
      hierarchy: [T('Add')],
      synonyms: [
        T('Add VM'),
        T('Create VM'),
        T('New VM'),
        T('VM'),
        T('Add Virtual Machine'),
        T('New Virtual Machine'),
        T('Create Virtual Machine'),
      ],
    },
  },
} satisfies UiSearchableElement;
