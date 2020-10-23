import { Component } from '@angular/core';
import { Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { FieldConfig } from 'app/pages/common/entity/entity-form/models/field-config.interface';
import { FieldSet } from '../../../common/entity/entity-form/models/fieldset.interface';
import helptext from 'app/helptext/system/ssh-keypairs';
import { AppLoaderService } from '../../../../services/app-loader/app-loader.service';
import { EntityUtils } from '../../../common/entity/utils';
import { WebSocketService, DialogService, StorageService } from '../../../../services';
import { ModalService } from 'app/services/modal.service';
import { atLeastOne } from 'app/pages/common/entity/entity-form/validators/at-least-one-validation';

@Component({
    selector: 'app-ssh-keypairs-form',
    template: `<entity-form [conf]='this'></entity-form>`
})
export class SshKeypairsFormComponent {

    protected queryCall = 'keychaincredential.query';
    protected queryCallOption: Array<any>;
    protected addCall = 'keychaincredential.create';
    protected editCall = 'keychaincredential.update';
    protected isEntity = true;
    protected entityForm: any;
    protected isOneColumnForm = true;
    private rowNum: any;
    public title = helptext.formTitle;
    private getRow = new Subscription;

    protected fieldConfig: FieldConfig[];
    public fieldSets: FieldSet[] = [
        {
            name: helptext.fieldset_basic,
            label: true,
            class: 'basic',
            width: '100%',
            config: [
                {
                    type: 'paragraph',
                    name: 'key_instructions',
                    paraText: helptext.key_instructions
                }, {
                    type: 'input',
                    name: 'name',
                    placeholder: helptext.name_placeholder,
                    tooltip: helptext.name_tooltip,
                    required: true,
                    validation: [Validators.required]
                }
            ]
        },
        {
            name: helptext.fieldset_basic,
            label: false,
            class: 'basic',
            width: '100%',
            config: [
                {
                    type: 'button',
                    name: 'remote_host_key_button',
                    customEventActionLabel: helptext.generate_key_button,
                    value: '',
                    customEventMethod: () => {
                        this.generateKeypair();
                    },
                    relation: [{
                        action: 'SHOW',
                        when: [{
                            name: 'setup_method',
                            value: 'manual',
                        }]
                    }],
                }, {
                    type: 'textarea',
                    name: 'private_key',
                    placeholder: helptext.private_key_placeholder,
                    tooltip: helptext.private_key_tooltip,
                }, {
                    type: 'textarea',
                    name: 'public_key',
                    placeholder: helptext.public_key_placeholder,
                    tooltip: helptext.public_key_tooltip,
                    validation: [atLeastOne('private_key', [helptext.private_key_placeholder, helptext.public_key_placeholder])]
                }
            ]
        }
    ]

    protected compactCustomActions = [
        {
            id: 'download_private',
            name: helptext.download_private,
            function: () => {
                this.downloadKey('private_key');
            }
        },
        {
            id: 'download_public',
            name: helptext.download_public,
            function: () => {
                this.downloadKey('public_key');
            }
        }
    ];

    constructor(private aroute: ActivatedRoute, private ws: WebSocketService, private loader: AppLoaderService,
        private dialogService: DialogService, private storage: StorageService, private modalService: ModalService) { 
            this.getRow = this.modalService.getRow$.subscribe(rowId => {
                this.rowNum = rowId;
                this.getRow.unsubscribe();
            })
        }

    isCustActionDisabled(actionId: string) {
        if (this.entityForm.formGroup.controls['name'].value) {
            if (actionId === 'download_private') {
                return !this.entityForm.formGroup.controls['private_key'].value;
            } else if (actionId === 'download_public') {
                return !this.entityForm.formGroup.controls['public_key'].value;
            }
        }
        return true;
    }

    preInit() {
        if (this.rowNum) {
            this.queryCallOption = [["id", "=", this.rowNum]];
            this.rowNum = null;
        }
    }

    generateKeypair() {
        this.loader.open();
        this.clearPreviousErrors();
        let elements = document.getElementsByTagName('mat-error');
        while (elements[0]) elements[0].parentNode.removeChild(elements[0]);
        this.ws.call('keychaincredential.generate_ssh_key_pair').subscribe(
            (res) => {
                this.loader.close();
                this.entityForm.formGroup.controls['private_key'].setValue(res.private_key);
                this.entityForm.formGroup.controls['public_key'].setValue(res.public_key);
            },
            (err) => {
                this.loader.close();
                new EntityUtils().handleWSError(this, err, this.dialogService);
            }
        )
    }

    downloadKey(key_type) {
        const name = this.entityForm.formGroup.controls['name'].value;
        const key = this.entityForm.formGroup.controls[key_type].value;
        const filename = name + '_' + key_type + '_rsa';
        const blob = new Blob([key], {type: 'text/plain'});
        this.storage.downloadBlob(blob, filename);
    }

    afterInit(entityForm) {
        this.entityForm = entityForm;
        this.fieldConfig = entityForm.fieldConfig;
        this.entityForm.formGroup.controls['private_key'].valueChanges.subscribe((res) => {
            this.clearPreviousErrors();
        });
        this.entityForm.formGroup.controls['public_key'].valueChanges.subscribe((res) => {
            this.clearPreviousErrors();
        });

    }

    clearPreviousErrors() {
        // Clears error messages from MW from previous attempts to Save
        let elements = document.getElementsByTagName('mat-error');
        while (elements[0]) elements[0].parentNode.removeChild(elements[0]);
    }

    resourceTransformIncomingRestData(wsResponse) {
        for (const item in wsResponse.attributes) {
            wsResponse[item] = wsResponse.attributes[item];
        }
        return wsResponse;
    }

    beforeSubmit(data) {
        if (data.remote_host_key_button || data.remote_host_key_button === '') {
            delete data.remote_host_key_button;
        }
        delete data['key_instructions'];
        if (this.entityForm.isNew) {
            data['type'] = 'SSH_KEY_PAIR';
        }

        data['attributes'] = {
            'private_key': data['private_key'],
            'public_key': data['public_key'],
        }

        delete data['private_key'];
        delete data['public_key'];
        return data;
    }

    afterSubmit() {
        this.modalService.refreshTable();
    }

}
