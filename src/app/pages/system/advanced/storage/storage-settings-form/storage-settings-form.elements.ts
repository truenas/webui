import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { Role } from 'app/enums/role.enum';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const storageSettingsFormElements = {
  hierarchy: [T('System'), T('Advanced'), T('Storage')],
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
} satisfies UiSearchableElement;
