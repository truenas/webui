import { Component } from '@angular/core';
import { Wizard } from '../../../common/entity/entity-form/models/wizard.interface';
import { Validators } from '@angular/forms';
import * as _ from 'lodash';

import helptext from '../../../../helptext/sharing/iscsi/iscsi-wizard';
import { IscsiService, RestService, WebSocketService } from '../../../../services/';

@Component({
    selector: 'app-iscsi-wizard',
    template: '<entity-wizard [conf]="this"></entity-wizard>',
    providers: [IscsiService]
})
export class IscsiWizardComponent {

    protected wizardConfig: Wizard[] = [{
        label: helptext.step1_label,
        fieldConfig: [
            {
                type: 'input',
                name: 'name',
                placeholder: helptext.name_placeholder,
                tooltip: helptext.name_tooltip,
                required: true,
            },
            {
                type: 'select',
                name: 'type',
                placeholder: helptext.type_placeholder,
                tooltip: helptext.type_tooltip,
                options: [
                    {
                        label: 'Device',
                        value: 'DISK',
                    },
                    {
                        label: 'File',
                        value: 'FILE',
                    },
                ],
            },
            // file options
            {
                type: 'explorer',
                explorerType: 'file',
                initial: '/mnt',
                name: 'path',
                placeholder: helptext.file_placeholder,
                tooltip: helptext.file_tooltip,
                isHidden: false,
                disabled: false,
                required: true,
                validation: [ Validators.required ],
            },
            {
                type: 'input',
                name: 'filesize',
                placeholder: helptext.filesize_placeholder,
                tooltip: helptext.filesize_tooltip,
                isHidden: false,
                disabled: false,
                required: true,
                validation: [ Validators.required ],
            },
            // device options
            {
                type: 'select',
                name: 'disk',
                placeholder: helptext.disk_placeholder,
                tooltip: helptext.disk_tooltip,
                options: [{
                    label: 'Create New',
                    value: ''
                }],
                isHidden: false,
                disabled: false,
                required: true,
                validation: [ Validators.required ]
            },
            {
                type: 'select',
                name: 'blocksize',
                placeholder: helptext.blocksize_placeholder,
                tooltip: helptext.blocksize_tooltip,
                options: [
                    {
                        label: '512',
                        value: 512,
                    },
                    {
                        label: '1024',
                        value: 1024,
                    },
                    {
                        label: '2048',
                        value: 2048,
                    },
                    {
                        label: '4096',
                        value: 4096,
                    },
                ],
                value: 512,
            },
        ]
    }]

    protected deviceFieldGroup: any[] = [
        'disk',
        'blocksize',
    ];
    protected fileFieldGroup: any[] = [
        'path',
        'filesize',
    ];

    protected entityWizard: any;

    constructor(private iscsiService: IscsiService) {

    }

    afterInit(entityWizard) {
        console.log(entityWizard);
        this.entityWizard = entityWizard;

        const disk_field = _.find(this.wizardConfig[0].fieldConfig, {'name' : 'disk'});
        //get device options
        this.iscsiService.getExtentDevices().subscribe((res) => {
          for(const i in res) {
            disk_field.options.push({label: res[i], value: i});
          }
        })

        entityWizard.formArray.controls[0].controls['type'].valueChanges.subscribe((value) => {
            console.log(value);

            this.formUpdate(value);
        });
        entityWizard.formArray.controls[0].controls['type'].setValue('DISK');
    }

    formUpdate(type) {
        const isDevice = type == 'FILE' ? false : true;

        this.fileFieldGroup.forEach(field => {
            const control: any = _.find(this.wizardConfig[0].fieldConfig, { 'name': field });
            control['isHidden'] = isDevice;
            control.disabled = isDevice;
            if (isDevice) {
                this.entityWizard.formArray.controls[0].controls[field].disable();
            } else {
                this.entityWizard.formArray.controls[0].controls[field].enable();
            }
        });

        this.deviceFieldGroup.forEach(field => {
            const control: any = _.find(this.wizardConfig[0].fieldConfig, { 'name': field });
            control['isHidden'] = !isDevice;
            control.disabled = !isDevice;
            if (!isDevice) {
                this.entityWizard.formArray.controls[0].controls[field].disable();
            } else {
                this.entityWizard.formArray.controls[0].controls[field].enable();
            }
        });
    }
}
