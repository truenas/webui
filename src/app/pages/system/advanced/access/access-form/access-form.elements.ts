import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { Role } from 'app/enums/role.enum';

export const accessFormElements = {
  hierarchy: [T('System Settings'), T('Advanced'), T('Access')],
  triggerAnchor: 'configure-access',
  anchorRouterLink: ['/system', 'advanced'],
  requiredRoles: [Role.AuthSessionsWrite],
  elements: {
    tokenLifetime: {
      hierarchy: [T('Token Lifetime')],
      synonyms: [T('Session Token Lifetime')],
    },
  },
};
