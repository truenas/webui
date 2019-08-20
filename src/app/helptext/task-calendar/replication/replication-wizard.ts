import { T } from '../../../translate-marker';

export default {
    step1_label: T('What and Where'),

    exist_replication_placeholder: T('Load Previous Replication Task'),
    exist_replication_tooltip: T(''),

    source_datasets_placeholder: T('Source Datasets'),
    source_datasets_tooltip: T(''),

    target_dataset_placeholder: T('Destination Datasets'),
    target_dataset_tooltip: T(''),

    ssh_credentials_placeholder: T('SSH Connections'),
    ssh_credentials_tooltip: T(''),

    encryption_placeholder: T('SSH Transfer Security'),
    encryption_tooltip: T('Data transfer security. The connection is authenticated with SSH,\
 then data can either be encrypted during transfer to maximise protection or left unencrypted\
 to maximise transfer speed. Transferring data without encryption is only recommended for\
 secure networks.'),

    name_placeholder: T('Task Name'),
    name_tooltip: T(''),

    step2_label: T('When'),
}