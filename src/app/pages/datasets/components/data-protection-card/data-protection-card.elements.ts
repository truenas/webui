import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const dataProtectionCardElements = {
  hierarchy: [T('Datasets')],
  synonyms: [T('Manage Datasets')],
  anchorRouterLink: ['/datasets'],
  elements: {
    createSnapshot: {
      hierarchy: [T('Create Snapshot')],
      synonyms: [T('Take Snapshot')],
    },
    manageSnapshots: {
      hierarchy: [T('Manage Snapshots')],
      synonyms: [T('Snapshot Manager')],
    },
    manageSnapshotTasks: {
      hierarchy: [T('Manage Snapshots Tasks')],
      synonyms: [T('Snapshot Task Manager')],
    },
    manageReplicationTasks: {
      hierarchy: [T('Manage Replication Tasks')],
      synonyms: [T('Replication Task Manager')],
    },
    manageRsyncTasks: {
      hierarchy: [T('Manage Rsync Tasks')],
      synonyms: [T('Rsync Task Manager')],
    },
  },
} satisfies UiSearchableElement;
