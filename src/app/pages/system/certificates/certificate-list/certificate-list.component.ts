import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import * as _ from 'lodash';
import { WebSocketService } from '../../../../services/';
import { T } from '../../../../translate-marker';
import { MatSnackBar } from '@angular/material';
import { EntityUtils } from '../../../common/entity/utils';

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
  protected route_success: string[] = [ 'system', 'certificates' ];

  protected entityList: any;

  constructor(protected router: Router, protected aroute: ActivatedRoute,
    protected ws: WebSocketService, public snackBar: MatSnackBar) {
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

  isActionVisible(actionId: string, row: any) {
    if (actionId === 'export_certificate' && row.CSR !== null) {
      return false;
    } else if (actionId === 'export_private_key' && row.CSR !== null) {
      return false;
    }

    return true;
  }

  getActions(row) {
    return [{
        id: "Edit",
        label: T("Edit"),
        onClick: (row) => {
          this.router.navigate(new Array('').concat(["system", "certificates", "edit", row.id]))
        }
      },
      {
        id: "export_certificate",
        label: T("Export Certificate"),
        onClick: (row) => {
          this.ws.call('certificate.query', [[["id", "=", row.id]]]).subscribe((res) => {
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
          this.ws.call('certificate.query', [[["id", "=", row.id]]]).subscribe((res) => {
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
      }];
  }
}
