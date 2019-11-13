import { ApplicationRef, Component, Injector } from '@angular/core';
import { MatSnackBar } from '@angular/material';
import { ActivatedRoute, Router } from '@angular/router';
import { helptext_system_ca } from 'app/helptext/system/ca';
import * as _ from 'lodash';
import { Subscription } from 'rxjs';
import { RestService, WebSocketService } from '../../../../services/';
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
  protected route_add: string[] = ['system', 'ca', 'add'];
  protected route_add_tooltip: string = helptext_system_ca.list.tooltip_route_add;
  protected route_success: string[] = [ 'system', 'ca' ];

  public busy: Subscription;
  public sub: Subscription;
  protected entityList: any;

  constructor(protected router: Router, protected aroute: ActivatedRoute,
    protected rest: RestService, protected ws: WebSocketService,
    protected _injector: Injector, protected _appRef: ApplicationRef,
    public snackBar: MatSnackBar) {}

  public columns: Array < any > = [
    { name: helptext_system_ca.list.column_name, prop: 'name', always_display: true },
    { name: helptext_system_ca.list.column_internal, prop: 'internal' },
    { name: helptext_system_ca.list.column_issuer, prop: 'issuer' },
    { name: helptext_system_ca.list.column_distinguished_name, prop: 'DN' },
    { name: helptext_system_ca.list.column_from, prop: 'from' },
    { name: helptext_system_ca.list.column_until, prop: 'until' },
  ];

  public config: any = {
    paging: true,
    sorting: { columns: this.columns },
    deleteMsg: {
      title: 'Certificate Authority',
      key_props: ['name']
    },
  }

  afterInit(entityList: any) {
    this.entityList = entityList;
  }

  isActionVisible(actionId: string, row: any) {
    if (actionId === 'export_certificate' && row.certificate === null) {
      return false;
    } else if (actionId === 'export_private_key' && row.privatekey === null) {
      return false;
    }
    return true;
  }

  getActions(row) {
    return [
      {
        id: "View",
        label: helptext_system_ca.list.action_view,
        onClick: (row) => {
          this.router.navigate(new Array('').concat(["system", "ca", "view", row.id]))
        }
      },
      {
        id: "sign",
        label: helptext_system_ca.list.action_sign,
        onClick: (row) => {
          this.router.navigate(new Array('').concat(["system", "ca", "sign", row.id]))
        }
      },
      {
        id: "export_certificate",
        label: helptext_system_ca.list.action_export_certificate,
        onClick: (row) => {
          this.ws.call('certificateauthority.query', [[["id", "=", row.id]]]).subscribe((res) => {
            if (res[0]) {
              this.ws.call('core.download', ['filesystem.get', [res[0].certificate_path], res[0].name + '.crt']).subscribe(
                (res) => {
                  this.snackBar.open(helptext_system_ca.list.snackbar_open_window_message, helptext_system_ca.list.snackbar_open_window_action, {
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
        label: helptext_system_ca.list.action_export_private_key,
        onClick: (row) => {
          this.ws.call('certificateauthority.query', [[["id", "=", row.id]]]).subscribe((res) => {
            if (res[0]) {
              this.ws.call('core.download', ['filesystem.get', [res[0].privatekey_path], res[0].name + '.key']).subscribe(
                (res) => {
                  this.snackBar.open(helptext_system_ca.list.snackbar_open_window_message, helptext_system_ca.list.snackbar_open_window_action, {
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
        label: helptext_system_ca.list.action_delete,
        onClick: (row) => {
          this.entityList.doDelete(row);
        }
      }];
  }

  dataHandler(entityList: any) {
    for (let i = 0; i < entityList.rows.length; i++) {
      if (_.isObject(entityList.rows[i].issuer)) {
        entityList.rows[i].issuer = entityList.rows[i].issuer.name;
      }
    }
  }
}
