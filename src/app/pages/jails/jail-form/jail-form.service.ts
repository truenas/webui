import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';

import { WebSocketService } from '../../../services';
import { EntityFormService } from '../../common/entity/entity-form/services/entity-form.service';
import { FieldConfig } from '../../common/entity/entity-form/models/field-config.interface';
import { FieldRelationService } from '../../common/entity/entity-form/services/field-relation.service';
import * as _ from 'lodash';
import { EntityUtils } from '../../common/entity/utils';

@Injectable()
export class JailFormService {
    public interfaces = {
        vnetEnabled: [
            {
                label: '------',
                value: '',
            }
        ],
        vnetDisabled: [
            {
                label: '------',
                value: '',
            }
        ],
        vnetDefaultInterface: [
            {
                label: 'none',
                value: 'none',
            },
            {
                label: 'auto',
                value: 'auto',
            }
        ]
    }

    // fields only accepted by ws with value 0/1
    public TFfields: any = [
        'bpf',
        'template',
        'host_time',
        'dhcp',
        'vnet',
        'rtsold',
        'jail_zfs',
        'boot',
        'allow_vmm',
        'allow_tun',
        'allow_socket_af',
        'allow_quotas',
        'allow_mount_zfs',
        'allow_mount_tmpfs',
        'allow_mount_procfs',
        'allow_mount_nullfs',
        'allow_mount_fusefs',
        'allow_mount_devfs',
        'allow_mount',
        'allow_mlock',
        'allow_chflags',
        'allow_raw_sockets',
        'allow_sysvipc',
        'allow_set_hostname',
        'ip6_saddrsel',
        'ip4_saddrsel',
        'ip_hostname',
        'assign_localhost',
        'nat',
    ];

    constructor(
        protected ws: WebSocketService,
        protected entityFormService: EntityFormService,
        protected fieldRelationService: FieldRelationService,
        protected dialog: MatDialog) { }

    createForm(formFields) {
        const formGroup = this.entityFormService.createFormGroup(formFields);

        for (const i in formFields) {
            const config = formFields[i];
            if (config.relation.length > 0) {
                this.setRelation(formGroup, formFields, config);
            }
        }
        return formGroup;
    }
    setRelation(formGroup, formFields, config: FieldConfig) {
        const activations =
            this.fieldRelationService.findActivationRelation(config.relation);
        if (activations) {
            const tobeDisabled = this.fieldRelationService.isFormControlToBeDisabled(
                activations, formGroup);
            const tobeHide = this.fieldRelationService.isFormControlToBeHide(
                activations, formGroup);
            this.setDisabled(formGroup, formFields, config.name, tobeDisabled, tobeHide);

            this.fieldRelationService.getRelatedFormControls(config, formGroup)
                .forEach(control => {
                    control.valueChanges.subscribe(
                        () => { this.relationUpdate(formGroup, formFields, config, activations); });
                });
        }
    }

    setDisabled(formGroup, formFields, name: string, disable: boolean, hide?: boolean) {
        if (hide) {
            disable = hide;
        } else {
            hide = false;
        }

        formFields = formFields.map((item) => {
            if (item.name === name) {
                item.disabled = disable;
                item['isHidden'] = hide;
            }
            return item;
        });
        if (formGroup.controls[name]) {
            const method = disable ? 'disable' : 'enable';
            formGroup.controls[name][method]();
            return;
        }
    }

    relationUpdate(formGroup, formFields, config: FieldConfig, activations: any) {
        const tobeDisabled = this.fieldRelationService.isFormControlToBeDisabled(
            activations, formGroup);
        const tobeHide = this.fieldRelationService.isFormControlToBeHide(
            activations, formGroup);
        this.setDisabled(formGroup, formFields, config.name, tobeDisabled, tobeHide);
    }

    updateInterface(formGroup, basicfieldConfig, addVnet?) {
        for (const ipType of ['ip4', 'ip6']) {
            const targetPropName = ipType + '_addr';
            for (let i = 0; i < formGroup.controls[targetPropName].controls.length; i++) {
                const subipInterfaceField = _.find(_.find(basicfieldConfig, { 'name': targetPropName }).listFields[i], { 'name': ipType + '_interface' });

                if (addVnet != undefined) {
                    subipInterfaceField.options = addVnet ? this.interfaces.vnetEnabled : this.interfaces.vnetDisabled;
                }
            }
        }
    }

    getFullIP(type: string, ipInterface: string, ip: string, netmask: string, ip4_interfaceField, ip6_interfaceField) {
        let full_address = ip;
        if (ipInterface != '') {
            const validInterface = _.find(type === 'ip4' ? ip4_interfaceField.options : ip6_interfaceField.options, { value: ipInterface }) !== undefined;
            full_address = validInterface ? ipInterface + '|' + ip : ip;
        }
        if (netmask != '') {
            full_address += '/' + netmask;
        }
        return full_address;
    }

    getPluginDefaluts(plugin, pluginRepository) {
        return this.ws.call('plugin.defaults', [{
            plugin: plugin,
            plugin_repository: pluginRepository,
            refresh: false
        }]);
    }

    getInterface() {
        return this.ws.call('interface.query', [[["name", "rnin", "vnet0:"]]]);
    }

    handleTFfiledValues(res, i) {
        if (_.indexOf(this.TFfields, i) > -1) {
            res[i] = res[i] == '1' ? true : false;
        }
    }

    deparseNatForwards(value, formGroup, networkfieldConfig) {
        if (value == 'none') {
            formGroup.controls['nat_forwards_checkbox'].setValue(false);
            return;
        }
        formGroup.controls['nat_forwards_checkbox'].setValue(true);
        value = value.split(',');
        for (let i = 0; i < value.length; i++) {
            const nat_forward = value[i].split(new RegExp('[(:)]'));
            if (formGroup.controls['nat_forwards'].controls[i] == undefined) {
                // add controls;
                const templateListField = _.cloneDeep(_.find(networkfieldConfig, { 'name': 'nat_forwards' }).templateListField);
                formGroup.controls['nat_forwards'].push(this.entityFormService.createFormGroup(templateListField));
                _.find(networkfieldConfig, { 'name': 'nat_forwards' }).listFields.push(templateListField);
            }
            formGroup.controls['nat_forwards'].controls[i].controls['protocol'].setValue(nat_forward[0]);
            formGroup.controls['nat_forwards'].controls[i].controls['jail_port'].setValue(nat_forward[1]);
            formGroup.controls['nat_forwards'].controls[i].controls['host_port'].setValue(nat_forward[2]);
        }
    }

    parseNatForwards(value) {
        if (value['nat_forwards_checkbox'] === true) {
            const multi_nat_forwards = [];
            for (let i = 0; i < value['nat_forwards'].length; i++) {
                const subNatForward = value['nat_forwards'][i];
                if (subNatForward['host_port'] === undefined || subNatForward['host_port'].trim() === '') {
                    delete subNatForward['host_port'];
                }
                if (Object.values(subNatForward).every(item => item !== undefined && String(item).trim() !== '')) {
                    const length = Object.keys(subNatForward).length;
                    if (length === 3) {
                        multi_nat_forwards.push(subNatForward['protocol'] + '(' + subNatForward['jail_port'] + ':' + subNatForward['host_port'] + ')');
                    } else if (length === 2) {
                        multi_nat_forwards.push(subNatForward['protocol'] + '(' + subNatForward['jail_port'] + ')');
                    }
                }
            }
            value['nat_forwards'] = multi_nat_forwards.length > 0 ? multi_nat_forwards.join(',') : 'none';
        } else {
            value['nat_forwards'] = 'none';
        }
        delete value['nat_forwards_checkbox'];
    }

    parseIpaddr(value, ip4_interfaceField, ip6_interfaceField) {
        for (const ipType of ['ip4', 'ip6']) {
            const propName = ipType + '_addr';
            if (value[propName] != undefined) {
                const multi_ipaddr = [];
                for (let i = 0; i < value[propName].length; i++) {
                    const subAddr = value[propName][i];
                    if (subAddr[propName] != '' && subAddr[propName] != undefined) {
                        multi_ipaddr.push(this.getFullIP(ipType, subAddr[ipType + '_interface'], subAddr[propName], subAddr[ipType + (ipType == 'ip4' ? '_netmask' : '_prefix')], ip4_interfaceField, ip6_interfaceField));
                    }
                }
                value[propName] = multi_ipaddr.join(',');
            }
            if (value[propName] == '' || value[propName] == undefined) {
                delete value[propName];
            }
        }
    }

    deparseIpaddr(value, ipType, formGroup, basicfieldConfig) {
        value = value.split(',');
        const propName = ipType + '_addr';
        for (let i = 0; i < value.length; i++) {
            if (formGroup.controls[propName].controls[i] == undefined) {
                // add controls;
                const templateListField = _.cloneDeep(_.find(basicfieldConfig, { 'name': propName }).templateListField);
                formGroup.controls[propName].push(this.entityFormService.createFormGroup(templateListField));
                _.find(basicfieldConfig, { 'name': propName }).listFields.push(templateListField);
            }
            if (ipType == 'ip6' && value[i] == 'vnet0|accept_rtadv') {
                formGroup.controls['auto_configure_ip6'].setValue(true);
            }

            if (value[i].indexOf('|') > 0) {
                formGroup.controls[propName].controls[i].controls[ipType + '_interface'].setValue(value[i].split('|')[0]);
                value[i] = value[i].split('|')[1];
            }
            if (value[i].indexOf('/') > 0) {
                formGroup.controls[propName].controls[i].controls[propName].setValue(value[i].split('/')[0]);
                formGroup.controls[propName].controls[i].controls[ipType + (ipType == 'ip4' ? '_netmask' : '_prefix')].setValue(value[i].split('/')[1]);
            } else {
                formGroup.controls[propName].controls[i].controls[propName].setValue(value[i] == 'none' ? '' : value[i]);
            }
        }
    }

    getPluginDefaults(plugin, pluginRepository, formGroup, networkfieldConfig): Promise<boolean> {
        return new Promise(async (resolve, reject) => {
            await this.ws.call('plugin.defaults', [{
                plugin: plugin,
                plugin_repository: pluginRepository,
                refresh: false
            }]).toPromise().then((defaults) => {
                for (let i in defaults.properties) {
                    if (formGroup.controls[i]) {
                        if (i === 'nat_forwards') {
                            this.deparseNatForwards(defaults.properties[i], formGroup, networkfieldConfig);
                            continue;
                        }
                        this.handleTFfiledValues(defaults.properties, i);
                        formGroup.controls[i].setValue(defaults.properties[i]);
                    }
                }
                if (!defaults.properties.hasOwnProperty('dhcp') && !defaults.properties.hasOwnProperty('nat')) {
                    formGroup.controls['nat'].setValue(true);
                }
                resolve(true);
            }, (err) => {
                resolve(false);
                new EntityUtils().handleWSError(this, err, this.dialog);
            });
        });
    }

}