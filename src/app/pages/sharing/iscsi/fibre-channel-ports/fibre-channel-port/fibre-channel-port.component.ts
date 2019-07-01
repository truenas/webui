import { Component, OnInit, Input } from '@angular/core';
import { FormGroup } from '@angular/forms';

import { WebSocketService, IscsiService } from '../../../../../services';
import { FieldConfig } from '../../../../common/entity/entity-form/models/field-config.interface';
import { FieldSet } from '../../../../common/entity/entity-form/models/fieldset.interface';
import { EntityFormService } from '../../../../common/entity/entity-form/services/entity-form.service';
import * as _ from 'lodash';
import {EntityUtils} from '../../../../common/entity/utils';

@Component({
    selector: 'app-iscsi-fibre-channel-port',
    templateUrl: './fibre-channel-port.component.html',
    styleUrls: ['./fibre-channel-port.component.css', '../../../../common/entity/entity-form/entity-form.component.scss'],
    providers: [IscsiService]
})
export class FibreChannelPortComponent implements OnInit {
    @Input() config: any;
    @Input() parent: any;

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
    public formGroup: FormGroup;

    constructor(
        private ws: WebSocketService,
        private entityFormService: EntityFormService,
        private iscsiService: IscsiService) {
            const targetField = _.find(this.fieldSets[1].config, { name: 'target' });
            this.iscsiService.getTargets().subscribe(
                (res) => {
                    for (let i = 0; i < res.length; i++) {
                        targetField.options.push({
                            label: res[i].name,
                            value: res[i].id,
                        });
                    }
                },
                (err) => {
                    new EntityUtils().handleWSError(this, err, this.parent.dialogService);
                }
            )
        }

    ngOnInit() {
        // this.config.initiators = ['naa.5000000d668ad303', 'naa.5000000d668ad302', 'naa.5000000d668ad305', 'naa.5000000d668ad306','naa.5000000d668ad303', 'naa.5000000d668ad302', 'naa.5000000d668ad305', 'naa.5000000d668ad306','naa.5000000d668ad303', 'naa.5000000d668ad302', 'naa.5000000d668ad305', 'naa.5000000d668ad306','naa.5000000d668ad303', 'naa.5000000d668ad302', 'naa.5000000d668ad305', 'naa.5000000d668ad306'];
        this.fieldConfig = [];
        for (let i = 0; i < this.fieldSets.length; i++) {
            const fieldset = this.fieldSets[i];
            if (fieldset.config) {
                this.fieldConfig = this.fieldConfig.concat(fieldset.config);
            }
        }
        this.formGroup = this.entityFormService.createFormGroup(this.fieldConfig);

        for (const i in this.config){
            if (this.formGroup.controls[i]) {
              this.formGroup.controls[i].setValue(this.config[i]);
            }
        }
    }

    isShow(field) {
        if (field === 'target' || field == 'initiators') {
            return this.formGroup.controls['mode'].value == 'TARGET';
        }
        return true;
    }

    onSubmit(event) {
        let value = _.cloneDeep(this.formGroup.value);
        delete value['initiators'];

        if (value['mode'] != 'TARGET') {
            value['target'] = null;
        }
        this.parent.loader.open();
        this.ws.call('fcport.update', [this.config.id, value]).subscribe(
            (res) => {
                this.parent.loader.close();
                this.parent.snackBar.open("Fiber Channel Port " + this.config.name + " update successfully.", 'close', { duration: 5000 });
            },
            (err) => {
                this.parent.loader.close();
                this.parent.dialogService.errorReport(err.trace.class, err.reason, err.trace.formatted);
            }
        )
    }
}