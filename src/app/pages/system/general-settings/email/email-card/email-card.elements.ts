import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const emailCardElements = {
  hierarchy: [T('System'), T('General Settings'), T('Email')],
  anchorRouterLink: ['/system', 'general'],
  elements: {
    email: {
      anchor: 'email-card',
    },
    settings: {
      anchor: 'email-settings',
      hierarchy: [T('Configure Email')],
      synonyms: [T('Send Test Email'), T('Config Email'), T('Set email')],
    },
    sendMethod: {
      hierarchy: [T('Send Method')],
      synonyms: [T('SMTP'), T('Gmail'), T('Outlook')],
    },
  },
} satisfies UiSearchableElement;
