import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { Role } from 'app/enums/role.enum';

export const sedFormElements = {
  hierarchy: [T('System'), T('Advanced'), T('Self-Encrypting Drive')],
  triggerAnchor: 'configure-sed',
  anchorRouterLink: ['/system', 'advanced'],
  requiredRoles: [Role.FullAdmin],
  elements: {
    sedUser: {
      hierarchy: [T('ATA Security User')],
      synonyms: [T('SED User')],
    },
    sedPassword: {
      hierarchy: [T('SED Password')],
    },
  },
};
