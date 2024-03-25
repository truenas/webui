import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';

export const supportCardElements = {
  hierarchy: [T('System Settings'), T('General'), T('Support')],
  anchorRouterLink: ['/system', 'general'],
  elements: {
    updateLicense: {
      hierarchy: [T('License')],
    },
    fileTicket: {
      hierarchy: [T('File Ticket')],
      synonyms: [T('Rate this page')],
    },
  },
};
