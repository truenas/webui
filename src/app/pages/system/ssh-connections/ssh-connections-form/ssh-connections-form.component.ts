import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { FieldConfig } from '../../../common/entity/entity-form/models/field-config.interface';
import helptext from '../../../../helptext/system/ssh-connections';

@Component({
    selector: 'app-ssh-connections-form',
    template: `<entity-form [conf]="this"></entity-form>`
})
export class SshConnectionsFormComponent {

    protected queryCall = 'keychaincredential.query';
    protected queryCallOption = [["id", "="]];

    protected fieldConfig: FieldConfig[] = [
        {
            type: 'input',
            name: 'type',
            value: 'SSH_CREDENTIALS',
            isHidden: true,
        },
        {
            type: 'input',
            name: 'name',
            placeholder: helptext.name_placeholder,
            tooltip: helptext.name_tooltip,
        },
        {
            type: 'select',
            name: 'setup_method',
            placeholder: helptext.setup_method_placeholder,
            tooltip: helptext.setup_method_tooltip,
            options: [
                {
                    label: 'Manual',
                    value: 'manual',
                },
                {
                    label: 'Semi-automatic (FreeNAS only)',
                    value: 'semiautomatic',
                }
            ],
            value: 'manual',
        },
        {
            type: 'input',
            name: 'host',
            placeholder: helptext.host_placeholder,
            tooltip: helptext.host_tooltip,
        },
        {
            type: 'input',
            inputType: 'number',
            name: 'port',
            placeholder: helptext.port_placeholder,
            tooltip: helptext.port_tooltip,
            value: 22,
        },
        {
            type: 'input',
            name: 'username',
            placeholder: helptext.username_placeholder,
            tooltip: helptext.username_tooltip,
        },
        {
            type: 'select',
            name: 'private_key',
            placeholder: helptext.private_key_placeholder,
            tooltip: helptext.private_key_tooltip,
            options: [
                {
                    label: '---------',
                    value: '',
                }
            ],
        },
        {
            type: 'textarea',
            name: 'remote_host_key',
            placeholder: helptext.remote_host_key_placeholder,
            tooltip: helptext.remote_host_key_tooltip,
        },
        {
            type: 'select',
            name: 'cipher',
            placeholder: helptext.cipher_placeholder,
            tooltip: helptext.cipher_tooltip,
            options: [
                {
                    label: 'Standard',
                    value: 'STANDARD',
                },
                {
                    label: 'Fast',
                    value: 'FAST',
                },
                {
                    label: 'Disabled',
                    value: 'DISABLED',
                }
            ]
        }, {
            type: 'input',
            inputType: 'number',
            name: 'connection_timeout',
            placeholder: helptext.connection_timeout_placeholder,
            tooltip: helptext.connection_timeout_tooltip,
            value: 10,
        }
    ]
    constructor(private aroute: ActivatedRoute) { }

    preInit() {
        this.aroute.params.subscribe(params => {
            if (params['pk']) {
                this.queryCallOption[0].push(parseInt(params['pk']));
            }
        });
    }
}