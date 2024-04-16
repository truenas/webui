import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { Role } from 'app/enums/role.enum';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const replicationSettingsFormElements = {
  hierarchy: [T('System'), T('Advanced'), T('Replication'), T('Replication Tasks Limit')],
  triggerAnchor: 'configure-replication',
  anchorRouterLink: ['/system', 'advanced'],
  requiredRoles: [Role.ReplicationTaskConfigWrite],
  elements: {
    replicationTasksLimit: {
    },
  },
} satisfies UiSearchableElement;
