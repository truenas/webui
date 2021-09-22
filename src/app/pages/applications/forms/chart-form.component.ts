import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatDialogRef } from '@angular/material/dialog/dialog-ref';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import * as _ from 'lodash';
import { Subscription } from 'rxjs';
import { CommonUtils } from 'app/core/classes/common-utils';
import helptext from 'app/helptext/apps/apps';
import { CatalogQueryParams } from 'app/interfaces/catalog.interface';
import { ChartRelease } from 'app/interfaces/chart-release.interface';
import { FormConfiguration } from 'app/interfaces/entity-form.interface';
import { FieldConfig, FormDictConfig } from 'app/pages/common/entity/entity-form/models/field-config.interface';
import { FieldSet } from 'app/pages/common/entity/entity-form/models/fieldset.interface';
import { EntityJobComponent } from 'app/pages/common/entity/entity-job/entity-job.component';
import { EntityUtils } from 'app/pages/common/entity/utils';
import { DialogService } from 'app/services/index';
import { ModalService } from 'app/services/modal.service';
import { ApplicationsService } from '../applications.service';

@UntilDestroy()
@Component({
  selector: 'chart-form',
  template: '<entity-form [conf]="this"></entity-form>',
})
export class ChartFormComponent implements FormConfiguration {
  queryCall: 'chart.release.query' = 'chart.release.query';
  customFilter: CatalogQueryParams;
  addCall: 'chart.release.create' = 'chart.release.create';
  editCall: 'chart.release.update' = 'chart.release.update';
  isEntity = true;
  protected utils: CommonUtils;

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
    private modalService: ModalService, private appService: ApplicationsService) {
    this.getRow = this.modalService.getRow$.pipe(untilDestroyed(this)).subscribe((rowName: string) => {
      this.rowName = rowName;
      this.customFilter = [[['id', '=', rowName]], { extra: { include_chart_schema: true } }];
      this.getRow.unsubscribe();
    });
    this.utils = new CommonUtils();
  }

  setTitle(title: string): void {
    this.title = title;
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
        const fieldSet = fieldSets.find((fieldSet) => fieldSet.name == question.group);
        if (fieldSet) {
          const fieldConfigs = this.entityUtils.parseSchemaFieldConfig(question);

          const imageConfig: FormDictConfig = _.find(fieldConfigs, { name: 'image' });
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
    } catch (error) {
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
    const configData = new EntityUtils().remapAppConfigData(data.config, fieldConfigs);

    configData['release_name'] = data.name;
    configData['extra_fieldsets'] = extraFieldSets;

    return configData;
  }

  customSubmit(data: any): void {
    data = new EntityUtils().remapAppSubmitData(data);
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
      this.modalService.close('slide-in-form');
      this.modalService.refreshTable();
    });
  }
}
