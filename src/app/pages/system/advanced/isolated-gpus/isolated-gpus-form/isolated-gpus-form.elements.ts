import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { Role } from 'app/enums/role.enum';

export const isolatedGpusElements = {
  isolatedGpuPciIds: {
    hierarchy: [T('System Settings'), T('Advanced'), T('Isolated GPU Devices'), T('GPUs')],
    triggerAnchor: 'configure-isolated-gpus',
    anchorRouterLink: ['/system', 'advanced'],
    requiredRoles: [Role.FullAdmin],
  },
};
