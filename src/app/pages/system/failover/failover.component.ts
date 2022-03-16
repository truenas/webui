import { Component } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { helptextSystemFailover } from 'app/helptext/system/failover';
import { FormConfiguration } from 'app/interfaces/entity-form.interface';
import { FailoverConfig, FailoverUpdate } from 'app/interfaces/failover.interface';
import { AppLoaderService } from 'app/modules/app-loader/app-loader.service';
import { EntityFormComponent } from 'app/modules/entity/entity-form/entity-form.component';
import { FieldConfig } from 'app/modules/entity/entity-form/models/field-config.interface';
import { FieldSet } from 'app/modules/entity/entity-form/models/fieldset.interface';
import { RelationAction } from 'app/modules/entity/entity-form/models/relation-action.enum';
import { EntityUtils } from 'app/modules/entity/utils';
import { WebSocketService } from 'app/services';
import { DialogService } from 'app/services/dialog.service';

@UntilDestroy()
@Component({
  selector: 'app-system-failover',
  template: '<entity-form [conf]="this"></entity-form>',
  styleUrls: [],
  providers: [],
})
export class FailoverComponent implements FormConfiguration {
  queryCall = 'failover.config' as const;
  updateCall = 'failover.update' as const;
  entityForm: EntityFormComponent;
  alreadyDisabled = false;
  confirmSubmit = false;
  saveSubmitText = helptextSystemFailover.save_button_text;
  confirmSubmitDialog = {
    title: this.translate.instant('Disable Failover'),
    message: '',
    hideCheckbox: false,
  };
  masterControl: FormControl;
  warned = false;

  customActions = [
    {
      id: 'sync_to_peer',
      name: this.translate.instant('Sync to Peer'),
      function: () => {
        const params = [{ reboot: false }];
        const ds = this.dialog.confirm({
          title: helptextSystemFailover.dialog_sync_to_peer_title,
          message: helptextSystemFailover.dialog_sync_to_peer_message,
          buttonMsg: helptextSystemFailover.dialog_button_ok,
          secondaryCheckBox: true,
          secondaryCheckBoxMsg: helptextSystemFailover.dialog_sync_to_peer_checkbox,
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
              this.dialog.info(helptextSystemFailover.confirm_dialogs.sync_title,
                helptextSystemFailover.confirm_dialogs.sync_to_message, '', 'info', true);
            }, (err) => {
              this.load.close();
              new EntityUtils().handleWsError(this.entityForm, err);
            });
          }
        });
      },
    },
    {
      id: 'sync_from_peer',
      name: this.translate.instant('Sync from Peer'),
      function: () => {
        this.dialog.confirm({
          title: helptextSystemFailover.dialog_sync_from_peer_title,
          message: helptextSystemFailover.dialog_sync_from_peer_message,
          buttonMsg: helptextSystemFailover.dialog_button_ok,
        }).pipe(filter(Boolean), untilDestroyed(this)).subscribe(() => {
          this.load.open();
          this.ws.call('failover.sync_from_peer').pipe(untilDestroyed(this)).subscribe(() => {
            this.load.close();
            this.dialog.info(helptextSystemFailover.confirm_dialogs.sync_title,
              helptextSystemFailover.confirm_dialogs.sync_from_message, '', 'info', true);
          }, (err) => {
            this.load.close();
            new EntityUtils().handleWsError(this.entityForm, err);
          });
        });
      },
    },
  ];

  fieldConfig: FieldConfig[] = [];
  fieldSets: FieldSet[] = [
    {
      name: helptextSystemFailover.fieldset_title,
      width: '100%',
      label: true,
      config: [
        {
          type: 'checkbox',
          name: 'disabled',
          placeholder: helptextSystemFailover.disabled_placeholder,
          tooltip: helptextSystemFailover.disabled_tooltip,
        }, {
          type: 'checkbox',
          name: 'master',
          placeholder: helptextSystemFailover.master_placeholder,
          tooltip: helptextSystemFailover.master_tooltip,
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
          placeholder: helptextSystemFailover.timeout_placeholder,
          tooltip: helptextSystemFailover.timeout_tooltip,
        },
      ],
    }];

  constructor(
    private load: AppLoaderService,
    private dialog: DialogService,
    private ws: WebSocketService,
    protected matDialog: MatDialog,
    protected translate: TranslateService,
  ) {}

  afterInit(entityEdit: EntityFormComponent): void {
    this.entityForm = entityEdit;
    this.entityForm.formGroup.controls['disabled'].valueChanges.pipe(untilDestroyed(this)).subscribe((res: boolean) => {
      if (!this.alreadyDisabled) {
        this.confirmSubmit = res;
      }
    });
    this.masterControl = this.entityForm.formGroup.controls['master'] as FormControl;
    this.masterControl.valueChanges.pipe(untilDestroyed(this)).subscribe((res: boolean) => {
      if (!res && !this.warned) {
        this.dialog.confirm({
          title: helptextSystemFailover.master_dialog_title,
          message: helptextSystemFailover.master_dialog_warning,
          buttonMsg: this.translate.instant('Continue'),
          cancelMsg: this.translate.instant('Cancel'),
          disableClose: true,
        }).pipe(untilDestroyed(this)).subscribe((confirm) => {
          if (!confirm) {
            this.masterControl.setValue(true);
          } else {
            this.warned = true;
          }
        });
      }
      if (res) {
        this.entityForm.saveSubmitText = helptextSystemFailover.save_button_text;
      } else {
        this.entityForm.saveSubmitText = helptextSystemFailover.failover_button_text;
      }
    });
  }

  customSubmit(body: FailoverUpdate): Subscription {
    this.load.open();
    return this.ws.call('failover.update', [body]).pipe(untilDestroyed(this)).subscribe(() => {
      this.alreadyDisabled = body['disabled'];
      this.load.close();
      this.dialog.info(this.translate.instant('Settings saved.'), '', '300px', 'info', true).pipe(untilDestroyed(this)).subscribe(() => {
        if (body.disabled && !body.master) {
          this.ws.logout();
        }
      });
    }, (res) => {
      this.load.close();
      new EntityUtils().handleWsError(this.entityForm, res);
    });
  }

  resourceTransformIncomingRestData(value: FailoverConfig): FailoverConfig {
    this.alreadyDisabled = value['disabled'];
    value['master'] = true;
    return value;
  }
}
