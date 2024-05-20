import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const ntpServerElements = {
  hierarchy: [T('System'), T('General'), T('NTP Server')],
  synonyms: [T('Add NTP Server')],
  anchorRouterLink: ['/system', 'general'],
  elements: {
    ntp: {
      anchor: 'ntp-card',
    },
    addNtpServer: {
      hierarchy: [T('Add')],
    },
  },
} satisfies UiSearchableElement;
