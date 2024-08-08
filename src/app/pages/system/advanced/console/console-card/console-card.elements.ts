import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const consoleCardElements = {
  hierarchy: [T('System'), T('Advanced Settings'), T('Console')],
  anchorRouterLink: ['/system', 'advanced'],
  elements: {
    console: {
      anchor: 'console-card',
    },
    configure: {
      anchor: 'console-settings',
      hierarchy: [T('Configure Console')],
      synonyms: [T('Console Settings')],
    },
    consoleMenu: {
      hierarchy: [T('Console Menu')],
      synonyms: [T('Show Text Console without Password Prompt')],
    },
    serialConsole: {
      hierarchy: [T('Enable Serial Console')],
    },
    serialPort: {
      hierarchy: [T('Serial Port')],
    },
    serialSpeed: {
      hierarchy: [T('Serial Speed')],
    },
    motd: {
      hierarchy: [T('MOTD Banner')],
    },
  },
} satisfies UiSearchableElement;
