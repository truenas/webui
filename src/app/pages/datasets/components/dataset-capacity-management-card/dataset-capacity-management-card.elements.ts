import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const datasetCapacityManagementElements = {
  hierarchy: [T('Datasets')],
  synonyms: [T('Manage Datasets')],
  anchorRouterLink: ['/datasets'],
  elements: {
    manageUserQuotas: {
      hierarchy: [T('Manage User Quotas')],
      synonyms: [T('User Quota Manager')],
    },
    manageGroupQuotas: {
      hierarchy: [T('Manage Group Quotas')],
      synonyms: [T('Group Quota Manager')],
    },
  },
} satisfies UiSearchableElement;
