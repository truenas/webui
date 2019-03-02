import { Component } from '@angular/core';
import { Wizard } from '../../../common/entity/entity-form/models/wizard.interface';
import { Validators, FormControl } from '@angular/forms';
import * as _ from 'lodash';

import helptext from '../../../../helptext/sharing/iscsi/iscsi-wizard';
import { IscsiService, RestService, WebSocketService } from '../../../../services/';
import { matchOtherValidator } from "app/pages/common/entity/entity-form/validators/password-validation";
import { CloudCredentialService } from '../../../../services/cloudcredential.service';

@Component({
    selector: 'app-iscsi-wizard',
    template: '<entity-wizard [conf]="this"></entity-wizard>',
    providers: [IscsiService, CloudCredentialService]
})
export class IscsiWizardComponent {

    public route_success: string[] = ['sharing', 'iscsi'];
    public isLinear = true;
    public summary_title = "ISCSI Summary";
    public summaryObj = {
        'name': null,
        'type': null,
        'path': null,
        'filesize': null,
        'disk': null,
        'dataset': null,
        'volsize': null,
        'volsize_unit': null,
        'usefor': null,
        'portal': null,
        'discovery_authmethod': null,
        'discovery_authgroup': null,
        'ip': null,
        'port': null,
        'auth': null,
        'tag': null,
        'user': null,
        'initiators': null,
        'auth_network': null,
        'comment': null,
    };
    public summary: any;

    protected wizardConfig: Wizard[] = [
        {
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
                    validation: [Validators.required],
                },
                {
                    type: 'input',
                    name: 'filesize',
                    placeholder: helptext.filesize_placeholder,
                    tooltip: helptext.filesize_tooltip,
                    isHidden: false,
                    disabled: false,
                    required: true,
                    validation: [Validators.required],
                },
                // device options
                {
                    type: 'select',
                    name: 'disk',
                    placeholder: helptext.disk_placeholder,
                    tooltip: helptext.disk_tooltip,
                    options: [{
                        label: 'Create New',
                        value: 'NEW'
                    }],
                    isHidden: false,
                    disabled: false,
                    required: true,
                    validation: [Validators.required]
                },
                // zvol creation group
                {
                    type: 'explorer',
                    explorerType: 'directory',
                    initial: '/mnt',
                    name: 'dataset',
                    placeholder: helptext.dataset_placeholder,
                    tooltip: helptext.dataset_tooltip,
                    hasErrors: false,
                    errors: 'Pool/Dataset not exist',
                    required: true,
                    validation: [Validators.required],
                },
                {
                    type: 'input',
                    name: 'volsize',
                    inputType: 'number',
                    placeholder: helptext.volsize_placeholder,
                    tooltip: helptext.volsize_tooltip,
                    validation: [Validators.required, Validators.min(0)],
                    required: true,
                    class: 'inline',
                    width: '70%',
                    value: 0,
                    min: 0,
                },
                {
                    type: 'select',
                    name: 'volsize_unit',
                    options: [{
                        label: 'KiB',
                        value: 'K',
                    }, {
                        label: 'MiB',
                        value: 'M',
                    }, {
                        label: 'GiB',
                        value: 'G',
                    }, {
                        label: 'TiB',
                        value: 'T',
                    }],
                    value: 'G',
                    class: 'inline',
                    width: '30%',
                },
                {
                    type: 'input',
                    name: 'volblocksize',
                    placeholder: helptext.volblocksize_placeholder,
                    tooltip: helptext.volblocksize_tooltip,
                    isHidden: true,
                },
                // use for group
                {
                    type: 'select',
                    name: 'usefor',
                    placeholder: helptext.usefor_placehodler,
                    tooltip: helptext.usefor_tooltip,
                    options: [
                        {
                            label: "VMware: Extent block size 512b, TPC enabled, no Xen compat mode, SSD speed",
                            value: 'vmware',
                        }, {
                            label: "Xen: Extent block size 512b, TPC enabled, Xen compat mode enabled, SSD speed",
                            value: 'xen',
                        },
                        {
                            label: "Legacy OS: Extent block size 512b, TPC enabled, no Xen compat mode, SSD speed",
                            value: 'legacyos',
                        },
                        {
                            label: "Modern OS: Extent block size 4k, TPC enabled, no Xen compat mode, SSD speed",
                            value: 'modernos',
                        }
                    ]
                },
                {
                    type: 'select',
                    name: 'blocksize',
                    isHidden: true,
                },
                {
                    type: 'checkbox',
                    name: 'insecure_tpc',
                    isHidden: true,
                },
                {
                    type: 'checkbox',
                    name: 'xen',
                    isHidden: true,
                },
                {
                    type: 'input',
                    name: 'rpm',
                    value: 'SSD',
                    isHidden: true,
                },
            ]
        },
        {
            label: helptext.step2_label,
            fieldConfig: [
                {
                    type: 'select',
                    name: 'portal',
                    placeholder: helptext.portal_placeholder,
                    tooltip: helptext.portal_tooltip,
                    options: [
                        {
                            label: 'Create New',
                            value: 'NEW'
                        }
                    ],
                    required: true,
                },
                // portal creation
                {
                    type: 'select',
                    name: 'discovery_authmethod',
                    placeholder: helptext.discovery_authmethod_placeholder,
                    tooltip: helptext.discovery_authmethod_tooltip,
                    options: [
                        {
                            label: 'NONE',
                            value: 'NONE',
                        },
                        {
                            label: 'CHAP',
                            value: 'CHAP',
                        },
                        {
                            label: 'Mutual CHAP',
                            value: 'CHAP_MUTUAL',
                        }
                    ],
                    value: 'NONE',
                    isHidden: true,
                    disabled: true,
                },
                {
                    type: 'select',
                    name: 'discovery_authgroup',
                    placeholder: helptext.discovery_authgroup_placeholder,
                    tooltip: helptext.discovery_authgroup_tooltip,
                    options: [
                        {
                            label: 'None',
                            value: '',
                        }
                    ],
                    value: '',
                    isHidden: true,
                    disabled: true,
                },
                {
                    type: 'select',
                    name: 'ip',
                    placeholder: helptext.ip_placeholder,
                    tooltip: helptext.ip_tooltip,
                    options: [
                        {
                            label: '0.0.0.0',
                            value: '0.0.0.0'
                        }
                    ],
                    value: '0.0.0.0',
                    isHidden: true,
                    disabled: true,
                },
                {
                    type: 'input',
                    name: 'port',
                    placeholder: helptext.port_placeholder,
                    tooltip: helptext.port_tooltip,
                    value: '3260',
                    isHidden: true,
                    disabled: true,
                },
                // athorized access
                {
                    type: 'select',
                    name: 'auth',
                    placeholder: helptext.auth_placeholder,
                    tooltip: helptext.auth_tooltip,
                    options: [
                        {
                            label: 'Create New',
                            value: 'NEW'
                        }
                    ],
                    required: true,
                    isHidden: true,
                    disabled: true,
                },
                {
                    type: 'input',
                    name: 'tag',
                    placeholder: helptext.tag_placeholder,
                    tooltip: helptext.tag_tooltip,
                    inputType: 'number',
                    min: 0,
                    required: true,
                    isHidden: true,
                    disabled: true,
                },
                {
                    type: 'input',
                    name: 'user',
                    placeholder: helptext.user_placeholder,
                    tooltip: helptext.user_tooltip,
                    required: true,
                    isHidden: true,
                    disabled: true,
                },
                {
                    type: 'input',
                    name: 'secret',
                    placeholder: helptext.secret_placeholder,
                    tooltip: helptext.secret_tooltip,
                    inputType: 'password',
                    togglePw: true,
                    required: true,
                    isHidden: true,
                    disabled: true,
                    validation: [
                        Validators.minLength(12),
                        Validators.maxLength(16),
                        Validators.required,
                        matchOtherValidator("secret_confirm"),
                    ]
                },
                {
                    type: 'input',
                    name: 'secret_confirm',
                    placeholder: helptext.secret_confirm_placeholder,
                    inputType: 'password',
                    isHidden: true,
                    disabled: true,
                },
            ]
        },
        {
            label: helptext.step3_label,
            fieldConfig: [
                {
                    type: 'input',
                    name: 'initiators',
                    placeholder: helptext.initiators_placeholder,
                    tooltip: helptext.initiators_tooltip,
                    value: '',
                    inputType: 'textarea',
                },
                {
                    type: 'input',
                    name: 'auth_network',
                    placeholder: helptext.auth_network_placeholder,
                    tooltip: helptext.auth_network_tooltip,
                    value: '',
                    inputType: 'textarea',
                },
                {
                    type: 'input',
                    name: 'comment',
                    placeholder: helptext.comment_placeholder,
                    tooltip: helptext.comment_tooltip,
                },
            ]
        }
    ]

    protected deviceFieldGroup: any[] = [
        'disk',
    ];
    protected fileFieldGroup: any[] = [
        'path',
        'filesize',
    ];
    protected zvolFieldGroup: any[] = [
        'dataset',
        'volsize',
        'volsize_unit',
        'volblocksize',
    ];
    protected useforFieldGroup: any[] = [
        'blocksize',
        'insecure_tpc',
        'xen',
        'rpm',
    ];
    // allways hidden fields
    protected hiddenFieldGroup: any[] = [
        'volblocksize',
        'insecure_tpc',
        'xen',
        'rpm',
    ];

    protected defaultUseforSettings: any[] = [
        {
            key: 'vmware',
            values: {
                'blocksize': 512,
                'insecure_tpc': true,
                'xen': false,
                'rpm': 'SSD',
            }
        },
        {
            key: 'xen',
            values: {
                'blocksize': 512,
                'insecure_tpc': true,
                'xen': true,
                'rpm': 'SSD',
            }
        },
        {
            key: 'legacyos',
            values: {
                'blocksize': 512,
                'insecure_tpc': true,
                'xen': false,
                'rpm': 'SSD',
            }
        },
        {
            key: 'modernos',
            values: {
                'blocksize': 4096,
                'insecure_tpc': true,
                'xen': false,
                'rpm': 'SSD',
            }
        }
    ]

    protected portalFieldGroup: any[] = [
        'discovery_authmethod',
        'discovery_authgroup',
        'ip',
        'port',
    ];
    protected authAccessFieldGroup: any[] = [
        'tag',
        'user',
        'secret',
        'secret_confirm'
    ];

    protected entityWizard: any;
    protected disablePortalGroup = true;
    protected disableAuth = true;
    protected disableAuthGroup = true;

    constructor(private iscsiService: IscsiService, private ws: WebSocketService, private cloudcredentialService: CloudCredentialService) {

    }

    afterInit(entityWizard) {
        this.entityWizard = entityWizard;

        this.summaryInit();
        this.step0Init();
        this.step1Init();
    }

    step0Init() {
        const disk_field = _.find(this.wizardConfig[0].fieldConfig, { 'name': 'disk' });
        //get device options
        this.iscsiService.getExtentDevices().subscribe((res) => {
            for (const i in res) {
                disk_field.options.push({ label: res[i], value: i });
            }
        })

        this.entityWizard.formArray.controls[0].controls['type'].valueChanges.subscribe((value) => {
            this.formTypeUpdate(value);
        });

        this.entityWizard.formArray.controls[0].controls['disk'].valueChanges.subscribe((value) => {
            const disableZvolGroup = value == 'NEW' && this.entityWizard.formArray.controls[0].controls['type'].value == 'DISK' ? false : true;
            this.disablefieldGroup(this.zvolFieldGroup, disableZvolGroup, 0);
        });

        this.entityWizard.formArray.controls[0].controls['dataset'].valueChanges.subscribe((value) => {
            if (value) {
                this.getDatasetValue(value);
            }
        });

        this.entityWizard.formArray.controls[0].controls['usefor'].valueChanges.subscribe((value) => {
            this.formUseforValueUpdate(value);
        });

        this.entityWizard.formArray.controls[0].controls['type'].setValue('DISK');
        this.entityWizard.formArray.controls[0].controls['usefor'].setValue('vmware');
    }

    step1Init() {
        this.iscsiService.listPortals().subscribe((res) => {
            const field = _.find(this.wizardConfig[1].fieldConfig, { 'name': 'portal' });
            for (const i in res) {
                let label = res[i].tag;
                if (res[i].comment) {
                    label += ' (' + res[i].comment + ')';
                }
                field.options.push({ label: label, value: res[i].id })
            }
        });

        this.iscsiService.getAuth().subscribe((res) => {
            const field = _.find(this.wizardConfig[1].fieldConfig, { 'name': 'discovery_authgroup' });
            for (let i = 0; i < res.length; i++) {
                field.options.push({ label: res[i].id, value: res[i].id });
            }
        });

        this.iscsiService.getIpChoices().subscribe((res) => {
            const field = _.find(this.wizardConfig[1].fieldConfig, { 'name': 'ip' });
            res.forEach((item) => {
                field.options.push({ label: item[1], value: item[0] });
            });
        });

        this.iscsiService.getAuth().subscribe((res) => {
            const field = _.find(this.wizardConfig[1].fieldConfig, { 'name': 'auth' });
            for (let i = 0; i < res.length; i++) {
                const option = { label: res[i].tag, value: res[i].tag };
                if (field.options.findIndex(item => item.label === option.label) < 0) {
                    field.options.push(option);
                }
            }
        })

        this.entityWizard.formArray.controls[1].controls['portal'].valueChanges.subscribe((value) => {
            this.disablePortalGroup = value === 'NEW' ? false : true;
            this.disablefieldGroup(this.portalFieldGroup, this.disablePortalGroup, 1);
        });

        this.entityWizard.formArray.controls[1].controls['discovery_authmethod'].valueChanges.subscribe((value) => {
            this.disableAuth = ((value === 'CHAP' || value === 'CHAP_MUTUAL') && !this.disablePortalGroup) ? false : true;
            this.disablefieldGroup(['auth'], this.disableAuth, 1);
        });

        this.entityWizard.formArray.controls[1].controls['auth'].valueChanges.subscribe((value) => {
            this.disableAuthGroup = (value === 'NEW' && !this.disableAuth) ? false : true;
            this.disablefieldGroup(this.authAccessFieldGroup, this.disableAuthGroup, 1);
        });
    }

    summaryInit() {
        for (let step = 0; step < 3; step++) {
            Object.entries(this.entityWizard.formArray.controls[step].controls).forEach(([name, control]) => {
                if (name in this.summaryObj) {
                    (<FormControl>control).valueChanges.subscribe(((value) => {
                        if (value == undefined) {
                            this.summaryObj[name] = null;
                        } else {
                            this.summaryObj[name] = value;
                            // get label value
                            if (name == 'disk' || name == 'usefor' || name == 'portal') {
                                const field = _.find(this.wizardConfig[step].fieldConfig, { name: name });
                                if (field) {
                                    this.summaryObj[name] = _.find(field.options, { value: value }).label;
                                }
                            }
                        }
                        this.summary = this.getSummary();
                    }));
                }
            });
        }
    }
    getSummary() {
        const summary = {
            'Name': this.summaryObj.name,
            'Extent': {
                'File': this.summaryObj.path + '(' + this.summaryObj.filesize + ')',
                'Device': this.summaryObj.disk,
                'New Device': this.summaryObj.dataset + '/' + this.summaryObj.name +
                    '(' + this.summaryObj.volsize + ' ' + this.summaryObj.volsize_unit + ')',
                'Use For': this.summaryObj.usefor,
            },
            'Portal': this.summaryObj.portal,
            'New Portal': {
                'Discovery Auth Method': this.summaryObj.discovery_authmethod,
                'Discovery Auth Group': this.summaryObj.discovery_authgroup,
                'Listen': this.summaryObj.ip + ':' + this.summaryObj.port,
            },
            'Authorized Access': this.summaryObj.auth,
            'New Authorized Access': {
                'Group ID': this.summaryObj.tag,
                'User': this.summaryObj.user,
            },
            'Initiator': {
                'Initiators': this.summaryObj.initiators,
                'Authorized Networks': this.summaryObj.auth_network,
                'Comment': this.summaryObj.comment,
            }
        };
        if (this.summaryObj.type === 'FILE') {
            delete summary['Extent']['Device'];
            delete summary['Extent']['New Device'];
        } else {
            delete summary['Extent']['File'];
            this.summaryObj.disk === 'Create New' ? delete summary['Extent']['Device'] : delete summary['Extent']['New Device'];
        }

        this.summaryObj.portal === 'Create New' ? delete summary['Portal'] : delete summary['New Portal'];
        this.summaryObj.auth === 'NEW' ? delete summary['Authorized Access'] : delete summary['New Authorized Access'];

        if (!this.summaryObj.initiators && !this.summaryObj.auth_network && !this.summaryObj.comment) {
            delete summary['Initiator'];
        } else if (!this.summaryObj.initiators) {
            delete summary['Initiator']['Initiators'];
        } else if (!this.summaryObj.auth_network) {
            delete summary['Initiator']['Authorized Networks'];
        } else if (!this.summaryObj.comment) {
            delete summary['Initiator']['Comment'];
        }
        console.log(summary);
        
        return summary;
    }

    disablefieldGroup(fieldGroup: any, disabled: boolean, stepIndex: number) {
        fieldGroup.forEach(field => {
            if (_.indexOf(this.hiddenFieldGroup, field) < 0) {
                const control: any = _.find(this.wizardConfig[stepIndex].fieldConfig, { 'name': field });
                control['isHidden'] = disabled;
                control.disabled = disabled;
                disabled ? this.entityWizard.formArray.controls[stepIndex].controls[field].disable() : this.entityWizard.formArray.controls[stepIndex].controls[field].enable();
                if (disabled) {
                    this.summaryObj[field] = null;
                }
            }
        });
    }

    formTypeUpdate(type) {
        const isDevice = type == 'FILE' ? false : true;

        this.disablefieldGroup(this.fileFieldGroup, isDevice, 0);
        this.disablefieldGroup(this.deviceFieldGroup, !isDevice, 0);
    }

    formUseforValueUpdate(selected) {
        const settings = _.find(this.defaultUseforSettings, { key: selected });
        for (const i in settings.values) {
            const controller = this.entityWizard.formArray.controls[0].controls[i];
            controller.setValue(settings.values[i]);
        }
    }

    getDatasetValue(dataset) {
        const datasetField = _.find(this.wizardConfig[0].fieldConfig, { 'name': 'dataset' });
        datasetField.hasErrors = false;

        if (!_.startsWith(dataset, '/mnt/')) {
            datasetField.hasErrors = true;
            return;
        } else {
            dataset = dataset.substring(5);
        }

        const pool = dataset.split("/")[0];
        this.ws.call('pool.dataset.query', [[["id", "=", dataset]]]).subscribe(
            (res) => {
                if (res.length == 0) {
                    datasetField.hasErrors = true;
                } else {
                    for (const i in this.zvolFieldGroup) {
                        const fieldName = this.zvolFieldGroup[i];
                        if (fieldName in res[0]) {
                            const controller = this.entityWizard.formArray.controls[0].controls[fieldName];
                            controller.setValue(res[0][fieldName].value);
                        }
                    }
                }
            }
        )
        this.ws.call('pool.dataset.recommended_zvol_blocksize', [pool]).subscribe(
            (res) => {
                this.entityWizard.formArray.controls[0].controls['volblocksize'].setValue(res);
            },
            (err) => {
                datasetField.hasErrors = true;
            }
        )
    }

    customSubmit(value) {
        console.log(value);
        // create new zvol
        if (value['disk'] === 'NEW') {
            this.addZvol(value);
        }
        if (value['portal'] === 'NEW') {
            this.addPortal(value);
        }
    }

    addZvol(value) {
        const zvolPayload = {
            name: value['dataset'].substring(5) + '/' + value['name'],
            type: 'VOLUME',
            volblocksize: value['volblocksize'],
            volsize: this.cloudcredentialService.getByte(value['volsize'] + value['volsize_unit']),
        };
        this.ws.call('pool.dataset.create', [zvolPayload]).subscribe(
            (res) => {
            },
            (err) => {    
            }
        )
    }

    addPortal(value) {
        console.log(value);
        const portalPayload = {
            comment: value['name'],
            discovery_authgroup: value['discovery_authgroup'],
            discovery_authmethod: value['discovery_authmethod'],
            listen: [{
                ip: value['ip'],
                port: value['port'],
            }]
        }
        if (portalPayload['discovery_authgroup'] === '') {
            delete portalPayload['discovery_authgroup'];
        }
        this.ws.call('iscsi.portal.create', [portalPayload]).subscribe(
            (res) => {
            },
            (err) => {
            }
        )
    }
}