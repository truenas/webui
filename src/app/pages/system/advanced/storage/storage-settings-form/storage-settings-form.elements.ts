import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { Role } from 'app/enums/role.enum';

export const storageSettingsFormElements = {
  hierarchy: [T('System Settings'), T('Advanced'), T('Storage')],
  triggerAnchor: 'configure-storage',
  anchorRouterLink: ['/system', 'advanced'],
  requiredRoles: [Role.FullAdmin],
  elements: {
    systemPool: {
      hierarchy: [T('System Data Pool')],
    },
    swapSize: {
      hierarchy: [T('Swap Size')],
    },
  },
};
