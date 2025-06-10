import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';

export const helptextSnapshots = {
  datasetLabel: T('Dataset'),

  nameLabel: T('Name'),
  nameTooltip: T('Unique snapshot name. Cannot be used with \
 a <i>Naming Schema</i>.'),

  namingSchemaLabel: T('Naming Schema'),
  namingSchemaTooltip: T('Generate a name for the snapshot \
 using the naming schema from a previously created <b>Periodic Snapshot Task</b>. \
 This allows the snapshot to be replicated. Cannot be used with a <i>Name</i>.'),

  recursiveLabel: T('Recursive'),
  recursiveTooltip: T('Set to include child datasets and zvols of the \
 chosen dataset.'),

  cloneNameTooltip: T('Name of the new dataset created from the \
 cloned snapshot.'),

  stopRollbackLabel: T('Stop Rollback if Snapshots Exist:'),
  stopRollbackTooltip: T('Choose a safety level for the \
 rollback action. The rollback is canceled when the safety check finds \
 additional snapshots that are directly related to the dataset being rolled back.'),

  rollbackDatasetLabel: T('Newer Intermediate, Child, and Clone'),
  rollbackDatasetTooltip: T('Stops the rollback when the safety check \
 finds any related intermediate, child dataset, or clone snapshots that \
 are newer than the rollback snapshot.'),

  rollbackRecursiveLabel: T('Newer Clone'),
  rollbackRecursiveTooltip: T('Stops the rollback when the safety \
 check finds any related clone snapshots that are newer than the \
 rollback snapshot.'),

  rollbackRecursiveClonesLabel: T('No Safety Check (CAUTION)'),
  rollbackRecursiveClonesTooltip: T('The rollback will destroy any \
 related intermediate, child dataset, and cloned snapshots that are \
 newer than the rollback snapshot.'),

  rollbackConfirm: T('Confirm'),

  extraColumns: {
    show: T('Show Extra Columns'),
    hide: T('Hide Extra Columns'),

    showMessage: T('Showing extra columns in the table is useful for data filtering, but can cause performance issues.'),
    hideMessage: T('Hidden columns are not available for sorting or filtering. Hiding columns improves performance.'),
    showButton: T('Show'),
    hideButton: T('Hide'),
  },
};
