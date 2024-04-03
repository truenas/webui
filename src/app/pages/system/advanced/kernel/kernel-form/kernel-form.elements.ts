import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { Role } from 'app/enums/role.enum';

export const kernelFormElements = {
  kernel: {
    hierarchy: [T('System'), T('Advanced'), T('Kernel'), T('Enable Kernel Debug')],
    triggerAnchor: 'configure-kernel',
    anchorRouterLink: ['/system', 'advanced'],
    requiredRoles: [Role.FullAdmin],
  },
};
