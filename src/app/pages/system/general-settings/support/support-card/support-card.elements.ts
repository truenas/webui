import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const elements: Record<string, UiSearchableElement> = {
  updateLicense: {
    hierarchy: [T('System Settings'), T('General'), T('Support'), T('License')],
    synonyms: [],
    triggerAnchor: 'update-license-btn',
    anchorRouterLink: ['/system', 'general'],
  },
  fileTicket: {
    hierarchy: [T('System Settings'), T('General'), T('Support'), T('File Ticket')],
    synonyms: [T('Report bug'), T('Create ticket'), T('Leave feedback'), T('Rate this page')],
    triggerAnchor: 'file-ticket-btn',
    anchorRouterLink: ['/system', 'general'],
  },
};
