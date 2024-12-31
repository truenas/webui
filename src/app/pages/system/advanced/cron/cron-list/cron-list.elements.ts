import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const cronElements = {
  hierarchy: [T('System'), T('Cron Jobs')],
  anchorRouterLink: ['/system', 'cron'],
  elements: {
    cron: {
      anchor: 'cron',
    },
  },
} satisfies UiSearchableElement;
