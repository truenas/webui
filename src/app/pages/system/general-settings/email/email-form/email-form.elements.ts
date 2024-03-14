import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const elements: Record<string, UiSearchableElement> = {
  sendMethod: {
    hierarchy: [T('System Settings'), T('General'), T('Email Options'), T('Send Method')],
    synonyms: [T('SMTP'), T('Gmail')],
    triggerAnchor: 'email-settings',
    anchorRouterLink: ['/system', 'general'],
  },
  outgoingServer: {
    hierarchy: [T('System Settings'), T('General'), T('Email Options'), T('Outgoing Server')],
    synonyms: [T('SMTP Server')],
    triggerAnchor: 'email-settings',
    anchorRouterLink: ['/system', 'general'],
  },
};
