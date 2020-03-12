import { Component, OnInit, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-dataset-quotas-userlist',
  template: `<entity-table [title]="title" [conf]="this"></entity-table>`,
  styleUrls: ['./dataset-quotas-userlist.component.css']
})
export class DatasetQuotasUserlistComponent implements OnInit {

  @Output() selectedUsers = new EventEmitter<any>();

  public title = "Users For Quota";
  // protected route_add: string[] = ['account', 'users', 'add'];
  // protected route_add_tooltip = "Add User";
  // protected route_edit: string[] = ['account', 'users', 'edit'];
  // protected route_delete: string[] = ['account', 'users', 'delete'];
  protected entityList: any;
  protected loaderOpen = false;
  // protected usr_lst = [];
  // protected grp_lst = [];
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
    { name: 'UID', prop: 'uid', hidden: false, maxWidth: 100 },
    // { name: 'GID', prop: 'gid', hidden: true, maxWidth: 100 },
    // { name: 'Home directory', prop: 'home', hidden: true  },
    // { name: 'Shell', prop: 'shell', hidden: true, minWidth: 150  },
    { name: 'Builtin', prop: 'builtin', hidden: false  },
    // { name: 'Full Name', prop: 'full_name', hidden: false, minWidth: 250 },
    // { name: 'Email', prop: 'email', hidden: true, maxWidth: 250 },
    // { name: 'Password Disabled', prop: 'password_disabled', hidden: true, minWidth: 200 },
    // { name: 'Lock User', prop: 'locked', hidden: true },
    // { name: 'Permit Sudo', prop: 'sudo', hidden: true  },
    // { name: 'Microsoft Account', prop: 'microsoft_account', hidden: true, minWidth: 170 },
    // { name : 'Samba Authentication', prop: 'smb', hidden: true }
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
  constructor() { }

  ngOnInit(): void {
  }

}
