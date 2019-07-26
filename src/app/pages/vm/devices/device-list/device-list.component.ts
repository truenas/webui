import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';


import { RestService, WebSocketService } from '../../../../services/';
import { DialogService } from '../../../../services/dialog.service';

import { AppLoaderService } from '../../../../services/app-loader/app-loader.service';
import { EntityUtils } from '../../../common/entity/utils';
import { ChangeDetectorRef } from '@angular/core';
import { T } from '../../../../translate-marker';
import { DialogFormConfiguration } from '../../../common/entity/entity-dialog/dialog-form-configuration.interface';
import * as _ from 'lodash';

@Component({
  selector : 'app-device-list',
  template : `
  <entity-table [title]="title" [conf]="this"></entity-table>
  `
})
export class DeviceListComponent {

  protected resource_name: string;
  protected route_add: string[];
  protected route_edit: string[];
  protected route_delete: string[];
  protected pk: any;
  public vm: string;
  public sub: Subscription;
  private entityList: any;
  public  wsDelete = 'datastore.delete';
  public queryCall = 'vm.device.query';
  protected queryCallOption: Array<any> = [[['vm', '=']]];
  public busy: Subscription;
  protected loaderOpen = false;
  public columns: Array<any> = [
    {name: 'Device ID', prop:'id', always_display: true},
    {name : 'Device', prop : 'dtype'},
    {name : 'Order', prop : 'order'},
  ];
  public title = "VM ";
  public config: any = {
    paging : true,
    sorting : {columns : this.columns},
  };
  constructor(protected router: Router, protected aroute: ActivatedRoute,
              protected rest: RestService, protected ws: WebSocketService, protected loader: AppLoaderService,
              public dialogService: DialogService, private cdRef:ChangeDetectorRef) {}


  isActionVisible(actionId: string, row: any) {
    return actionId === 'delete' && row.id === true ? false : true;
  }


  getActions(row) {
    const actions = [];
    actions.push({
      id: row.id,
      name: 'edit',
      icon: 'edit',
      label : T("Edit"),
      onClick : (edit_row) => {
        this.router.navigate(new Array('').concat(
            [ "vm", this.pk, "devices", this.vm, "edit", edit_row.id, edit_row.dtype ]));
      }
    });
    actions.push({
      id: row.id,
      name: 'delete',
      icon: 'delete',
      label : T("Delete"),
      onClick : (delete_row) => {
        this.deviceDelete(delete_row.id);
      },
    });
    actions.push({
      id: row.id,
      name: 'reorder',
      icon: 'reorder',
      label : T("Change Device Order"),
      onClick : (row1) => {
        const localLoader = this.loader,
        localRest = this.rest,
        localws = this.ws,
        localDialogService = this.dialogService

          const conf: DialogFormConfiguration = { 
            title: `Change Device Order ${row1.dtype}: ${row1.id}`,
            parent: this,
            fieldConfig: [{
              type: 'input',
              name: 'order',
            }
          ],
            saveButtonText: T('Save'),
            preInit: function (entityDialog) {
              _.find(entityDialog.fieldConfig, {'name':'order'})['value'] = row1.order;
            },
            customSubmit: function (entityDialog) {
              const value = entityDialog.formValue;
              localLoader.open();
              localws.call('vm.device.update',[row1.id,{'order':value.order}]).subscribe((succ)=>{
                entityDialog.dialogRef.close(true);
                localLoader.close();
                this.parent.entityList.getData();
              },(err)=>{
                localLoader.close();
              },()=>{
                entityDialog.dialogRef.close(true);
                localLoader.close();
                this.parent.entityList.getData();
              });

            }
          }
          this.dialogService.dialogForm(conf);
        }
      }),
      actions.push({
        id: row.id,
        name: 'details',
        icon: 'list',
        label : T("Details"),
        onClick : (device) => {
          let details = ``
          for (const attribute in device.attributes) {
            details = `${attribute}: ${device.attributes[attribute]} \n` + details;
          }
          this.dialogService.Info(`Details`, details,'500px','info');
        },
      });
    return actions;
    }
  
  deviceDelete(id){
    this.dialogService.confirm(T("Delete"), T("Delete this device?"), true, T('Delete Device')).subscribe((res) => {
      if (res) {
        this.loader.open();
        this.loaderOpen = true;
        const data = {};
        if (this.wsDelete) {
          this.busy = this.ws.call(this.wsDelete, ['vm.device',id]).subscribe(
            (resinner) => {
              this.entityList.getData();
              this.loader.close();
            },
            (resinner) => {
              new EntityUtils().handleError(this, resinner);
              this.loader.close();
            }
          );
        }
      }
    })
  }
  preInit(entityList: any) {
    this.entityList = entityList;
    this.sub = this.aroute.params.subscribe(params => {
      this.pk = params['pk'];
      this.vm = params['name'];
      this.route_add = ['vm', this.pk, 'devices', this.vm, 'add'];
      this.route_edit = [ 'vm', this.pk, 'devices', this.vm, 'edit' ];
      this.route_delete = [ 'vm', this.pk, 'devices', this.vm, 'delete' ];
      // this is filter by vm's id to show devices belonging to that VM
      this.resource_name = 'vm/device/?vm__id=' + this.pk;
      this.title = this.title + this.vm + ' devices';
      this.cdRef.detectChanges();
      this.queryCallOption[0][0].push(parseInt(this.pk,10));
    });
  }
}
