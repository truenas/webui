import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { Role } from 'app/enums/role.enum';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const kernelFormElements = {
  hierarchy: [T('System'), T('Advanced'), T('Kernel'), T('Enable Kernel Debug')],
  triggerAnchor: 'configure-kernel',
  anchorRouterLink: ['/system', 'advanced'],
  requiredRoles: [Role.FullAdmin],
  elements: {
    kernel: {},
  },
} satisfies UiSearchableElement;
