import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const elements: Record<string, UiSearchableElement> = {
  replicationTasksLimit: {
    hierarchy: [T('System Settings'), T('Advanced'), T('Replication'), T('Replication Tasks Limit')],
    synonyms: [],
    triggerAnchor: 'replication-settings',
    anchorRouterLink: ['/system', 'advanced'],
  },
};
