import { Component } from '@angular/core';
import { Wizard } from '../../../common/entity/entity-form/models/wizard.interface';
import { Validators, FormControl, ValidationErrors } from '@angular/forms';
import { Router } from '@angular/router';
import * as _ from 'lodash';

import { helptext_sharing_iscsi } from '../../../../helptext/sharing/iscsi/iscsi';
import { IscsiService, WebSocketService, NetworkService, StorageService } from '../../../../services/';
import { matchOtherValidator } from "app/pages/common/entity/entity-form/validators/password-validation";
import { CloudCredentialService } from '../../../../services/cloudcredential.service';
import { EntityUtils } from '../../../common/entity/utils';
import { AppLoaderService } from '../../../../services/app-loader/app-loader.service';
import { DialogService } from '../../../../services/';
import { forbiddenValues } from '../../../common/entity/entity-form/validators/forbidden-values-validation';
import globalHelptext from 'app/helptext/global-helptext';

@Component({
    selector: 'app-iscsi-wizard',
    template: '<entity-wizard [conf]="this"></entity-wizard>',
    providers: [IscsiService, CloudCredentialService, NetworkService, StorageService]
})
export class IscsiWizardComponent {

    public route_success: string[] = ['sharing', 'iscsi'];
    public isLinear = true;
    public summary_title = "iSCSI Summary";
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
        'listen': null,
        'tag': null,
        'user': null,
        'initiators': null,
        'auth_network': null,
        'comment': null,
        'target': null,
    };
    public summary: any;
    protected namesInUse = [];

    protected wizardConfig: Wizard[] = [
        {
            label: helptext_sharing_iscsi.step1_label,
            fieldConfig: [
                {
                    type: 'input',
                    name: 'name',
                    placeholder: helptext_sharing_iscsi.name_placeholder,
                    tooltip: helptext_sharing_iscsi.name_tooltip,
                    required: true,
                    validation: [
                        Validators.required,
                        forbiddenValues(this.namesInUse)
                    ],
                },
                {
                    type: 'select',
                    name: 'type',
                    placeholder: helptext_sharing_iscsi.extent_placeholder_type,
                    tooltip: helptext_sharing_iscsi.extent_tooltip_type,
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
                    placeholder: helptext_sharing_iscsi.extent_placeholder_path,
                    tooltip: helptext_sharing_iscsi.extent_tooltip_path,
                    isHidden: false,
                    disabled: false,
                    required: true,
                    validation: [Validators.required],
                },
                {
                    type: 'input',
                    name: 'filesize',
                    placeholder: helptext_sharing_iscsi.extent_placeholder_filesize,
                    tooltip: helptext_sharing_iscsi.extent_tooltip_filesize,
                    isHidden: false,
                    disabled: false,
                    required: true,
                    blurEvent:this.blurFilesize,
                    blurStatus: true,
                    parent: this,
                    value: 0,
                    validation: [Validators.required,
                        (control: FormControl): ValidationErrors => {
                          const config = this.wizardConfig[0].fieldConfig.find(c => c.name === 'filesize');
                          const size = this.storageService.convertHumanStringToNum(control.value, true);

                          let errors = control.value && isNaN(size)
                            ? { invalid_byte_string: true }
                            : null

                          if (errors) {
                            config.hasErrors = true;
                            config.errors = globalHelptext.human_readable.input_error;
                          } else {
                            config.hasErrors = false;
                            config.errors = '';
                          }

                          return errors;
                        }
                    ],
                },
                // device options
                {
                    type: 'select',
                    name: 'disk',
                    placeholder: helptext_sharing_iscsi.disk_placeholder,
                    tooltip: helptext_sharing_iscsi.disk_tooltip,
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
                    explorerType: 'dataset',
                    initial: '',
                    name: 'dataset',
                    placeholder: helptext_sharing_iscsi.dataset_placeholder,
                    tooltip: helptext_sharing_iscsi.dataset_tooltip,
                    hasErrors: false,
                    errors: 'Pool/Dataset not exist',
                    required: true,
                    validation: [Validators.required],
                },
                {
                    type: 'input',
                    name: 'volsize',
                    inputType: 'number',
                    placeholder: helptext_sharing_iscsi.volsize_placeholder,
                    tooltip: helptext_sharing_iscsi.volsize_tooltip,
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
                    placeholder: helptext_sharing_iscsi.volblocksize_placeholder,
                    tooltip: helptext_sharing_iscsi.volblocksize_tooltip,
                    isHidden: true,
                },
                // use for group
                {
                    type: 'select',
                    name: 'usefor',
                    placeholder: helptext_sharing_iscsi.usefor_placeholder,
                    tooltip: helptext_sharing_iscsi.usefor_tooltip,
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
                    type: 'input',
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
                {
                    type: 'select',
                    name: 'target',
                    placeholder: helptext_sharing_iscsi.target_placeholder,
                    tooltip: helptext_sharing_iscsi.target_tooltip,
                    options: [
                        {
                            label: 'Create New',
                            value: 'NEW'
                        }
                    ],
                    value: 'NEW',
                },
            ]
        },
        {
            label: helptext_sharing_iscsi.step2_label,
            fieldConfig: [
                {
                    type: 'select',
                    name: 'portal',
                    placeholder: helptext_sharing_iscsi.portal_placeholder,
                    tooltip: helptext_sharing_iscsi.portal_tooltip,
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
                    placeholder: helptext_sharing_iscsi.portal_form_placeholder_discovery_authmethod,
                    tooltip: helptext_sharing_iscsi.portal_form_tooltip_discovery_authmethod,
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
                    placeholder: helptext_sharing_iscsi.portal_form_placeholder_discovery_authgroup,
                    tooltip: helptext_sharing_iscsi.portal_form_tooltip_discovery_authgroup,
                    options: [
                        {
                            label: 'None',
                            value: '',
                        },
                        {
                            label: 'Create New',
                            value: 'NEW'
                        }
                    ],
                    value: '',
                    isHidden: true,
                    disabled: true,
                },
                {
                    type: 'input',
                    name: 'tag',
                    placeholder: helptext_sharing_iscsi.authaccess_placeholder_tag,
                    tooltip: helptext_sharing_iscsi.authaccess_tooltip_tag,
                    inputType: 'number',
                    min: 0,
                    required: true,
                    isHidden: true,
                    disabled: true,
                },
                {
                    type: 'input',
                    name: 'user',
                    placeholder: helptext_sharing_iscsi.authaccess_placeholder_user,
                    tooltip: helptext_sharing_iscsi.authaccess_tooltip_user,
                    required: true,
                    isHidden: true,
                    disabled: true,
                },
                {
                    type: 'input',
                    name: 'secret',
                    placeholder: helptext_sharing_iscsi.authaccess_placeholder_secret,
                    tooltip: helptext_sharing_iscsi.authaccess_tooltip_secret,
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
                    placeholder: helptext_sharing_iscsi.authaccess_placeholder_secret_confirm,
                    inputType: 'password',
                    isHidden: true,
                    disabled: true,
                },
                {
                    type: 'list',
                    name: 'listen',
                    templateListField: [
                        {
                            type: 'select',
                            name: 'ip',
                            placeholder: helptext_sharing_iscsi.portal_form_placeholder_ip,
                            tooltip: helptext_sharing_iscsi.portal_form_tooltip_ip,
                            options: [],
                            class: 'inline',
                            width: '60%',
                            required: true,
                            validation : [ Validators.required ],
                        },
                        {
                            type: 'input',
                            name: 'port',
                            placeholder: helptext_sharing_iscsi.portal_form_placeholder_port,
                            tooltip: helptext_sharing_iscsi.portal_form_tooltip_port,
                            value: '3260',
                            class: 'inline',
                            width: '30%',
                        }
                    ],
                    listFields: [],
                    isHidden: true,
                    disabled: true,
                },

            ],
            skip: false,
        },
        {
            label: helptext_sharing_iscsi.step3_label,
            fieldConfig: [
                {
                    type: 'chip',
                    name: 'initiators',
                    placeholder: helptext_sharing_iscsi.initiators_placeholder,
                    tooltip: helptext_sharing_iscsi.initiators_tooltip,
                },
                {
                    type: 'chip',
                    name: 'auth_network',
                    placeholder: helptext_sharing_iscsi.auth_network.placeholder,
                    tooltip: helptext_sharing_iscsi.auth_network.tooltip,
                    hasErrors: false,
                    validation: [this.IPValidator('auth_network')]
                }
            ],
            skip: false,
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
        'listen',
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

    protected deleteCalls = {
        zvol: 'pool.dataset.delete',
        extent: 'iscsi.extent.delete',
        portal: 'iscsi.portal.delete',
        auth: 'iscsi.auth.delete',
        initiator: 'iscsi.initiator.delete',
        target: 'iscsi.target.delete',
        associateTarget: 'iscsi.targetextent.delete',
    }

    protected createCalls = {
        zvol: 'pool.dataset.create',
        extent: 'iscsi.extent.create',
        portal: 'iscsi.portal.create',
        auth: 'iscsi.auth.create',
        initiator: 'iscsi.initiator.create',
        target: 'iscsi.target.create',
        associateTarget: 'iscsi.targetextent.create',
    }

    constructor(private iscsiService: IscsiService,
        private ws: WebSocketService,
        private cloudcredentialService: CloudCredentialService,
        private dialogService: DialogService,
        private loader: AppLoaderService,
        private networkService: NetworkService,
        private router: Router,
        private storageService: StorageService) {
        this.iscsiService.getExtents().subscribe(
            (res) => {
                this.namesInUse.push(...res.map(extent => extent.name));
            }
        )
        this.iscsiService.getTargets().subscribe(
            (res) => {
                this.namesInUse.push(...res.map(target => target.name));
            }
        )
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
        const taregt_field = _.find(this.wizardConfig[0].fieldConfig, { 'name': 'target' });
        this.iscsiService.getTargets().subscribe((res) => {
            for (const item of res) {
                taregt_field.options.push({ label: item.name, value: item.id});
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

        this.entityWizard.formArray.controls[0].controls['target'].valueChanges.subscribe((value) => {
            if (value !== 'NEW' && !this.wizardConfig[1].skip && !this.wizardConfig[2].skip) {
                this.wizardConfig[1].skip = true;
                this.wizardConfig[2].skip = true;
                this.entityWizard.formArray.controls[1].controls['portal'].clearValidators();
                this.entityWizard.formArray.controls[1].controls['portal'].updateValueAndValidity();
            } else if (value === 'NEW' && this.wizardConfig[1].skip && this.wizardConfig[2].skip) {
                this.wizardConfig[1].skip = false;
                this.wizardConfig[2].skip = false;
                this.entityWizard.formArray.controls[1].controls['portal'].setValidators([Validators.required]);
                this.entityWizard.formArray.controls[1].controls['portal'].updateValueAndValidity();
            }
        });
    }

    step1Init() {
        const authGroupField = _.find(this.wizardConfig[1].fieldConfig, { 'name': 'discovery_authgroup' });
        const listenIpField = _.find(this.wizardConfig[1].fieldConfig, { 'name': 'listen' }).templateListField[0];

        this.iscsiService.listPortals().subscribe((portals) => {
            const field = _.find(this.wizardConfig[1].fieldConfig, { 'name': 'portal' });
            for (const portal of portals) {
                const ips = portal.listen.map(ip => ip.ip + ':' + ip.port);
                field.options.push({ label: portal.tag + ' (' + ips + ')', value: portal.id })
            }
        });

        this.iscsiService.getAuth().subscribe((res) => {
            for (let i = 0; i < res.length; i++) {
                if (_.find(authGroupField.options, {value: res[i].tag}) == undefined) {
                    authGroupField.options.push({ label: res[i].tag, value: res[i].tag });
                }
            }
        });

        this.iscsiService.getIpChoices().subscribe((ips) => {
            for (const ip in ips) {
                listenIpField.options.push({ label: ips[ip], value: ip });
            }

            const listenListFields = _.find(this.wizardConfig[1].fieldConfig, { 'name': 'listen' }).listFields;
            for (const listenField of listenListFields) {
                const ipField = _.find(listenField, {name: 'ip'});
                ipField.options = listenIpField.options;
            }
        });

        this.entityWizard.formArray.controls[1].controls['portal'].valueChanges.subscribe((value) => {
            this.disablePortalGroup = value === 'NEW' ? false : true;
            this.disablefieldGroup(this.portalFieldGroup, this.disablePortalGroup, 1);
        });

        this.entityWizard.formArray.controls[1].controls['discovery_authmethod'].valueChanges.subscribe((value) => {
            this.disableAuth = ((value === 'CHAP' || value === 'CHAP_MUTUAL') && !this.disablePortalGroup) ? false : true;

            authGroupField.required = !this.disableAuth;
            if (this.disableAuth) {
                this.entityWizard.formArray.controls[1].controls['discovery_authgroup'].clearValidators();
            } else {
                this.entityWizard.formArray.controls[1].controls['discovery_authgroup'].setValidators([Validators.required]);
            }
            this.entityWizard.formArray.controls[1].controls['discovery_authgroup'].updateValueAndValidity();
        });

        this.entityWizard.formArray.controls[1].controls['discovery_authgroup'].valueChanges.subscribe((value) => {
            this.disableAuthGroup = value === 'NEW' ? false : true;
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
                            if (name == 'disk' || name == 'usefor' || name == 'portal' || name == 'target') {
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
                'Discovery Auth Group': this.summaryObj.discovery_authgroup === 'NEW' ? `${this.summaryObj.tag} (New Create)` : this.summaryObj.discovery_authgroup,
                'Listen': this.summaryObj.listen === null ? null : this.summaryObj.listen.map(listen => listen.ip + ':' + listen.port),
            },
            'Authorized Access': this.summaryObj.discovery_authgroup,
            'New Authorized Access': {
                'Group ID': this.summaryObj.tag,
                'User': this.summaryObj.user,
            },
            'Initiator': {
                'Initiators': this.summaryObj.initiators,
                'Authorized Networks': this.summaryObj.auth_network,
                'Comment': this.summaryObj.comment,
            },
            'Target': this.summaryObj.target,
        };
        if (this.summaryObj.type === 'FILE') {
            delete summary['Extent']['Device'];
            delete summary['Extent']['New Device'];
        } else {
            delete summary['Extent']['File'];
            this.summaryObj.disk === 'Create New' ? delete summary['Extent']['Device'] : delete summary['Extent']['New Device'];
        }

        this.summaryObj.portal === 'Create New' ? delete summary['Portal'] : delete summary['New Portal'];
        this.summaryObj.discovery_authgroup === 'NEW' ? delete summary['Authorized Access'] : delete summary['New Authorized Access'];

        if (!this.summaryObj.initiators && !this.summaryObj.auth_network && !this.summaryObj.comment) {
            delete summary['Initiator'];
        } else if (!this.summaryObj.initiators) {
            delete summary['Initiator']['Initiators'];
        } else if (!this.summaryObj.auth_network) {
            delete summary['Initiator']['Authorized Networks'];
        } else if (!this.summaryObj.comment) {
            delete summary['Initiator']['Comment'];
        }

        if (this.summaryObj.target === 'Create New' ) {
            delete summary['Target'];
        }
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

    async customSubmit(value) {
        this.loader.open();
        let toStop = false;
        const createdItems = {
            zvol: null,
            extent: null,
            auth: null,
            portal: null,
            initiator: null,
            target: null,
            associateTarget: null,
        }

        for (const item in createdItems) {
            if (!toStop) {
                if (!(
                    (item === 'zvol' && value['disk'] !== 'NEW') ||
                    (item === 'auth' && value['discovery_authgroup'] !== 'NEW') ||
                    (item === 'portal' && value[item] !== 'NEW') ||
                    ((item === 'initiator' || item === 'portal' || item === 'target') && value['target'] !== 'NEW')
                )) {
                    await this.doCreate(value, item).then(
                        (res) => {
                            if (item === 'zvol') {
                                value['disk'] = 'zvol/' + res.id;
                            } else if (item === 'auth') {
                                value['discovery_authgroup'] = res.tag;
                            } else {
                                value[item] = res.id;
                            }
                            createdItems[item] = res.id;
                        },
                        (err) => {
                            new EntityUtils().handleWSError(this, err, this.dialogService);
                            toStop = true;
                            this.rollBack(createdItems);
                        }
                    )
                }
            }
        }

        this.loader.close();
        if (!toStop) {
            this.router.navigate(new Array('/').concat(this.route_success));
        }
    }

    getRoundVolsize(value) {
        const volsize = this.cloudcredentialService.getByte(value['volsize'] + value['volsize_unit']);
        const volblocksize = this.cloudcredentialService.getByte(value['volblocksize']);
        return volsize + (volblocksize - volsize % volblocksize);
    }

    doCreate(value, item) {
        let payload;
        if (item === 'zvol') {
            payload = {
                name: value['dataset'] + '/' + value['name'],
                type: 'VOLUME',
                volblocksize: value['volblocksize'],
                volsize: this.getRoundVolsize(value),
            };
        }
        if (item === 'portal') {
            payload = {
                comment: value['name'],
                discovery_authgroup: value['discovery_authgroup'],
                discovery_authmethod: value['discovery_authmethod'],
                listen: value['listen'],
            }
            if (payload['discovery_authgroup'] === '') {
                delete payload['discovery_authgroup'];
            }
        }
        if (item === 'auth') {
            payload = {
                tag: value['tag'],
                user: value['user'],
                secret: value['secret'],
            }
        }
        if (item === 'extent') {
            payload = {
                name: value['name'],
                type: value['type'],
            }
            if (payload.type === 'FILE') {
                this.fileFieldGroup.forEach((field) => {
                    if (field === 'filesize') {
                        value[field] = this.storageService.convertHumanStringToNum(value[field], true);
                        payload[field] = value[field] == 0 ? value[field] : (value[field] + (512 - value[field]%512));
                    } else {
                        payload[field] = value[field];
                    }
                });
            } else if (payload.type === 'DISK') {
                payload['disk'] = value['disk'];
            }
            payload = Object.assign(payload, _.find(this.defaultUseforSettings, { key: value['usefor'] }).values);
        }
        if (item === 'initiator') {
            payload = {
                initiators: value['initiators'],
                auth_network: value['auth_network'],
                comment: value['name'],
            }
        }
        if (item === 'target') {
            payload = {
                name: value['name'],
                groups: [
                    {
                        portal: value['portal'],
                        initiator: value['initiator'] ? value['initiator'] : null,
                        authmethod: 'NONE', //default value for now
                        auth: null, //default value for now
                    }
                ]
            }
        }
        if (item === 'associateTarget') {
            payload = {
                target: value['target'],
                extent: value['extent'],
            }
        }
        return this.ws.call(this.createCalls[item], [payload]).toPromise();
    }

    rollBack(items) {
        for (const item in items) {
            if (items[item] != null) {
                this.ws.call(this.deleteCalls[item], [items[item]]).subscribe(
                    (res) => {
                        console.log('rollback ' + item, res);
                    }
                );
            }
        }
    }

    IPValidator(name: string) {
        const self = this;
        return function validIPs(control: FormControl) {
            const config = self.wizardConfig[2].fieldConfig.find(c => c.name === name);
            let counter = 0;
            if (control.value) {
                control.value.forEach((item) => {
                    if (!self.networkService.authNetworkValidator(item)) {
                        counter++;
                    }
                });
            }

            const errors = control.value && control.value.length > 0 && counter > 0
            ? { validIPs : true }
            : null;
        
            if (errors) {
              config.hasErrors = true;
              config.errors = helptext_sharing_iscsi[name].error;
            } else {
              config.hasErrors = false;
              config.errors = '';
            }
    
            return errors;
        }
    };

    blurFilesize(parent){
        if (parent.entityWizard) {
            parent.entityWizard.formArray.controls[0].controls['filesize'].setValue(parent.storageService.humanReadable);
        }
    }
}
