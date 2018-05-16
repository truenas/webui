import { Component, ElementRef, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { RestService } from '../../../../services/';
import { TourService } from '../../../../services/tour.service';
import { debug } from 'util';
import { EntityUtils } from '../../../common/entity/utils';
import { EntityTableComponent, InputTableConf } from 'app/pages/common/entity/entity-table/entity-table.component';
import { DialogService } from 'app/services/dialog.service';
import { WebSocketService } from 'app/services/ws.service';
import { AppLoaderService } from 'app/services/app-loader/app-loader.service';
import { AfterViewInit } from '@angular/core/src/metadata/lifecycle_hooks';
import { DownloadKeyModalDialog } from 'app/components/common/dialog/downloadkey/downloadkey-dialog.component';
import { MatDialog } from '@angular/material';
import { TranslateService } from '@ngx-translate/core';
import * as _ from 'lodash';


import { Injectable } from '@angular/core';
import { ErdService } from 'app/services/erd.service';
import { T } from '../../../../translate-marker';
import { EntityJobComponent } from '../../../common/entity/entity-job/entity-job.component';



export interface ZfsPoolData {
  avail?: number;
  availStr?: string;
  id?: string;
  is_decrypted?: boolean;
  is_upgraded?: boolean;
  mountpoint?: string;
  name?: string;
  path?: string;
  nodePath?: string;
  parentPath?: string;
  status?: string;
  used?: number;
  used_pct?: string;
  usedStr?: string;
  sed_pct?: string;
  vol_encrypt?: number;
  vol_encryptkey?: string;
  vol_guid?: string;
  vol_name?: string;
  type?: string;
  compression?: string;
  dedup?: string;
  readonly?: string;
  children?: any[];
  dataset_data?: any;
  actions?: any[];
  volumesListTableConfig?: VolumesListTableConfig;

}


export class VolumesListTableConfig implements InputTableConf {
  public hideTopActions = true;
  public flattenedVolData: any;
  public resource_name = 'storage/volume';
  public rowData: ZfsPoolData[] = [];
  protected dialogRef: any;
  public route_add = ["storage", "pools", "import"];
  public route_add_tooltip = T("Create or Import Pool");

  constructor(
    private parentVolumesListComponent: VolumesListComponent,
    private _router: Router,
    private _classId: string,
    private title: string,
    private datasetData: Object,
    public mdDialog: MatDialog,
    protected rest: RestService,
    protected ws: WebSocketService,
    protected dialogService: DialogService,
    protected loader: AppLoaderService,
    protected translate: TranslateService) {

    if (typeof (this._classId) !== "undefined" && this._classId !== "") {
      this.resource_name += "/" + this._classId;

      this.rest.get(this.resource_name, {}).subscribe((res) => {
        this.rowData = [];

        this.rowData = this.resourceTransformIncomingRestData(res.data);
      }, (res) => {
        this.dialogService.errorReport(T("Error getting volume/dataset data"), res.message, res.stack);
      });
    }




  }

  /*getAddActions() {
    const actions = [];
    actions.push({
      label: T("Import or Create Pool"),
      icon: "add",
      onClick: () => {
        this._router.navigate(new Array('/').concat(
          ["storage", "pools", "import"]));
      }
    });

    return actions;
  }*/

  getEncryptedActions(rowData: any) {
    const actions = [];

    if (rowData.vol_encrypt === 2) {

      if (rowData.status !== "LOCKED") {
        actions.push({
          label: T("Lock"),
          onClick: (row1) => {
            this.dialogService.confirm(T("Lock"), T("Proceed with locking the pool: ") + row1.name).subscribe((confirmResult) => {
              if (confirmResult === true) {
                this.loader.open();
                this.rest.post(this.resource_name + "/" + row1.name + "/lock/", { body: JSON.stringify({}) }).subscribe((restPostResp) => {
                  this.loader.close();
                  this.parentVolumesListComponent.repaintMe();

                }, (res) => {
                  this.loader.close();
                  this.dialogService.errorReport(T("Error locking pool"), res.message, res.stack);
                });
              }
            });
          }
        });

      }

      if (rowData.status === "LOCKED") {
        actions.push({
          label: T("Un-Lock"),
          onClick: (row1) => {
            this._router.navigate(new Array('/').concat(
              ["storage", "pools", "unlock", row1.id]));
          }
        });
      }

    }




    actions.push({
      label: T("Create Passphrase"),
      onClick: (row1) => {
        this._router.navigate(new Array('/').concat(
          ["storage", "pools", "createkey", row1.id]));
      }
    });

    actions.push({
      label: T("Add Recovery Key"),
      onClick: (row1) => {
        this._router.navigate(new Array('/').concat(
          ["storage", "pools", "addkey", row1.id]));
      }
    });

    actions.push({
      label: T("Delete Recovery Key"),
      onClick: (row1) => {
        this.dialogService.confirm(T("Delete Recovery Key"), T("Delete recovery key for volume: ") + row1.name).subscribe((confirmResult) => {
          if (confirmResult === true) {
            this.loader.open();

            this.rest.delete(this.resource_name + "/" + row1.name + "/recoverykey/", { body: JSON.stringify({}) }).subscribe((restPostResp) => {
              this.loader.close();

              this.dialogService.Info(T("Deleted Recovery Key"), T("Successfully deleted recovery key for pool ") + row1.name).subscribe((infoResult) => {
                this.parentVolumesListComponent.repaintMe();
              });
            }, (res) => {
              this.loader.close();
              this.dialogService.errorReport(T("Error Deleting Key"), res.message, res.stack);
            });
          }
        });
      }
    });

    actions.push({
      label: T("Encryption Rekey"),
      onClick: (row1) => {
        this._router.navigate(new Array('/').concat(
          ["storage", "pools", "rekey", row1.id]));

      }
    });

    actions.push({
      label: T("Download Encrypt Key"),
      onClick: (row1) => {
        const dialogRef = this.mdDialog.open(DownloadKeyModalDialog, { disableClose: true });
        dialogRef.componentInstance.volumeId = row1.id;

      }
    });


    return actions;
  }

  getActions(rowData: any) {
    let rowDataPathSplit = [];
    if (rowData.path) {
      rowDataPathSplit = rowData.path.split('/');
    }
    const actions = [];
    //workaround to make deleting volumes work again,  was if (row.vol_fstype == "ZFS")
    if (rowData.type === 'zpool') {
      actions.push({
        label: T("Detach"),
        onClick: (row1) => {
          this._router.navigate(new Array('/').concat(
            ["storage", "pools", "detachvolume", row1.id]));
        }
      });
      actions.push({
        label: T("Extend"),
        onClick: (row1) => {
          this._router.navigate(new Array('/').concat(
            ["storage", "pools", "manager", row1.id]));
        }
      });
      actions.push({
        label: T("Status"),
        onClick: (row1) => {
          this._router.navigate(new Array('/').concat(
            ["storage", "pools", "status", row1.id]));
        }
      });

      if (rowData.is_upgraded === false) {

        actions.push({
          label: T("Upgrade Pool"),
          onClick: (row1) => {

            this.dialogService.confirm(T("Upgrade Pool"), T("Proceed with upgrading the pool? (Upgrading a pool is a \
                                                        non-reversable operation that could make some features of \
                                                        the pool incompatible with older versions of FreeNAS): ") + row1.name).subscribe((confirmResult) => {
                if (confirmResult === true) {
                  this.loader.open();

                  this.rest.post("storage/volume/" + row1.id + "/upgrade", { body: JSON.stringify({}) }).subscribe((restPostResp) => {
                    this.loader.close();

                    this.dialogService.Info(T("Upgraded"), T("Successfully Upgraded ") + row1.name).subscribe((infoResult) => {
                      this.parentVolumesListComponent.repaintMe();
                    });
                  }, (res) => {
                    this.loader.close();
                    this.dialogService.errorReport(T("Error Upgrading Pool ") + row1.name, res.message, res.stack);
                  });
                }
              });

          }
        });
      }
    }

    if (rowData.type === "dataset") {
      actions.push({
        label: T("Add Dataset"),
        onClick: (row1) => {
          this._router.navigate(new Array('/').concat([
            "storage", "pools", "id", row1.path.split('/')[0], "dataset",
            "add", row1.path
          ]));
        }
      });
      actions.push({
        label: T("Add Zvol"),
        onClick: (row1) => {
          this._router.navigate(new Array('/').concat([
            "storage", "pools", "id", row1.path.split('/')[0], "zvol", "add",
            row1.path
          ]));
        }
      });
      actions.push({
        label: T("Edit Options"),
        onClick: (row1) => {
          this._router.navigate(new Array('/').concat([
            "storage", "pools", "id", row1.path.split('/')[0], "dataset",
            "edit", row1.path
          ]));
        }
      });
      if (rowDataPathSplit[1] !== "iocage") {
        actions.push({
          label: T("Edit Permissions"),
          onClick: (row1) => {
            this._router.navigate(new Array('/').concat([
              "storage", "pools", "id", row1.path.split('/')[0], "dataset",
              "permissions", row1.path
            ]));
          }
        });
      }

      if (rowData.path.indexOf('/') !== -1) {
        actions.push({
          label: T("Delete Dataset"),
          onClick: (row1) => {

            this.dialogService.confirm(T("Delete"), T("This action is irreversible and will \
             delete any existing snapshots of this dataset (" + row1.path + ").  Please confirm."), false).subscribe((res) => {
                if (res) {

                  this.loader.open();

                  const url = "storage/dataset/" + row1.path;


                  this.rest.delete(url, {}).subscribe((res) => {
                    this.loader.close();
                    this.parentVolumesListComponent.repaintMe();
                  }, (error) => {
                    this.loader.close();
                    this.dialogService.errorReport(T("Error deleting dataset"), error.message, error.stack);
                  });

                }
              });
          }
        });

      }

      let rowDataset = _.find(this.datasetData, { id: rowData.path });
      if (rowDataset && rowDataset['origin'] && !!rowDataset['origin'].parsed) {
        actions.push({
          label: T("Promote Dataset"),
          onClick: (row1) => {
            this.loader.open();

            this.ws.call('pool.dataset.promote', [row1.path]).subscribe((wsResp) => {
              this.loader.close();
              // Showing info here because there is no feedback on list parent for this if promoted.
              this.dialogService.Info(T("Promote Dataset"), T("Successfully Promoted ") + row1.path).subscribe((infoResult) => {
                this.parentVolumesListComponent.repaintMe();
              });
            }, (res) => {
              this.loader.close();
              this.dialogService.errorReport(T("Error Promoting dataset ") + row1.path, res.reason, res.stack);
            });
          }
        });
      }
    }
    if (rowData.type === "zvol") {
      actions.push({
        label: T("Delete zvol"),
        onClick: (row1) => {


          this.dialogService.confirm(T("Delete zvol:" + row1.path), T("Please confirm the deletion of zvol:" + row1.path), false).subscribe((confirmed) => {
            if (confirmed === true) {
              this.loader.open();

              this.rest.delete('storage/volume/' + this._classId + '/zvols/' + row1.name, {}).subscribe((wsResp) => {
                this.loader.close();
                this.parentVolumesListComponent.repaintMe();

              }, (res) => {
                this.loader.close();
                this.dialogService.errorReport(T("Error Deleting zvol ") + row1.path, res.reason, res.stack);
              });
            }
          });


        }
      });// return 'storage/volume/' + this.pk + '/zvols/';
      actions.push({
        label: T("Edit Zvol"),
        onClick: (row1) => {
          this._router.navigate(new Array('/').concat([
            "storage", "pools", "id", row1.path.split('/')[0], "zvol", "edit",
            row1.path
          ]));
        }
      });


    }
    return actions;
  }


  resourceTransformIncomingRestData(data: any): ZfsPoolData[] {

    data = new EntityUtils().flattenData(data);
    const returnData: ZfsPoolData[] = [];
    const numberIdPathMap: Map<string, number> = new Map<string, number>();

    for (let i = 0; i < data.length; i++) {
      const dataObj = data[i];

      dataObj.nodePath = dataObj.mountpoint;

      if (typeof (dataObj.nodePath) === "undefined" && typeof (dataObj.path) !== "undefined") {
        dataObj.nodePath = "/mnt/" + dataObj.path;
      }

      dataObj.parentPath = dataObj.nodePath.slice(0, dataObj.nodePath.lastIndexOf("/"));

      if (dataObj.status !== '-') {
        // THEN THIS A ZFS_POOL DON'T ADD    dataObj.type = 'zpool'
        continue;
      } else if (typeof (dataObj.nodePath) === "undefined" || dataObj.nodePath.indexOf("/") === -1) {
        continue;
      }

      if ("/mnt" === dataObj.parentPath) {
        dataObj.parentPath = "0";
      }


      try {
        dataObj.availStr = (<any>window).filesize(dataObj.avail, { standard: "iec" });
      } catch (error) {
        dataObj.availStr = "" + dataObj.avail;
      }

      try {
        dataObj.usedStr = (<any>window).filesize(dataObj.used, { standard: "iec" });
      } catch (error) {
        dataObj.usedStr = "" + dataObj.used;
      }

      dataObj.compression = "";
      dataObj.readonly = "";
      dataObj.dedub = "";

      if (dataObj.type === 'dataset' && typeof (dataObj.dataset_data) !== "undefined" && typeof (dataObj.dataset_data.data) !== "undefined") {
        for (let k = 0; k < dataObj.dataset_data.data.length; k++) {
          if (dataObj.dataset_data.data[k].name === dataObj.nodePath) {
            dataObj.compression = dataObj.dataset_data.data[k].compression;
            dataObj.readonly = dataObj.dataset_data.data[k].readonly;
            dataObj.dedup = dataObj.dataset_data.data[k].dedup;
          }

        }
      }

      dataObj.actions = this.getActions(dataObj);

      returnData.push(dataObj);
    }

    return returnData;
  };


}


@Component({
  selector: 'app-volumes-list',
  styleUrls: ['./volumes-list.component.css'],
  templateUrl: './volumes-list.component.html'
})
export class VolumesListComponent extends EntityTableComponent implements OnInit, AfterViewInit {

  title = T("Pools");
  zfsPoolRows: ZfsPoolData[] = [];
  conf: InputTableConf = new VolumesListTableConfig(this, this.router, "", "Pools", {}, this.mdDialog, this.rest, this.ws, this.dialogService, this.loader, this.translate);

  actionComponent = {
    getActions: (row) => {
      return this.conf.getActions(row);
    },
    conf: new VolumesListTableConfig(this, this.router, "", "Pools", {}, this.mdDialog, this.rest, this.ws, this.dialogService, this.loader, this.translate)
  };

  actionEncryptedComponent = {
    getActions: (row) => {
      return (<VolumesListTableConfig>this.conf).getEncryptedActions(row);
    },
    conf: new VolumesListTableConfig(this, this.router, "", "Pools", {}, this.mdDialog, this.rest, this.ws, this.dialogService, this.loader, this.translate)
  };

  expanded = false;
  public paintMe = true;


  constructor(protected rest: RestService, protected router: Router, protected ws: WebSocketService,
    protected _eRef: ElementRef, protected dialogService: DialogService, protected loader: AppLoaderService,
    protected mdDialog: MatDialog, protected erdService: ErdService, protected translate: TranslateService) {
    super(rest, router, ws, _eRef, dialogService, loader, erdService, translate);
  }

  public repaintMe() {
    this.paintMe = false;
    this.ngOnInit();
  }

  ngOnInit(): void {
    while (this.zfsPoolRows.length > 0) {
      this.zfsPoolRows.pop();
    }

    this.ws.call('pool.dataset.query', []).subscribe((datasetData) => {
      this.rest.get("storage/volume", {}).subscribe((res) => {
        res.data.forEach((volume: ZfsPoolData) => {
          volume.volumesListTableConfig = new VolumesListTableConfig(this, this.router, volume.id, volume.name, datasetData, this.mdDialog, this.rest, this.ws, this.dialogService, this.loader, this.translate);
          volume.type = 'zpool';


          try {
            volume.availStr = (<any>window).filesize(volume.avail, { standard: "iec" });
          } catch (error) {
            volume.availStr = "" + volume.avail;
          }

          try {
            volume.usedStr = (<any>window).filesize(volume.used, { standard: "iec" }) + " (" + volume.used_pct + ")";
          } catch (error) {
            volume.usedStr = "" + volume.used;
          }
          this.zfsPoolRows.push(volume);
        });

        if (this.zfsPoolRows.length === 1) {
          this.expanded = true;
        }

        this.paintMe = true;
      }, (res) => {
        this.dialogService.errorReport(T("Error getting pool data"), res.message, res.stack);
      });
    }, (res) => {
      this.dialogService.errorReport(T("Error getting pool data"), res.message, res.stack);
    });

  }

  ngAfterViewInit(): void {

  }



}
