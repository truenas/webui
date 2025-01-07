import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const initShudownListElements = {
  hierarchy: [T('System'), T('Init/Shutdown Scripts')],
  anchorRouterLink: ['/system', 'initshutdown'],
  elements: {
    initShutDown: {
      anchor: 'init-shutdown',
    },
  },
} satisfies UiSearchableElement;
