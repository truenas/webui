import { RestService, WebSocketService } from '../../../services';
import { Component } from '@angular/core';
import { Router } from '@angular/router';

import { AppLoaderService } from '../../../services/app-loader/app-loader.service';
import { T } from '../../../translate-marker';

@Component({
  selector: 'app-plugins-available-list',
  templateUrl: './plugins-available-list.component.html',
  styleUrls: ['./plugins-available-list.component.css'],
  // template: `<entity-table [title]="title" [conf]="this"></entity-table>`
})
export class PluginsAvailabelListComponent {

  public title = "Available Plugins";
  protected queryCall = 'jail.list_resource';
  protected queryCallOption = ["PLUGIN", true];
  protected entityList: any;

  public columns: Array < any > = [
    { name: T('Name'), prop: '0', icon: '5' },
    { name: T('Description'), prop: '1' },
    { name: T('Version'), prop: '6' },
    { name: T('Official'), prop: '4'},
  ];
  public config: any = {
    paging: true,
    sorting: { columns: this.columns },
  };

  public isPoolActivated: boolean = true;
  public selectedPool;
  public activatedPool: any;
  public availablePools: any = [];

  public tooltipMsg: any = T("Choose an existing ZFS Pool to allow the \
                              iocage jail manager to create a /iocage \
                              dataset in the selected pool. The '/iocage' \
                              dataset may not be visible until after the \
                              first jail is created. iocage uses this \
                              dataset to store FreeBSD RELEASES and all \
                              other jail data. To create a new ZFS Pool, \
                              navigate Storage/Volumes and click 'Create \
                              ZFS Pool'.");

  constructor(protected router: Router, protected rest: RestService, protected ws: WebSocketService, protected loader: AppLoaderService) {
    this.getActivatedPool();
    this.getAvailablePools();
  }

  getActions(parentRow) {
    return [{
        id: "install",
        label: T("install"),
        onClick: (row) => {
          this.router.navigate(
            new Array('').concat(["plugins", "add", row[2]]));
        }
      }
    ]
  }

  getActivatedPool(){
    this.ws.call('jail.get_activated_pool').subscribe((res)=>{
      if (res != null) {
        this.activatedPool = res;
        this.isPoolActivated = true;
      } else {
        this.isPoolActivated = false;
      }
    })
  }

  getAvailablePools(){
    this.ws.call('pool.query').subscribe( (res)=> {
      this.availablePools = res;
    })
  }

  activatePool(event: Event){
    this.ws.call('jail.activate', [this.selectedPool.name]).subscribe(
      (res)=>{
        this.isPoolActivated = true;
      });
  }
}
