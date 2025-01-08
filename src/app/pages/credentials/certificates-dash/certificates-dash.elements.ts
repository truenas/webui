import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const certificatesDashElements = {
  hierarchy: [T('Credentials'), T('Certificates')],
  anchorRouterLink: ['/credentials', 'certificates'],
  elements: {
    certificatesDash: {
      anchor: 'certificates-dash',
    },
  },
} satisfies UiSearchableElement;
