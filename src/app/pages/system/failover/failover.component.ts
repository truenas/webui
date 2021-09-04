import { Component } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { helptext_system_failover } from 'app/helptext/system/failover';
import { FormConfiguration } from 'app/interfaces/entity-form.interface';
import { FailoverUpdate } from 'app/interfaces/failover.interface';
import { EntityFormComponent } from 'app/pages/common/entity/entity-form';
import { FieldConfig } from 'app/pages/common/entity/entity-form/models/field-config.interface';
import { FieldSet } from 'app/pages/common/entity/entity-form/models/fieldset.interface';
import { RelationAction } from 'app/pages/common/entity/entity-form/models/relation-action.enum';
import { EntityUtils } from 'app/pages/common/entity/utils';
import { WebSocketService } from 'app/services';
import { AppLoaderService } from 'app/services/app-loader/app-loader.service';
import { DialogService } from 'app/services/dialog.service';
import { T } from 'app/translate-marker';

@UntilDestroy()
@Component({
  selector: 'app-system-failover',
  template: '<entity-form [conf]="this"></entity-form>',
  styleUrls: [],
  providers: [],
})
export class FailoverComponent implements FormConfiguration {
  queryCall: 'failover.config' = 'failover.config';
  updateCall = 'failover.update';
  entityForm: EntityFormComponent;
  alreadyDisabled = false;
  confirmSubmit = false;
  saveSubmitText = helptext_system_failover.save_button_text;
  confirmSubmitDialog = {
    title: T('Disable Failover'),
    message: T(''),
    hideCheckbox: false,
  };
  master_fg: FormControl;
  warned = false;

  custActions = [
    {
      id: 'sync_to_peer',
      name: T('Sync to Peer'),
      function: () => {
        const params = [{ reboot: false }];
        const ds = this.dialog.confirm({
          title: helptext_system_failover.dialog_sync_to_peer_title,
          message: helptext_system_failover.dialog_sync_to_peer_message,
          buttonMsg: helptext_system_failover.dialog_button_ok,
          secondaryCheckBox: true,
          secondaryCheckBoxMsg: helptext_system_failover.dialog_sync_to_peer_checkbox,
          method: 'failover.sync_to_peer',
          data: params,
        });
        ds.afterClosed().pipe(untilDestroyed(this)).subscribe((status: boolean) => {
          if (status) {
            this.load.open();
            this.ws.call(
              ds.componentInstance.method, ds.componentInstance.data,
            ).pipe(untilDestroyed(this)).subscribe(() => {
              this.load.close();
              this.dialog.info(helptext_system_failover.confirm_dialogs.sync_title,
                helptext_system_failover.confirm_dialogs.sync_to_message, '', 'info', true);
            }, (err) => {
              this.load.close();
              new EntityUtils().handleWSError(this.entityForm, err);
            });
          }
        });
      },
    },
    {
      id: 'sync_from_peer',
      name: T('Sync from Peer'),
      function: () => {
        this.dialog.confirm({
          title: helptext_system_failover.dialog_sync_from_peer_title,
          message: helptext_system_failover.dialog_sync_from_peer_message,
          buttonMsg: helptext_system_failover.dialog_button_ok,
        }).pipe(filter(Boolean), untilDestroyed(this)).subscribe(() => {
          this.load.open();
          this.ws.call('failover.sync_from_peer').pipe(untilDestroyed(this)).subscribe(() => {
            this.load.close();
            this.dialog.info(helptext_system_failover.confirm_dialogs.sync_title,
              helptext_system_failover.confirm_dialogs.sync_from_message, '', 'info', true);
          }, (err) => {
            this.load.close();
            new EntityUtils().handleWSError(this.entityForm, err);
          });
        });
      },
    },
  ];

  fieldConfig: FieldConfig[] = [];
  fieldSets: FieldSet[] = [
    {
      name: helptext_system_failover.fieldset_title,
      width: '100%',
      label: true,
      config: [
        {
          type: 'checkbox',
          name: 'disabled',
          placeholder: helptext_system_failover.disabled_placeholder,
          tooltip: helptext_system_failover.disabled_tooltip,
        }, {
          type: 'checkbox',
          name: 'master',
          placeholder: helptext_system_failover.master_placeholder,
          tooltip: helptext_system_failover.master_tooltip,
          value: true,
          relation: [
            {
              action: RelationAction.Disable,
              when: [{
                name: 'disabled',
                value: false,
              }],
            },
          ],
        }, {
          type: 'input',
          name: 'timeout',
          placeholder: helptext_system_failover.timeout_placeholder,
          tooltip: helptext_system_failover.timeout_tooltip,
        },
      ],
    }];

  constructor(
    private load: AppLoaderService,
    private dialog: DialogService,
    private ws: WebSocketService,
    protected matDialog: MatDialog,
  ) {}

  afterInit(entityEdit: EntityFormComponent): void {
    this.entityForm = entityEdit;
    this.entityForm.formGroup.controls['disabled'].valueChanges.pipe(untilDestroyed(this)).subscribe((res: boolean) => {
      if (!this.alreadyDisabled) {
        this.confirmSubmit = res;
      }
    });
    this.master_fg = this.entityForm.formGroup.controls['master'] as FormControl;
    this.master_fg.valueChanges.pipe(untilDestroyed(this)).subscribe((res: boolean) => {
      if (!res && !this.warned) {
        this.dialog.confirm({
          title: helptext_system_failover.master_dialog_title,
          message: helptext_system_failover.master_dialog_warning,
          buttonMsg: T('Continue'),
          cancelMsg: T('Cancel'),
          disableClose: true,
        }).pipe(untilDestroyed(this)).subscribe((confirm) => {
          if (!confirm) {
            this.master_fg.setValue(true);
          } else {
            this.warned = true;
          }
        });
      }
      if (res) {
        this.entityForm.saveSubmitText = helptext_system_failover.save_button_text;
      } else {
        this.entityForm.saveSubmitText = helptext_system_failover.failover_button_text;
      }
    });
  }

  customSubmit(body: FailoverUpdate): Subscription {
    this.load.open();
    return this.ws.call('failover.update', [body]).pipe(untilDestroyed(this)).subscribe(() => {
      this.alreadyDisabled = body['disabled'];
      this.load.close();
      this.dialog.info(T('Settings saved.'), '', '300px', 'info', true).pipe(untilDestroyed(this)).subscribe(() => {
        if (body.disabled && !body.master) {
          this.ws.logout();
        }
      });
    }, (res) => {
      this.load.close();
      new EntityUtils().handleWSError(this.entityForm, res);
    });
  }

  resourceTransformIncomingRestData(value: any): any {
    this.alreadyDisabled = value['disabled'];
    value['master'] = true;
    return value;
  }
}
