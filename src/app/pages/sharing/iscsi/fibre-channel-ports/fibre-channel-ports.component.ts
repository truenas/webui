import { Component, OnInit } from '@angular/core';
import { FormGroup, FormArray, FormBuilder } from '@angular/forms';

import { WebSocketService, IscsiService } from '../../../../services';
import { FieldConfig } from '../../../common/entity/entity-form/models/field-config.interface';
import { FieldSet } from '../../../common/entity/entity-form/models/fieldset.interface';
import { EntityFormService } from '../../../common/entity/entity-form/services/entity-form.service';
import * as _ from 'lodash';

@Component({
    selector: 'app-iscsi-fibre-channel-ports',
    templateUrl: './fibre-channel-ports.component.html',
    styleUrls: ['./fibre-channel-ports.component.css', '../../../common/entity/entity-form/entity-form.component.scss'],
    providers: [IscsiService]
})
export class FibreChannelPortsComponent implements OnInit {

    public fibreChannels;

    public fieldSets: FieldSet[] = [
        {
            name: '',
            class: '',
            label: true,
            width: '50%',
            config: [
                {
                    type: 'radio',
                    name: 'mode',
                    placeholder: '',
                    tooltip: '',
                    options: [
                        {
                            label: 'Initiator',
                            value: 'INITIATOR'
                        },
                        {
                            label: 'Target',
                            value: 'TARGET'
                        },
                        {
                            label: 'Disabled',
                            value: 'DISABLED'
                        }
                    ]
                },
            ]
        },
        {
            name: '',
            class: '',
            label: true,
            width: '50%',
            config: [
                {
                    type: 'select',
                    name: 'target',
                    placeholder: 'Targets',
                    tooltip: '',
                    options: [{
                        label: '---------',
                        value: null,
                    }],
                    value: null,
                    disabled: false,
                    isHidden: false,
                },
                {
                    type: 'textarea',
                    name: 'initiators',
                    placeholder: 'Connected Initiators',
                    tooltip: '',
                    disabled: false,
                    isHidden: false,
                }
            ]
        }
    ];
    public fieldConfig: FieldConfig[];
    public formArray: FormArray;
    public fieldCofigArray: FieldConfig[];

    constructor(
        private ws: WebSocketService,
        private entityFormService: EntityFormService,
        private iscsiService: IscsiService,
        private formBuilder: FormBuilder) {}

    getTargetOptions() {
        return new Promise((resolve, reject) => {
            const targetField = _.find(this.fieldSets[1].config, { name: 'target' });
            this.iscsiService.getTargets().subscribe(
                (res) => {
                    for (let i = 0; i < res.length; i++) {
                        targetField.options.push({
                            label: res[i].name,
                            value: res[i].id,
                        });
                    }
                    return resolve(true);
                },
                (err) => {
                    return reject(err);
                }
            )
        });
    }

    async ngOnInit() {
        await this.getTargetOptions();

        this.formArray = this.formBuilder.array([]);

        this.fieldConfig = [];
        for (let i = 0; i < this.fieldSets.length; i++) {
            const fieldset = this.fieldSets[i];
            if (fieldset.config) {
                this.fieldConfig = this.fieldConfig.concat(fieldset.config);
            }
        }

        this.ws.call('fcport.query').subscribe(
            (res) => {
                // res[1].initiators = ['naa.5000000d668ad303', 'naa.5000000d668ad302', 'naa.5000000d668ad305', 'naa.5000000d668ad306','naa.5000000d668ad303', 'naa.5000000d668ad302', 'naa.5000000d668ad305', 'naa.5000000d668ad306','naa.5000000d668ad303', 'naa.5000000d668ad302', 'naa.5000000d668ad305', 'naa.5000000d668ad306','naa.5000000d668ad303', 'naa.5000000d668ad302', 'naa.5000000d668ad305', 'naa.5000000d668ad306'];
                this.fibreChannels = res;
                for (let i = 0; i < this.fibreChannels.length; i++) {
                    const config = _.cloneDeep(this.fieldConfig);
                    this.formArray.push(this.entityFormService.createFormGroup(config));
                    for (const item in this.fibreChannels[i]) {
                        const fg = (<FormGroup>this.formArray.controls[i]).controls[item];
                        if (fg) {
                            fg.setValue(this.fibreChannels[i][item]);
                        }
                    }
                }
            },
            (err) => {

            });
    }

    isShow(field, index) {
        if (field === 'target' || field == 'initiators') {
            return (<FormGroup> this.formArray.controls[index]).controls['mode'].value == 'TARGET';
        }
        return true;
    }
}