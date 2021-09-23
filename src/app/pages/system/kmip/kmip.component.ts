import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import * as _ from 'lodash';
import { helptext_system_kmip } from 'app/helptext/system/kmip';
import { FormConfiguration } from 'app/interfaces/entity-form.interface';
import { KmipConfigUpdate } from 'app/interfaces/kmip-config.interface';
import { EntityFormComponent } from 'app/pages/common/entity/entity-form';
import { FieldConfig, FormSelectConfig } from 'app/pages/common/entity/entity-form/models/field-config.interface';
import { FieldSet } from 'app/pages/common/entity/entity-form/models/fieldset.interface';
import { EntityJobComponent } from 'app/pages/common/entity/entity-job/entity-job.component';
import { EntityUtils } from 'app/pages/common/entity/utils';
import { SystemGeneralService, DialogService, WebSocketService } from 'app/services';

@UntilDestroy()
@Component({
  selector: 'app-system-kmip',
  templateUrl: './kmip.component.html',
  styleUrls: ['./kmip.component.scss'],
})
export class KmipComponent implements FormConfiguration {
  queryCall: 'kmip.config' = 'kmip.config';
  editCall: 'kmip.update' = 'kmip.update';
  isEntity = false;

  entityForm: EntityFormComponent;

  fieldConfig: FieldConfig[] = [];
  fieldSets: FieldSet[] = [
    {
      name: helptext_system_kmip.fieldset_server,
      class: 'server',
      label: true,
      width: '100%',
      config: [
        {
          type: 'input',
          name: 'server',
          placeholder: helptext_system_kmip.server.placeholder,
          tooltip: helptext_system_kmip.server.tooltip,
          class: 'inline',
          width: '50%',
        },
        {
          type: 'input',
          inputType: 'number',
          name: 'port',
          placeholder: helptext_system_kmip.port.placeholder,
          tooltip: helptext_system_kmip.port.tooltip,
          class: 'inline',
          width: '50%',
        },
      ],
    },
    {
      name: helptext_system_kmip.fieldset_certificate,
      class: 'certificate',
      label: true,
      width: '100%',
      config: [
        {
          type: 'select',
          name: 'certificate',
          placeholder: helptext_system_kmip.certificate.placeholder,
          tooltip: helptext_system_kmip.certificate.tooltip,
          options: [
            { label: '---', value: null },
          ],
          class: 'inline',
          width: '50%',
        },
        {
          type: 'select',
          name: 'certificate_authority',
          placeholder: helptext_system_kmip.certificate_authority.placeholder,
          tooltip: helptext_system_kmip.certificate_authority.tooltip,
          options: [
            { label: '---', value: null },
          ],
          class: 'inline',
          width: '50%',
        },
      ],
    },
    {
      name: helptext_system_kmip.fieldset_management,
      class: 'management',
      label: true,
      width: '100%',
      config: [
        {
          type: 'checkbox',
          name: 'manage_sed_disks',
          placeholder: helptext_system_kmip.manage_sed_disks.placeholder,
          tooltip: helptext_system_kmip.manage_sed_disks.tooltip,
        },
        {
          type: 'checkbox',
          name: 'manage_zfs_keys',
          placeholder: helptext_system_kmip.manage_zfs_keys.placeholder,
          tooltip: helptext_system_kmip.manage_zfs_keys.tooltip,
        },
        {
          type: 'checkbox',
          name: 'enabled',
          placeholder: helptext_system_kmip.enabled.placeholder,
          tooltip: helptext_system_kmip.enabled.tooltip,
        },
        {
          type: 'checkbox',
          name: 'change_server',
          placeholder: helptext_system_kmip.change_server.placeholder,
          tooltip: helptext_system_kmip.change_server.tooltip,
        },
        {
          type: 'checkbox',
          name: 'validate',
          placeholder: helptext_system_kmip.validate.placeholder,
          tooltip: helptext_system_kmip.validate.tooltip,
        },
        {
          type: 'checkbox',
          name: 'force_clear',
          placeholder: helptext_system_kmip.force_clear.placeholder,
          tooltip: helptext_system_kmip.force_clear.tooltip,
        },
      ],
    },
  ];

  showSpinner = true;
  kmip_enabled: boolean;
  sync_pending = false;

  constructor(
    private systemGeneralService: SystemGeneralService,
    private dialogService: DialogService,
    private dialog: MatDialog,
    private ws: WebSocketService,
  ) {
    this.ws.call(this.queryCall).pipe(untilDestroyed(this)).subscribe(
      (res) => {
        this.kmip_enabled = res.enabled;
        if (this.kmip_enabled) {
          this.ws.call('kmip.kmip_sync_pending').pipe(untilDestroyed(this)).subscribe(
            (isPending) => {
              this.showSpinner = false;
              this.sync_pending = isPending;
            },
            (penddingCallErr) => {
              new EntityUtils().handleWSError(this, penddingCallErr, this.dialogService);
            },
          );
        } else {
          this.showSpinner = false;
        }
      },
      (err) => {
        new EntityUtils().handleWSError(this, err, this.dialogService);
      },
    );
  }

  preInit(): void {
    const certificateFieldset: FieldSet = _.find(this.fieldSets, { class: 'certificate' });
    const certificateField: FormSelectConfig = _.find(certificateFieldset.config, { name: 'certificate' });
    const certificateAuthorityField: FormSelectConfig = _.find(certificateFieldset.config, { name: 'certificate_authority' });

    this.systemGeneralService.getCA().pipe(untilDestroyed(this)).subscribe((res) => {
      for (let i = 0; i < res.length; i++) {
        certificateAuthorityField.options.push({ label: res[i].name, value: res[i].id });
      }
    });
    this.systemGeneralService.getCertificates().pipe(untilDestroyed(this)).subscribe((res) => {
      for (let i = 0; i < res.length; i++) {
        certificateField.options.push({ label: res[i].name, value: res[i].id });
      }
    });
  }

  afterInit(entityForm: EntityFormComponent): void {
    this.entityForm = entityForm;
    this.fieldConfig = entityForm.fieldConfig;
  }

  customSubmit(data: KmipConfigUpdate): void {
    if (data['server'] === null) {
      data['server'] = '';
    }
    const dialogRef = this.dialog.open(EntityJobComponent, {
      data: { title: helptext_system_kmip.jobDialog.title },
      disableClose: true,
    });
    dialogRef.componentInstance.setCall(this.editCall, [data]);
    dialogRef.componentInstance.submit();
    dialogRef.componentInstance.success.pipe(untilDestroyed(this)).subscribe(() => {
      dialogRef.close(true);
      this.entityForm.success = true;
      this.entityForm.formGroup.markAsPristine();
    });
    dialogRef.componentInstance.failure.pipe(untilDestroyed(this)).subscribe((err) => {
      dialogRef.close(true);
      if (err.exc_info && err.exc_info.extra) {
        (err as any).extra = err.exc_info.extra;
      }
      new EntityUtils().handleWSError(this, err, this.dialogService);
    });
  }

  syncKeys(): void {
    this.ws.call('kmip.sync_keys').pipe(untilDestroyed(this)).subscribe(
      () => {
        this.dialogService.info(helptext_system_kmip.syncInfoDialog.title, helptext_system_kmip.syncInfoDialog.info, '500px', 'info', true);
      },
      (err) => {
        new EntityUtils().handleWSError(this, err, this.dialogService);
      },
    );
  }

  clearSyncKeys(): void {
    this.ws.call('kmip.clear_sync_pending_keys').pipe(untilDestroyed(this)).subscribe(
      () => {
        this.dialogService.info(helptext_system_kmip.clearSyncKeyInfoDialog.title, helptext_system_kmip.clearSyncKeyInfoDialog.info, '500px', 'info', true);
      },
      (err) => {
        new EntityUtils().handleWSError(this, err, this.dialogService);
      },
    );
  }
}
