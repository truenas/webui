import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const vmListElements = {
  hierarchy: [T('Virtual Machines')],
  anchorRouterLink: ['/vm'],
  elements: {
    vm: {
      synonyms: [T('VM'), T('Virtualization')],
    },
  },
} satisfies UiSearchableElement;
