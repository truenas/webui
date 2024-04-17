import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { Role } from 'app/enums/role.enum';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const accessFormElements = {
  hierarchy: [T('System'), T('Advanced'), T('Access')],
  triggerAnchor: 'configure-access',
  anchorRouterLink: ['/system', 'advanced'],
  requiredRoles: [Role.AuthSessionsWrite],
  elements: {
    tokenLifetime: {
      hierarchy: [T('Token Lifetime')],
      synonyms: [T('Session Token Lifetime')],
    },
  },
} satisfies UiSearchableElement;
