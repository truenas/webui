import { Component, ElementRef, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { RestService } from '../../../../services/';
import { TourService } from '../../../../services/tour.service';
import filesize from 'filesize';
import { debug } from 'util';
import { EntityUtils } from '../../../common/entity/utils';

@Component({
  selector : 'app-volumes-list',
  template : `<entity-table [title]="title" [conf]="this"></entity-table>`
})
export class DisksListComponent {

  public title = "View Disks";
  protected flattenedVolData: any;
  protected resource_name: string = 'storage/disk/';

  constructor(
    protected _rest: RestService,
    private _router: Router,
    protected _eRef: ElementRef,
    private tour: TourService    
  ) {}

  public columns: Array<any> = [
    {name : 'Name', prop : 'disk_name'},
    {name : 'Serial', prop : 'disk_serial'},
    {name : 'Disk Size', prop : 'disk_size'},
    {name : 'Description', prop : 'disk_description'},
    {name : 'Transfer Mode', prop : 'disk_transfermode'},
    {name : 'HDD Standby', prop : 'disk_hddstandby'},
    {name : 'Advanced Power Management', prop : 'disk_advpowermgmt'},
    {name : 'Acoustic Level', prop : 'disk_acousticlevel'},
    {name : 'Enable S.M.A.R.T.', prop : 'disk_togglesmart'},
    {name : 'S.M.A.R.T. extra options', prop : 'disk_smartoptions'},
    {name : 'Enclosure Slot', prop : 'disk_enclosure_slot'}
  ];
  public config: any = {
    paging : true,
    sorting : {columns : this.columns},
  };

  getActions(row) {
    let actions = [];

    actions.push({
      label : "Edit",
      onClick : (row) => {
        
      }
    });
    actions.push({
      label : "Wipe",
      onClick : (row) => {
        
      }
    });

    return actions;
  }
  
}
