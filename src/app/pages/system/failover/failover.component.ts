import { Component } from '@angular/core';
import { Validators } from '@angular/forms';
import * as _ from 'lodash';
import { AppLoaderService } from "../../../services/app-loader/app-loader.service";
import { DialogService } from "../../../services/dialog.service";
import { MatSnackBar, MatDialog } from '@angular/material';
import { EntityUtils } from '../../common/entity/utils';
import { RestService, WebSocketService } from '../../../services/';
import { T } from '../../../translate-marker';
import { FieldConfig } from '../../common/entity/entity-form/models/field-config.interface';
import { helptext_system_failover } from 'app/helptext/system/failover';


@Component({
  selector: 'app-system-failover',
  templateUrl: 'failover.component.html',
  styleUrls: ['failover.component.css']
})

export class FailoverComponent {
  public job: any = {};
  protected queryCall = 'system.failover.config';
  protected updateCall = 'system.failover.update';
  public entityForm: any;
  protected dialogRef: any;
  public custActions: Array < any > = [
    {
      id: 'sync_to_peer',
      name: T('Sync to Peer'),
      function: () => {
        this.dialog.confirm(helptext_system_failover.dialog_sync_to_peer_title, helptext_system_failover.dialog_sync_to_peer_message, true, helptext_system_failover.dialog_button_ok).subscribe((res) => {
        });
      }
    },
    {
      id: 'sync_from_peer',
      name: T('Sync from Peer'),
      function: () => {
        this.dialog.confirm(helptext_system_failover.dialog_sync_to_peer_title, helptext_system_failover.dialog_sync_to_peer_message, true, helptext_system_failover.dialog_button_ok).subscribe((res) => {
        });
      }
    } 
  ];


  public fieldConfig: FieldConfig[] = [{
    type: 'checkbox',
    name: 'disabled',
    placeholder: helptext_system_failover.disabled_placeholder,
    tooltip: helptext_system_failover.disabled_tooltip
  }, {
    type: 'checkbox',
    name: 'master',
    placeholder: helptext_system_failover.master_placeholder,
    tooltip: helptext_system_failover.master_tooltip,
    relation: [
      {
        action : 'DISABLE',
        when : [{
          name: 'disabled',
          value: false
        }]
      }
    ]
  }, {
    type: 'input',
    name: 'timeout',
    placeholder: helptext_system_failover.timeout_placeholder,
    tooltip: helptext_system_failover.timeout_tooltip,

  }
];

  constructor(private rest: RestService,
    private load: AppLoaderService,
    private dialog: DialogService,
    private ws: WebSocketService,
    public snackBar: MatSnackBar,
    protected matDialog: MatDialog) {}

  openSnackBar(message: string, action: string) {
    this.snackBar.open(message, action, {
      duration: 5000
    });
  }

  afterInit(entityEdit: any) {
    this.entityForm = entityEdit;

  }

  public customSubmit(body) {
    /*this.load.open();
    if (body['disabled']) {
      // this.dialog.confirm stuff
    }
    return this.ws.call('system.failover.update', [body]).subscribe((res) => {
      this.load.close();
      this.snackBar.open(T("Settings saved."), T('close'), { duration: 5000 })
    }, (res) => {
      this.load.close();
      new EntityUtils().handleWSError(this.entityForm, res);
    });*/
  }
}
