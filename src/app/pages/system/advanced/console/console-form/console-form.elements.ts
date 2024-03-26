import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';

export const consoleFormElements = {
  hierarchy: [T('System Settings'), T('Advanced'), T('Console')],
  triggerAnchor: 'configure-console',
  anchorRouterLink: ['/system', 'advanced'],
  elements: {
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
};
