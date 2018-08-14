import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from "@angular/router";
import { Subscription } from 'rxjs/Subscription';
import { MatSnackBar } from '@angular/material';

import { RestService } from '../../../../services/rest.service';
import { WebSocketService } from '../../../../services/ws.service';
import { DialogService } from '../../../../services/';
import { AppLoaderService } from '../../../../services/app-loader/app-loader.service';
import { EntityUtils } from '../../../common/entity/utils';

interface PoolDiskInfo {
  id: number,
  parentId: number,
  name: any,
  read: any,
  write: any,
  checksum: any,
  status: any,
  actions ?: any,
  path ?: any,
}
@Component({
  selector : 'app-bootstatus-list',
  template : `
              <div class="material mat-card mat-card-table">
              <div class="mat-toolbar mat-card-toolbar">
                <div class="mat-card-title-text">
                  {{title | translate}}
                </div>
              </div>
              <div>
                <mat-list *ngIf="poolScan">
                  <mat-list-item><b>{{poolScan.function}}</b></mat-list-item>
                  <mat-list-item>Status: {{poolScan.pause != null ? 'PAUSED' : poolScan.state ? poolScan.state : 'None requested'}}</mat-list-item>
                  <mat-list-item *ngIf="poolScan.errors != null">Errors: {{poolScan.errors}}</mat-list-item>
                  <mat-list-item *ngIf="poolScan.start_time != null">Date: {{getReadableDate(poolScan.start_time)}}</mat-list-item>
                </mat-list>
              </div>
              <div class="padding-16">
                <dx-tree-list id='pool' [dataSource]="topology" [columnAutoWidth]="true" [expandedRowKeys]="expandRows">
                  <dxo-selection mode="single"></dxo-selection>
                  <dxi-column dataField="name" [width]="300"></dxi-column>
                  <dxi-column dataField="read" cellTemplate="readCellTemplate"></dxi-column>
                  <div *dxTemplate="let rowData of 'readCellTemplate'">
                    <div [ngClass]="rowData.data.read > 0 ? 'CellHighlight' : ''">
                      {{rowData.data.read}}
                    </div>
                  </div>

                  <dxi-column dataField="write" cellTemplate="writeCellTemplate"></dxi-column>
                  <div *dxTemplate="let rowData of 'writeCellTemplate'">
                    <div [ngClass]="rowData.data.write > 0 ? 'CellHighlight' : ''">
                      {{rowData.data.write}}
                    </div>
                  </div>

                  <dxi-column dataField="checksum" cellTemplate="checksumCellTemplate"></dxi-column>
                  <div *dxTemplate="let rowData of 'checksumCellTemplate'">
                    <div [ngClass]="rowData.data.checksum > 0 ? 'CellHighlight' : ''">
                      {{rowData.data.checksum}}
                    </div>
                  </div>

                  <dxi-column dataField="status"></dxi-column>
                  <dxi-column dataField="" cellTemplate="cellTemplate"></dxi-column>
                  <div *dxTemplate="let rowData of 'cellTemplate'">
                    <div id="menu_{{rowData.data.name}}" *ngIf="rowData.data.actions">
                      <mat-icon [matMenuTriggerFor]="statuMenu" [style.cursor]="'pointer'">more_vert</mat-icon>
                      <mat-menu #statuMenu="matMenu">
                        <span *ngFor="let action of rowData.data.actions" id="buttonAction_{{rowData.data.name}}">
                          <button mat-menu-item *ngIf="!action.isHidden" (click)="action.onClick(rowData.data);">
                            <span>{{ action.label }}</span>
                          </button>
                        </span>
                      </mat-menu>
                    </div>
                  </div>
                </dx-tree-list>
              </div>
            </div>
`
})
export class BootStatusListComponent implements OnInit {

  public title = "Boot Pool Status";
  protected queryCall = 'boot.get_state';
  protected entityList: any;
  public busy: Subscription;
  protected pk: number;
  public poolScan: any;
  public topology: Array < PoolDiskInfo > = [];
  public expandRows: Array < number > = [1];


  constructor(_rest: RestService, private _router: Router, private ws: WebSocketService,
    private dialog:DialogService, protected loader: AppLoaderService, public snackBar: MatSnackBar, protected aroute: ActivatedRoute) {

    }

    getData() {
      this.ws.call('boot.get_state').subscribe(
        (res) => {

          if (res) {

            // this.poolScan = res.scan;
            this.dataHandler(res);
          }
        },
        (err) => {
          new EntityUtils().handleError(this, err);
        }
      );
    }

    ngOnInit() {
      this.aroute.params.subscribe(params => {
        this.pk = parseInt(params['pk'], 10);
        this.getData();
      });
    }



    parseResponse(id: any, data: any, parentId: any, category ?: any, boot_pool_info?: any) {
      let stats: any = {
        read_errors: 0,
        write_errors: 0,
        checksum_errors: 0,
      };

      if (data.stats) {
        stats = data.stats;
      }

      // use path as the device name if the device name is null
      if (!data.device || data.device == null) {
        data.device = data.path;
      }

      const item: PoolDiskInfo = {
        id: id,
        parentId: parentId,
        name: data.name ? data.name : data.device,
        read: stats.read_errors ? stats.read_errors : 0,
        write: stats.write_errors ? stats.write_errors : 0,
        checksum: stats.checksum_errors ? stats.checksum_errors : 0,
        status: data.status,
        path: data.path,
      };

      if(data.groups && data.groups.data[0].type){
        data.type = data.groups.data[0].type;
      }
      if (data.name && data.name === 'freenas-boot') {
        item.actions = [{
          label: "Attach",
          onClick: (row) => {
            this._router.navigate(new Array('').concat([ "system", "bootenv", "attach", row.name ]));
          },
          isHidden: false,
        }];
      }
      if (data.type && boot_pool_info && boot_pool_info[0].type === 'mirror' && data.path) {
        item.actions = [{
          label: "Detach",
          onClick: (row) => {
            this.detach(row.name)
          },
          isHidden: false,
        },
        {
          label: "Replace",
          onClick: (row) => { this._router.navigate(new Array('').concat([ "system", "bootenv", "replace", row.name ]));
          },
          isHidden: false,
        }];

      }
      if(data.type && boot_pool_info && boot_pool_info[0].type === 'disk' && data.path){
        item.actions = [
        {
          label: "Replace",
          onClick: (row) => { this._router.navigate(new Array('').concat([ "system", "bootenv", "replace", row.name ]));
          },
          isHidden: false,
        }];

      }

      this.topology.push(item);
    }
    parseTopology(data, parentRow: any) {
      let parentId = 1;
      let namePostfix  = false;
      if (parentRow && parentRow !== 'data' && data.length > 0) {
        parentId = this.topology.length + 1;
        this.topology.push({
          id: this.topology.length + 1,
          parentId: 1,
          name: parentRow,
          read: '',
          write: '',
          checksum: '',
          status: '',
        });
        this.expandRows.push(parentId);
      }
      if (data.length > 1) {
        namePostfix = true;
      }
      for (const i in data) {
        let subParentId = parentId;
        if (data[i].type !== 'DISK') {
          const rowId = this.topology.length + 1;
          this.expandRows.push(rowId);
          this.topology.push({
            id: rowId,
            parentId: parentId,
            name: namePostfix ? data[i].type + '-' + i : data[i].type,
            read: data[i].stats.read_errors,
            write: data[i].stats.write_errors,
            checksum: data[i].stats.write_errors,
            status: data[i].status,
          });
          subParentId = rowId;
        }
        if (data[i].children) {
          for (const j in data[i].children) {
            this.parseResponse(this.topology.length + 1, data[i].children[j], subParentId, parentRow, data);
          }
        }
        if (data[i].path != null) {
          this.parseResponse(this.topology.length + 1, data[i], subParentId, parentRow, data);
        }
      }
    }
    openSnackBar(message: string, action: string) {
      this.snackBar.open(message, action , {
        duration: 5000
      });
    }
    detach(disk:any){
      disk = disk.substring(5, disk.length);
      this.loader.open();
      this.busy = this.ws.call('boot.detach', [disk]).subscribe(
        (res) => {
          this.loader.close();
          this._router.navigate(
            new Array('').concat('system','bootenv')
          );
          this.openSnackBar("Device detached.", "Success");
        },
        (res) => {
          this.loader.close();
          this.dialog.errorReport(res.error, res.reason, res.trace.formatted);
        });
    }

    dataHandler(pool: any) {
      this.topology = [];
      this.parseResponse(1, pool, 0);
      this.parseTopology(pool.groups.data, 'data');

    }

    getReadableDate(data: any) {
      if (data != null) {
        return new Date(data.$date);
      }
      return;
    }
  }
