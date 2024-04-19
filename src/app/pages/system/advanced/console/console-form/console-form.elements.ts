import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { Role } from 'app/enums/role.enum';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const consoleFormElements = {
  hierarchy: [T('System'), T('Advanced'), T('Console')],
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
} satisfies UiSearchableElement;
