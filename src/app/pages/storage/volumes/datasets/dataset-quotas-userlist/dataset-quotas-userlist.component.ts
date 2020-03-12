import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { WebSocketService, StorageService } from '../../../../../services/';

@Component({
  selector: 'app-dataset-quotas-userlist',
  template: `<entity-table [title]="title" [conf]="this"></entity-table>`,
  styleUrls: ['./dataset-quotas-userlist.component.css']
})
export class DatasetQuotasUserlistComponent implements OnInit {
  @Input() db;
  @Output() selectedUsers = new EventEmitter<any>();

  public title = "Dataset Users";
  protected entityList: any;
  protected hasDetails = false;
  protected noActions = true;
  protected queryCall = 'user.query';
  columnFilter = false;
  // protected globalConfig = {
  //   id: "config",
  //   onClick: () => {
  //     this.toggleBuiltins();
  //   }
  // };

  public columns: Array < any > = [
    { name: 'Username', prop: 'username', always_display: true, minWidth: 150},
    { name: 'UID', prop: 'uid', hidden: false },
    { name: 'Data Quota', prop: 'quota', hidden: false },
    { name: 'DQ % Used', prop: 'used_percent', hidden: false  },
    { name: 'Object Quota', prop: 'obj_quota', hidden: false },
    { name: 'OQ % Used', prop: 'obj_used_percent', hidden: false  },

  ];
  public rowIdentifier = 'username';
  public config: any = {
    paging: true,
    sorting: { columns: this.columns },
    multiSelect: true,
    deleteMsg: {
      title: 'User',
      key_props: ['username']
    }
  };

  public multiActions: Array < any > = [{
    id: "addToForm",
    label: ("Add to Form"),
    icon: "add",
    enable: true,
    ttpos: "above",
    onClick: (selected) => {
      console.log(selected)
      this.selectedUsers.emit(selected);
    }
  }];
  constructor(protected ws: WebSocketService, protected storageService: StorageService) { }

  resourceTransformIncomingRestData(data) {
    this.ws.call('pool.dataset.get_quota', [this.db, 'USER']).subscribe(res => {
      data.map(item => {
        res.map(i => {
          if(item.username === i.name) {
            item.quota = this.storageService.convertBytestoHumanReadable(i.quota, 0);
            item.used = i.used_percent;
            item.obj_quota = i.obj_quota;
            item.obj_used_percent = i.obj_used_percent;
          }
        })
      })
    })
    return data;
  }

  ngOnInit(): void {}

}
