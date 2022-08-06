import { ChangeDetectionStrategy, Component, OnDestroy } from '@angular/core';
import { FormBuilder, UntypedFormControl, Validators } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import _ from 'lodash';
import { of, Subscription } from 'rxjs';
import { ixChartApp } from 'app/constants/catalog.constants';
import { DynamicFormSchemaType } from 'app/enums/dynamic-form-schema-type.enum';
import helptext from 'app/helptext/apps/apps';
import { CatalogApp } from 'app/interfaces/catalog.interface';
import {
  ChartFormValue,
  ChartFormValues,
  ChartRelease, ChartReleaseCreate, ChartSchema, ChartSchemaNode,
} from 'app/interfaces/chart-release.interface';
import { AddListItemEvent, DeleteListItemEvent, DynamicFormSchema } from 'app/interfaces/dynamic-form-schema.interface';
import { EntityJobComponent } from 'app/modules/entity/entity-job/entity-job.component';
import { EntityUtils } from 'app/modules/entity/utils';
import { CustomUntypedFormField } from 'app/modules/ix-forms/components/ix-dynamic-form/classes/custom-untyped-form-field';
import { DialogService } from 'app/services';
import { AppSchemaService } from 'app/services/app-schema.service';
import { IxSlideInService } from 'app/services/ix-slide-in.service';

@UntilDestroy()
@Component({
  templateUrl: './chart-form.component.html',
  styleUrls: ['./chart-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChartFormComponent implements OnDestroy {
  title: string;
  config: { [key: string]: ChartFormValue };
  catalogApp: CatalogApp;
  selectedVersionKey: string;

  isLoading = false;
  isNew = true;
  dynamicSection: DynamicFormSchema[] = [];
  dialogRef: MatDialogRef<EntityJobComponent>;
  subscription = new Subscription();

  form = this.formBuilder.group<ChartFormValues>({
    release_name: '',
  });

  readonly helptext = helptext;

  constructor(
    private formBuilder: FormBuilder,
    private slideInService: IxSlideInService,
    private dialogService: DialogService,
    private appSchemaService: AppSchemaService,
    private mdDialog: MatDialog,
  ) {}

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  setTitle(title: string): void {
    this.title = title;
  }

  setChartEdit(chart: ChartRelease): void {
    this.isNew = false;
    this.title = chart.name;
    this.config = chart.config;
    this.config.release_name = chart.id;

    this.form.addControl('release_name', new UntypedFormControl(this.title, [Validators.required]));

    this.dynamicSection.push({
      name: 'Application name',
      description: '',
      schema: [
        {
          controlName: 'release_name',
          type: DynamicFormSchemaType.Input,
          title: helptext.chartForm.release_name.placeholder,
          required: true,
          editable: false,
        },
      ],
    });

    this.buildDynamicForm(chart.chart_schema.schema);
  }

  setChartCreate(catalogApp: CatalogApp): void {
    this.catalogApp = catalogApp;
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

    if (!this.selectedVersionKey) {
      this.selectedVersionKey = versionKeys[0];
    }

    this.form.addControl('release_name', new UntypedFormControl('', [Validators.required]));
    this.form.addControl('version', new UntypedFormControl(this.selectedVersionKey, [Validators.required]));

    this.dynamicSection.push({
      name: 'Application name',
      description: '',
      schema: [
        {
          controlName: 'release_name',
          type: DynamicFormSchemaType.Input,
          title: helptext.chartForm.release_name.placeholder,
          required: true,
        },
        {
          controlName: 'version',
          type: DynamicFormSchemaType.Select,
          title: helptext.chartWizard.nameGroup.version,
          required: true,
          options: of(versionKeys.map((version) => ({ value: version, label: version }))),
          hidden: hideVersion,
        },
      ],
    });

    this.buildDynamicForm(catalogApp.schema);
  }

  buildDynamicForm(schema: ChartSchema['schema']): void {
    try {
      schema.groups.forEach((group) => {
        this.dynamicSection.push({ ...group, schema: [] });
      });
      schema.questions.forEach((question) => {
        if (this.dynamicSection.find((section) => section.name === question.group)) {
          this.addFormControls(question);
          this.addFormSchema(question, question.group);
        }
      });
      this.dynamicSection = this.dynamicSection.filter((section) => section.schema.length > 0);
      if (!this.isNew) {
        this.form.patchValue(this.config);
      }
    } catch (error: unknown) {
      this.dialogService.errorReport(helptext.chartForm.parseError.title, helptext.chartForm.parseError.message);
    }
  }

  addFormControls(chartSchemaNode: ChartSchemaNode): void {
    this.subscription.add(
      this.appSchemaService.addFormControls(
        chartSchemaNode,
        this.form,
        this.config,
        this.isNew,
        false,
      ),
    );
  }

  addFormSchema(chartSchemaNode: ChartSchemaNode, group: string): void {
    this.dynamicSection.forEach((section) => {
      if (section.name === group) {
        section.schema = section.schema.concat(
          this.appSchemaService.transformNode(chartSchemaNode, this.isNew, false),
        );
      }
    });
  }

  addItem(event: AddListItemEvent): void {
    this.appSchemaService.addFormListItem(event, this.isNew, false);
  }

  deleteItem(event: DeleteListItemEvent): void {
    this.appSchemaService.deleteFormListItem(event);
  }

  getFieldsHiddenOnForm(data: any, path = '', fieldsTobeDeleted: string[] = []): string[] {
    if (path) {
      if ((this.form.get(path) as CustomUntypedFormField).hidden) {
        fieldsTobeDeleted.push(path);
        return fieldsTobeDeleted;
      }
    }
    if (_.isPlainObject(data)) {
      for (const key in data) {
        fieldsTobeDeleted.concat(this.getFieldsHiddenOnForm(data[key], path ? path + '.' + key : key, fieldsTobeDeleted));
      }
      return fieldsTobeDeleted;
    }
  }

  cleanData(data: ChartFormValues): ChartFormValues {
    const fieldsTobeDeleted: string[] = this.getFieldsHiddenOnForm(data);
    for (const field of fieldsTobeDeleted) {
      const keys = field.split('.');
      let value: any = data;
      let configValue: any = this.config;
      for (let i = 0; i < keys.length - 1; i++) {
        value = value[keys[i]];
        configValue = configValue[keys[i]];
        if (value === undefined || value === null) {
          break;
        }
      }
      if (value !== undefined && value !== null) {
        if (this.isNew) {
          delete value[keys[keys.length - 1]];
        } else if (!configValue[keys[keys.length - 1]]) {
          delete value[keys[keys.length - 1]];
        }
      }
    }
    return data;
  }

  onSubmit(): void {
    const data = this.cleanData(
      this.appSchemaService.serializeFormValue(this.form.getRawValue()) as ChartFormValues,
    );

    this.dialogRef = this.mdDialog.open(EntityJobComponent, {
      data: {
        title: this.isNew ? helptext.installing : helptext.updating,
      },
    });

    if (this.isNew) {
      delete data.version;
      this.dialogRef.componentInstance.setCall('chart.release.create', [{
        catalog: this.catalogApp.catalog.id,
        item: this.catalogApp.name,
        release_name: data.release_name,
        train: this.catalogApp.catalog.train,
        version: this.selectedVersionKey,
        values: data,
      } as ChartReleaseCreate]);
    } else {
      delete data.release_name;
      this.dialogRef.componentInstance.setCall('chart.release.update', [this.title, { values: data }]);
    }

    this.dialogRef.componentInstance.submit();
    this.dialogRef.componentInstance.success.pipe(untilDestroyed(this)).subscribe(() => {
      this.dialogService.closeAllDialogs();
      this.slideInService.close();
    });

    this.dialogRef.componentInstance.failure.pipe(untilDestroyed(this)).subscribe((res) => {
      if (res.exc_info && res.exc_info.extra) {
        new EntityUtils().handleWsError(this, res);
      } else {
        this.dialogService.errorReport('Error', res.error, res.exception);
      }
    });
  }
}
