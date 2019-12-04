import {Validators} from '@angular/forms';
import { T } from '../../../translate-marker';

export default {
// storage/snapshots/snapshot-add
snapshot_add_dataset_placeholder: T('Dataset'),
snapshot_add_dataset_tooltip: T('Select a dataset or zvol.'),
snapshot_add_dataset_validation: [Validators.required],

snapshot_add_name_placeholder: T('Name'),
snapshot_add_name_tooltip: T('Unique snapshot name. Cannot be used with \
 a <i>Naming Schema</i>.'),

snapshot_add_naming_schema_placeholder: T('Naming Schema'),
snapshot_add_naming_schema_tooltip: T('Generate a name for the snapshot \
 from a previously created \
 <a href="--docurl--/tasks.html#periodic-snapshot-tasks" \
 target="_blank">periodic snapshot task</a> naming schema. This allows \
 the snapshot to be replicated. Cannot be used with a <i>Name</i>.'),

snapshot_add_recursive_placeholder: T('Recursive'),
snapshot_add_recursive_tooltip: T('Set to include child datasets of the \
 chosen dataset.'),

// storage/snapshots/snapshot-clone
snapshot_clone_name_placeholder: T('Name'),
snapshot_clone_name_tooltip: T('Name of the new dataset created from the cloned snapshot.'),
snapshot_clone_name_validation : [ Validators.required ],

label_clone: T('Clone to New Dataset'),
label_delete: T('Delete'),
label_rollback: T('Rollback'),

rollback_snapshot_placeholder: T('Snapshot'),
rollback_recursive_placeholder: T('Destroy newer snapshots'),
rollback_recursive_tooltip: T('Setting this will destroy any snapshots and bookmarks more recent than this one'),
rollback_recursive_clones_placeholder: T('Destroy newer cloned datasets'),
rollback_recursive_clones_tooltip: T('Setting this will also destroy any datasets cloned from snapshots that are more recent than this one'),
rollback_warning: T("<b>WARNING:</b> Rolling back to this snapshot will permanently delete later snapshots of this dataset.\
 Do not roll back until all desired snapshots have been backed up!"),
rollback_title: ('Rollback Snapshot'),
rollback_confirm: T('Confirm')
}
