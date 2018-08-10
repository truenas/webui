import {Component, ElementRef, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {Subscription} from 'rxjs/Subscription';


import {RestService, WebSocketService} from '../../../../services/';
import { DialogService } from 'app/services';
import { AppLoaderService } from '../../../../services/app-loader/app-loader.service';
import { EntityUtils } from '../../../common/entity/utils';
import { ChangeDetectorRef } from '@angular/core';

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
  public busy: Subscription;
  protected loaderOpen = false;
  public columns: Array<any> = [
    {name : 'Type', prop : 'dtype'},
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
      label : "Edit",
      onClick : (edit_row) => {
        this.router.navigate(new Array('').concat(
            [ "vm", this.pk, "devices", this.vm, "edit", edit_row.id, edit_row.dtype ]));
      }
    });
    actions.push({
      label : "Delete",
      onClick : (delete_row) => {
        this.deviceDelete(delete_row.id);
      },
    });
    return actions;
  }

  deviceDelete(id){
    this.dialogService.confirm("Delete", "Delete this device?").subscribe((res) => {
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
    });
  }
}
