import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import * as _ from 'lodash';
import { helptextSystemKmip } from 'app/helptext/system/kmip';
import { FormConfiguration } from 'app/interfaces/entity-form.interface';
import { KmipConfigUpdate } from 'app/interfaces/kmip-config.interface';
import { EntityFormComponent } from 'app/modules/entity/entity-form/entity-form.component';
import { FieldConfig, FormSelectConfig } from 'app/modules/entity/entity-form/models/field-config.interface';
import { FieldSet } from 'app/modules/entity/entity-form/models/fieldset.interface';
import { EntityJobComponent } from 'app/modules/entity/entity-job/entity-job.component';
import { EntityUtils } from 'app/modules/entity/utils';
import { SystemGeneralService, DialogService, WebSocketService } from 'app/services';

@UntilDestroy()
@Component({
  templateUrl: './kmip.component.html',
  styleUrls: ['./kmip.component.scss'],
})
export class KmipComponent implements FormConfiguration {
  queryCall = 'kmip.config' as const;
  editCall = 'kmip.update' as const;
  isEntity = false;

  entityForm: EntityFormComponent;

  fieldConfig: FieldConfig[] = [];
  fieldSets: FieldSet[] = [
    {
      name: helptextSystemKmip.fieldset_server,
      class: 'server',
      label: true,
      width: '100%',
      config: [
        {
          type: 'input',
          name: 'server',
          placeholder: helptextSystemKmip.server.placeholder,
          tooltip: helptextSystemKmip.server.tooltip,
          class: 'inline',
          width: '50%',
        },
        {
          type: 'input',
          inputType: 'number',
          name: 'port',
          placeholder: helptextSystemKmip.port.placeholder,
          tooltip: helptextSystemKmip.port.tooltip,
          class: 'inline',
          width: '50%',
        },
      ],
    },
    {
      name: helptextSystemKmip.fieldset_certificate,
      class: 'certificate',
      label: true,
      width: '100%',
      config: [
        {
          type: 'select',
          name: 'certificate',
          placeholder: helptextSystemKmip.certificate.placeholder,
          tooltip: helptextSystemKmip.certificate.tooltip,
          options: [
            { label: '---', value: null },
          ],
          class: 'inline',
          width: '50%',
          linkText: 'Certificates',
          linkClicked: () => {
            this.router.navigate(['/', 'credentials', 'certificates']);
          },
        },
        {
          type: 'select',
          name: 'certificate_authority',
          placeholder: helptextSystemKmip.certificate_authority.placeholder,
          tooltip: helptextSystemKmip.certificate_authority.tooltip,
          options: [
            { label: '---', value: null },
          ],
          class: 'inline',
          width: '50%',
          linkText: this.translate.instant('Certificate Authorities'),
          linkClicked: () => {
            this.router.navigate(['/', 'credentials', 'certificates']);
          },
        },
      ],
    },
    {
      name: helptextSystemKmip.fieldset_management,
      class: 'management',
      label: true,
      width: '100%',
      config: [
        {
          type: 'checkbox',
          name: 'manage_sed_disks',
          placeholder: helptextSystemKmip.manage_sed_disks.placeholder,
          tooltip: helptextSystemKmip.manage_sed_disks.tooltip,
        },
        {
          type: 'checkbox',
          name: 'manage_zfs_keys',
          placeholder: helptextSystemKmip.manage_zfs_keys.placeholder,
          tooltip: helptextSystemKmip.manage_zfs_keys.tooltip,
        },
        {
          type: 'checkbox',
          name: 'enabled',
          placeholder: helptextSystemKmip.enabled.placeholder,
          tooltip: helptextSystemKmip.enabled.tooltip,
        },
        {
          type: 'checkbox',
          name: 'change_server',
          placeholder: helptextSystemKmip.change_server.placeholder,
          tooltip: helptextSystemKmip.change_server.tooltip,
        },
        {
          type: 'checkbox',
          name: 'validate',
          placeholder: helptextSystemKmip.validate.placeholder,
          tooltip: helptextSystemKmip.validate.tooltip,
        },
        {
          type: 'checkbox',
          name: 'force_clear',
          placeholder: helptextSystemKmip.force_clear.placeholder,
          tooltip: helptextSystemKmip.force_clear.tooltip,
        },
      ],
    },
  ];

  showSpinner = true;
  isKmipEnabled: boolean;
  isSyncPending = false;

  constructor(
    private systemGeneralService: SystemGeneralService,
    private dialogService: DialogService,
    private dialog: MatDialog, private router: Router,
    private ws: WebSocketService, private translate: TranslateService,
  ) {
    this.ws.call(this.queryCall).pipe(untilDestroyed(this)).subscribe(
      (res) => {
        this.isKmipEnabled = res.enabled;
        if (this.isKmipEnabled) {
          this.ws.call('kmip.kmip_sync_pending').pipe(untilDestroyed(this)).subscribe(
            (isPending) => {
              this.showSpinner = false;
              this.isSyncPending = isPending;
            },
            (penddingCallErr) => {
              new EntityUtils().handleWsError(this, penddingCallErr, this.dialogService);
            },
          );
        } else {
          this.showSpinner = false;
        }
      },
      (err) => {
        new EntityUtils().handleWsError(this, err, this.dialogService);
      },
    );
  }

  preInit(): void {
    const certificateFieldset: FieldSet = _.find(this.fieldSets, { class: 'certificate' });
    const certificateField = _.find(certificateFieldset.config, { name: 'certificate' }) as FormSelectConfig;
    const certificateAuthorityField = _.find(certificateFieldset.config, { name: 'certificate_authority' }) as FormSelectConfig;

    this.systemGeneralService.getCertificateAuthorities().pipe(untilDestroyed(this)).subscribe((res) => {
      res.forEach((authority) => {
        certificateAuthorityField.options.push({ label: authority.name, value: authority.id });
      });
    });
    this.systemGeneralService.getCertificates().pipe(untilDestroyed(this)).subscribe((res) => {
      res.forEach((certificate) => {
        certificateField.options.push({ label: certificate.name, value: certificate.id });
      });
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
      data: { title: helptextSystemKmip.jobDialog.title },
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
      new EntityUtils().handleWsError(this, err, this.dialogService);
    });
  }

  syncKeys(): void {
    this.ws.call('kmip.sync_keys').pipe(untilDestroyed(this)).subscribe(
      () => {
        this.dialogService.info(helptextSystemKmip.syncInfoDialog.title, helptextSystemKmip.syncInfoDialog.info);
      },
      (err) => {
        new EntityUtils().handleWsError(this, err, this.dialogService);
      },
    );
  }

  clearSyncKeys(): void {
    this.ws.call('kmip.clear_sync_pending_keys').pipe(untilDestroyed(this)).subscribe(
      () => {
        this.dialogService.info(
          helptextSystemKmip.clearSyncKeyInfoDialog.title,
          helptextSystemKmip.clearSyncKeyInfoDialog.info,
        );
      },
      (err) => {
        new EntityUtils().handleWsError(this, err, this.dialogService);
      },
    );
  }
}
