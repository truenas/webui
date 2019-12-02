import { Component, OnDestroy } from '@angular/core';
import * as _ from 'lodash';
import { AppLoaderService } from "../../../services/app-loader/app-loader.service";
import { DialogService } from "../../../services/dialog.service";
import { MatDialog } from '@angular/material';
import { Router } from '@angular/router';
import { EntityUtils } from '../../common/entity/utils';
import { WebSocketService } from '../../../services/';
import { T } from '../../../translate-marker';
import { FieldConfig } from '../../common/entity/entity-form/models/field-config.interface';
import { helptext_system_failover } from 'app/helptext/system/failover';

@Component({
  selector: 'app-system-failover',
  template: `<entity-form [conf]="this"></entity-form>`,
  styleUrls: [],
  providers : [],
})

export class FailoverComponent implements OnDestroy {
  protected queryCall = 'failover.config';
  protected updateCall = 'failover.update';
  public entityForm: any;
  protected failoverDisableSubscription: any;
  public confirmSubmit = false;
  public confirmSubmitDialog = {
    title: T("Disable Failover"),
    message: T(""),
    hideCheckbox: false
  }
  public masterSubscription: any;
  public master_fg: any;
  public warned = false;

  public custActions: Array < any > = [
    {
      id: 'sync_to_peer',
      name: T('Sync to Peer'),
      function: () => {
        const params = [{"reboot": false}]
        const ds = this.dialog.confirm(
          helptext_system_failover.dialog_sync_to_peer_title, 
          helptext_system_failover.dialog_sync_to_peer_message,
          false, helptext_system_failover.dialog_button_ok,
          true,
          helptext_system_failover.dialog_sync_to_peer_checkbox,
          'failover.sync_to_peer',
          params);
        ds.afterClosed().subscribe((status)=>{
          if(status){
            this.load.open();
            this.ws.call(
              ds.componentInstance.method,ds.componentInstance.data).subscribe((res) => {
                this.load.close();
                this.dialog.Info(helptext_system_failover.confirm_dialogs.sync_title,
                                   helptext_system_failover.confirm_dialogs.sync_to_message, '', 'info', true);
              }, (err) => {
                this.load.close();
                new EntityUtils().handleWSError(this.entityForm, err);
              });
          }
        });
      }
    },
    {
      id: 'sync_from_peer',
      name: T('Sync from Peer'),
      function: () => {
        this.dialog.confirm(helptext_system_failover.dialog_sync_from_peer_title,
                            helptext_system_failover.dialog_sync_from_peer_message, false,
                            helptext_system_failover.dialog_button_ok).subscribe((confirm) => {
          if (confirm) {
            this.load.open();
            this.ws.call('failover.sync_from_peer').subscribe((res) => {
              this.load.close();
              this.dialog.Info(helptext_system_failover.confirm_dialogs.sync_title,
                                 helptext_system_failover.confirm_dialogs.sync_from_message, '', 'info', true);
            }, (err) => {
              this.load.close();
              new EntityUtils().handleWSError(this.entityForm, err);
            });
          }
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
    value: true,
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

  constructor(
    private load: AppLoaderService,
    private dialog: DialogService,
    private ws: WebSocketService,
    protected matDialog: MatDialog,
    private router: Router) {}

  afterInit(entityEdit: any) {
    this.entityForm = entityEdit;
    this.failoverDisableSubscription = 
      this.entityForm.formGroup.controls['disabled'].valueChanges.subscribe(res => {
        this.confirmSubmit = res;
      });
    this.master_fg = this.entityForm.formGroup.controls['master']
    this.masterSubscription = 
      this.master_fg.valueChanges.subscribe(res => {
      if (!res && !this.warned) {
        this.dialog.confirm(helptext_system_failover.master_dialog_title, helptext_system_failover.master_dialog_warning, false, T('Continue'), false, '', null, {}, null, false, T('Cancel'), true).subscribe(confirm => {
          if (!confirm) {
            this.master_fg.setValue(true);
          } else {
            this.warned = true;
          }
        });
      }
    });
  }

  public customSubmit(body) {
    this.load.open();
    return this.ws.call('failover.update', [body]).subscribe((res) => {
      this.load.close();
      this.dialog.Info(T("Settings saved."), '', '300px', 'info', true).subscribe(saved => {
        if (body.disabled && !body.master) {
          this.ws.logout();
        }
      });
    }, (res) => {
      this.load.close();
      new EntityUtils().handleWSError(this.entityForm, res);
    });
  }

  resourceTransformIncomingRestData(value) {
    value['master'] = true;
    return value;
  }

  ngOnDestroy() {
    this.failoverDisableSubscription.unsubscribe();
  }
}
