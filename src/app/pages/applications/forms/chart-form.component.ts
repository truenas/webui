import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { chartsTrain, latestVersion } from 'app/constants/catalog.constants';
import * as _ from 'lodash';
import { Subscription } from 'rxjs';
import { DialogService } from '../../../services/index';
import { ApplicationsService } from '../applications.service';
import { FieldConfig } from '../../common/entity/entity-form/models/field-config.interface';
import { FieldSet } from '../../common/entity/entity-form/models/fieldset.interface';
import { ModalService } from '../../../services/modal.service';
import { EntityJobComponent } from '../../common/entity/entity-job/entity-job.component';
import { CommonUtils } from 'app/core/classes/common-utils';
import helptext from '../../../helptext/apps/apps';
import { EntityUtils } from '../../common/entity/utils';
import { FormConfiguration } from 'app/interfaces/entity-form.interface';

@Component({
  selector: 'chart-form',
  template: '<entity-form [conf]="this"></entity-form>',
})
export class ChartFormComponent implements FormConfiguration {
  queryCall: 'chart.release.query' = 'chart.release.query';
  queryCallOption: any[];
  customFilter: any[];
  addCall: 'chart.release.create' = 'chart.release.create';
  editCall: 'chart.release.update' = 'chart.release.update';
  isEntity = true;
  protected utils: CommonUtils;

  title: string;
  private name: string;
  private getRow = new Subscription();
  private rowName: string;
  private dialogRef: any;
  fieldConfig: FieldConfig[];
  fieldSets: FieldSet[] = [];
  private catalogApp: any;
  private entityUtils = new EntityUtils();

  constructor(private mdDialog: MatDialog, private dialogService: DialogService,
    private modalService: ModalService, private appService: ApplicationsService) {
    this.getRow = this.modalService.getRow$.subscribe((rowName: string) => {
      this.rowName = rowName;
      this.customFilter = [[['id', '=', rowName]], { extra: { include_chart_schema: true } }];
      this.getRow.unsubscribe();
    });
    this.utils = new CommonUtils();
  }

  setTitle(title: string) {
    this.title = title;
  }

  parseSchema(catalogApp: any) {
    try {
      this.catalogApp = catalogApp;
      this.title = this.catalogApp.name;

      this.fieldSets = [
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
      this.catalogApp.schema.groups.forEach((group: any) => {
        this.fieldSets.push({
          name: group.name,
          label: true,
          config: [],
          colspan: 2,
        });
      });
      this.catalogApp.schema.questions.forEach((question: any) => {
        const fieldSet = this.fieldSets.find((fieldSet: any) => fieldSet.name == question.group);
        if (fieldSet) {
          const fieldConfigs = this.entityUtils.parseSchemaFieldConfig(question);

          const imageConfig = _.find(fieldConfigs, { name: 'image' });
          if (imageConfig) {
            const repositoryConfig = _.find(imageConfig.subFields, { name: 'repository' });
            if (repositoryConfig) {
              repositoryConfig.readonly = true;
            }
          }

          fieldSet.config = fieldSet.config.concat(fieldConfigs);
        }
      });

      this.fieldSets = this.fieldSets.filter((fieldSet) => fieldSet.config.length > 0);
    } catch (error) {
      return this.dialogService.errorReport(helptext.chartForm.parseError.title, helptext.chartForm.parseError.message);
    }
  }

  resourceTransformIncomingRestData(data: any) {
    const chartSchema = {
      name: data.chart_metadata.name,
      catalog: {
        id: null as any,
        label: data.catalog,
      },
      schema: data.chart_schema.schema,
    };

    this.parseSchema(chartSchema);
    this.name = data.name;

    data.config['release_name'] = data.name;
    data.config['changed_schema'] = true;

    return data.config;
  }

  customSubmit(data: any) {
    const payload = [];
    payload.push({
      catalog: this.catalogApp.catalog.id,
      item: this.catalogApp.name,
      release_name: data.release_name,
      train: chartsTrain,
      version: latestVersion,
      values: data,
    });

    if (this.rowName) {
      delete payload[0].catalog;
      delete payload[0].item;
      delete payload[0].release_name;
      delete payload[0].train;
      delete payload[0].version;
      payload.unshift(this.name);
    }

    this.dialogRef = this.mdDialog.open(EntityJobComponent, {
      data: {
        title: (
          helptext.installing),
      },
      disableClose: true,
    });
    this.dialogRef.componentInstance.setCall(this.editCall, payload);
    this.dialogRef.componentInstance.submit();
    this.dialogRef.componentInstance.success.subscribe(() => {
      this.dialogService.closeAllDialogs();
      this.modalService.close('slide-in-form');
      this.modalService.refreshTable();
    });
  }
}
