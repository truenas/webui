import { Component } from '@angular/core';
import { FieldConfig } from 'app/pages/common/entity/entity-form/models/field-config.interface';
import helptext from '../../../../helptext/task-calendar/replication';

@Component({
    selector: 'app-replication-list',
    template: `<entity-form [conf]='this'></entity-form>`
})
export class ReplicationFormComponent {

    protected queryCall = 'replication.query';
    protected queryCallOption = [["id", "="]];
    protected addCall = 'replication.create';
    protected editCall = 'replication.update';
    protected route_success: string[] = ['tasks', 'replication'];
    protected isEntity = true;
    protected entityForm: any;

     protected fieldConfig: FieldConfig[] = [
        {
            type: 'select',
            name: 'direction',
            placeholder: helptext.direction_placeholder,
            tooltip: helptext.direction_tooltip,
            options: [
                {
                    label: 'PUSH',
                    value: 'PUSH',
                }, {
                    label: 'PULL',
                    value: 'PULL',
                }
            ],
            value: 'PUSH',
        },{
            type: 'select',
            name: 'transport',
            placeholder: helptext.transport_placeholder,
            tooltip: helptext.transport_tooltip,
            options: [
                {
                    label: 'SSH',
                    value: 'SSH',
                }, {
                    label: 'SSH+NETCAT',
                    value: 'SSH+NETCAT',
                },{
                    label: 'LOCAL',
                    value: 'LOCAL',
                }, {
                    label: 'LEGACY',
                    value: 'LEGACY',
                }
            ],
            value: 'SSH',
        },{
            type: 'select',
            name: 'ssh_credentials',
            placeholder: helptext.ssh_credentials_placeholder,
            tooltip: helptext.ssh_credentials_tooltip,
            options: [
                {
                    label: '---------',
                    value: '',
                }
            ],
            value: '',
            relation: [{
                action: 'HIDE',
                when: [{
                    name: 'transport',
                    value: 'LOCAL',
                }]
            }],
        },{
            type: 'select',
            name: 'netcat_active_side',
            placeholder: helptext.netcat_active_side_placeholder,
            tooltip: helptext.netcat_active_side_tooltip,
            options: [
                {
                    label: 'LOCAL',
                    value: 'LOCAL',
                }, {
                    label: 'REMOTE',
                    value: 'REMOTE',
                }
            ],
            value: 'LOCAL',
            relation: [{
                action: 'SHOW',
                when: [{
                    name: 'transport',
                    value: 'SSH+NETCAT',
                }]
            }],
        },{
            type: 'input',
            name: 'netcat_active_side_listen_address',
            placeholder: helptext.netcat_active_side_listen_address_placeholder,
            tooltip: helptext.netcat_active_side_listen_address_tooltip,
            relation: [{
                action: 'SHOW',
                when: [{
                    name: 'transport',
                    value: 'SSH+NETCAT',
                }]
            }],
        },{
            type: 'input',
            name: 'netcat_active_side_port_min',
            placeholder: helptext.netcat_active_side_port_min_placeholder,
            tooltip: helptext.netcat_active_side_port_min_tooltip,
            relation: [{
                action: 'SHOW',
                when: [{
                    name: 'transport',
                    value: 'SSH+NETCAT',
                }]
            }],
        },{
            type: 'input',
            name: 'netcat_active_side_port_max',
            placeholder: helptext.netcat_active_side_port_max_placeholder,
            tooltip: helptext.netcat_active_side_port_max_tooltip,
            relation: [{
                action: 'SHOW',
                when: [{
                    name: 'transport',
                    value: 'SSH+NETCAT',
                }]
            }],
        },{
            type: 'input',
            name: 'netcat_passive_side_connect_address',
            placeholder: helptext.netcat_passive_side_connect_address_placeholder,
            tooltip: helptext.netcat_passive_side_connect_address_tooltip,
            relation: [{
                action: 'SHOW',
                when: [{
                    name: 'transport',
                    value: 'SSH+NETCAT',
                }]
            }],
        },{
            type: 'select',
            multiple: true,
            name: 'source_datasets',
            placeholder: helptext.source_datasets_placeholder,
            tooltip: helptext.source_datasets_tooltip,
            options: [],
        },{
            type: 'select',
            multiple: true,
            name: 'target_dataset',
            placeholder: helptext.target_dataset_placeholder,
            tooltip: helptext.target_dataset_tooltip,
            options: [],
        },{
            type: 'checkbox',
            name: 'recursive',
            placeholder: helptext.recursive_placeholder,
            tooltip: helptext.recursive_tooltip,
            value: false,
        },{
            type: 'select',
            multiple: true,
            name: 'exclude',
            placeholder: helptext.exclude_placeholder,
            tooltip: helptext.exclude_tooltip,
            options: [],
            relation: [{
                action: 'HIDE',
                connective: 'OR',
                when: [{
                    name: 'recursive',
                    value: false,
                }, {
                    name: 'transport',
                    value: 'LEGACY',
                }]
            }],
        },{
            type: 'select',
            name: 'periodic_snapshot_tasks',
            placeholder: helptext.periodic_snapshot_tasks_placeholder,
            tooltip: helptext.periodic_snapshot_tasks_tooltip,
            options: [],
            relation: [{
                action: 'HIDE',
                connective: 'OR',
                when: [{
                    name: 'direction',
                    value: 'PULL',
                }, {
                    name: 'transport',
                    value: 'LEGACY',
                }]
            }],
        },
        {
            type: 'input',
            name: 'naming_schema',
            placeholder: helptext.naming_schema_placeholder,
            tooltip: helptext.naming_schema_tooltip,
            relation: [{
                action: 'HIDE',
                connective: 'OR',
                when: [{
                    name: 'direction',
                    value: 'PUSH',
                }, {
                    name: 'transport',
                    value: 'LEGACY',
                }]
            }],
        },
        {
            type: 'input',
            name: 'also_include_naming_schema',
            placeholder: helptext.also_include_naming_schema_placeholder,
            tooltip: helptext.also_include_naming_schema_tooltip,
            relation: [{
                action: 'HIDE',
                connective: 'OR',
                when: [{
                    name: 'direction',
                    value: 'PULL',
                }, {
                    name: 'transport',
                    value: 'LEGACY',
                }]
            }],
        },
        {
            type: 'checkbox',
            name: 'auto',
            placeholder: helptext.auto_placeholder,
            tooltip: helptext.auto_tooltip,
            value: true,
            relation: [{
                action: 'HIDE',
                when: [{
                    name: 'transport',
                    value: 'LEGACY',
                }]
            }],
        },{
            type: 'checkbox',
            name: 'schedule',
            placeholder: helptext.schedule_placeholder,
            tooltip: helptext.schedule_tooltip,
            relation: [{
                action: 'HIDE',
                connective: 'OR',
                when: [{
                    name: 'transport',
                    value: 'LEGACY',
                }, {
                    name: 'auto',
                    value: false,
                }]
            }],
            value: false,
        },{
            type: 'scheduler',
            name: 'schedule_picker',
            tooltip: helptext.schedule_tooltip,
            value: "0 0 * * *",
            relation: [{
                action: 'SHOW',
                when: [{
                    name: 'schedule',
                    value: true,
                }]
            }],
        },{
            type: 'checkbox',
            name: 'restrict_schedule',
            placeholder: helptext.restrict_schedule_placeholder,
            tooltip: helptext.restrict_schedule_tooltip,
            relation: [{
                action: 'HIDE',
                when: [{
                    name: 'transport',
                    value: 'LEGACY',
                }]
            }],
        },{
            type: 'scheduler',
            name: 'restrict_schedule_picker',
            tooltip: helptext.restrict_schedule_tooltip,
            value: "0 0 * * *",
            relation: [{
                action: 'SHOW',
                when: [{
                    name: 'restrict_schedule',
                    value: true,
                }]
            }],
        },{
            type: 'checkbox',
            name: 'only_matching_schedule',
            placeholder: helptext.only_matching_schedule_placeholder,
            tooltip: helptext.only_matching_schedule_tooltip,
            relation: [{
                action: 'HIDE',
                connective: 'OR',
                when: [{
                    name: 'schedule',
                    value: false,
                },{
                    name: 'transport',
                    value: 'LEGACY',
                }]
            }],
        },{
            type: 'checkbox',
            name: 'allow_from_scratch',
            placeholder: helptext.allow_from_scratch_placeholder,
            tooltip: helptext.allow_from_scratch_tooltip,
            relation: [{
                action: 'HIDE',
                when: [{
                    name: 'transport',
                    value: 'LEGACY',
                }]
            }],
        },{
            type: 'checkbox',
            name: 'hold_pending_snapshots',
            placeholder: helptext.hold_pending_snapshots_placeholder,
            tooltip: helptext.hold_pending_snapshots_tooltip,
            relation: [{
                action: 'HIDE',
                when: [{
                    name: 'transport',
                    value: 'LEGACY',
                }]
            }],
        },{
            type: 'select',
            name: 'retention_policy',
            placeholder: helptext.retention_policy_placeholder,
            tooltip: helptext.retention_policy_tooltip,
            options: [
                {
                    label: 'Same as Source',
                    value: 'SOURCE',
                },{
                    label: 'Custom',
                    value: 'CUSTOM',
                },{
                    label: 'None',
                    value: 'NONE',
                }
            ],
            value: 'NONE',
            relation: [{
                action: 'HIDE',
                when: [{
                    name: 'transport',
                    value: 'LEGACY',
                }]
            }],
        },{
            type: 'input',
            inputType: 'number',
            name: 'lifetime_value',
            placeholder: helptext.lifetime_value_placeholder,
            tooltip: helptext.lifetime_value_tooltip,
            relation: [{
                action: 'SHOW',
                when: [{
                    name: 'retention_policy',
                    value: 'CUSTOM',
                }]
            }],
            width: '50%',
        },{
            type: 'select',
            name: 'lifetime_unit',
            placeholder: helptext.lifetime_unit_placeholder,
            tooltip: helptext.lifetime_unit_tooltip,
            options: [
                {
                    label: 'Hour(s)',
                    value: 'HOUR',
                },{
                    label: 'Day(s)',
                    value: 'DAY',
                },{
                    label: 'Week(s)',
                    value: 'WEEK',
                },{
                    label: 'Month(s)',
                    value: 'MONTH',
                },{
                    label: 'Year(s)',
                    value: 'YEAR',
                }
            ],
            value: 'WEEK',
            relation: [{
                action: 'SHOW',
                when: [{
                    name: 'retention_policy',
                    value: 'CUSTOM',
                }]
            }],
            width: '50%',
        },
        {
            type: 'select',
            name: 'compression',
            placeholder: helptext.compression_placeholder,
            tooltip: helptext.compression_tooltip,
            options: [
                {
                    label: 'Disabled',
                    value: 'DISABLED', // should set it to be null before submit
                },{
                    label: 'lz4 (fastest)',
                    value: 'LZ4',
                },{
                    label: 'pigz (all rounder)',
                    value: 'PIGZ',
                },{
                    label: 'plzip (best compression)',
                    value: 'PLZIP',
                }
            ],
            value: 'DISABLED',
            relation: [{
                action: 'SHOW',
                when: [{
                    name: 'transport',
                    value: 'SSH',
                }]
            }],
        },{
            type: 'input',
            inputType: 'number',
            name: 'speed_limit',
            placeholder: helptext.speed_limit_placeholder,
            tooltip: helptext.speed_limit_tooltip,
            relation: [{
                action: 'SHOW',
                when: [{
                    name: 'transport',
                    value: 'SSH',
                }]
            }],
        },
        {
            type: 'checkbox',
            name: 'dedup',
            placeholder: helptext.dedup_placeholder,
            tooltip: helptext.dedup_tooltip,
            relation: [{
                action: 'HIDE',
                when: [{
                    name: 'transport',
                    value: 'LEGACY',
                }]
            }],
        },{
            type: 'checkbox',
            name: 'large_block',
            placeholder: helptext.large_block_placeholder,
            tooltip: helptext.large_block_tooltip,
            value: true,
            relation: [{
                action: 'HIDE',
                when: [{
                    name: 'transport',
                    value: 'LEGACY',
                }]
            }],
        },{
            type: 'checkbox',
            name: 'embed',
            placeholder: helptext.embed_placeholder,
            tooltip: helptext.embed_tooltip,
            value: true,
            relation: [{
                action: 'HIDE',
                when: [{
                    name: 'transport',
                    value: 'LEGACY',
                }]
            }],
        },{
            type: 'checkbox',
            name: 'compressed',
            placeholder: helptext.compressed_placeholder,
            tooltip: helptext.compressed_tooltip,
            value: true,
            relation: [{
                action: 'HIDE',
                when: [{
                    name: 'transport',
                    value: 'LEGACY',
                }]
            }],
        },{
            type: 'input',
            inputType: 'number',
            name: 'retries',
            placeholder: helptext.retries_placeholder,
            tooltip: helptext.retries_tooltip,
            value: 5,
            relation: [{
                action: 'HIDE',
                when: [{
                    name: 'transport',
                    value: 'LEGACY',
                }]
            }],
        },{
            type: 'select',
            name: 'logging_level',
            placeholder: helptext.logging_level_placeholder,
            tooltip: helptext.logging_level_tooltip,
            options: [
                {
                    label: 'DEBUG',
                    value: 'DEBUG',
                },{
                    label: 'INFO',
                    value: 'INFO',
                },{
                    label: 'WARNING',
                    value: 'WARNING',
                },{
                    label: 'ERROR',
                    value: 'ERROR',
                }
            ]
        },{
            type: 'checkbox',
            name: 'enabled',
            placeholder: helptext.enabled_placeholder,
            tooltip: helptext.enabled_tooltip,
            value: true,
        },
    ]

    constructor() { }

}