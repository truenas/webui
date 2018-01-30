import { Component, ElementRef, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { RestService } from '../../../../services/';
import { TourService } from '../../../../services/tour.service';
import filesize from 'filesize';
import { debug } from 'util';
import { EntityUtils } from '../../../common/entity/utils';
import { EntityTableComponent } from 'app/pages/common/entity/entity-table/entity-table.component';
import { DialogService } from 'app/services/dialog.service';
import { WebSocketService } from 'app/services/ws.service';
import { AppLoaderService } from 'app/services/app-loader/app-loader.service';
import { AfterViewInit } from '@angular/core/src/metadata/lifecycle_hooks';
import { DownloadKeyModalDialog } from 'app/components/common/dialog/downloadkey/downloadkey-dialog.component';
import { MatDialog } from '@angular/material';


import { Injectable } from '@angular/core';
import { ErdService } from 'app/services/erd.service';



export interface ZfsPoolData {
  avail: number;
  availStr: string;
  id: string;
  is_decrypted: boolean;
  is_upgraded: boolean;
  mountpoint: string;
  name: string;
  path: string;
  nodePath: string;
  parentPath: string;
  status: string;
  used: number;
  used_pct: string;
  usedStr: string;
  sed_pct: string;
  vol_encrypt: number;
  vol_encryptkey: string;
  vol_guid: string;
  vol_name: string;
  type: string;
  compression: string;
  dedup: string;
  readonly: string;
  children: any[];
  dataset_data: any;
  actions: any[];
  volumesListTableConfig: VolumesListTableConfig;

}


export class VolumesListTableConfig {
  protected hideTopActions = true;
  protected flattenedVolData: any;
  protected resource_name = 'storage/volume';
  protected route_add: string[] = ['storage', 'volumes', 'manager'];
  protected route_add_tooltip = "Create ZFS Pool";
  public rowData: ZfsPoolData[] = [];

  constructor(
    private parentVolumesListComponent: VolumesListComponent,
    private _router: Router,
    private _classId: string,
    private title: string,
    public mdDialog: MatDialog,
    protected rest: RestService,
    protected dialogService: DialogService) {

    if (typeof (this._classId) !== "undefined" && this._classId !== "") {
      this.resource_name += "/" + this._classId;

      this.rest.get(this.resource_name, {}).subscribe((res) => {
        this.rowData = [];

        this.rowData = this.resourceTransformIncomingRestData(res.data);
      }, (res) => {
        alert("error");
        console.log("error", res);
      });
    }



  }

  getAddActions() {
    const actions = [];
    actions.push({
      label: "Import Volumes",
      icon: "vertical_align_bottom",
      onClick: () => {
        this._router.navigate(new Array('/').concat(
          ["storage", "volumes", "import_list"]));
      }
    });
    return actions;
  }

  getActions(rowData: any) {
    const actions = [];
    //workaround to make deleting volumes work again,  was if (row.vol_fstype == "ZFS")
    if (rowData.type === 'zpool') {
      actions.push({
        label: "Extend",
        onClick: (row1) => {
          this._router.navigate(new Array('/').concat(
            ["storage", "volumes", "manager", row1.id]));
        }
      });
      actions.push({
        label: "Delete",
        onClick: (row1) => {
          this._router.navigate(new Array('/').concat(
            ["storage", "volumes", "delete", row1.id]));
        }
      });
      actions.push({
        label: "Status",
        onClick: (row1) => {
          this._router.navigate(new Array('/').concat(
            ["storage", "volumes", "status", row1.id]));
        }
      });
      actions.push({
        label: "Lock",
        onClick: (row1) => {
          this.dialogService.confirm("Lock", "Proceed with locking the volume: " + row1.name).subscribe((confirmResult) => {
            if (confirmResult === true) {

              this.rest.post(this.resource_name + "/" + row1.name + "/lock/", { body: JSON.stringify({}) }).subscribe((restPostResp) => {
                console.log("restPostResp", restPostResp);
                this.dialogService.Info("Lock", "Locked " + row1.name).subscribe((infoResult) => {
                  this.parentVolumesListComponent.repaintMe();
                });
              }, (res) => {
                this.dialogService.errorReport("Error getting locking volume", res.message, res.stack);
              });
            }
          });
        }
      });


      actions.push({
        label: "Un-Lock",
        onClick: (row1) => {
          this.dialogService.confirm("Un-Lock", "Proceed with un locking the volume: " + row1.id).subscribe((confirmResult) => {
            if (confirmResult === true) {

              this.rest.post(this.resource_name + "/" + row1.name + "/unlock/", { body: JSON.stringify({ passphrase: "" }) }).subscribe((restPostResp) => {
                console.log("restPostResp", restPostResp);
                this.dialogService.Info("Un-Lock", "Un Locked " + row1.iname).subscribe((infoResult) => {
                  this.parentVolumesListComponent.repaintMe();
                });
              }, (res) => {
                this.dialogService.errorReport("Error getting unlocking volume", res.message, res.stack);
              });


            }
          });
        }
      });

      if (rowData.vol_encrypt > 0) {
        actions.push({
          label: "Download Encrypt Key",
          onClick: (row1) => {
            const dialogRef = this.mdDialog.open(DownloadKeyModalDialog, { disableClose: true });
          }
        });
      }
    }

    if (rowData.type === "dataset") {
      actions.push({
        label: "Add Dataset",
        onClick: (row1) => {
          this._router.navigate(new Array('/').concat([
            "storage", "volumes", "id", row1.path.split('/')[0], "dataset",
            "add", row1.path
          ]));
        }
      });
      actions.push({
        label: "Add Zvol",
        onClick: (row1) => {
          this._router.navigate(new Array('/').concat([
            "storage", "volumes", "id", row1.path.split('/')[0], "zvol", "add",
            row1.path
          ]));
        }
      });
      actions.push({
        label: "Edit Options",
        onClick: (row1) => {
          this._router.navigate(new Array('/').concat([
            "storage", "volumes", "id", row1.path.split('/')[0], "dataset",
            "edit", row1.path
          ]));
        }
      });
      if (rowData.path.indexOf('/') !== -1) {
        actions.push({
          label: "Delete Dataset",
          onClick: (row1) => {
            this._router.navigate(new Array('/').concat([
              "storage", "volumes", "id", row1.path.split('/')[0], "dataset",
              "delete", row1.path
            ]));
          }
        });
        actions.push({
          label: "Edit Permissions",
          onClick: (row1) => {
            this._router.navigate(new Array('/').concat([
              "storage", "volumes", "id", row1.path.split('/')[0], "dataset",
              "permissions", row1.path
            ]));
          }
        });
      }
    }
    if (rowData.type === "zvol") {
      actions.push({
        label: "Delete Zvol",
        onClick: (row1) => {
          this._router.navigate(new Array('/').concat([
            "storage", "volumes", "id", row1.path.split('/')[0], "zvol",
            "delete", row1.path
          ]));
        }
      });
      actions.push({
        label: "Edit Zvol",
        onClick: (row1) => {
          this._router.navigate(new Array('/').concat([
            "storage", "volumes", "id", row1.path.split('/')[0], "zvol", "edit",
            row1.path
          ]));
        }
      });
    }
    return actions;
  }


  resourceTransformIncomingRestData(data: any): ZfsPoolData[] {
    console.log("Log point 1");

    data = new EntityUtils().flattenData(data);
    const returnData: ZfsPoolData[] = [];
    const numberIdPathMap: Map<string, number> = new Map<string, number>();

    for (let i = 0; i < data.length; i++) {
      data[i].nodePath = data[i].mountpoint;

      if (data[i].status !== '-') {
        // THEN THIS A ZFS_POOL DON'T ADD    data[i].type = 'zpool'
        continue;
      } else if (typeof (data[i].nodePath) === "undefined" || data[i].nodePath.indexOf("/") === -1) {
        continue;
      }

      data[i].parentPath = data[i].nodePath.slice(0, data[i].nodePath.lastIndexOf("/"));

      if ("/mnt" === data[i].parentPath) {
        data[i].parentPath = "0";
      }

      try {
        data[i].availStr = filesize(data[i].avail, { standard: "iec" });
      } catch (error) {
        data[i].availStr = "" + data[i].avail;
      }

      try {
        data[i].usedStr = filesize(data[i].used, { standard: "iec" });
      } catch (error) {
        data[i].usedStr = "" + data[i].used;
      }

      if (data[i].type === 'dataset' && typeof (data[i].dataset_data) !== "undefined" && typeof (data[i].dataset_data.data) !== "undefined") {
        for (let k = 0; k < data[i].dataset_data.data.length; k++) {
          if (data[i].dataset_data.data[k].name === data[i].nodePath) {
            data[i].compression = data[i].dataset_data.data[k].compression;
            data[i].readonly = data[i].dataset_data.data[k].readonly;
            data[i].dedup = data[i].dataset_data.data[k].dedup;
          }

        }
      }

      data[i].actions = this.getActions(data[i]);

      returnData.push(data[i]);
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

  title = "Volumes";
  zfsPoolRows: ZfsPoolData[] = [];
  conf = new VolumesListTableConfig(this, this.router, "", "Volumes", this.mdDialog, this.rest, this.dialogService);
  expanded = false;
  public paintMe = true;


  constructor(protected rest: RestService, protected router: Router, protected ws: WebSocketService,
    protected _eRef: ElementRef, protected dialogService: DialogService, protected loader: AppLoaderService,
    protected mdDialog: MatDialog, protected erdService: ErdService) {
    super(rest, router, ws, _eRef, dialogService, loader, erdService);
  }

  public repaintMe() {
    this.paintMe = false;
    this.ngOnInit();
  }

  ngOnInit(): void {
    while (this.zfsPoolRows.length > 0) {
      this.zfsPoolRows.pop();
    }

    this.rest.get("storage/volume", {}).subscribe((res) => {
      res.data.forEach((volume: ZfsPoolData) => {
        volume.volumesListTableConfig = new VolumesListTableConfig(this, this.router, volume.id, volume.name, this.mdDialog, this.rest, this.dialogService);
        volume.type = 'zpool';

        try {
          volume.availStr = filesize(volume.avail, { standard: "iec" });
        } catch (error) {
          volume.availStr = "" + volume.avail;
        }

        try {
          volume.usedStr = filesize(volume.used, { standard: "iec" }) + " (" + volume.used_pct + ")";
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
      this.dialogService.errorReport("Error getting volume data", res.message, res.stack);
    });

  }

  ngAfterViewInit(): void {

  }



}
