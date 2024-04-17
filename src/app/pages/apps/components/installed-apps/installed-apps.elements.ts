import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const installedAppsElements = {
  hierarchy: [T('Applications'), T('Installed')],
  anchorRouterLink: ['/apps', 'installed'],
  elements: {
    installed: {
      synonyms: [T('Apps'), T('Applications')],
    },
  },
} satisfies UiSearchableElement;
