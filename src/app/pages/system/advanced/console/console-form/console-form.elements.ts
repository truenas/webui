import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { Role } from 'app/enums/role.enum';

export const consoleFormElements = {
  hierarchy: [T('System Settings'), T('Advanced'), T('Console')],
  triggerAnchor: 'configure-console',
  anchorRouterLink: ['/system', 'advanced'],
  requiredRoles: [Role.FullAdmin],
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
