import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Validators } from '@angular/forms';

import { FieldSet } from '../../../common/entity/entity-form/models/fieldset.interface';
import { helptext_sharing_smb } from 'app/helptext/sharing/smb/smb';
import * as _ from 'lodash';

@Component({
    selector: 'app-smb-acl',
    template: `<entity-form [conf]='this'></entity-form>`
})
export class SMBAclComponent {
    protected queryCall = 'smb.sharesec.query';
    protected editCall = 'smb.sharesec.update'

    protected route_success: string[] = ['sharing', 'smb'];
    protected isEntity = true;
    protected customFilter: Array<any> = [[["id", "="]]];

    protected fieldSets: FieldSet[] = [
        {
            name: helptext_sharing_smb.share_acl_basic,
            label: true,
            class: 'basic',
            width: '100%',
            config: [
                {
                    type: 'input',
                    name: 'share_name',
                    placeholder: helptext_sharing_smb.share_name_placeholder,
                    tooltip: helptext_sharing_smb.share_name_tooltip,
                    readonly: true,
                }
            ]
        },
        {
            name: helptext_sharing_smb.share_acl_entries,
            label: true,
            class: 'entries',
            width: '100%',
            config: [
                {
                    type: 'list',
                    name: 'share_acl',
                    width: '100%',
                    listFields: [],
                    templateListField: [
                        {
                            type: 'input',
                            name: 'ae_who_sid',
                            placeholder: helptext_sharing_smb.ae_who_sid_placeholder,
                            tooltip: helptext_sharing_smb.ae_who_sid_tooltip,
                            required: true,
                            validation: [Validators.required],
                        },
                        {
                            type: 'input',
                            name: 'ae_who_name_domain',
                            placeholder: helptext_sharing_smb.ae_who_name_domain_placeholder,
                            tooltip: helptext_sharing_smb.ae_who_name_domain_tooltip,
                            class: 'inline',
                            width: '50%'
                        },
                        {
                            type: 'input',
                            name: 'ae_who_name_name',
                            placeholder: helptext_sharing_smb.ae_who_name_name_placeholder,
                            tooltip: helptext_sharing_smb.ae_who_name_name_tooltip,
                            class: 'inline',
                            width: '50%'
                        },
                        {
                            type: 'select',
                            name: 'ae_perm',
                            placeholder: helptext_sharing_smb.ae_perm_placeholder,
                            tooltip: helptext_sharing_smb.ae_perm_tooltip,
                            options: [
                                {
                                    label: 'FULL',
                                    value: 'FULL'
                                },
                                {
                                    label: 'CHANGE',
                                    value: 'CHANGE'
                                },
                                {
                                    label: 'READ',
                                    value: 'READ'
                                },
                            ],
                            required: true,
                            validation: [Validators.required],
                            class: 'inline',
                            width: '50%'
                        },
                        {
                            type: 'select',
                            name: 'ae_type',
                            placeholder: helptext_sharing_smb.ae_type_placeholder,
                            tooltip: helptext_sharing_smb.ae_type_tooltip,
                            options: [
                                {
                                    label: 'ALLOWED',
                                    value: 'ALLOWED'
                                },
                                {
                                    label: 'DENIED',
                                    value: 'DENIED'
                                },
                            ],
                            required: true,
                            validation: [Validators.required],
                            class: 'inline',
                            width: '50%'
                        },
                    ]
                }

            ]
        }
    ];

    protected shareACLField: any;
    protected entityForm: any;

    constructor(private aroute: ActivatedRoute) { }

    preInit() {
        this.aroute.params.subscribe(params => {
            if (params['pk']) {
                this.customFilter[0][0].push(parseInt(params['pk'], 10));
            }
        });
    }

    afterInit(entityForm) {
        this.entityForm = entityForm;
        this.shareACLField = _.find(entityForm.fieldConfig, {name: 'share_acl'});

        entityForm.formGroup.controls['share_acl'].valueChanges.subscribe((res) => {
            for (let i = 0; i < res.length; i++) {
                if (res[i].ae_who_sid !== undefined && res[i].ae_who_sid !== '') {
                    const sidField = _.find(this.shareACLField['listFields'][i], {name: 'ae_who_sid'});
                    if (!sidField.required) {
                        this.updateRequiredValidator('ae_who_sid', i, true);
                        this.updateRequiredValidator('ae_who_name_domain', i, false);
                        this.updateRequiredValidator('ae_who_name_name', i, false);
                    }
                } else if (res[i].ae_who_name_domain !== undefined && res[i].ae_who_name_domain !== '' ||
                res[i].ae_who_name_name !== undefined && res[i].ae_who_name_name !== '') {
                    const domainField = _.find(this.shareACLField['listFields'][i], {name: 'ae_who_name_domain'});
                    const nameField = _.find(this.shareACLField['listFields'][i], {name: 'ae_who_name_name'});
                    if (!domainField.required || !nameField.required) {
                        this.updateRequiredValidator('ae_who_sid', i, false);
                        this.updateRequiredValidator('ae_who_name_domain', i, true);
                        this.updateRequiredValidator('ae_who_name_name', i, true);
                    }
                }
            }
        })
    }

    updateRequiredValidator(fieldName, index, required) {
        const fieldCtrl = this.entityForm.formGroup.controls['share_acl'].controls[index].controls[fieldName];
        const fieldConfig =  _.find(this.shareACLField['listFields'][index], {name: fieldName});
        if (fieldConfig.required !== required) {
            fieldConfig.required = required;
            if (required) {
                fieldCtrl.setValidators([Validators.required]);
            } else {
                fieldCtrl.clearValidators();
            }
            fieldCtrl.updateValueAndValidity();
        }
    }

    resourceTransformIncomingRestData(data) {
        for (let i = 0; i < data['share_acl'].length; i++) {
            if (data['share_acl'][i]['ae_who_name']) {
                data['share_acl'][i]['ae_who_name_domain'] = data['share_acl'][i]['ae_who_name']['domain'];
                data['share_acl'][i]['ae_who_name_name'] = data['share_acl'][i]['ae_who_name']['name'];
                delete data['share_acl'][i]['ae_who_name'];
            }
        }
        return data;
    }

    beforeSubmit(data) {
       delete data['share_name']
        for (const acl of data.share_acl) {
            if (acl['ae_who_sid'] !== undefined && acl['ae_who_sid'] !== '') {
                delete acl['ae_who_name_domain'];
                delete acl['ae_who_name_name'];
            } else {
                acl['ae_who_name'] = {
                    domain: acl['ae_who_name_domain'],
                    name: acl['ae_who_name_name'],
                }
                delete acl['ae_who_name_domain'];
                delete acl['ae_who_name_name'];
                delete acl['ae_who_sid'];
            }
        }
    }
}