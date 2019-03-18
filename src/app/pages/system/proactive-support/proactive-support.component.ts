import { Component } from '@angular/core';

import { FieldConfig } from '../../common/entity/entity-form/models/field-config.interface';
import { FieldSet } from '../../common/entity/entity-form/models/fieldset.interface';
import helptext from '../../../helptext/system/proactivesupport';

@Component({
    selector: 'app-proative-support',
    template: `<entity-form [conf]="this"></entity-form>`,
})
export class ProactiveSupportComponent {

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
                },
                {
                    type: 'input',
                    name: 'name',
                    placeholder: 'Name',
                    tooltip: '',
                },
                {
                    type: 'input',
                    inputType: 'email',
                    name: 'email',
                    placeholder: 'Email',
                    tooltip: '',
                },
                {
                    type: 'input',
                    inputType: 'phone',
                    name: 'phone',
                    placeholder: 'Phone',
                    tooltip: '',
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
                    name: 'title',
                    placeholder: 'Title',
                    tooltip: '',
                },
                {
                    type: 'input',
                    name: 'name',
                    placeholder: 'Name',
                    tooltip: '',
                },
                {
                    type: 'input',
                    inputType: 'email',
                    name: 'email',
                    placeholder: 'Email',
                    tooltip: '',
                },
                {
                    type: 'input',
                    inputType: 'phone',
                    name: 'phone',
                    placeholder: 'Phone',
                    tooltip: '',
                }
            ]
        },
        {
            name: 'Secondary Contact (optional)',
            label: false,
            config: [
                {
                    type: 'checkbox',
                    name: 'enable',
                    placeholder: 'Enable automatic support alerts to iXsystems (Silver/Gold support only)',
                    tooltip: '',
                }
            ]
        }
    ]

    constructor() { }
}