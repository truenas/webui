import { Component } from '@angular/core';
import { Router } from '@angular/router';

import { Wizard } from '../../../common/entity/entity-form/models/wizard.interface';
import helptext from '../../../../helptext/task-calendar/replication/replication-wizard';

@Component({
    selector: 'app-replication-wizard',
    template: `<entity-wizard [conf]="this"></entity-wizard>`
})
export class ReplicationWizardComponent {

    public route_success: string[] = ['task', 'replication'];
    public isLinear = true;
    public summary_title = "Replication Summary";

    protected custActions: Array<any> = [
    {
        id: 'advanced_add',
        name: "Advanced Replication Creation",
        function: () => {
        this.router.navigate(
            new Array('').concat(["tasks", "replication", "add"])
        );
        }
    }];

    protected wizardConfig: Wizard[] = [
        {
            label: helptext.step1_label,
            fieldConfig: [
                {
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
                        }, {
                            label: 'LOCAL',
                            value: 'LOCAL',
                        }, {
                            label: 'LEGACY',
                            value: 'LEGACY',
                        }
                    ],
                    value: 'SSH',
                    required: true,
                },
            ]
        }
    ]

    constructor(private router: Router) { }
}