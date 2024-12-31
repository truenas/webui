import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const datasetManagementElements = {
  hierarchy: [T('Datasets')],
  anchorRouterLink: ['/datasets'],
  synonyms: [T('Manage Datasets')],
  elements: {
    datasets: {
      anchor: 'datasets',
    },
  },
} satisfies UiSearchableElement;
