import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const replicationSettingsCardElements = {
  hierarchy: [T('System'), T('Advanced Settings'), T('Replication')],
  anchorRouterLink: ['/system', 'advanced'],
  elements: {
    replication: {
      anchor: 'replication-card',
    },
    configure: {
      anchor: 'replication-settings',
      hierarchy: [T('Configure Replication')],
      synonyms: [T('Replication Settings')],
    },
    replicationTasksLimit: {
      hierarchy: [T('Replication Tasks Limit')],
    },
  },
} satisfies UiSearchableElement;
