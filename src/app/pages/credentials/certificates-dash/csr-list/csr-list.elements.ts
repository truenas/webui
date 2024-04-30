import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const csrListElements = {
  hierarchy: [T('Credentials'), T('Certificates'), T('Certificate Signing Requests')],
  anchorRouterLink: ['/credentials', 'certificates'],
  elements: {
    csr: {
      anchor: 'csr-list',
      synonyms: [T('CSRs')],
    },
    add: {
      hierarchy: [T('Add')],
      anchor: 'add-csr',
    },
  },
} satisfies UiSearchableElement;
