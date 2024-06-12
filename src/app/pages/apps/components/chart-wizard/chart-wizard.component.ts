import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { FormBuilder, FormControl, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import _ from 'lodash';
import {
  BehaviorSubject, Observable, of, Subject, Subscription, timer,
} from 'rxjs';
import {
  debounceTime,
  distinctUntilChanged,
  filter, map, take, tap,
} from 'rxjs/operators';
import { ixChartApp } from 'app/constants/catalog.constants';
import { DynamicFormSchemaType } from 'app/enums/dynamic-form-schema-type.enum';
import { Role } from 'app/enums/role.enum';
import { helptextApps } from 'app/helptext/apps/apps';
import { AppDetailsRouteParams } from 'app/interfaces/app-details-route-params.interface';
import { CatalogApp } from 'app/interfaces/catalog.interface';
import {
  ChartFormValue,
  ChartFormValues,
  ChartRelease,
  ChartReleaseCreate,
  ChartSchema,
  ChartSchemaNode,
} from 'app/interfaces/chart-release.interface';
import {
  AddListItemEvent,
  DeleteListItemEvent,
  DynamicWizardSchema,
} from 'app/interfaces/dynamic-form-schema.interface';
import { Job } from 'app/interfaces/job.interface';
import { Option } from 'app/interfaces/option.interface';
import { WebSocketError } from 'app/interfaces/websocket-error.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { CustomUntypedFormField } from 'app/modules/ix-dynamic-form/components/ix-dynamic-form/classes/custom-untyped-form-field';
import { IxValidatorsService } from 'app/modules/ix-forms/services/ix-validators.service';
import { forbiddenAsyncValues, forbiddenValuesError } from 'app/modules/ix-forms/validators/forbidden-values-validation/forbidden-values-validation';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import { DockerHubRateInfoDialogComponent } from 'app/pages/apps/components/dockerhub-rate-limit-info-dialog/dockerhub-rate-limit-info-dialog.component';
import { ApplicationsService } from 'app/pages/apps/services/applications.service';
import { KubernetesStore } from 'app/pages/apps/store/kubernetes-store.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { AppSchemaService } from 'app/services/schema/app-schema.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  selector: 'ix-chart-wizard',
  templateUrl: './chart-wizard.component.html',
  styleUrls: ['./chart-wizard.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChartWizardComponent implements OnInit, OnDestroy {
  appId: string;
  catalog: string;
  train: string;
  config: Record<string, ChartFormValue>;
  catalogApp: CatalogApp;
  isLoading = true;
  appsLoaded = false;
  isNew = true;
  dynamicSection: DynamicWizardSchema[] = [];
  rootDynamicSection: DynamicWizardSchema[] = [];
  subscription = new Subscription();
  chartSchema: ChartSchema['schema'];

  forbiddenAppNames$ = this.appService.getAllChartReleases().pipe(map((apps) => apps.map((app) => app.name)));

  form = this.formBuilder.group<ChartFormValues>({
    release_name: '',
  });

  searchControl = this.formBuilder.control('');
  searchOptions: Option[] = [];

  readonly helptext = helptextApps;

  private _pageTitle$ = new BehaviorSubject<string>('...');
  pageTitle$ = this._pageTitle$.asObservable().pipe(
    filter(Boolean),
    map((name) => {
      if (name === ixChartApp) {
        return `${this.titlePrefix} ${this.translate.instant('Custom App')}`;
      }
      return `${this.titlePrefix} ${name}`;
    }),
  );

  protected readonly requiredRoles = [Role.AppsWrite];

  get titlePrefix(): string {
    return this.isNew ? this.translate.instant('Install') : this.translate.instant('Edit');
  }

  get showAppMetadata(): boolean {
    return Boolean(this.catalogApp?.app_metadata && this.form?.controls['show_metadata']?.value);
  }

  constructor(
    private formBuilder: FormBuilder,
    private dialogService: DialogService,
    private appSchemaService: AppSchemaService,
    private matDialog: MatDialog,
    private validatorsService: IxValidatorsService,
    private translate: TranslateService,
    private cdr: ChangeDetectorRef,
    private activatedRoute: ActivatedRoute,
    private appService: ApplicationsService,
    private loader: AppLoaderService,
    private router: Router,
    private errorHandler: ErrorHandlerService,
    private kubernetesStore: KubernetesStore,
    private ws: WebSocketService,
  ) {}

  ngOnInit(): void {
    this.getDockerHubRateLimitInfo();
    this.listenForRouteChanges();
    this.handleSearchControl();
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  onSectionClick(sectionName: string): void {
    const nextElement = document.getElementById(sectionName);

    nextElement?.scrollIntoView({ block: 'center' });
    nextElement.classList.add('highlighted');

    timer(999)
      .pipe(untilDestroyed(this))
      .subscribe(() => nextElement.classList.remove('highlighted'));
  }

  checkSectionInvalid(section: DynamicWizardSchema): boolean {
    return !section.schema.every((item) => !this.form.controls[item.controlName].invalid);
  }

  loadApplicationForCreation(): void {
    this.isNew = true;
    this.isLoading = true;
    this.appService
      .getCatalogItem(this.appId, this.catalog, this.train)
      // .getCatalogItem('plex', 'TESTLANG', 'charts')
      .pipe(this.loader.withLoader(), untilDestroyed(this))
      .subscribe({
        next: (app) => {
          this.setChartForCreation({
            ...app,
            schema: app.versions[app.latest_version].schema,
          });
          this.afterAppLoaded();
        },
        error: (error: WebSocketError) => this.afterAppLoadError(error),
      });
  }

  updateSearchOption(): void {
    this.searchOptions = this.appSchemaService.getSearchOptions(this.dynamicSection, this.form.value);
  }

  addItem(event: AddListItemEvent): void {
    this.appSchemaService.addFormListItem({
      event: {
        ...event,
        schema: event.schema.map((item) => ({ ...item, schema: { ...item.schema, immutable: false } })),
      },
      isNew: true,
      isParentImmutable: false,
    });
  }

  deleteItem(event: DeleteListItemEvent): void {
    this.appSchemaService.deleteFormListItem(event);
  }

  getFieldsHiddenOnForm(data: unknown, deleteField$: Subject<string>, path = ''): void {
    if (path) {
      // eslint-disable-next-line no-restricted-syntax
      const formField = this.form.get(path) as CustomUntypedFormField;
      formField?.hidden$?.pipe(take(1), untilDestroyed(this)).subscribe((hidden) => {
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
      complete: () => this.saveData(data),
    });

    this.getFieldsHiddenOnForm(data, deleteField$);
    deleteField$.complete();
  }

  saveData(data: ChartFormValues): void {
    let job$: Observable<Job<ChartRelease>>;

    if (this.isNew) {
      const version = data.version;
      delete data.version;
      job$ = this.ws.job('chart.release.create', [
        {
          catalog: this.catalog,
          item: this.catalogApp.name,
          release_name: data.release_name,
          train: this.train,
          version,
          values: data,
        } as ChartReleaseCreate,
      ]);
    } else {
      delete data.release_name;
      job$ = this.ws.job('chart.release.update', [
        this.config.release_name as string,
        { values: data },
      ]);
    }

    this.dialogService.jobDialog(job$, {
      title: this.isNew ? helptextApps.installing : helptextApps.updating,
    })
      .afterClosed()
      .pipe(
        this.errorHandler.catchError(),
        untilDestroyed(this),
      )
      .subscribe(() => this.onSuccess());
  }

  onSuccess(): void {
    this.dialogService.closeAllDialogs();
    this.router.navigate(['/apps/installed', this.catalog, this.train, this.appId]);
  }

  private listenForRouteChanges(): void {
    this.activatedRoute.parent.params
      .pipe(
        filter((params: AppDetailsRouteParams) => !!params.appId && !!params.catalog && !!params.train),
        untilDestroyed(this),
      )
      .subscribe(({ train, catalog, appId }) => {
        this.appId = appId;
        this.train = train;
        this.catalog = catalog;
        this.isLoading = false;
        this.cdr.markForCheck();

        if (this.activatedRoute.routeConfig.path.endsWith('install')) {
          this.loadApplicationForCreation();
        }

        if (this.activatedRoute.routeConfig.path.endsWith('edit')) {
          this.loadApplicationForEdit();
        }
      });
  }

  private loadApplicationForEdit(): void {
    this.isNew = false;
    this.isLoading = true;
    this.appService
      .getChartRelease(this.appId)
      .pipe(this.loader.withLoader(), untilDestroyed(this))
      .subscribe({
        next: (releases) => {
          this.setChartForEdit(releases[0]);
          this.afterAppLoaded();
        },
        error: (error: WebSocketError) => this.afterAppLoadError(error),
      });
  }

  private setChartForCreation(catalogApp: CatalogApp): void {
    this.rootDynamicSection = [];
    this.catalogApp = catalogApp;
    this._pageTitle$.next(this.catalogApp.title || this.catalogApp.name);
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

    this.form.addControl('version', new FormControl(catalogApp.latest_version, [Validators.required]));
    this.form.addControl('release_name', new FormControl('', [Validators.required]));
    this.form.controls.release_name.setValidators(
      this.validatorsService.withMessage(
        Validators.pattern('^[a-z]([a-z0-9-]*[a-z0-9])?$'),
        this.translate.instant(this.helptext.chartWizard.nameGroup.nameValidationRules),
      ),
    );
    this.form.controls.release_name.setAsyncValidators(forbiddenAsyncValues(this.forbiddenAppNames$));
    this.form.controls.release_name.updateValueAndValidity();
    this.listenForVersionChanges();

    this.rootDynamicSection.push({
      name: 'Application name',
      description: '',
      help: '',
      schema: [
        {
          controlName: 'release_name',
          type: DynamicFormSchemaType.Input,
          title: helptextApps.chartForm.release_name.placeholder,
          required: true,
          tooltip: helptextApps.chartForm.release_name.tooltip,
        },
        {
          controlName: 'version',
          type: DynamicFormSchemaType.Select,
          title: helptextApps.chartWizard.nameGroup.version,
          required: true,
          options: of(versionKeys.map((version) => ({ value: version, label: version }))),
          hidden: hideVersion,
        },
      ],
    });

    this.buildDynamicForm(catalogApp.schema);

    if (catalogApp?.app_metadata) {
      const controlName = 'show_metadata';
      this.form.addControl(controlName, new FormControl(true, []));
      this.rootDynamicSection.push({
        name: 'Application Metadata',
        description: '',
        help: this.translate.instant('This information is provided by the catalog maintainer.'),
        schema: [
          {
            controlName,
            title: 'Show Metadata',
            type: DynamicFormSchemaType.Checkbox,
            hidden: true,
          },
        ],
      });
    }

    if (this.catalogApp.name !== ixChartApp) {
      this.form.patchValue({ release_name: this.catalogApp.name });
      this.forbiddenAppNames$.pipe(
        map((forbiddenNames) => {
          return forbiddenValuesError(forbiddenNames, false, this.form.controls.release_name);
        }),
        tap((errors) => {
          this.form.controls.release_name.setErrors(errors);
          this.form.controls.release_name.markAsDirty();
          this.form.controls.release_name.markAsTouched();
          this.cdr.markForCheck();
        }),
        untilDestroyed(this),
      ).subscribe();
    }
  }

  private setChartForEdit(chart: ChartRelease): void {
    this.rootDynamicSection = [];
    this.isNew = false;
    this.config = chart.config;
    this.config.release_name = chart.id;

    this._pageTitle$.next(chart.title || chart.name);

    this.form.addControl('release_name', new FormControl(chart.name, [Validators.required]));

    this.rootDynamicSection.push({
      name: 'Application name',
      description: '',
      help: '',
      schema: [
        {
          controlName: 'release_name',
          type: DynamicFormSchemaType.Input,
          title: helptextApps.chartForm.release_name.placeholder,
          required: true,
          editable: false,
        },
      ],
    });

    this.buildDynamicForm(chart.chart_schema.schema);
  }

  private afterAppLoaded(): void {
    this.appsLoaded = true;
    this.isLoading = false;
    this.checkIfPoolIsSet();
    this.cdr.markForCheck();
  }

  private afterAppLoadError(error: unknown): void {
    this.router.navigate(['/apps', 'available']).then(() => {
      this.errorHandler.showErrorModal(error);
    });
  }

  private buildDynamicForm(schema: ChartSchema['schema']): void {
    if (this.chartSchema?.questions) {
      this.chartSchema.questions.forEach((question) => this.form.removeControl(question.variable));
    }

    this.dynamicSection = [];
    this.dynamicSection.push(...this.rootDynamicSection);
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
      if (!this.isNew && this.config && this.form) {
        this.config = this.appSchemaService.restoreKeysFromFormGroup(this.config, this.form);
        this.form.patchValue(this.config);
      }
      this.updateSearchOption();
    } catch (error: unknown) {
      console.error(error);
      this.dialogService.error({
        title: helptextApps.chartForm.parseError.title,
        message: helptextApps.chartForm.parseError.message,
      });
    }
  }

  private addFormControls(chartSchemaNode: ChartSchemaNode): void {
    this.subscription.add(
      this.appSchemaService.getNewFormControlChangesSubscription({
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
        section.schema = section.schema.concat(this.appSchemaService.transformNode(chartSchemaNode, this.isNew, false));
      }
    });
  }

  private checkIfPoolIsSet(): void {
    this.kubernetesStore.selectedPool$.pipe(untilDestroyed(this)).subscribe((pool) => {
      if (!pool) {
        this.router.navigate(['/apps/available', this.catalog, this.train, this.appId]);
      }
    });
  }

  private handleSearchControl(): void {
    this.searchControl.valueChanges.pipe(
      debounceTime(100),
      distinctUntilChanged(),
      untilDestroyed(this),
    ).subscribe((value) => {
      const option = this.searchOptions.find((opt) => opt.value === value)
        || this.searchOptions.find((opt) => opt.label.toLocaleLowerCase() === value.toLocaleLowerCase());

      if (option) {
        const path = option.value.toString().split('.');
        path.forEach((id, idx) => {
          if (idx === path.length - 1) {
            this.onSectionClick(id);
          }
        });
      }
    });
  }

  private listenForVersionChanges(): void {
    this.form.controls.version?.valueChanges.pipe(filter(Boolean), untilDestroyed(this)).subscribe((version) => {
      this.catalogApp.schema = this.catalogApp.versions[version].schema;
      this.buildDynamicForm(this.catalogApp.schema);
    });
  }

  private getDockerHubRateLimitInfo(): void {
    this.ws.call('container.image.dockerhub_rate_limit').pipe(untilDestroyed(this)).subscribe((info) => {
      if (info.remaining_pull_limit < 5) {
        this.matDialog.open(DockerHubRateInfoDialogComponent);
      }
    });
  }
}
