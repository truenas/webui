import { ApplicationRef, Component, Injector, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import * as _ from 'lodash';
import { Subscription } from 'rxjs';
import { RestService, WebSocketService } from '../../../../services/';
import { T } from '../../../../translate-marker';
import { MatSnackBar } from '@angular/material';
import { EntityUtils } from '../../../common/entity/utils';

@Component({
  selector: 'ca-list',
  template: `<entity-table [title]="title" [conf]="this"></entity-table>`
})

export class CertificateAuthorityListComponent {

  public title = "Certificate Authorities";
  protected queryCall = "certificateauthority.query";
  protected wsDelete = "certificateauthority.delete";
  // protected route_edit: string[] = ['system', 'ca', 'edit'];
  protected route_success: string[] = [ 'system', 'ca' ];

  public busy: Subscription;
  public sub: Subscription;
  protected entityList: any;

  constructor(protected router: Router, protected aroute: ActivatedRoute,
    protected rest: RestService, protected ws: WebSocketService,
    protected _injector: Injector, protected _appRef: ApplicationRef,
    public snackBar: MatSnackBar) {}

  public columns: Array < any > = [
    { name: T('Name'), prop: 'name' },
    { name: T('Internal'), prop: 'internal' },
    { name: T('Issuer'), prop: 'issuer' },
    { name: T('Distinguished Name'), prop: 'DN' },
    { name: T('From'), prop: 'from' },
    { name: T('Until'), prop: 'until' },
  ];

  public config: any = {
    paging: true,
    sorting: { columns: this.columns },
  }

  afterInit(entityList: any) {
    this.entityList = entityList;
  }

  getAddActions() {
    let actions = [];
    actions.push({
      label: T("Import CA"),
      icon: "card_membership",
      onClick: () => {
        this.router.navigate(
          new Array('').concat(["system", "ca", "import"]));
      }
    }, {
      label: T("Create CA"),
      icon: "add",
      onClick: () => {
        this.router.navigate(new Array('').concat(
          ["system", "ca", "add"]));
      }
    });

    return actions;
  }

  getActions(row) {
    return [{
        id: "sign",
        label: T("Sign CSR"),
        onClick: (row) => {
          this.router.navigate(new Array('').concat(["system", "ca", "sign", row.id]))
        }
      },
      {
        id: "export_certificate",
        label: T("Export Certificate"),
        onClick: (row) => {
          this.ws.call('certificateauthority.query', [[["id", "=", row.id]]]).subscribe((res) => {
            if (res[0]) {
              this.ws.call('core.download', ['filesystem.get', [res[0].certificate_path], res[0].name + '.crt']).subscribe(
                (res) => {
                  this.snackBar.open(T("Redirecting to download. Make sure pop-ups are enabled in the browser."), T("Success"), {
                    duration: 5000
                  });
                  window.open(res[1]);
                },
                (res) => {
                  new EntityUtils().handleError(this, res);
                }
              );
            }
          })
        }
      },
      {
        id: "export_private_key",
        label: T("Export Private Key"),
        onClick: (row) => {
          this.ws.call('certificateauthority.query', [[["id", "=", row.id]]]).subscribe((res) => {
            if (res[0]) {
              this.ws.call('core.download', ['filesystem.get', [res[0].privatekey_path], res[0].name + '.key']).subscribe(
                (res) => {
                  this.snackBar.open(T("Redirecting to download. Make sure pop-ups are enabled in the browser."), T("Success"), {
                    duration: 5000
                  });
                  window.open(res[1]);
                },
                (res) => {
                  new EntityUtils().handleError(this, res);
                }
              );
            }
          })
        }
      },
      {
        id: "delete",
        label: T("Delete"),
        onClick: (row) => {
          this.entityList.doDelete(row.id);
        }
      }]
   }
}
