import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
} from '@angular/core';
import {
  FormBuilder, FormControl, ReactiveFormsModule, Validators,
} from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  isArray, isPlainObject, unset,
} from 'lodash-es';
import {
  BehaviorSubject, Observable, of, Subject, Subscription, timer,
} from 'rxjs';
import {
  debounceTime,
  distinctUntilChanged,
  filter, map, take, tap,
} from 'rxjs/operators';
import { customApp } from 'app/constants/catalog.constants';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { DynamicFormSchemaType } from 'app/enums/dynamic-form-schema-type.enum';
import { Role } from 'app/enums/role.enum';
import { helptextApps } from 'app/helptext/apps/apps';
import { AppDetailsRouteParams } from 'app/interfaces/app-details-route-params.interface';
import {
  ChartFormValue,
  ChartFormValues,
  App,
  AppCreate,
  ChartSchema,
  ChartSchemaNode,
} from 'app/interfaces/app.interface';
import { CatalogApp } from 'app/interfaces/catalog.interface';
import {
  AddListItemEvent,
  DeleteListItemEvent,
  DynamicWizardSchema,
} from 'app/interfaces/dynamic-form-schema.interface';
import { Job } from 'app/interfaces/job.interface';
import { Option } from 'app/interfaces/option.interface';
import { WebSocketError } from 'app/interfaces/websocket-error.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { CustomUntypedFormField } from 'app/modules/forms/ix-dynamic-form/components/ix-dynamic-form/classes/custom-untyped-form-field';
import {
  IxDynamicWizardComponent,
} from 'app/modules/forms/ix-dynamic-form/components/ix-dynamic-wizard/ix-dynamic-wizard.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { ReadOnlyComponent } from 'app/modules/forms/ix-forms/components/readonly-badge/readonly-badge.component';
import { IxValidatorsService } from 'app/modules/forms/ix-forms/services/ix-validators.service';
import { forbiddenAsyncValues, forbiddenValuesError } from 'app/modules/forms/ix-forms/validators/forbidden-values-validation/forbidden-values-validation';
import { iconMarker } from 'app/modules/ix-icon/icon-marker.util';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { DockerHubRateInfoDialogComponent } from 'app/pages/apps/components/dockerhub-rate-limit-info-dialog/dockerhub-rate-limit-info-dialog.component';
import { AppMetadataCardComponent } from 'app/pages/apps/components/installed-apps/app-metadata-card/app-metadata-card.component';
import { ApplicationsService } from 'app/pages/apps/services/applications.service';
import { DockerStore } from 'app/pages/apps/store/docker.store';
import { AuthService } from 'app/services/auth/auth.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { AppSchemaService } from 'app/services/schema/app-schema.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  selector: 'ix-app-wizard',
  templateUrl: './app-wizard.component.html',
  styleUrls: ['./app-wizard.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    PageHeaderComponent,
    ReadOnlyComponent,
    IxInputComponent,
    AppMetadataCardComponent,
    MatButton,
    RequiresRolesDirective,
    AsyncPipe,
    TranslateModule,
    TestDirective,
    ReactiveFormsModule,
    IxIconComponent,
    IxDynamicWizardComponent,
  ],
})
export class AppWizardComponent implements OnInit, OnDestroy {
  appId: string;
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

  forbiddenAppNames$ = this.appService.getAllApps().pipe(map((apps) => apps.map((app) => app.name)));

  form = this.formBuilder.group<ChartFormValues>({
    release_name: '',
  });

  searchControl = this.formBuilder.control('');
  searchOptions: Option[] = [];

  readonly helptext = helptextApps;
  readonly iconMarker = iconMarker;

  private _pageTitle$ = new BehaviorSubject<string>('...');
  pageTitle$ = this._pageTitle$.asObservable().pipe(
    filter(Boolean),
    map((name) => {
      if (name?.toLocaleLowerCase() === customApp?.toLocaleLowerCase()) {
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

  get hasRequiredRoles(): Observable<boolean> {
    return this.authService.hasRole(this.requiredRoles);
  }

  constructor(
    private formBuilder: FormBuilder,
    private dialogService: DialogService,
    private appSchemaService: AppSchemaService,
    private validatorsService: IxValidatorsService,
    private translate: TranslateService,
    private cdr: ChangeDetectorRef,
    private activatedRoute: ActivatedRoute,
    private appService: ApplicationsService,
    private loader: AppLoaderService,
    private router: Router,
    private errorHandler: ErrorHandlerService,
    private dockerStore: DockerStore,
    private ws: WebSocketService,
    private authService: AuthService,
    private matDialog: MatDialog,
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
      .getCatalogAppDetails(this.appId, this.train)
      .pipe(this.loader.withLoader(), untilDestroyed(this))
      .subscribe({
        next: (app) => {
          this.setAppForCreation({
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
    if (isPlainObject(data)) {
      Object.keys(data).forEach((key) => {
        this.getFieldsHiddenOnForm((data as Record<string, unknown>)[key], deleteField$, path ? path + '.' + key : key);
      });
    }
    if (isArray(data)) {
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
        unset(data, keys);
      },
      complete: () => this.saveData(data),
    });

    this.getFieldsHiddenOnForm(data, deleteField$);
    deleteField$.complete();
  }

  saveData(data: ChartFormValues): void {
    let job$: Observable<Job<App>>;

    if (this.isNew) {
      const version = data.version;
      delete data.version;
      job$ = this.ws.job('app.create', [
        {
          values: data,
          catalog_app: this.catalogApp.name,
          app_name: data.release_name,
          train: this.train,
          version,
        } as AppCreate,
      ]);
    } else {
      delete data.release_name;
      job$ = this.ws.job('app.update', [
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
    this.router.navigate(['/apps/installed', this.train, this.appId]);
  }

  private listenForRouteChanges(): void {
    this.activatedRoute.parent.params
      .pipe(
        filter((params: AppDetailsRouteParams) => !!params.appId && !!params.train),
        untilDestroyed(this),
      )
      .subscribe(({ train, appId }) => {
        this.appId = appId;
        this.train = train;
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
      .getApp(this.appId)
      .pipe(this.loader.withLoader(), untilDestroyed(this))
      .subscribe({
        next: (releases) => {
          this.setAppForEdit(releases[0]);
          this.afterAppLoaded();
        },
        error: (error: WebSocketError) => this.afterAppLoadError(error),
      });
  }

  private setAppForCreation(catalogApp: CatalogApp): void {
    this.rootDynamicSection = [];
    this.catalogApp = catalogApp;
    this._pageTitle$.next(this.catalogApp.title || this.catalogApp.name);
    let hideVersion = false;
    if (this.catalogApp.name === customApp) {
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
        this.translate.instant(this.helptext.appWizard.nameGroup.nameValidationRules),
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
          title: helptextApps.appForm.release_name.placeholder,
          required: true,
          tooltip: helptextApps.appForm.release_name.tooltip,
        },
        {
          controlName: 'version',
          type: DynamicFormSchemaType.Select,
          title: helptextApps.appWizard.nameGroup.version,
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

    if (this.catalogApp.name !== customApp) {
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

  private setAppForEdit(app: App): void {
    this.rootDynamicSection = [];
    this.isNew = false;
    this.config = app.config;
    this.config.release_name = app.id;

    this._pageTitle$.next(app.metadata.title || app.name);

    this.form.addControl('release_name', new FormControl(app.name, [Validators.required]));

    this.rootDynamicSection.push({
      name: 'Application name',
      description: '',
      help: '',
      schema: [
        {
          controlName: 'release_name',
          type: DynamicFormSchemaType.Input,
          title: helptextApps.appForm.release_name.placeholder,
          required: true,
          editable: false,
        },
      ],
    });

    this.buildDynamicForm(app.version_details.schema);
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
        title: helptextApps.appForm.parseError.title,
        message: helptextApps.appForm.parseError.message,
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
    this.dockerStore.selectedPool$.pipe(
      take(1),
      untilDestroyed(this),
    ).subscribe({
      next: (pool) => {
        if (!pool) {
          this.router.navigate(['/apps/available', this.train, this.appId]);
        }
      },
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
    this.ws.call('app.image.dockerhub_rate_limit').pipe(untilDestroyed(this)).subscribe((info) => {
      if (info.remaining_pull_limit < 5) {
        this.matDialog.open(DockerHubRateInfoDialogComponent, {
          data: info,
        });
      }
    });
  }
}
