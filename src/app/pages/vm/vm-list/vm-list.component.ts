import { Component } from '@angular/core';
import { Router } from '@angular/router';

import { WebSocketService, StorageService, AppLoaderService, DialogService } from '../../../services/';
import { T } from '../../../translate-marker';
import globalHelptext from '../../../helptext/global-helptext';
import helptext from '../../../helptext/vm/vm-list';
import { EntityUtils } from '../../common/entity/utils';
import { DialogFormConfiguration } from 'app/pages/common/entity/entity-dialog/dialog-form-configuration.interface';
import * as _ from 'lodash';

@Component({
    selector: 'vm-list',
    template: `<entity-table [title]='title' [conf]='this'></entity-table>`
})
export class VMListComponent {

    public title = "Virtual Machines";
    protected queryCall = 'vm.query';
    protected wsDelete = 'vm.delete';
    protected route_add: string[] = ['vm', 'wizard'];
    protected route_edit: string[] = ['vm', 'edit'];

    public entityList: any;
    public columns: Array<any> = [
        { name: T('Name'), prop: 'name', always_display: true },
        { name: T('State'), prop: 'state', always_display: true, toggle: true },
        { name: T('Autostart'), prop: 'autostart', selectable: true },
        { name: T("Virtual CPUs"), prop: 'vcpus', hidden: true },
        { name: T("Memory Size"), prop: 'memory', hidden: true },
        { name: T("Boot Loader Type"), prop: 'bootloader', hidden: true },
        { name: T('System Clock'), prop: 'time', hidden: true },
        { name: T("VNC Port"), prop: 'port', hidden: true },
        { name: T("Com Port"), prop: 'com_port', hidden: true },
        { name: T("Description"), prop: 'description', hidden: true }
    ];
    public config: any = {
        paging: true,
        sorting: { columns: this.columns },
        deleteMsg: {
            title: 'Name',
            key_props: ['name']
        },
    };

    protected wsMethods = {
        start: "vm.start",
        restart: "vm.restart",
        stop: "vm.stop",
        update: "vm.update",
        clone: "vm.clone",
    };

    constructor(
        private ws: WebSocketService,
        private storageService: StorageService,
        private loader: AppLoaderService,
        private dialogService: DialogService,
        private router: Router) { }

    afterInit(entityList) {
        this.entityList = entityList;
    }

    resourceTransformIncomingRestData(vms) {
        for (let vm_index = 0; vm_index < vms.length; vm_index++) {
            vms[vm_index]['state'] = vms[vm_index]['status']['state'];
            vms[vm_index]['com_port'] = `/dev/nmdm${vms[vm_index]['id']}B`;
            if (this.checkVnc(vms[vm_index])) {
                vms[vm_index]['port'] = this.vncPort(vms[vm_index]);
            } else {
                vms[vm_index]['port'] = 'N/A';
                if (vms[vm_index]['vm_type'] === "Container Provider") {
                    vms[vm_index]['vm_type'] = globalHelptext.dockerhost;
                }
            };
            vms[vm_index]['memory'] = this.storageService.convertBytestoHumanReadable(vms[vm_index]['memory'] * 1048576, 2);
        }
        return vms;
    }

    checkVnc(vm) {
        const devices = vm.devices
        if (!devices || devices.length === 0) {
            return false;
        };
        if (vm.bootloader === 'GRUB' || vm.bootloader === "UEFI_CSM") {
            return false;
        };
        for (let i = 0; i < devices.length; i++) {
            if (devices && devices[i].dtype === "VNC") {
                return true;
            }
        }
    }

    vncPort(vm) {
        const devices = vm.devices
        if (!devices || devices.length === 0) {
            return false;
        };
        if (vm.bootloader === 'GRUB' || vm.bootloader === "UEFI_CSM") {
            return false;
        };
        for (let i = 0; i < devices.length; i++) {
            if (devices && devices[i].dtype === "VNC") {
                return devices[i].attributes.vnc_port;
            }
        }
    }

    onSliderChange(row) {
        const method = row['status']['state'] === "RUNNING" ? this.wsMethods.stop : this.wsMethods.start;
        this.doRowAction(row, method);
    }

    onMemoryError(row) {
        const memoryDialog = this.dialogService.confirm(
            helptext.memory_dialog.title,
            helptext.memory_dialog.message,
            true,
            helptext.memory_dialog.buttonMsg,
            true,
            helptext.memory_dialog.secondaryCheckBoxMsg,
            undefined,
            [{ 'overcommit': false }],
            helptext.memory_dialog.tooltip);

        memoryDialog.componentInstance.switchSelectionEmitter.subscribe((res) => {
            memoryDialog.componentInstance.isSubmitEnabled = !memoryDialog.componentInstance.isSubmitEnabled;
        });

        memoryDialog.afterClosed().subscribe((dialogRes) => {
            if (dialogRes) {
                this.doRowAction(row, this.wsMethods.start, [row.id, { "overcommit": true }]);
            }
        });
    }

    doRowAction(row, method, params = [row.id], updateTable = false) {
        this.loader.open();
        this.ws.call(method, params).subscribe(
            (res) => {
                if (updateTable) {
                    this.entityList.getData();
                    this.loader.close();
                } else {
                    this.updateRows([row]).then(() => {
                        this.loader.close();
                    });
                }
            },
            (err) => {
                this.loader.close();
                if (method === this.wsMethods.start && err.error === 12) {
                    this.onMemoryError(row);
                    return;
                } else if (method === this.wsMethods.update) {
                    row.autostart = !row.autostart;
                }
                new EntityUtils().handleWSError(this, err, this.dialogService);
            }
        )
    }

    updateRows(rows: Array<any>): Promise<boolean> {
        return new Promise((resolve, reject) => {
            this.ws.call(this.queryCall).subscribe(
                (res) => {
                    for (const row of rows) {
                        const targetIndex = _.findIndex(res, function (o) { return o['id'] === row.id });
                        if (targetIndex === -1) {
                            reject(false);
                        }
                        for (const i in row) {
                            row[i] = res[targetIndex][i];
                        }
                    }
                    this.resourceTransformIncomingRestData(rows);
                    resolve(true);
                },
                (err) => {
                    new EntityUtils().handleWSError(this, err, this.dialogService);
                    reject(err);
                }
            )
        });
    };

    onCheckboxChange(row) {
        row.autostart = !row.autostart;
        this.doRowAction(row, this.wsMethods.update, [row.id, { 'autostart': row.autostart }]);
    }

    getActions(row) {
        return [{
            id: "START",
            icon: "play_arrow",
            label: T("Start"),
            onClick: start_row => {
                this.onSliderChange(start_row);
            }
        },
        {
            id: "RESTART",
            icon: "replay",
            label: T("Restart"),
            onClick: restart_row => {
                this.doRowAction(restart_row, this.wsMethods.restart);
            }
        },
        {
            id: "POWER_OFF",
            icon: "power_settings_new",
            label: T("Power Off"),
            onClick: power_off_row => {
                this.doRowAction(row, this.wsMethods.stop, [power_off_row.id, true]);
            }
        },
        {
            id: "STOP",
            icon: "stop",
            label: T("Stop"),
            onClick: stop_row => {
                this.onSliderChange(stop_row);
            }
        },
        {
            id: 'EDIT',
            icon: "edit",
            label: T("Edit"),
            onClick: edit_row => {
                this.router.navigate(new Array("").concat(["vm", "edit", edit_row.id]));
            }
        },
        {
            id: 'DELETE',
            icon: "delete",
            label: T("Delete"),
            onClick: delete_row => {
                this.entityList.doDelete(delete_row);
            }
        },
        {
            id: 'DEVICES',
            icon: "device_hub",
            label: T("Devices"),
            onClick: devices_row => {
                this.router.navigate(new Array("").concat(["vm", devices_row.id, "devices", devices_row.name]));
            }
        },
        {
            id: 'CLONE',
            icon: "filter_none",
            label: T("Clone"),
            onClick: clone_row => {
                const parent = this;
                const conf: DialogFormConfiguration = {
                    title: T("Name"),
                    fieldConfig: [
                        {
                            type: "input",
                            inputType: "text",
                            name: "name",
                            placeholder: T("Enter a Name (optional)"),
                            required: false
                        }
                    ],
                    saveButtonText: T("Clone"),
                    customSubmit: function (entityDialog) {
                        entityDialog.dialogRef.close(true);
                        const params = [clone_row.id];
                        if (entityDialog.formValue.name) {
                            params.push(entityDialog.formValue.name);
                        }
                        parent.doRowAction(clone_row, parent.wsMethods.clone, params, true);
                    }
                };
                this.dialogService.dialogForm(conf);
            }
        },
        {
            id: 'VNC',
            icon: "settings_ethernet",
            label: T("VNC"),
            onClick: vnc_vm => {
                this.ws.call("vm.get_vnc_web", [vnc_vm.id]).subscribe(res => {
                    for (const vnc_port in res) {
                        window.open(res[vnc_port]);
                    }
                });
            }
        },
        {
            id: 'SERIAL',
            icon: "keyboard_arrow_right",
            label: T("Serial"),
            onClick: vm => {
                this.router.navigate(new Array("").concat(["vm", "serial", vm.id]));
            }
        }];
    }

    isActionVisible(actionId: string, row: any) {
        if (actionId === 'VNC' && (row["status"]["state"] !== "RUNNING" || !this.checkVnc(row))) {
            return false;
        } else if ((actionId === 'POWER_OFF' || actionId === 'STOP' || actionId === 'RESTART' || actionId === 'SERIAL') && row["status"]["state"] !== "RUNNING") {
            return false;
        } else if (actionId === 'START' && row["status"]["state"] === "RUNNING") {
            return false;
        }
        return true;
    }
}