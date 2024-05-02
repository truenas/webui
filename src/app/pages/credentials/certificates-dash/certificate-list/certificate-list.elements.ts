import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const certificateListElements = {
  hierarchy: [T('Credentials'), T('Certificates')],
  anchorRouterLink: ['/credentials', 'certificates'],
  elements: {
    add: {
      hierarchy: [T('Add')],
      anchor: 'add-certificate',
    },
  },
} satisfies UiSearchableElement;
