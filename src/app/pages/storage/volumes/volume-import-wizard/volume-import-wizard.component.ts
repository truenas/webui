import { Component } from '@angular/core';
import { FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import {
  UntilDestroy, untilDestroyed,
} from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import * as _ from 'lodash';
import { filter, tap } from 'rxjs/operators';
import helptext from 'app/helptext/storage/volumes/volume-import-wizard';
import { WizardConfiguration } from 'app/interfaces/entity-wizard.interface';
import { Job } from 'app/interfaces/job.interface';
import { PoolFindResult } from 'app/interfaces/pool-import.interface';
import { FormSelectConfig } from 'app/pages/common/entity/entity-form/models/field-config.interface';
import { Wizard } from 'app/pages/common/entity/entity-form/models/wizard.interface';
import { EntityJobComponent } from 'app/pages/common/entity/entity-job/entity-job.component';
import { EntityWizardComponent } from 'app/pages/common/entity/entity-wizard/entity-wizard.component';
import { EntityUtils } from 'app/pages/common/entity/utils';
import { WebSocketService, DialogService, AppLoaderService } from 'app/services';
import { ModalService } from 'app/services/modal.service';

@UntilDestroy()
@Component({
  selector: 'app-volumeimport-wizard',
  template: '<entity-wizard [conf]="this"></entity-wizard>',
})
export class VolumeImportWizardComponent implements WizardConfiguration {
  summary: Record<string, unknown> = {};
  isLinear = true;
  summaryTitle = 'Pool Import Summary';
  saveSubmitText = this.translate.instant('Import');
  entityWizard: EntityWizardComponent;
  title: string = helptext.import_title;
  importablePools: PoolFindResult[] = [];

  wizardConfig: Wizard[] = [
    {
      label: helptext.import_label,
      fieldConfig: [
        {
          type: 'select',
          name: 'guid',
          placeholder: helptext.guid_placeholder,
          tooltip: helptext.guid_tooltip,
          options: [],
          validation: [Validators.required],
          required: true,
        },
      ],
    },
  ];

  protected pool: string;
  hideCancel = true;

  constructor(
    private router: Router,
    protected ws: WebSocketService,
    private loader: AppLoaderService,
    protected dialog: MatDialog,
    protected dialogService: DialogService,
    public modalService: ModalService,
    protected translate: TranslateService,
  ) {
  }

  getImportablePools(): void {
    const dialogRef = this.dialog.open(
      EntityJobComponent,
      { data: { title: helptext.find_pools_title }, disableClose: true },
    );
    dialogRef.componentInstance.setDescription(helptext.find_pools_msg);
    dialogRef.componentInstance.setCall('pool.import_find');
    dialogRef.componentInstance.submit();
    dialogRef.componentInstance.success.pipe(
      untilDestroyed(this),
    ).subscribe((poolFindResult: Job<PoolFindResult[]>) => {
      dialogRef.close(false);
      if (!poolFindResult?.result) {
        return;
      }
      this.importablePools = poolFindResult.result;
      const guidFc = _.find(this.wizardConfig[0].fieldConfig, { name: 'guid' }) as FormSelectConfig;
      guidFc.options = poolFindResult.result.map((pool) => {
        return { label: pool.name + ' | ' + pool.guid, value: pool.guid };
      });
    });
    dialogRef.componentInstance.failure.pipe(untilDestroyed(this)).subscribe((res) => {
      new EntityUtils().handleWSError(this.entityWizard, res, this.dialogService);
      dialogRef.close(false);
    });
  }

  preInit(): void {
    this.getImportablePools();
  }

  afterInit(entityWizard: EntityWizardComponent): void {
    this.entityWizard = entityWizard;

    const guidFc = _.find(this.wizardConfig[0].fieldConfig, { name: 'guid' }) as FormSelectConfig;
    const guidFg = entityWizard.formArray.get([0]).get('guid') as FormGroup;
    guidFg.valueChanges.pipe(untilDestroyed(this)).subscribe((res) => {
      const pool = _.find(guidFc.options, { value: res });
      this.summary[this.translate.instant('Pool to import')] = pool['label'];
      const selectedPoolIndex = this.importablePools.findIndex((p) => p.guid === pool.value);
      this.pool = this.importablePools[selectedPoolIndex].name;
    });
  }

  customSubmit(value: any): void {
    const dialogRef = this.dialog.open(
      EntityJobComponent,
      {
        data: { title: this.translate.instant('Importing Pool') },
        disableClose: true,
      },
    );
    dialogRef.componentInstance.setDescription(this.translate.instant('Importing Pool...'));
    dialogRef.componentInstance.setCall('pool.import_pool', [{ guid: value.guid }]);
    dialogRef.componentInstance.submit();
    dialogRef.componentInstance.success.pipe(untilDestroyed(this)).subscribe(() => {
      dialogRef.close(false);

      this.loader.open();
      this.ws.call('pool.dataset.query', [[['pool', '=', this.pool]]])
        .pipe(
          tap(() => {
            this.loader.close();
          }),
          untilDestroyed(this),
        ).subscribe((datasets) => {
          const hasLockedDataset = datasets.some((dataset) => dataset.encrypted && dataset.locked);
          if (!hasLockedDataset) {
            this.modalService.closeSlideIn();
            this.modalService.refreshTable();
            return;
          }
          this.dialogService.confirm({
            title: helptext.unlock_dataset_dialog_title,
            message: helptext.unlock_dataset_dialog_message,
            hideCheckBox: true,
            buttonMsg: helptext.unlock_dataset_dialog_button,
          }).pipe(
            tap(() => {
              this.modalService.closeSlideIn();
              this.modalService.refreshTable();
            }),
            filter(Boolean),
            untilDestroyed(this),
          ).subscribe(() => {
            this.router.navigate(['/storage', 'id', this.pool, 'dataset', 'unlock', this.pool]);
          });
        }, (err) => {
          this.modalService.closeSlideIn();
          this.modalService.refreshTable();
          new EntityUtils().handleWSError(this, err, this.dialogService);
        });
    });
    dialogRef.componentInstance.failure.pipe(untilDestroyed(this)).subscribe((res) => {
      dialogRef.close(false);
      this.errorReport(res);
    });
  }

  errorReport(res: any): void {
    if (res.reason && res.trace) {
      this.dialogService.errorReport(this.translate.instant('Error importing pool'), res.reason, res.trace.formatted);
    } else if (res.error && res.exception) {
      this.dialogService.errorReport(this.translate.instant('Error importing pool'), res.error, res.exception);
    } else {
      console.error(res);
    }
  }
}
