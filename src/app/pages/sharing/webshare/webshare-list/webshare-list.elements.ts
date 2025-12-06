import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const webshareListElements = {
  hierarchy: [T('Shares'), T('WebShare')],
  anchorRouterLink: ['/sharing', 'webshare'],
  elements: {
    webshareList: {
      anchor: 'webshare-list',
    },
    createWebShare: {
      hierarchy: [T('Add WebShare')],
      synonyms: [
        T('Create WebShare'),
        T('New WebShare'),
        T('Add Share'),
        T('Create Share'),
        T('New Share'),
      ],
    },
  },
} satisfies UiSearchableElement;
