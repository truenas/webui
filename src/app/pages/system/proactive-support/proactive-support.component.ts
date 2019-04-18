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
            name: helptext.cardtitle_placeholder,
            label: true,
        },
        {
            name: helptext.primary_contact_placeholder,
            label: true,
            width: '50%',
            config: [
                {
                    type: 'input',
                    name: 'title',
                    placeholder: helptext.title_placeholder,
                    tooltip: helptext.title_tooltip,
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
                    placeholder: helptext.name_placeholder,
                    tooltip: helptext.name_tooltip,
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
                    placeholder: helptext.email_placeholder,
                    tooltip: helptext.email_tooltip,
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
                    placeholder: helptext.phone_placeholder,
                    tooltip: helptext.phone_tooltip,
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
            name: helptext.secondary_contact_placeholder,
            label: true,
            width: '50%',
            config: [
                {
                    type: 'input',
                    name: 'secondary_title',
                    placeholder: helptext.secondary_title_placeholder,
                    tooltip: helptext.secondary_title_tooltip,
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
                    placeholder: helptext.secondary_name_placeholder,
                    tooltip: helptext.secondary_name_tooltip,
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
                    placeholder: helptext.secondary_email_placeholder,
                    tooltip: helptext.secondary_email_tooltip,
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
                    placeholder: helptext.secondary_phone_placeholder,
                    tooltip: helptext.secondary_phone_tooltip,
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
            name: helptext.secondary_contact_placeholder,
            label: false,
            config: [
                {
                    type: 'checkbox',
                    name: 'enabled',
                    placeholder: helptext.enabled_placeholder,
                    tooltip: helptext.enabled_tooltip,
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