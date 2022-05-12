import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { FormBuilder } from '@ngneat/reactive-forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { of } from 'rxjs';
import { ixChartApp } from 'app/constants/catalog.constants';
import { DynamicFormSchemaType } from 'app/enums/dynamic-form-schema-type.enum';
import helptext from 'app/helptext/apps/apps';
import { CatalogApp } from 'app/interfaces/catalog.interface';
import {
  ChartRelease, ChartReleaseCreate, ChartSchema, ChartSchemaNode,
} from 'app/interfaces/chart-release.interface';
import { AddListItemEvent, DeleteListItemEvent, DynamicFormSchema } from 'app/interfaces/dynamic-form-schema.interface';
import { EntityJobComponent } from 'app/modules/entity/entity-job/entity-job.component';
import { EntityUtils } from 'app/modules/entity/utils';
import { DialogService } from 'app/services';
import { AppSchemaService } from 'app/services/app-schema.service';
import { IxSlideInService } from 'app/services/ix-slide-in.service';

interface ChartFormValues {
  release_name: string;
  version?: string;
  [key: string]: string | number | boolean | Record<string, unknown>;
}

@UntilDestroy()
@Component({
  templateUrl: './chart-form.component.html',
  styleUrls: ['./chart-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChartFormComponent {
  title: string;
  config: { [key: string]: any };
  catalogApp: CatalogApp;
  selectedVersionKey: string;

  isLoading = false;
  isNew = true;
  dynamicSection: DynamicFormSchema[] = [];
  dialogRef: MatDialogRef<EntityJobComponent>;

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

  setTitle(title: string): void {
    this.title = title;
  }

  setChartEdit(chart: ChartRelease): void {
    this.isNew = false;
    this.title = chart.name;
    this.config = chart.config;

    this.form.addControl('release_name', new FormControl(this.title, [Validators.required]));

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

  setChartCreate(chart: CatalogApp): void {
    this.catalogApp = chart;
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

    this.form.addControl('release_name', new FormControl('', [Validators.required]));
    this.form.addControl('version', new FormControl(this.selectedVersionKey, [Validators.required]));

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
          options: of(versionKeys.map((option) => ({ value: option, label: option }))),
          hidden: hideVersion,
        },
      ],
    });

    this.buildDynamicForm(chart.schema);
  }

  buildDynamicForm(schema: ChartSchema['schema']): void {
    try {
      schema.groups.forEach((group) => {
        this.dynamicSection.push({ ...group, schema: [] });
      });
      schema.questions.forEach((question) => {
        if (this.dynamicSection.find((schema) => schema.name === question.group)) {
          this.addFormControls(question);
          this.addFormSchema(question, question.group);
        }
      });
      if (!this.isNew) {
        this.form.patchValue(this.config);
      }
    } catch (error: unknown) {
      this.dialogService.errorReport(helptext.chartForm.parseError.title, helptext.chartForm.parseError.message);
    }
  }

  addFormControls(question: ChartSchemaNode): void {
    this.appSchemaService.addFormControls(question, this.form, this.config);
  }

  addFormSchema(chartSchemaNode: ChartSchemaNode, group: string): void {
    this.dynamicSection.forEach((section) => {
      if (section.name === group) {
        section.schema = section.schema.concat(
          this.appSchemaService.transformNode(chartSchemaNode),
        );
      }
    });
  }

  addItem(event: AddListItemEvent): void {
    this.appSchemaService.addFormListItem(event);
  }

  deleteItem(event: DeleteListItemEvent): void {
    this.appSchemaService.deleteFormListItem(event);
  }

  onSubmit(): void {
    const data = this.form.value;
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
