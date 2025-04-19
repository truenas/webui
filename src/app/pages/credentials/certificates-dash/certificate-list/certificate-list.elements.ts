import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const certificateListElements = {
  hierarchy: [T('Credentials'), T('Certificates')],
  anchorRouterLink: ['/credentials', 'certificates'],
  elements: {
    import: {
      hierarchy: [T('Import Certificate')],
      anchor: 'import-certificate',
      synonyms: [
        T('Add Certificate'),
      ],
    },
  },
} satisfies UiSearchableElement;
