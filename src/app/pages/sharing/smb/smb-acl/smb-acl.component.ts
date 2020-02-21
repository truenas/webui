import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { FieldSet } from '../../../common/entity/entity-form/models/fieldset.interface';
import { helptext_sharing_smb } from 'app/helptext/sharing/smb/smb';

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
                            class: 'inline',
                            width: '50%'
                        },
                    ]
                }

            ]
        }
    ]

    constructor(private aroute: ActivatedRoute) { }

    preInit() {
        this.aroute.params.subscribe(params => {
            if (params['pk']) {
                this.customFilter[0][0].push(parseInt(params['pk'], 10));
            }
        });
    }

    beforeSubmit(data) {
       delete data['share_name']
        for (const acl of data.share_acl) {
            console.log(acl);
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
        console.log(data);
    }
}