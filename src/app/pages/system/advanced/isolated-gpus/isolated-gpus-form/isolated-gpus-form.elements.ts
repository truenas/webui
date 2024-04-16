import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { Role } from 'app/enums/role.enum';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const isolatedGpusElements = {
  hierarchy: [T('System'), T('Advanced'), T('Isolated GPU Devices'), T('GPUs')],
  triggerAnchor: 'configure-isolated-gpus',
  anchorRouterLink: ['/system', 'advanced'],
  requiredRoles: [Role.FullAdmin],
  elements: {
    isolatedGpuPciIds: {},
  },
} satisfies UiSearchableElement;
