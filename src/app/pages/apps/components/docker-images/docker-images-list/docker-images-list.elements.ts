import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { GlobalSearchVisibleToken } from 'app/modules/global-search/enums/global-search-visible-token.enum';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const dockerImagesListElements = {
  hierarchy: [T('Applications'), T('Manage Container Images')],
  anchorRouterLink: ['/apps', 'manage-container-images'],
  elements: {
    dockerImagesList: {
      anchor: 'docker-images-list',
    },
    pullImage: {
      hierarchy: [T('Pull Image')],
      synonyms: [T('Add Image')],
    },
  },
  visibleTokens: [GlobalSearchVisibleToken.Apps],
} satisfies UiSearchableElement;
