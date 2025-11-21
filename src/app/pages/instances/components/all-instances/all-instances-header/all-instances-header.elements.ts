import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { GlobalSearchVisibleToken } from 'app/modules/global-search/enums/global-search-visible-token.enum';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const allInstancesHeaderElements = {
  hierarchy: [T('Containers')],
  anchorRouterLink: ['/containers'],
  elements: {
    settings: {
      hierarchy: [T('GlobalSettings')],
      synonyms: [T('Container Settings')],
      anchor: 'container-global-settings',
    },
    add: {
      hierarchy: [T('Create New Container')],
      synonyms: [T('New Container'), T('Add Container')],
      anchor: 'add-container',
    },
  },
  visibleTokens: [GlobalSearchVisibleToken.Vms],
} satisfies UiSearchableElement;
