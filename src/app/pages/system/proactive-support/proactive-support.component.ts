import { Component } from '@angular/core';

import { FieldConfig } from '../../common/entity/entity-form/models/field-config.interface';
import { FieldSet } from '../../common/entity/entity-form/models/fieldset.interface';
import helptext from '../../../helptext/system/proactivesupport';
import { WebSocketService, SnackbarService } from '../../../services/';
import { AppLoaderService } from "../../../services/app-loader/app-loader.service";
import { EntityUtils } from '../../common/entity/utils';

@Component({
    selector: 'app-proative-support',
    template: `<entity-form [conf]="this"></entity-form>`,
    providers: [SnackbarService]
})
export class ProactiveSupportComponent {

    protected queryCall = 'support.config';

    public fieldSetDisplay = 'default';//default | carousel | stepper
    public fieldConfig: FieldConfig[] = [];
    public fieldSets: FieldSet[] = [
        {
            name: 'Proactive Support can notify iXsystems by email when TrueNAS hardware conditions require attention.',
            label: true,
        },
        {
            name: 'Primary Contact',
            label: true,
            width: '50%',
            config: [
                {
                    type: 'input',
                    name: 'title',
                    placeholder: 'Title',
                    tooltip: '',
                    relation: [{
                        action: 'DISABLE',
                        when: [{
                            name: 'enabled',
                            value: false,
                        }]
                    }]
                },
                {
                    type: 'input',
                    name: 'name',
                    placeholder: 'Name',
                    tooltip: '',
                    relation: [{
                        action: 'DISABLE',
                        when: [{
                            name: 'enabled',
                            value: false,
                        }]
                    }]
                },
                {
                    type: 'input',
                    inputType: 'email',
                    name: 'email',
                    placeholder: 'Email',
                    tooltip: '',
                    relation: [{
                        action: 'DISABLE',
                        when: [{
                            name: 'enabled',
                            value: false,
                        }]
                    }]
                },
                {
                    type: 'input',
                    inputType: 'phone',
                    name: 'phone',
                    placeholder: 'Phone',
                    tooltip: '',
                    relation: [{
                        action: 'DISABLE',
                        when: [{
                            name: 'enabled',
                            value: false,
                        }]
                    }]
                }
            ]
        },
        {
            name: 'Secondary Contact (optional)',
            label: true,
            width: '50%',
            config: [
                {
                    type: 'input',
                    name: 'secondary_title',
                    placeholder: 'Title',
                    tooltip: '',
                    relation: [{
                        action: 'DISABLE',
                        when: [{
                            name: 'enabled',
                            value: false,
                        }]
                    }]
                },
                {
                    type: 'input',
                    name: 'secondary_name',
                    placeholder: 'Name',
                    tooltip: '',
                    relation: [{
                        action: 'DISABLE',
                        when: [{
                            name: 'enabled',
                            value: false,
                        }]
                    }]
                },
                {
                    type: 'input',
                    inputType: 'email',
                    name: 'secondary_email',
                    placeholder: 'Email',
                    tooltip: '',
                    relation: [{
                        action: 'DISABLE',
                        when: [{
                            name: 'enabled',
                            value: false,
                        }]
                    }]
                },
                {
                    type: 'input',
                    inputType: 'phone',
                    name: 'secondary_phone',
                    placeholder: 'Phone',
                    tooltip: '',
                    relation: [{
                        action: 'DISABLE',
                        when: [{
                            name: 'enabled',
                            value: false,
                        }]
                    }]
                }
            ]
        },
        {
            name: 'Secondary Contact (optional)',
            label: false,
            config: [
                {
                    type: 'checkbox',
                    name: 'enabled',
                    placeholder: 'Enable automatic support alerts to iXsystems (Silver/Gold support only)',
                    tooltip: '',
                }
            ]
        }
    ]

    constructor(private ws: WebSocketService, private snackbarService: SnackbarService,
        private loader: AppLoaderService) { }

    customSubmit(value) {
        this.loader.open();
        this.ws.call('support.update', [value]).subscribe(
            (res) => {
                this.loader.close();
                this.snackbarService.open("Settings saved.", 'close', { duration: 5000 })
            },
            (err) => {
                this.loader.close();
                new EntityUtils().handleWSError(this, err);
            }
        );
    }
}