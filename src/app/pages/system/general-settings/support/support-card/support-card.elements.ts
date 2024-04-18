import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const supportCardElements = {
  hierarchy: [T('System'), T('Support')],
  anchorRouterLink: ['/system', 'support'],
  elements: {
    support: {},
    updateLicense: {
      hierarchy: [T('License')],
    },
    fileTicket: {
      hierarchy: [T('File Ticket')],
      synonyms: [T('Rate this page')],
    },
  },
} satisfies UiSearchableElement;
