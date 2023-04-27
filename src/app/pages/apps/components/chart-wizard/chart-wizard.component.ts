import {
  AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit, TemplateRef, ViewChild,
} from '@angular/core';
import {
  FormBuilder, FormControl, Validators,
} from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import _ from 'lodash';
import {
  BehaviorSubject, of, Subject, Subscription,
} from 'rxjs';
import { filter, map, take } from 'rxjs/operators';
import { chartsTrain, ixChartApp, officialCatalog } from 'app/constants/catalog.constants';
import { DynamicFormSchemaType } from 'app/enums/dynamic-form-schema-type.enum';
import helptext from 'app/helptext/apps/apps';
import { CatalogApp } from 'app/interfaces/catalog.interface';
import {
  ChartFormValue,
  ChartFormValues,
  ChartRelease, ChartReleaseCreate, ChartSchema, ChartSchemaNode,
} from 'app/interfaces/chart-release.interface';
import { AddListItemEvent, DeleteListItemEvent, DynamicWizardSchema } from 'app/interfaces/dynamic-form-schema.interface';
import { Option } from 'app/interfaces/option.interface';
import { EntityJobComponent } from 'app/modules/entity/entity-job/entity-job.component';
import { CustomUntypedFormField } from 'app/modules/ix-dynamic-form/components/ix-dynamic-form/classes/custom-untyped-form-field';
import { FormErrorHandlerService } from 'app/modules/ix-forms/services/form-error-handler.service';
import { IxValidatorsService } from 'app/modules/ix-forms/services/ix-validators.service';
import { ApplicationsService } from 'app/pages/apps/services/applications.service';
import { AppLoaderService, DialogService } from 'app/services';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { LayoutService } from 'app/services/layout.service';
import { AppSchemaService } from 'app/services/schema/app-schema.service';

@UntilDestroy()
@Component({
  templateUrl: './chart-wizard.component.html',
  styleUrls: ['./chart-wizard.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChartWizardComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('pageHeader') pageHeader: TemplateRef<unknown>;
  appId: string;
  config: { [key: string]: ChartFormValue };
  catalogApp: CatalogApp;

  isLoading = true;
  appsLoaded = false;
  isNew = true;
  dynamicSection: DynamicWizardSchema[] = [];
  dialogRef: MatDialogRef<EntityJobComponent>;
  subscription = new Subscription();
  chartSchema: ChartSchema['schema'];

  form = this.formBuilder.group<ChartFormValues>({
    release_name: '',
  });

  searchControl = this.formBuilder.control('');
  searchOptions: Option[] = [];

  readonly helptext = helptext;

  private _pageTitle$ = new BehaviorSubject<string>('Loading');
  pageTitle$ = this._pageTitle$.asObservable().pipe(
    filter(Boolean),
    map((name) => {
      if (name === ixChartApp) {
        return `${this.titlePrefix} ${this.translate.instant('Custom App')}`;
      }
      return `${this.titlePrefix} ${name}`;
    }),
  );

  get titlePrefix(): string {
    return this.isNew ? this.translate.instant('Install') : this.translate.instant('Edit');
  }

  constructor(
    private formBuilder: FormBuilder,
    private errorHandler: ErrorHandlerService,
    private formErrorHandler: FormErrorHandlerService,
    private slideInService: IxSlideInService,
    private dialogService: DialogService,
    private appSchemaService: AppSchemaService,
    private mdDialog: MatDialog,
    private validatorsService: IxValidatorsService,
    private translate: TranslateService,
    private cdr: ChangeDetectorRef,
    private activatedRoute: ActivatedRoute,
    private appService: ApplicationsService,
    private layoutService: LayoutService,
    private loader: AppLoaderService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.listenForRouteChanges();

    this.searchControl.valueChanges.pipe(untilDestroyed(this)).subscribe((value) => {
      const option = this.searchOptions.find((opt) => opt.value === value)
        || this.searchOptions.find((opt) => opt.label.toLocaleLowerCase() === value.toLocaleLowerCase());

      if (option) {
        const path = option.value.toString().split('.');
        let nextElement: HTMLElement;
        path.forEach((id, idx) => {
          nextElement = document.getElementById(id);
          if (idx === path.length - 1) {
            nextElement?.scrollIntoView({ block: 'center' });
          }
        });
      }
    });
  }

  ngAfterViewInit(): void {
    this.layoutService.pageHeaderUpdater$.next(this.pageHeader);
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  onSectionClick(sectionName: string): void {
    document.getElementById(sectionName)?.scrollIntoView();
  }

  checkSectionInvalid(section: DynamicWizardSchema): boolean {
    return !section.schema.every((item) => !this.form.controls[item.controlName].invalid);
  }

  private listenForRouteChanges(): void {
    this.activatedRoute.params
      .pipe(
        map((params) => params.appId as string),
        filter(Boolean),
        untilDestroyed(this),
      )
      .subscribe((appId) => {
        this.appId = appId;
        this._pageTitle$.next(appId);
        this.isLoading = false;
        this.cdr.markForCheck();

        if (this.activatedRoute.routeConfig.path.includes('install')) {
          this.makeChartCreate();
        }

        if (this.activatedRoute.routeConfig.path.includes('edit')) {
          // TODO: Implement application editing logic
        }
      });
  }

  makeChartCreate(): void {
    this.isLoading = true;
    this.loader.open();
    this.appService
      .getCatalogItem(this.appId, officialCatalog, chartsTrain)
      .pipe(
        untilDestroyed(this),
      ).subscribe({
        next: (app) => {
          app.schema = app.versions[app.latest_version].schema;
          this.appsLoaded = true;
          this.cdr.detectChanges();
          this.setChartCreate(app);
          this.isLoading = false;
          this.loader.close();
          this.cdr.markForCheck();
        },
        error: () => {
          this.loader.close();
          this.router.navigate(['/apps', 'available']);
        },
      });
  }

  private setChartCreate(catalogApp: CatalogApp): void {
    this.catalogApp = catalogApp;
    this._pageTitle$.next(this.catalogApp.name);
    let hideVersion = false;
    if (this.catalogApp.name === ixChartApp) {
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
      help: '',
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
    if (this.catalogApp.name !== ixChartApp) {
      this.form.patchValue({ release_name: this.catalogApp.name });
    }
  }

  private setChartEdit(chart: ChartRelease): void {
    this.isNew = false;
    this.config = chart.config;
    this.config.release_name = chart.id;

    this.form.addControl('release_name', new FormControl(chart.name, [Validators.required]));

    this.dynamicSection.push({
      name: 'Application name',
      description: '',
      help: '',
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

  private buildDynamicForm(schema: ChartSchema['schema']): void {
    this.chartSchema = schema;
    try {
      schema.groups.forEach((group) => {
        this.dynamicSection.push({ ...group, help: group.description, schema: [] });
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
      this.updateSearchOption();
    } catch (error: unknown) {
      console.error(error);
      this.dialogService.error({
        title: helptext.chartForm.parseError.title,
        message: helptext.chartForm.parseError.message,
      });
    }
  }

  private addFormControls(chartSchemaNode: ChartSchemaNode): void {
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

  private addFormSchema(chartSchemaNode: ChartSchemaNode, group: string): void {
    this.dynamicSection.forEach((section) => {
      if (section.name === group) {
        section.schema = section.schema.concat(
          this.appSchemaService.transformNode(chartSchemaNode, this.isNew, false),
        );
      }
    });
  }

  updateSearchOption(): void {
    this.searchOptions = this.appSchemaService.getSearchOptions(this.dynamicSection, this.form.value);
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
    this.dialogRef.componentInstance.showCloseButton = false;

    if (this.isNew) {
      const version = data.version;
      delete data.version;
      this.dialogRef.componentInstance.setCall('chart.release.create', [{
        catalog: officialCatalog,
        item: this.catalogApp.name,
        release_name: data.release_name,
        train: chartsTrain,
        version,
        values: data,
      } as ChartReleaseCreate]);
    } else {
      delete data.release_name;
      this.dialogRef.componentInstance.setCall('chart.release.update', [data.release_name, { values: data }]);
    }

    this.dialogRef.componentInstance.submit();
    this.dialogRef.componentInstance.success.pipe(untilDestroyed(this)).subscribe(() => this.onSuccess());

    this.dialogRef.componentInstance.failure.pipe(untilDestroyed(this)).subscribe((failedJob) => {
      this.dialogRef.close();
      this.formErrorHandler.handleWsFormError(failedJob, this.form);
    });
  }

  onSuccess(): void {
    this.dialogService.closeAllDialogs();
    this.slideInService.close();
    this.router.navigate(['/apps/installed']);
  }
}
