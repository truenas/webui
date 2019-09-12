import { T } from '../../../translate-marker';

export default {
    step1_label: T('What and Where'),

    exist_replication_placeholder: T('Load Previous Replication Task'),
    exist_replication_tooltip: T(''),

    source_datasets_from_placeholder: T('Source Datasets'),
    source_datasets_from_tooltip: T(''),

    target_dataset_from_placeholder: T('Destination Datasets'),
    target_dataset_from_tooltip: T(''),

    ssh_credentials_source_placeholder: T('SSH Connections'),
    ssh_credentials_source_tooltip: T(''),

    ssh_credentials_target_placeholder: T('SSH Connections'),
    ssh_credentials_target_tooltip: T(''),

    source_datasets_placeholder: T(''),
    source_datasets_tooltip: T(''),

    target_dataset_placeholder: T(''),
    target_dataset_tooltip: T(''),

    recursive_placeholder: T('Recursive'),
    recursive_tooltip: T(''),

    custom_snapshots_placeholder: T('Replicate Custom Snapshots'),
    custom_snapshots_tooltip: T(''),

    naming_schema_placeholder: T('Naming Schema'),
    naming_schema_tooltip: T(''),

    encryption_placeholder: T('SSH Transfer Security'),
    encryption_tooltip: T('Data transfer security. The connection is authenticated with SSH,\
 then data can either be encrypted during transfer to maximise protection or left unencrypted\
 to maximise transfer speed. Transferring data without encryption is only recommended for\
 secure networks.'),

    name_placeholder: T('Task Name'),
    name_tooltip: T(''),

    step2_label: T('When'),

    schedule_method_placeholder: T('Replication Schedule'),
    schedule_method_tooltip: T(''),

    schedule_placeholder: T('Scheduling'),
    schedule_tooltip: T(''),

    retention_policy_placeholder: T('Destination Snapshot Lifetime'),
    retention_policy_tooltip: T(''),

    lifetime_value_placeholder: T(''),
    lifetime_value_tooltip: T(''),

    lifetime_unit_tooltip: T(''),

    // dialog
    cipher_placeholder: T('Cipher'),
    cipher_tooltip: T(''),
}