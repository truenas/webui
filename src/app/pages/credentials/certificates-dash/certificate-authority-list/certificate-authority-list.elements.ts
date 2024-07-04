import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const certificateAuthorityListElements = {
  hierarchy: [T('Credentials'), T('Certificates'), T('Certificate Authorities')],
  anchorRouterLink: ['/credentials', 'certificates'],
  elements: {
    certificateAuthorityList: {
      anchor: 'certificate-authority-list',
    },
    add: {
      hierarchy: [T('Add Certificate Authority')],
      synonyms: [
        T('New Certificate Authority'),
        T('Create Certificate Authority'),
        T('Certificate Authority'),
      ],
      anchor: 'add-certificate-authority',
    },
  },
} satisfies UiSearchableElement;
