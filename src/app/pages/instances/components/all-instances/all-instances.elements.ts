import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { GlobalSearchVisibleToken } from 'app/modules/global-search/enums/global-search-visible-token.enum';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const allInstancesElements = {
  hierarchy: [T('Containers')],
  synonyms: [T('Instances'), T('Incus'), T('Containers')],
  anchorRouterLink: ['/instances/view/def'],
  elements: {
    list: {
      hierarchy: [T('List')],
      synonyms: [T('Containers'), T('Instances'), T('Incus')],
      anchor: 'containers-list',
    },
  },
  visibleTokens: [GlobalSearchVisibleToken.Vms],
} satisfies UiSearchableElement;
