import {Validators} from '@angular/forms';
import { T } from '../../../translate-marker';

export default {
// storage/snapshots/snapshot-add
snapshot_add_dataset_placeholder: T('Pool/Dataset'),
snapshot_add_dataset_tooltip: T('Select an existing ZFS pool, dataset, or zvol.'),
snapshot_add_dataset_validation: [Validators.required],

snapshot_add_name_placeholder: T('Name'),
snapshot_add_name_tooltip: T('Add a name for the new snapshot'),

snapshot_add_naming_schema_placeholder: T('Naming Schema'),
snapshot_add_naming_schema_tooltip: T('Add a naming schema for the new snapshot'),

snapshot_add_recursive_placeholder: T('Recursive'),
snapshot_add_recursive_tooltip: T('Set to include child datasets of the chosen dataset.'),

// storage/snapshots/snapshot-clone
snapshot_clone_name_placeholder: T('Name'),
snapshot_clone_name_tooltip: T('Enter a name for the cloned snapshot.'),
snapshot_clone_name_validation : [ Validators.required ],

label_clone: T('Clone'),
label_delete: T('Delete'),
label_rollback: T('Rollback')

}