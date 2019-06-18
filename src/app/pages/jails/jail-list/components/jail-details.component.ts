import { Component, Input } from "@angular/core";
import { EntityJobComponent } from "app/pages/common/entity/entity-job";
import { EntityTableComponent } from "app/pages/common/entity/entity-table";
import {
  EntityAction,
  EntityTableRowDetailComponent
} from "app/pages/common/entity/entity-table/entity-table-row-detail.interface";
import { EntityUtils } from "app/pages/common/entity/utils";
import { T } from "app/translate-marker";
import { JailListComponent } from "../jail-list.component";

@Component({
  selector: "app-jail-details",
  styles: [
    `
      p,
      h4 {
        color: var(--fg2) !important;
      }

      .button-delete {
        background: var(--red);
        color: var(--primary-txt) !important;
      }
    `
  ],
  templateUrl: "./jail-details.component.html"
})
export class JailDetailsComponent implements EntityTableRowDetailComponent<Jail> {
  @Input() public config: Jail;
  @Input() public parent: EntityTableComponent & { conf: JailListComponent };

  public actions: EntityAction[] = [];

  public ngOnInit(): void {
    this.actions = [
      {
        id: "edit",
        label: T("Edit"),
        onClick: row => this.parent.conf.router.navigate(new Array("").concat(["jails", "edit", row.host_hostuuid]))
      },
      {
        id: "mount",
        label: T("Mount points"),
        onClick: row => this.parent.conf.router.navigate(new Array("").concat(["jails", "storage", row.host_hostuuid]))
      },
      {
        id: "start",
        label: T("Start"),
        onClick: row => {
          this.parent.conf.entityList.busy = this.parent.conf.loader.open();
          this.parent.conf.ws.call("jail.start", [row.host_hostuuid]).subscribe(
            () => {
              row.state = "up";
              this.parent.conf.updateRow(row);
              this.parent.conf.updateMultiAction([row]);
              this.parent.conf.loader.close();
            },
            res => {
              this.parent.conf.loader.close();
              new EntityUtils().handleWSError(this.parent.conf.entityList, res, this.parent.conf.dialogService);
            }
          );
        }
      },
      {
        id: "restart",
        label: T("Restart"),
        onClick: row => {
          this.parent.conf.entityList.busy = this.parent.conf.loader.open();
          row.state = "restarting";
          this.parent.conf.ws.call("jail.restart", [row.host_hostuuid]).subscribe(
            () => {
              row.state = "up";
              this.parent.conf.updateRow(row);
              this.parent.conf.updateMultiAction([row]);
              this.parent.conf.loader.close();
            },
            err => {
              this.parent.conf.loader.close();
              new EntityUtils().handleWSError(this.parent.conf.entityList, err, this.parent.conf.dialogService);
            }
          );
        }
      },
      {
        id: "stop",
        label: T("Stop"),
        onClick: row => {
          const dialog = {};
          this.parent.conf.dialogService
            .confirm(
              "Stop",
              "Stop the selected jails?",
              dialog.hasOwnProperty("hideCheckbox") ? dialog["hideCheckbox"] : true,
              T("Stop")
            )
            .subscribe(res => {
              if (res) {
                this.parent.conf.loader.open();
                this.parent.conf.entityList.busy = this.parent.conf.ws.call("jail.stop", [row.host_hostuuid]).subscribe(
                  () => {
                    row.state = "down";
                    this.parent.conf.updateRow(row);
                    this.parent.conf.updateMultiAction([row]);
                    this.parent.conf.loader.close();
                  },
                  response => {
                    this.parent.conf.loader.close();
                    new EntityUtils().handleWSError(
                      this.parent.conf.entityList,
                      response,
                      this.parent.conf.dialogService
                    );
                  }
                );
              }
            });
        }
      },
      {
        id: "update",
        label: T("Update"),
        onClick: row => {
          const dialogRef = this.parent.conf.dialog.open(EntityJobComponent, {
            data: { title: T("Updating Jail") },
            disableClose: true
          });
          dialogRef.componentInstance.setCall("jail.update_to_latest_patch", [row.host_hostuuid]);
          dialogRef.componentInstance.submit();
          dialogRef.componentInstance.success.subscribe(res => {
            dialogRef.close(true);
            this.parent.conf.snackBar.open(T("Jail ") + row.host_hostuuid + T(" updated."), T("Close"), {
              duration: 5000
            });
          });
        }
      },
      {
        id: "shell",
        label: T("Shell"),
        onClick: row => this.parent.conf.router.navigate(new Array("").concat(["jails", "shell", row.host_hostuuid]))
      },
      {
        id: "delete",
        label: T("Delete"),
        onClick: row => this.parent.conf.entityList.doDelete(row)
      }
    ];
  }
}

export interface Jail {
  CONFIG_VERSION: string;
  allow_chflags: number;
  allow_mlock: number;
  allow_mount: number;
  allow_mount_devfs: number;
  allow_mount_fusefs: number;
  allow_mount_nullfs: number;
  allow_mount_procfs: number;
  allow_mount_tmpfs: number;
  allow_mount_zfs: number;
  allow_quotas: number;
  allow_raw_sockets: number;
  allow_set_hostname: number;
  allow_socket_af: number;
  allow_sysvipc: number;
  allow_tun: number;
  allow_vmm: number;
  assign_localhost: number;
  available: string;
  basejail: number;
  boot: number;
  bpf: number;
  children_max: string;
  cloned_release: string;
  comment: string;
  compression: string;
  compressratio: string;
  coredumpsize: string;
  count: string;
  cpuset: string;
  cputime: string;
  datasize: string;
  dedup: string;
  defaultrouter: string;
  defaultrouter6: string;
  depends: string;
  devfs_ruleset: string;
  dhcp: number;
  enforce_statfs: string;
  exec_clean: number;
  exec_created: string;
  exec_fib: string;
  exec_jail_user: string;
  exec_poststart: string;
  exec_poststop: string;
  exec_prestart: string;
  exec_prestop: string;
  exec_start: string;
  exec_stop: string;
  exec_system_jail_user: string;
  exec_system_user: string;
  exec_timeout: string;
  host_domainname: string;
  host_hostname: string;
  host_hostuuid: string;
  host_time: number;
  hostid: string;
  hostid_strict_check: number;
  interfaces: string;
  ip4: string;
  ip4_addr: string;
  ip4_saddrsel: number;
  ip6: string;
  ip6_addr: string;
  ip6_saddrsel: number;
  ip_hostname: number;
  jail_zfs: number;
  jail_zfs_dataset: string;
  jail_zfs_mountpoint: string;
  last_started: string;
  localhost_ip: string;
  login_flags: string;
  mac_prefix: string;
  maxproc: string;
  memorylocked: string;
  memoryuse: string;
  mount_devfs: number;
  mount_fdescfs: number;
  mount_linprocfs: number;
  mount_procfs: number;
  mountpoint: string;
  msgqqueued: string;
  msgqsize: string;
  nat: number;
  nat_backend: string;
  nat_forwards: string;
  nat_interface: string;
  nat_prefix: string;
  nmsgq: string;
  notes: string;
  nsem: string;
  nsemop: string;
  nshm: string;
  nthr: string;
  openfiles: string;
  origin: string;
  owner: string;
  pcpu: string;
  priority: string;
  pseudoterminals: string;
  quota: string;
  readbps: string;
  readiops: string;
  release: string;
  reservation: string;
  resolver: string;
  rlimits: string;
  rtsold: number;
  securelevel: string;
  shmsize: string;
  stacksize: string;
  state: string;
  stop_timeout: string;
  swapuse: string;
  sync_state: string;
  sync_target: string;
  sync_tgt_zpool: string;
  sysvmsg: string;
  sysvsem: string;
  sysvshm: string;
  template: number;
  type: string;
  used: string;
  vmemoryuse: string;
  vnet: number;
  vnetnumber_mac: string;
  vnet2_mac: string;
  vnet3_mac: string;
  vnet_default_interface: string;
  vnet_interfaces: string;
  wallclock: string;
  writebps: string;
  writeiops: string;
  id: string;
  jid: null;
  _level: number;
  boot_readble: string;
  source_template: string;
  basejail_readble: string;
}
