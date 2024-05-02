import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const dockerImagesListElements = {
  hierarchy: [T('Applications'), T('Manage Container Images')],
  anchorRouterLink: ['/apps', 'installed', 'manage-container-images'],
  elements: {
    dockerImagesList: {},
    pullImage: {
      hierarchy: [T('Pull Image')],
      synonyms: [T('Add Image')],
    },
  },
} satisfies UiSearchableElement;
