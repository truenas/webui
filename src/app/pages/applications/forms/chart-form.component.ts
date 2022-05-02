import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatDialogRef } from '@angular/material/dialog/dialog-ref';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import * as _ from 'lodash';
import { Subscription } from 'rxjs';
import helptext from 'app/helptext/apps/apps';
import { CatalogQueryParams } from 'app/interfaces/catalog.interface';
import { ChartRelease } from 'app/interfaces/chart-release.interface';
import { FormConfiguration } from 'app/interfaces/entity-form.interface';
import { EntityFormComponent } from 'app/modules/entity/entity-form/entity-form.component';
import { FieldConfig, FormDictConfig } from 'app/modules/entity/entity-form/models/field-config.interface';
import { FieldSet } from 'app/modules/entity/entity-form/models/fieldset.interface';
import { EntityJobComponent } from 'app/modules/entity/entity-job/entity-job.component';
import { EntityUtils } from 'app/modules/entity/utils';
import { remapAppSubmitData } from 'app/pages/applications/utils/remap-app-submit-data.utils';
import { DialogService } from 'app/services/index';
import { ModalService } from 'app/services/modal.service';
import { remapAppConfigData } from '../utils/remap-app-config-data.utils';

@UntilDestroy()
@Component({
  selector: 'chart-form',
  template: '<entity-form [conf]="this"></entity-form>',
})
export class ChartFormComponent implements FormConfiguration {
  queryCall = 'chart.release.query' as const;
  customFilter: CatalogQueryParams;
  addCall = 'chart.release.create' as const;
  editCall = 'chart.release.update' as const;
  isEntity = true;
  entityForm: EntityFormComponent;

  title: string;
  private name: string;
  private getRow = new Subscription();
  private rowName: string;
  private dialogRef: MatDialogRef<EntityJobComponent>;
  fieldConfig: FieldConfig[];
  fieldSets: FieldSet[] = [
    {
      name: helptext.chartForm.release_name.name,
      width: '100%',
      config: [
        {
          type: 'input',
          name: 'release_name',
          placeholder: helptext.chartForm.release_name.placeholder,
          tooltip: helptext.chartForm.release_name.tooltip,
          required: true,
          disabled: true,
          readonly: true,
        },
      ],
      colspan: 2,
    },
  ];
  private catalogApp: ChartRelease;
  private entityUtils = new EntityUtils();

  constructor(private mdDialog: MatDialog, private dialogService: DialogService,
    private modalService: ModalService) {
    this.getRow = this.modalService.getRow$.pipe(untilDestroyed(this)).subscribe((rowName: string) => {
      this.rowName = rowName;
      this.customFilter = [[['id', '=', rowName]], { extra: { include_chart_schema: true } }];
      this.getRow.unsubscribe();
    });
  }

  setTitle(title: string): void {
    this.title = title;
  }

  preInit(entityForm: EntityFormComponent): void {
    this.entityForm = entityForm;
  }

  parseSchema(catalogApp: ChartRelease): FieldSet[] {
    let fieldSets: FieldSet[] = [];
    try {
      this.catalogApp = catalogApp;
      this.title = this.catalogApp.name;

      this.catalogApp.chart_schema.schema.groups.forEach((group) => {
        fieldSets.push({
          name: group.name,
          label: true,
          config: [],
          colspan: 2,
        });
      });
      this.catalogApp.chart_schema.schema.questions.forEach((question) => {
        const fieldSet = fieldSets.find((fieldSet) => fieldSet.name === question.group);
        if (fieldSet) {
          const fieldConfigs = this.entityUtils.parseSchemaFieldConfig(question, this.entityForm.isNew);

          const imageConfig = _.find(fieldConfigs, { name: 'image' }) as FormDictConfig;
          if (imageConfig) {
            const repositoryConfig = _.find(imageConfig.subFields, { name: 'repository' });
            if (repositoryConfig) {
              repositoryConfig.readonly = true;
            }
          }

          fieldSet.config = fieldSet.config.concat(fieldConfigs);
        }
      });

      fieldSets = fieldSets.filter((fieldSet) => fieldSet.config.length > 0);
    } catch (error: unknown) {
      console.error(error);
      this.dialogService.errorReport(helptext.chartForm.parseError.title, helptext.chartForm.parseError.message);
    }

    return fieldSets;
  }

  resourceTransformIncomingRestData(data: ChartRelease): any {
    this.name = data.name;

    const extraFieldSets = this.parseSchema(data);
    let fieldConfigs: FieldConfig[] = [];
    extraFieldSets.forEach((fieldSet) => {
      fieldConfigs = fieldConfigs.concat(fieldSet.config);
    });
    const configData = remapAppConfigData(data.config, fieldConfigs);

    configData['release_name'] = data.name;
    configData['extra_fieldsets'] = extraFieldSets;

    return configData;
  }

  customSubmit(data: any): void {
    data = remapAppSubmitData(data);
    const payload = [];
    payload.push({
      values: data,
    });

    payload.unshift(this.name);

    this.dialogRef = this.mdDialog.open(EntityJobComponent, {
      data: {
        title: helptext.updating,
      },
    });
    this.dialogRef.componentInstance.setCall(this.editCall, payload);
    this.dialogRef.componentInstance.submit();
    this.dialogRef.componentInstance.success.pipe(untilDestroyed(this)).subscribe(() => {
      this.dialogService.closeAllDialogs();
      this.modalService.closeSlideIn();
      this.modalService.refreshTable();
    });
  }
}
