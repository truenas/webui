import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const diskHealthCardElements = {
  hierarchy: [T('Storage Dashboard')],
  anchorRouterLink: ['/storage'],
  elements: {
    diskHealth: {
      hierarchy: [T('Disk Health')],
    },
    manageDisks: {
      hierarchy: [T('Manage Disks')],
    },
  },
} satisfies UiSearchableElement;
