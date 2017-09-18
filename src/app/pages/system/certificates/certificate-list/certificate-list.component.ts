import { ApplicationRef, Component, Injector, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import * as _ from 'lodash';
import { Subscription } from 'rxjs';
import {Observable} from 'rxjs/Observable';
import { RestService, WebSocketService } from '../../../../services/';

@Component({
  selector: 'certificate-list',
  template: `<entity-table [conf]="this"></entity-table>`
})

export class CertificateListComponent {

  protected resource_name: string = 'system/certificate';
  protected route_delete: string[] = ['system', 'certificates', 'delete'];
  protected route_edit: string[] = ['system', 'certificates', 'edit'];
  protected route_success: string[] = [ 'system', 'certificates' ];

  public busy: Subscription;
  public sub: Subscription;

  public gcl = this.getCertList().subscribe(result => console.log(result),error => console.log(error));

  constructor(protected router: Router, protected aroute: ActivatedRoute,
    protected rest: RestService, protected ws: WebSocketService,
    protected _injector: Injector, protected _appRef: ApplicationRef) {
  }

  public columns: Array < any > = [
    { prop: 'cert_name', name: 'Name' },
    { prop: 'cert_issuer', name: 'Issuer' },
    { prop: 'cert_type_internal', name: 'Internal' },
    { prop: 'cert_lifetime', name: "Lifetime" },
    { prop: 'cert_from', name: "From" },
    { prop: 'cert_until', name: "Expires" },
  ];

  public config: any = {
    paging: true,
    sorting: { columns: this.columns },
  }

  getAddActions() {
    let actions = [];
    actions.push({
      label: "Import Certificate",
      icon: "card_membership",
      onClick: () => {
        this.router.navigate(
          new Array('').concat(["system", "certificates", "import"]));
      }
    }, {
      label: "Create Internal",
      icon: "system_update_alt",
      onClick: () => {
        this.router.navigate(new Array('').concat(
          ["system", "certificates", "internal"]));
      }
    }, {
      label: "Create CSR",
      icon: "vpn_lock",
      onClick: () => {
        this.router.navigate(new Array('').concat(
          ["system", "certificates", "csr"]));
      }
    });

    return actions;
  }

  preInit(entityList: any) {
    this.sub = this.aroute.params.subscribe(params => {});
  }

  getCertList(): Observable<Array<any>> {
    return this.rest.get(this.resource_name, {});
  }
}
