import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { GlobalSearchVisibleToken } from 'app/modules/global-search/enums/global-search-visible-token.enum';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const vmListElements = {
  hierarchy: [T('Virtual Machines')],
  anchorRouterLink: ['/vm'],
  elements: {
    vm: {
      anchor: 'vm-list',
      synonyms: [T('VM'), T('Virtualization')],
    },
    add: {
      hierarchy: [T('Add VM')],
      anchor: 'add-vm',
      synonyms: [
        T('Create VM'),
        T('New VM'),
        T('VM'),
        T('Add Virtual Machine'),
        T('New Virtual Machine'),
        T('Create Virtual Machine'),
      ],
    },
  },
  visibleTokens: [GlobalSearchVisibleToken.Vms],
} satisfies UiSearchableElement;
