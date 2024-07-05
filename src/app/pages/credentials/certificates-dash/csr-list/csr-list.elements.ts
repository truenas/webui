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
      hierarchy: [T('Add CSR')],
      anchor: 'add-csr',
      synonyms: [
        T('Create CSR'),
        T('New CSR'),
        T('Generate CSR'),
        T('Create Certificate Signing Requests'),
        T('New Certificate Signing Requests'),
        T('Add Certificate Signing Requests'),
        T('Generate Certificate Signing Requests'),
      ],
    },
  },
} satisfies UiSearchableElement;
