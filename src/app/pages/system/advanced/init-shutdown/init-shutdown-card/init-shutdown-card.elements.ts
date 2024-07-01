import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const initShutdownCardElements = {
  hierarchy: [T('System'), T('Advanced'), T('Init/Shutdown Scripts')],
  synonyms: [T('Add Init/Shutdown Script')],
  anchorRouterLink: ['/system', 'advanced'],
  elements: {
    addInitShutdownScript: {
      hierarchy: [T('Add')],
      anchor: 'add-init-shutdown-script',
      synonyms: [
        T('Add Init/Shutdown Script'),
        T('Create Init/Shutdown Script'),
        T('New Init/Shutdown Script'),
        T('Init/Shutdown Script'),
      ],
    },
  },
} satisfies UiSearchableElement;
