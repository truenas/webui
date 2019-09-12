import { Component, OnDestroy } from '@angular/core';
import * as _ from 'lodash';
import { AppLoaderService } from "../../../services/app-loader/app-loader.service";
import { DialogService } from "../../../services/dialog.service";
import { MatDialog } from '@angular/material';
import { Router } from '@angular/router';
import { EntityUtils } from '../../common/entity/utils';
import { WebSocketService, SnackbarService } from '../../../services/';
import { T } from '../../../translate-marker';
import { FieldConfig } from '../../common/entity/entity-form/models/field-config.interface';
import { helptext_system_failover } from 'app/helptext/system/failover';
import { DialogFormConfiguration } from '../../common/entity/entity-dialog/dialog-form-configuration.interface';


@Component({
  selector: 'app-system-failover',
  template: `<entity-form [conf]="this"></entity-form>`,
  styleUrls: [],
  providers : [ SnackbarService ],
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
                this.snackBar.open(helptext_system_failover.snackbar_sync_to_peer_message_success,
                                   helptext_system_failover.snackbar_sync_to_peer_success_action);
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
              this.snackBar.open(helptext_system_failover.snackbar_sync_to_peer_message_success,
                                 helptext_system_failover.snackbar_sync_to_peer_success_action);
            }, (err) => {
              this.load.close();
              new EntityUtils().handleWSError(this.entityForm, err);
            });
          }
        });
      }
    },
    {
      id: 'initiate_failover',
      name: T('Initiate Failover'),
      function: () => {
            const self = this;
            const conf: DialogFormConfiguration = { 
            title: helptext_system_failover.dialog_initiate_failover_title,
            fieldConfig: [{
              type: 'paragraph',
              name: 'failover_warning',
              paraText: helptext_system_failover.dialog_initiate_failover_message,
              isHidden: false
            }, {
              type: 'checkbox',
              name: 'reboot',
              value: false,
              placeholder: helptext_system_failover.dialog_initiate_failover_checkbox,
            }, {
              type: 'checkbox',
              name: 'confirm',
              placeholder: T("Confirm"),
              required: true
            }],
            saveButtonText: T('Failover'),
            customSubmit: function (entityDialog) {
              window.localStorage.setItem('failingover', 'true');
              const value = entityDialog.formValue;
              let route = '/others/failover';
              if (value.reboot) {
                route = '/others/reboot';
              }
              self.router.navigate([route]);
            }
            
          }
          this.dialog.dialogForm(conf);
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

  constructor(
    private load: AppLoaderService,
    private dialog: DialogService,
    private ws: WebSocketService,
    public snackBar: SnackbarService,
    protected matDialog: MatDialog,
    private router: Router) {}

  afterInit(entityEdit: any) {
    this.entityForm = entityEdit;
    this.failoverDisableSubscription = 
      this.entityForm.formGroup.controls['disabled'].valueChanges.subscribe(res => {
        this.confirmSubmit = res;
      });
  }

  public customSubmit(body) {
    this.load.open();
    return this.ws.call('failover.update', [body]).subscribe((res) => {
      this.load.close();
      this.snackBar.open(T("Settings saved."), T('close'), { duration: 5000 })
    }, (res) => {
      this.load.close();
      new EntityUtils().handleWSError(this.entityForm, res);
    });
  }

  ngOnDestroy() {
    this.failoverDisableSubscription.unsubscribe();
  }
}
