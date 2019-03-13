import { Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material';
import { ActivatedRoute, Router } from '@angular/router';
import * as _ from 'lodash';
import { WebSocketService } from '../../../../services/';
import { T } from '../../../../translate-marker';

@Component({
  selector: 'app-acmedns-list',
  template: `<entity-table [title]="title" [conf]="this"></entity-table>`,
  styleUrls: ['./acmedns-list.component.css']
})
export class AcmednsListComponent implements OnInit {
  public title = "ACME DNS Authenticators";
  protected queryCall = "acme.dns.authenticator.query";
  protected wsDelete = "acme.dns.authenticator.delete";
  protected route_add: string[] = ['system', 'certificates', 'add'];
  // protected route_add_tooltip: string = helptext_system_certificates.list.tooltip_add;
  protected route_success: string[] = [ 'system', 'certificates' ];

  protected entityList: any;

  constructor(protected router: Router, protected aroute: ActivatedRoute,
    protected ws: WebSocketService, public snackBar: MatSnackBar) {
  }

  ngOnInit() {
  }

  public columns: Array < any > = [
    { name: T('Authenticator'), prop: 'authenticator' },
    { name: T('Name'), prop: 'name' }
  ];

  public config: any = {
    paging: true,
    sorting: { columns: this.columns },
    deleteMsg: {
      title: 'Authenticator',
      key_props: ['authenticator']
    },
  }

  afterInit(entityList: any) {
    this.entityList = entityList;
  }

  dataHandler(entityList: any) {
    for (let i = 0; i < entityList.rows.length; i++) {
      if (_.isObject(entityList.rows[i].issuer)) {
        entityList.rows[i].issuer = entityList.rows[i].issuer.name;
      }
    }
  }

  getActions(row) {
    return [{
      id: "edit",
      label: T("Edit"),
      onClick: (row) => {
        console.log('edit an authenticator')
        // this.router.navigate(
        //   new Array('').concat(["jails", "edit", row.host_hostuuid]));
      }
    },
    {
      id: "delete",
      label: T("Delete"),
      onClick: (row) => {
        this.entityList.doDelete(row);
      }
    }];
  } 

}
