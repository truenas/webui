import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const datasetManagementElements = {
  hierarchy: [T('Datasets')],
  anchorRouterLink: ['/datasets'],
  elements: {
    datasets: {},
  },
} satisfies UiSearchableElement;
