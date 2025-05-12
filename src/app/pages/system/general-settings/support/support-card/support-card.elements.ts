import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const supportCardElements = {
  hierarchy: [T('System'), T('General Settings'), T('Support')],
  anchorRouterLink: ['/system', 'general'],
  elements: {
    support: {
      anchor: 'support',
    },
    updateLicense: {
      hierarchy: [T('License')],
      synonyms: [
        T('Update License'),
        T('Add License'),
        T('License Update'),
      ],
    },
    fileTicket: {
      hierarchy: [T('File Ticket')],
      synonyms: [T('Rate this page')],
    },
  },
} satisfies UiSearchableElement;
