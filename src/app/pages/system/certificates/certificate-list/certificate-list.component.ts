import { ApplicationRef, Component, Injector, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import * as _ from 'lodash';
import { Subscription } from 'rxjs';
import {Observable} from 'rxjs/Observable';
import { RestService, WebSocketService } from '../../../../services/';
import { T } from '../../../../translate-marker';

@Component({
  selector: 'certificate-list',
  template: `<entity-table [title]="title" [conf]="this"></entity-table>`
})

export class CertificateListComponent {

  public title = "Certificates";
  protected queryCall = "certificate.query";
  protected wsDelete = "certificate.delete";
  protected route_add: string[] = ['system', 'certificates', 'add'];
  protected route_add_tooltip: string = T('Create Certificate');
  protected route_edit: string[] = ['system', 'certificates', 'edit'];
  protected route_success: string[] = [ 'system', 'certificates' ];

  public busy: Subscription;
  public sub: Subscription;

  constructor(protected router: Router, protected aroute: ActivatedRoute,
    protected rest: RestService, protected ws: WebSocketService,
    protected _injector: Injector, protected _appRef: ApplicationRef) {
  }

  public columns: Array < any > = [
    { name: T('Name'), prop: 'name'},
    { name: T('Issuer'), prop: 'issuer'},
    { name: T('Distinguished Name'), prop: 'DN'},
    { name: T('From'), prop: 'from'},
    { name: T('Until'), prop: 'until'},
  ];

  public config: any = {
    paging: true,
    sorting: { columns: this.columns },
  }

  dataHandler(entityList: any) {
    for (let i = 0; i < entityList.rows.length; i++) {
      if (_.isObject(entityList.rows[i].issuer)) {
        entityList.rows[i].issuer = entityList.rows[i].issuer.name;
      }
    }
  }
}
