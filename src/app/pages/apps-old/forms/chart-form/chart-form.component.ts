import {
  ChangeDetectionStrategy, Component, Inject, OnDestroy, OnInit,
} from '@angular/core';
import {
  FormBuilder, FormControl, Validators,
} from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import _ from 'lodash';
import { of, Subject, Subscription } from 'rxjs';
import { take } from 'rxjs/operators';
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
import { Job } from 'app/interfaces/job.interface';
import { EntityJobComponent } from 'app/modules/entity/entity-job/entity-job.component';
import { CustomUntypedFormField } from 'app/modules/ix-dynamic-form/components/ix-dynamic-form/classes/custom-untyped-form-field';
import { IxSlideInRef } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in-ref';
import { SLIDE_IN_DATA } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in.token';
import { IxValidatorsService } from 'app/modules/ix-forms/services/ix-validators.service';
import { DialogService } from 'app/services';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { AppSchemaService } from 'app/services/schema/app-schema.service';

export interface SlideInDataChartForm { title?: string; releases?: ChartRelease[]; catalogApp?: CatalogApp }

@UntilDestroy()
@Component({
  templateUrl: './chart-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChartFormComponent implements OnInit, OnDestroy {
  title: string;
  config: { [key: string]: ChartFormValue };
  catalogApp: CatalogApp;
  chartSchema: ChartSchema['schema'];

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
    private slideInRef: IxSlideInRef<ChartFormComponent>,
    private dialogService: DialogService,
    private errorHandler: ErrorHandlerService,
    private appSchemaService: AppSchemaService,
    private mdDialog: MatDialog,
    private validatorsService: IxValidatorsService,
    private translate: TranslateService,
    @Inject(SLIDE_IN_DATA) private slideInData: SlideInDataChartForm,
  ) { }

  ngOnInit(): void {
    if (this.slideInData.catalogApp) {
      this.setChartCreate();
    }

    if (this.slideInData.title) {
      this.setTitle();
    }

    if (this.slideInData?.releases?.length) {
      this.setChartEdit();
    }
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  setTitle(): void {
    this.title = this.slideInData.title;
  }

  setChartEdit(): void {
    const chart = this.slideInData.releases[0];
    this.isNew = false;
    this.title = chart.name;
    this.config = chart.config;
    this.config.release_name = chart.id;

    this.form.addControl('release_name', new FormControl(null, [Validators.required]));
    this.form.controls.release_name.setValue(this.title);

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

  setChartCreate(): void {
    this.catalogApp = this.slideInData.catalogApp;
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

    this.form.addControl('version', new FormControl(versionKeys[0], [Validators.required]));
    this.form.addControl('release_name', new FormControl('', [Validators.required]));
    this.form.controls.release_name.setValidators(
      this.validatorsService.withMessage(
        Validators.pattern('^[a-z](?:[a-z0-9-]*[a-z0-9])?$'),
        this.translate.instant('Name must start with an alphabetic character and end with an alphanumeric character. Hyphen is allowed in the middle.'),
      ),
    );

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

    this.buildDynamicForm(this.catalogApp.schema);
    this.form.patchValue({ release_name: this.catalogApp.name });
  }

  buildDynamicForm(schema: ChartSchema['schema']): void {
    this.chartSchema = schema;
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
        this.config = this.appSchemaService.restoreKeysFromFormGroup(this.config, this.form);
        this.form.patchValue(this.config);
      }
    } catch (error: unknown) {
      console.error(error);
      this.dialogService.error({
        title: helptext.chartForm.parseError.title,
        message: helptext.chartForm.parseError.message,
      });
    }
  }

  addFormControls(chartSchemaNode: ChartSchemaNode): void {
    this.subscription.add(
      this.appSchemaService.addFormControls({
        chartSchemaNode,
        formGroup: this.form,
        config: this.config,
        isNew: this.isNew,
        isParentImmutable: false,
      }),
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
    this.appSchemaService.addFormListItem({
      event,
      isNew: this.isNew,
      isParentImmutable: false,
    });
  }

  deleteItem(event: DeleteListItemEvent): void {
    this.appSchemaService.deleteFormListItem(event);
  }

  getFieldsHiddenOnForm(
    data: unknown,
    deleteField$: Subject<string>,
    path = '',
  ): void {
    if (path) {
      // eslint-disable-next-line no-restricted-syntax
      const formField = (this.form.get(path) as CustomUntypedFormField);
      formField?.hidden$?.pipe(
        take(1),
        untilDestroyed(this),
      ).subscribe((hidden) => {
        if (hidden) {
          deleteField$.next(path);
        }
      });
    }
    if (_.isPlainObject(data)) {
      Object.keys(data).forEach((key) => {
        this.getFieldsHiddenOnForm((data as Record<string, unknown>)[key], deleteField$, path ? path + '.' + key : key);
      });
    }
    if (_.isArray(data)) {
      for (let i = 0; i < data.length; i++) {
        this.getFieldsHiddenOnForm(data[i], deleteField$, `${path}.${i}`);
      }
    }
  }

  onSubmit(): void {
    const data = this.appSchemaService.serializeFormValue(this.form.getRawValue(), this.chartSchema) as ChartFormValues;

    const deleteField$ = new Subject<string>();
    deleteField$.pipe(untilDestroyed(this)).subscribe({
      next: (fieldToBeDeleted) => {
        const keys = fieldToBeDeleted.split('.');
        _.unset(data, keys);
      },
      complete: () => {
        this.saveData(data);
      },
    });

    this.getFieldsHiddenOnForm(data, deleteField$);
    deleteField$.complete();
  }

  saveData(data: ChartFormValues): void {
    this.dialogRef = this.mdDialog.open(EntityJobComponent, {
      data: {
        title: this.isNew ? helptext.installing : helptext.updating,
      },
    });

    if (this.isNew) {
      const version = data.version;
      delete data.version;
      this.dialogRef.componentInstance.setCall('chart.release.create', [{
        catalog: this.catalogApp.catalog.id,
        item: this.catalogApp.name,
        release_name: data.release_name,
        train: this.catalogApp.catalog.train,
        version,
        values: data,
      } as ChartReleaseCreate]);
    } else {
      delete data.release_name;
      this.dialogRef.componentInstance.setCall('chart.release.update', [this.title, { values: data }]);
    }

    this.dialogRef.componentInstance.submit();
    this.dialogRef.componentInstance.success.pipe(untilDestroyed(this)).subscribe(() => this.onSuccess());

    this.dialogRef.componentInstance.failure.pipe(untilDestroyed(this)).subscribe((error) => this.onFailure(error));
  }

  onFailure(failedJob: Job): void {
    this.dialogService.error(this.errorHandler.parseJobError(failedJob));
  }

  onSuccess(): void {
    this.dialogService.closeAllDialogs();
    this.slideInRef.close(true);
  }
}
