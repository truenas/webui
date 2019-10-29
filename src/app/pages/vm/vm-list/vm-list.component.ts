import { Component } from '@angular/core';

import { WebSocketService, StorageService, AppLoaderService, DialogService } from '../../../services/';
import { T } from '../../../translate-marker';
import globalHelptext from '../../../helptext/global-helptext';
import helptext from '../../../helptext/vm/vm-list';
import { EntityUtils } from '../../common/entity/utils';

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

    protected startVM = "vm.start";
    protected stopVM = "vm.stop";
    protected updateVM = "vm.update";

    constructor(
        private ws: WebSocketService,
        private storageService: StorageService,
        private loader: AppLoaderService,
        private dialogService: DialogService) { }

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
        const method = row['status']['state'] === "RUNNING" ? this.stopVM : this.startVM;
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
                this.doRowAction(row, this.startVM, [row.id, { "overcommit": true }]);
            }
        });
    }

    doRowAction(row, method, params = [row.id]) {
        this.loader.open();
        this.ws.call(method, params).subscribe(
            (res) => {
                this.entityList.getData();
                this.loader.close();
            },
            (err) => {
                this.entityList.getData();
                this.loader.close();
                if (method === this.startVM && err.error === 12) {
                    this.onMemoryError(row);
                    return;
                }
                new EntityUtils().handleWSError(this, err, this.dialogService);
            }
        )
    }

    onCheckboxChange(row) {
        row.autostart = !row.autostart;
        this.doRowAction(row, this.updateVM, [row.id, { 'autostart': row.autostart }]);
    }
}