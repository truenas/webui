import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const emailFormElements = {
  hierarchy: [T('System'), T('General'), T('Email')],
  triggerAnchor: 'configure-email',
  anchorRouterLink: ['/system', 'general'],
  elements: {
    sendMethod: {
      hierarchy: [T('Send Method')],
      synonyms: [T('SMTP'), T('Gmail')],
    },
    outgoingServer: {
      hierarchy: [T('Outgoing Server')],
      synonyms: [T('SMTP Server')],
    },
  },
} satisfies UiSearchableElement;
