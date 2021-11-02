import { Component, OnDestroy } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatDialogRef } from '@angular/material/dialog/dialog-ref';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import * as _ from 'lodash';
import { CoreService } from 'app/core/services/core-service/core.service';
import { ExplorerType } from 'app/enums/explorer-type.enum';
import helptext from 'app/helptext/storage/import-disk/import-disk';
import { FormCustomAction, FormConfiguration } from 'app/interfaces/entity-form.interface';
import { Job } from 'app/interfaces/job.interface';
import { EntityFormComponent } from 'app/pages/common/entity/entity-form/entity-form.component';
import {
  FieldConfig, FormRadioConfig, FormSelectConfig,
} from 'app/pages/common/entity/entity-form/models/field-config.interface';
import { FieldSet } from 'app/pages/common/entity/entity-form/models/fieldset.interface';
import { EntityJobComponent } from 'app/pages/common/entity/entity-job/entity-job.component';
import { EntityUtils } from 'app/pages/common/entity/utils';
import {
  WebSocketService,
  JobService,
} from 'app/services';
import { DialogService } from 'app/services/dialog.service';

@UntilDestroy()
@Component({
  selector: 'app-import-disk',
  template: `
  <div *ngIf="initialized">
  <entity-form [conf]="this"></entity-form>
  </div>`,
})
export class ImportDiskComponent implements OnDestroy, FormConfiguration {
  initialized = true;

  fieldConfig: FieldConfig[];
  fieldSets: FieldSet[] = [
    {
      name: helptext.fieldset_disk,
      label: true,
      class: 'general',
      width: '49%',
      config: [
        {
          type: 'select',
          name: 'volume',
          placeholder: helptext.import_disk_volume_placeholder,
          tooltip: helptext.import_disk_volume_tooltip,
          options: [],
          required: true,
          validation: helptext.import_disk_volume_validation,
        },
        {
          type: 'radio',
          name: 'fs_type',
          placeholder: helptext.import_disk_fs_type_placeholder,
          tooltip: helptext.import_disk_fs_type_tooltip,
          options: [
            { value: 'ufs', label: 'UFS' },
            { value: 'ntfs', label: 'NTFS' },
            { value: 'msdosfs', label: 'MSDOSFS' },
            { value: 'ext2fs', label: 'EXT2FS' },
          ],
          required: true,
          validation: helptext.import_disk_fs_type_validation,
        },
        {
          type: 'select',
          name: 'msdosfs_locale',
          placeholder: helptext.import_disk_msdosfs_locale_placeholder,
          tooltip: helptext.import_disk_msdosfs_locale_tooltip,
          options: [],
          isHidden: true,
        },
        {
          type: 'explorer',
          name: 'dst_path',
          placeholder: helptext.import_disk_dst_path_placeholder,
          tooltip: helptext.import_disk_dst_path_tooltip,
          explorerType: ExplorerType.Directory,
          initial: '/mnt',
          required: true,
          validation: helptext.import_disk_dst_path_validation,
        },
      ],
    },
  ];

  volume: FormSelectConfig;
  fs_type: FormControl;
  private fs_type_list: FormRadioConfig;
  msdosfs_locale: FormSelectConfig;
  private entityForm: EntityFormComponent;
  protected dialogRef: MatDialogRef<EntityJobComponent>;
  custActions: FormCustomAction[];

  constructor(
    protected router: Router,
    protected ws: WebSocketService,
    protected dialog: MatDialog,
    protected dialogService: DialogService,
    protected job: JobService,
    protected core: CoreService,
    protected translate: TranslateService,
  ) {}

  preInit(entityForm: EntityFormComponent): void {
    this.entityForm = entityForm;
    entityForm.isNew = true; // disable attempting to load data that doesn't exist
  }

  afterInit(entityForm: EntityFormComponent): void {
    this.fieldConfig = entityForm.fieldConfig;
    this.volume = _.find(this.fieldConfig, { name: 'volume' }) as FormSelectConfig;
    this.fs_type_list = _.find(this.fieldConfig, { name: 'fs_type' }) as FormRadioConfig;
    this.msdosfs_locale = _.find(this.fieldConfig, { name: 'msdosfs_locale' }) as FormSelectConfig;
    this.fs_type = entityForm.formGroup.controls['fs_type'] as FormControl;

    this.ws.call('pool.import_disk_msdosfs_locales').pipe(untilDestroyed(this)).subscribe((locales) => {
      locales.forEach((locale) => {
        this.msdosfs_locale.options.push({ label: locale, value: locale });
      });
    }, (res) => {
      this.dialogService.errorReport(this.translate.instant('Error getting locales'), res.message, res.stack);
      this.initialized = true;
    });

    this.fs_type.valueChanges.pipe(untilDestroyed(this)).subscribe((value: string) => {
      if (value === 'msdosfs') {
        this.msdosfs_locale['isHidden'] = false;
      } else {
        this.msdosfs_locale['isHidden'] = true;
      }
    });

    entityForm.formGroup.controls['volume'].valueChanges.pipe(untilDestroyed(this)).subscribe((res: string) => {
      this.ws.call('pool.import_disk_autodetect_fs_type', [res]).pipe(untilDestroyed(this)).subscribe((res) => {
        // If ws call fails to return type, no type is selected; otherwise, type is autoselected.
        for (const option of this.fs_type_list.options) {
          if (res === option.value) {
            this.fs_type.setValue(option.value);
          }
        }
      });
    });

    this.makeList();

    // Listen for disks being added/removed
    this.core.register({ observerClass: this, eventName: 'DisksChanged' }).pipe(untilDestroyed(this)).subscribe(() => {
      this.makeList();
    });
  }

  makeList(): void {
    this.volume.options = [];
    this.ws.call('disk.get_unused', [true]).pipe(untilDestroyed(this)).subscribe((data) => {
      data.forEach((disk) => {
        if (disk.partitions) {
          disk.partitions.forEach((partition) => {
            this.volume.options.push(
              {
                label: partition.path,
                value: partition.path,
              },
            );
          });
        }
      });
      this.initialized = true;
    }, (res) => {
      this.dialogService.errorReport(this.translate.instant('Error getting disk data'), res.message, res.stack);
      this.initialized = true;
    });
  }

  customSubmit(payload: any): void {
    this.custActions = [];
    const fs_options: Record<string, unknown> = {};
    if (payload.fs_type === 'msdosfs' && payload.msdosfs_locale) {
      fs_options['locale'] = payload.msdosfs_locale;
    }
    this.dialogRef = this.dialog.open(EntityJobComponent, { data: { title: this.translate.instant('Importing Disk') } });
    this.dialogRef.componentInstance.setDescription(this.translate.instant('Importing Disk...'));
    this.dialogRef.componentInstance.setCall('pool.import_disk', [payload.volume, payload.fs_type, fs_options, payload.dst_path]);
    this.dialogRef.componentInstance.submit();
    this.dialogRef.componentInstance.success.pipe(untilDestroyed(this)).subscribe((job_res: Job<any>) => {
      this.dialogRef.close();
      this.entityForm.success = true;
      this.job.showLogs(job_res, this.translate.instant('Disk Imported: Log Summary'), this.translate.instant('Close'));
      this.custActions = [
        {
          id: 'view_import_log',
          name: 'View Import Log',
          function: () => {
            this.job.showLogs(job_res, this.translate.instant('Logs'), this.translate.instant('Close'));
          },
        },
      ];
    });
    this.dialogRef.componentInstance.aborted.pipe(untilDestroyed(this)).subscribe((job) => {
      this.dialogRef.close();
      this.entityForm.success = false;
      this.job.showLogs(job, this.translate.instant('Disk Import Aborted: Log Summary'), this.translate.instant('Close'));
      this.custActions = [
        {
          id: 'view_import_log',
          name: 'View Import Log',
          function: () => {
            this.job.showLogs(job, this.translate.instant('Logs'), this.translate.instant('Close'));
          },
        },
      ];
    });
    this.dialogRef.componentInstance.failure.pipe(untilDestroyed(this)).subscribe((err) => {
      new EntityUtils().handleWSError(this.entityForm, err);
    });
  }

  ngOnDestroy(): void {
    this.core.unregister({ observerClass: this });
  }
}
