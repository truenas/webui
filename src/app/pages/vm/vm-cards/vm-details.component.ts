import { Component, Input } from "@angular/core";
import { DialogFormConfiguration } from "app/pages/common/entity/entity-dialog/dialog-form-configuration.interface";
import { EntityTableComponent } from "app/pages/common/entity/entity-table";
import {
  EntityAction,
  EntityDetail,
  EntityRowDetails
} from "app/pages/common/entity/entity-table/entity-row-details.interface";
import { T } from "app/translate-marker";
import { VmCardsComponent } from "./vm-cards.component";

@Component({
  selector: "app-vm-details",
  template: `
    <app-entity-row-details [conf]="this"></app-entity-row-details>
  `
})
export class VmDetailsComponent implements EntityRowDetails<any> {
  public readonly entityName: "vm";

  @Input() public config: any;
  @Input() public parent: EntityTableComponent & { conf: VmCardsComponent };

  public actions: EntityAction[] = [];
  public details: EntityDetail[] = [];

  public ngOnInit(): void {
    this.details = [
      { label: T("Virtual CPUs"), value: this.config.vcpus },
      { label: T("Memory Size (MiB)"), value: this.config.memory },
      { label: T("Boot Loader Type"), value: this.config.bootloader },
      { label: T("VNC Port"), value: this.config.port },
      { label: T("Com Port"), value: this.config.com_port }
    ];

    if (this.config.type) {
      this.details.unshift({ label: T("Type"), value: this.config.type });
    }

    if (this.config.description) {
      this.details.unshift({ label: T("Description"), value: this.config.description });
    }

    this.actions = this.getActions(this.config);
  }

  private getActions(row) {
    const actions = [];
    const localCore = this.parent.conf.core;
    if (row["status"]["state"] === "RUNNING") {
      actions.push({
        name: this.config.name,
        id: "poweroff",
        icon: "power_settings_new",
        label: T("Power Off"),
        onClick: power_off_row => {
          const eventName = "VmPowerOff";
          this.parent.conf.core.emit({ name: eventName, data: [power_off_row.id] });
          this.parent.conf.setTransitionState("POWERING OFF", power_off_row);
        }
      });
      actions.push({
        name: this.config.name,
        id: "stop",
        icon: "stop",
        label: T("Stop"),
        onClick: power_stop_row => {
          const eventName = "VmStop";
          this.parent.conf.core.emit({ name: eventName, data: [power_stop_row.id] });
          this.parent.conf.setTransitionState("STOPPING", power_stop_row);
        }
      });
      actions.push({
        name: this.config.name,
        id: "restart",
        icon: "replay",
        label: T("Restart"),
        onClick: power_restart_row => {
          const eventName = "VmRestart";
          this.parent.conf.core.emit({ name: eventName, data: [power_restart_row.id] });
          this.parent.conf.setTransitionState("RESTARTING", power_restart_row);
        }
      });
    } else {
      actions.push({
        name: this.config.name,
        id: "start",
        icon: "play_arrow",
        label: T("Start"),
        onClick: start_row => {
          const eventName = "VmStart";
          const args = [start_row.id];
          const overcommit = [{ overcommit: false }];
          const dialogText = T(
            "Memory overcommitment allows multiple VMs to be launched when there is not enough free memory for configured RAM of all VMs. Use with caution."
          );
          const startDialog = this.parent.conf.dialog.confirm(
            T("Power"),
            undefined,
            true,
            T("Power On"),
            true,
            T("Overcommit Memory?"),
            undefined,
            overcommit,
            dialogText
          );
          startDialog.afterClosed().subscribe(res => {
            if (res) {
              const checkbox = startDialog.componentInstance.data[0].overcommit;
              args.push({ overcommit: checkbox });
              this.parent.conf.core.emit({ name: eventName, data: args });
              this.parent.conf.setTransitionState("STARTING", start_row);
            }
          });
        }
      });
    }
    actions.push({
      name: this.config.name,
      label: T("Edit"),
      icon: "edit",
      onClick: edit_row => {
        this.parent.conf.router.navigate(new Array("").concat(["vm", "edit", edit_row.id]));
      }
    });
    actions.push({
      name: this.config.name,
      label: T("Delete"),
      icon: "delete",
      onClick: delete_row => {
        const eventName = "VmDelete";
        const args = [delete_row.id];
        const deleteDialog = this.parent.conf.dialog.confirm("Delete VM", "Delete VM " + delete_row.name + " ?");
        deleteDialog.subscribe(res => {
          if (res) {
            this.parent.conf.core.emit({ name: eventName, data: args });
            this.parent.conf.setTransitionState("DELETING", delete_row);
          }
        });
      }
    });
    actions.push({
      name: this.config.name,
      label: T("Devices"),
      icon: "device_hub",
      onClick: devices_row => {
        this.parent.conf.router.navigate(new Array("").concat(["vm", devices_row.id, "devices", devices_row.name]));
      }
    });
    actions.push({
      name: this.config.name,
      label: T("Clone"),
      icon: "filter_none",
      onClick: clone_row => {
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
          customSubmit: function(entityDialog) {
            const eventName = "VmClone";
            entityDialog.formValue.name
              ? localCore.emit({ name: eventName, data: [clone_row.id, entityDialog.formValue.name] })
              : localCore.emit({ name: eventName, data: [clone_row.id] });
            entityDialog.dialogRef.close(true);
          }
        };
        this.parent.conf.dialog.dialogForm(conf);
      }
    });

    if (row["status"]["state"] === "RUNNING") {
      if (this.parent.conf.checkVnc(row)) {
        actions.push({
          name: this.config.name,
          label: T("VNC"),
          icon: "settings_ethernet",
          onClick: vnc_vm => {
            this.parent.conf.ws.call("vm.get_vnc_web", [vnc_vm.id]).subscribe(res => {
              for (const vnc_port in res) {
                window.open(res[vnc_port]);
              }
            });
          }
        });
      }
      actions.push({
        name: this.config.name,
        label: T("Serial"),
        icon: "keyboard_arrow_right",
        onClick: vm => {
          this.parent.conf.router.navigate(new Array("").concat(["vm", "serial", vm.id]));
        }
      });
    }

    return actions;
  }
}
