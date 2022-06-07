import { Component, OnDestroy } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatDialogRef } from '@angular/material/dialog/dialog-ref';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Subject } from 'rxjs';
import { ixChartApp } from 'app/constants/catalog.constants';
import helptext from 'app/helptext/apps/apps';
import { CatalogApp } from 'app/interfaces/catalog.interface';
import { ChartReleaseCreate } from 'app/interfaces/chart-release.interface';
import { WizardConfiguration } from 'app/interfaces/entity-wizard.interface';
import { Wizard } from 'app/modules/entity/entity-form/models/wizard.interface';
import { EntityJobComponent } from 'app/modules/entity/entity-job/entity-job.component';
import { EntityWizardComponent } from 'app/modules/entity/entity-wizard/entity-wizard.component';
import { EntityUtils } from 'app/modules/entity/utils';
import { remapAppSubmitData } from 'app/pages/applications/utils/remap-app-submit-data.utils';
import { DialogService } from 'app/services/index';
import { ModalService } from 'app/services/modal.service';

@UntilDestroy()
@Component({
  selector: 'chart-add-wizard',
  template: '<entity-wizard [conf]="this"></entity-wizard>',
})

export class ChartWizardComponent implements OnDestroy, WizardConfiguration {
  protected addCall = 'chart.release.create' as const;
  summary: Record<string, unknown> = {};
  isAutoSummary = true;
  hideCancel = true;
  private title: string;
  private dialogRef: MatDialogRef<EntityJobComponent>;
  wizardConfig: Wizard[] = [];
  private catalogApp: CatalogApp;
  private entityWizard: EntityWizardComponent;
  private destroy$ = new Subject();
  private selectedVersionKey: string;
  isLinear = true;

  constructor(
    private mdDialog: MatDialog,
    private dialogService: DialogService,
    private modalService: ModalService,
  ) {}

  setTitle(title: string): void {
    this.title = title;
  }

  setCatalogApp(catalogApp: CatalogApp): void {
    this.catalogApp = catalogApp;
    this.parseSchema();
  }

  parseSchema(): void {
    try {
      this.title = this.catalogApp.name;
      let hideVersion = false;
      if (this.catalogApp.name === ixChartApp) {
        this.title = helptext.launch;
        hideVersion = true;
      }
      const versionKeys: string[] = [];
      Object.keys(this.catalogApp.versions).forEach((versionKey) => {
        if (this.catalogApp.versions[versionKey].healthy) {
          versionKeys.push(versionKey);
        }
      });

      const versionOptions = versionKeys.map((version) => ({
        value: version,
        label: version,
      }));

      if (!this.selectedVersionKey) {
        this.selectedVersionKey = versionKeys[0];
      }

      const selectedVersion = this.catalogApp.versions[this.selectedVersionKey];

      this.wizardConfig = [];
      this.wizardConfig.push({
        label: helptext.chartWizard.nameGroup.label,
        fieldConfig: [{
          type: 'input',
          name: 'release_name',
          placeholder: helptext.chartForm.release_name.placeholder,
          tooltip: helptext.chartForm.release_name.tooltip,
          required: true,
        },
        {
          type: 'select',
          name: 'version',
          placeholder: helptext.chartWizard.nameGroup.version,
          options: versionOptions,
          value: this.selectedVersionKey,
          required: true,
          isHidden: hideVersion,
        }],
      });

      selectedVersion.schema.groups.forEach((group) => {
        this.wizardConfig.push({
          label: group.name,
          fieldConfig: [],
        });
      });

      selectedVersion.schema.questions.forEach((question) => {
        const wizard = this.wizardConfig.find((wizard) => wizard.label === question.group);
        if (wizard) {
          const wizardFieldConfigs = new EntityUtils().parseSchemaFieldConfig(question);
          wizard.fieldConfig = wizard.fieldConfig.concat(wizardFieldConfigs);
        }
      });

      this.wizardConfig = this.wizardConfig.filter((wizard) => wizard.fieldConfig.length > 0);
      if (this.entityWizard) {
        this.entityWizard.resetFields();
        this.entityWizard.formArray.get([0]).get('version').valueChanges.pipe(untilDestroyed(this)).subscribe((value) => {
          this.selectedVersionKey = value;
          this.parseSchema();
        });
      }
    } catch (error: unknown) {
      console.error(error);
      this.dialogService.errorReport(helptext.chartForm.parseError.title, helptext.chartForm.parseError.message);
    }
  }

  afterInit(entityWizard: EntityWizardComponent): void {
    this.entityWizard = entityWizard;

    entityWizard.formArray.get([0]).get('version').valueChanges.pipe(untilDestroyed(this)).subscribe((value) => {
      this.selectedVersionKey = value;
      this.parseSchema();
    });
  }

  customSubmit(data: any): void {
    delete data.version;

    data = remapAppSubmitData(data);

    this.dialogRef = this.mdDialog.open(EntityJobComponent, {
      data: {
        title: helptext.installing,
      },
    });
    this.dialogRef.componentInstance.setCall(this.addCall, [{
      catalog: this.catalogApp.catalog.id,
      item: this.catalogApp.name,
      release_name: data.release_name,
      train: this.catalogApp.catalog.train,
      version: this.selectedVersionKey,
      values: data,
    } as ChartReleaseCreate]);
    this.dialogRef.componentInstance.submit();
    this.dialogRef.componentInstance.success.pipe(untilDestroyed(this)).subscribe(() => {
      this.dialogService.closeAllDialogs();
      this.modalService.closeSlideIn();
      this.modalService.refreshTable();
    });
    this.dialogRef.componentInstance.failure.pipe(untilDestroyed(this)).subscribe((res) => {
      if (res.exc_info && res.exc_info.extra) {
        new EntityUtils().handleWsError(this, res);
      } else {
        this.dialogService.errorReport('Error', res.error, res.exception);
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
