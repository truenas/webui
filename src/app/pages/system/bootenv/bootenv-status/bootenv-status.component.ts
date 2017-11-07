import {Component, ElementRef} from '@angular/core';
import {Router} from '@angular/router';
import filesize from 'filesize';
import * as _ from 'lodash';

import {RestService} from '../../../../services/rest.service';

@Component({
  selector : 'app-bootstatus-list',
  template : `<entity-table [title]="title" [conf]="this"></entity-table>`
})
export class BootStatusListComponent {

  public title = "Boot Status";
  protected resource_name: string = 'system/bootenv';
  protected queryCall = 'boot.get_state';
  protected entityList: any;

  public columns: Array<any> = [
    {name: 'Name', prop: 'name'},
    {name: 'Read', prop: 'read_errors'},
    {name: 'Write', prop: 'write_errors'},
    {name: 'Checksum', prop: 'checksum_errors'},
    {name: 'Status', prop: 'status'},
  ];
  public config: any = {
    paging : true,
    sorting : {columns : this.columns},
  };



  rowValue(row, attr) {
    if (attr === 'name'){
      return row.name;
    }
    else if(attr === 'status'){
      return row.groups.data[0].status;
    }
    else if(attr === 'read_errors'){
      return row.read_errors;
    }
    else if(attr === 'checksum_errors'){
      return row.checksum_errors;
    }
    else {
      return row.write_errors;
    }

  }

  
  resourceTransformIncomingRestData(data:any): any {
    data.read_errors  = data.groups.data[0].stats.read_errors;
    data.write_errors  = data.groups.data[0].stats.write_errors;
    data.checksum_errors  = data.groups.data[0].stats.checksum_errors;
    return data
  };
  constructor(_rest: RestService, private _router: Router) {}

  afterInit(entityList: any) {
    this.entityList = entityList;
  }

}
