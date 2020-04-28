import {Validators} from '@angular/forms';
import { T } from '../../../translate-marker';

export default {
fieldset_snapshot: T('Snapshot'),

// storage/snapshots/snapshot-add
snapshot_add_dataset_placeholder: T('Dataset'),
snapshot_add_dataset_tooltip: T('Select a dataset or zvol.'),
snapshot_add_dataset_validation: [Validators.required],

snapshot_add_name_placeholder: T('Name'),
snapshot_add_name_tooltip: T('Unique snapshot name. Cannot be used with \
 a <i>Naming Schema</i>.'),

snapshot_add_naming_schema_placeholder: T('Naming Schema'),
snapshot_add_naming_schema_tooltip: T('Generate a name for the snapshot \
 using the naming schema from a previously created <b>Periodic Snapshot Task</b>. \
 This allows the snapshot to be replicated. Cannot be used with a <i>Name</i>.'),

snapshot_add_recursive_placeholder: T('Recursive'),
snapshot_add_recursive_tooltip: T('Set to include child datasets of the \
 chosen dataset.'),

// storage/snapshots/snapshot-clone
snapshot_clone_name_placeholder: T('Name'),
snapshot_clone_name_tooltip: T('Name of the new dataset created from the \
 cloned snapshot.'),
snapshot_clone_name_validation : [ Validators.required ],

label_clone: T('Clone to New Dataset'),
label_delete: T('Delete'),
label_rollback: T('Rollback'),

rollback_snapshot_placeholder: T('Snapshot'),

rollback_recursive_radio_placeholder: T('Stop Rollback if Snapshots Exist:'),
rollback_recursive_radio_tooltip: T('Choose a safety level for the \
 rollback action. The rollback is canceled when the safety check finds \
 additional snapshots that are directly related to the dataset being rolled back.'),

rollback_dataset_placeholder: T('Newer Intermediate, Child, and Clone'),
rollback_dataset_tooltip: T('Stops the rollback when the safety check \
 finds any related intermediate, child dataset, or clone snapshots that \
 are newer than the rollback snapshot.'),

rollback_recursive_placeholder: T('Newer Clone'),
rollback_recursive_tooltip: T('Stops the rollback when the safety \
 check finds any related clone snapshots that are newer than the \
 rollback snapshot.'),

rollback_recursive_clones_placeholder: T('No Safety Check (CAUTION)'),
rollback_recursive_clones_tooltip: T('The rollback will destroy any \
 related intermediate, child dataset, and cloned snapshots that are \
 newer than the rollback snapshot.'),

rollback_warning: T("<b>WARNING:</b> Rolling the dataset back \
 destroys data on the dataset <i>and</i> can destroy additional snapshots \
 that are related to the dataset. <b>This can result in permanent data \
 loss!</b> Do not roll back until all desired data and snapshots are \
 backed up."),

rollback_title: ('Dataset Rollback From Snapshot'),
rollback_confirm: T('Confirm'),

extra_cols: {
    title_show: T('Show Extra Columns'),
    title_hide: T('Hide Extra Columns'),

    message_show: T('Showing extra columns in the table is useful for data filtering, \
 but can cause performance issues. NOTE: This window will reload automatically so that the new view can take effect.'),
    message_hide: T('Hidden columns are not available for sorting or filtering, but the values can be \
 viewed by expanding the row. Hiding columns improves performance. NOTE: This window will reload automatically so that \
 the new view can take effect.'),
    button_show: T('Show'),
    button_hide: T('Hide')
}

}
