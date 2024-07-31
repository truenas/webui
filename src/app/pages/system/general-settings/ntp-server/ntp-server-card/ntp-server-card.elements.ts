import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const ntpServerElements = {
  hierarchy: [T('System'), T('General Settings'), T('NTP Server')],
  synonyms: [T('Add NTP Server')],
  anchorRouterLink: ['/system', 'general'],
  elements: {
    ntp: {
      anchor: 'ntp-card',
    },
    addNtpServer: {
      hierarchy: [T('Add NTP Server')],
      anchor: 'add-ntp-server',
      synonyms: [
        T('Create NTP Server'),
        T('New NTP Server'),
        T('NTP Server'),
        T('Time Server'),
      ],
    },
  },
} satisfies UiSearchableElement;
