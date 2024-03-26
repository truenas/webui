import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';

export const replicationSettingsFormElements = {
  replicationTasksLimit: {
    hierarchy: [T('System Settings'), T('Advanced'), T('Replication'), T('Replication Tasks Limit')],
    triggerAnchor: 'configure-replication',
    anchorRouterLink: ['/system', 'advanced'],
  },
};
