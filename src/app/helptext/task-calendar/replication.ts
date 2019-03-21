import { T } from '../../translate-marker';

export default {

    direction_placeholder: T('Direction'),
    direction_tooltip: T(''),

    transport_placeholder: T('Transport'),
    transport_tooltip: T(''),

    ssh_credentials_placeholder: T('SSH Connection'),
    ssh_credentials_tooltip: T(''),

    netcat_active_side_placeholder: T('Netcat Active Side'),
    netcat_active_side_tooltip: T(''),

    netcat_active_side_listen_address_placeholder: T('Netcat Active Side Listen Address'),
    netcat_active_side_listen_address_tooltip: T(''),

    netcat_active_side_port_min_placeholder: T('Netcat Active Side Min Port'),
    netcat_active_side_port_min_tooltip: T(''),

    netcat_active_side_port_max_placeholder: T('Netcat Active Side Max Port'),
    netcat_active_side_port_max_tooltip: T(''),

    netcat_passive_side_connect_address_placeholder: T('Netcat Active Side Connect Address'),
    netcat_passive_side_connect_address_tooltip: T(''),

    source_datasets_placeholder: T('Source Datasets'),
    source_datasets_tooltip: T(''),

    target_dataset_placeholder: T('Target Datasets'),
    target_dataset_tooltip: T(''),

    recursive_placeholder: T('Recursively Replicate Child Dataset\'s Snapshots'),
    recursive_tooltip: T(''),

    exclude_placeholder: T('Exclude Child Datasets'),
    exclude_tooltip: T(''),

    periodic_snapshot_tasks_placeholder: T('Periodic Snapshot Tasks'),
    periodic_snapshot_tasks_tooltip: T(''),

    naming_schema_placeholder: T('Naming Schema'),
    naming_schema_tooltip: T(''),

    also_include_naming_schema_placeholder: T('Also Include Naming Schema'),
    also_include_naming_schema_tooltip: T(''),

    auto_placeholder: T('Run Automatically'),
    auto_tooltip: T(''),

    schedule_placeholder: T('Schedule'),
    schedule_tooltip: T(''),

    restrict_schedule_placeholder: T('Restrict Schedule'),
    restrict_schedule_tooltip: T(''),

    only_matching_schedule_placeholder: T('Only Replicate Snapshots Matching Schedule'),
    only_matching_schedule_tooltip: T(''),

    allow_from_scratch_placeholder: T('Replicate from scratch if incremental is not possible'),
    allow_from_scratch_tooltip: T(''),

    hold_pending_snapshots_placeholder: T('Hold Pending Snapshots'),
    hold_pending_snapshots_tooltip: T(''),

    retention_policy_placeholder: T('Snapshot Retention Policy'),
    retention_policy_tooltip: T(''),

    lifetime_value_placeholder: T('Snapshot Lifetime'),
    lifetime_value_tooltip: T(''),

    lifetime_unit_placeholder: T(''),
    lifetime_unit_tooltip: T(''),

    compression_placeholder: T('Stream Compression'),
    compression_tooltip: T(''),

    speed_limit_placeholder: T('Limit (kbps)'),
    speed_limit_tooltip: T(''),

    dedup_placeholder: T('Send Deduplicated Stream'),
    dedup_tooltip: T(''),

    large_block_placeholder: T('Allow Blocks Larger than 128KB'),
    large_block_tooltip: T(''),

    embed_placeholder: T('Allow WRITE_EMBEDDED Records'),
    embed_tooltip: T(''),

    compressed_placeholder: T('Allow Compressed WRITE Records'),
    compressed_tooltip: T(''),

    retries_placeholder: T('Number of retries for failed replications'),
    retries_tooltip: T(''),

    logging_level_placeholder: T('Logging Level'),
    logging_level_tooltip: T(''),

    enabled_placeholder: T('Enabled'),
    enabled_tooltip: T(''),

}