import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const replicationSettingsCardElements = {
  hierarchy: [T('System'), T('Advanced'), T('Replication')],
  anchorRouterLink: ['/system', 'advanced'],
  elements: {
    replication: {
      anchor: 'replication-card',
    },
    replicationTasksLimit: {
      hierarchy: [T('Replication Tasks Limit')],
    },
  },
} satisfies UiSearchableElement;
