import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';

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
};
