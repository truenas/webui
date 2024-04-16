import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const initShutdownCardElements = {
  hierarchy: [T('System'), T('Advanced'), T('Init/Shutdown Scripts'), T('Add')],
  synonyms: [T('Add Init/Shutdown Script')],
  anchorRouterLink: ['/system', 'advanced'],
  elements: {
    addInitShutdownScript: {},
  },
} satisfies UiSearchableElement;
