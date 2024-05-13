import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const usageCardElements = {
  hierarchy: [T('Storage Dashboard')],
  anchorRouterLink: ['/storage'],
  elements: {
    usage: {
      hierarchy: [T('Usage')],
    },
    manageDatasets: {
      hierarchy: [T('Manage Datasets')],
    },
  },
} satisfies UiSearchableElement;
