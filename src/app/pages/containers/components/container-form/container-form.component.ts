import {
  ChangeDetectionStrategy, Component, computed, DestroyRef, OnInit, signal, inject,
} from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import {
  FormArray,
  FormControl,
  FormGroup,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  filter, map, Observable, of, take, tap,
} from 'rxjs';
import { slashRootNode } from 'app/constants/basic-root-nodes.constant';
import {
  ContainerCapabilitiesPolicy,
  containerTimeLabels,
  ContainerTime,
  ContainerRemote,
  ContainerType,
} from 'app/enums/container.enum';
import { Role } from 'app/enums/role.enum';
import { choicesToOptions } from 'app/helpers/operators/options.operators';
import { mapToOptions } from 'app/helpers/options.helper';
import { containersHelptext } from 'app/helptext/containers/containers';
import {
  Container,
  ContainerEnvVariablesFormGroup,
  CreateContainer,
  UpdateContainer,
} from 'app/interfaces/container.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxCheckboxComponent } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.component';
import { IxFieldsetComponent } from 'app/modules/forms/ix-forms/components/ix-fieldset/ix-fieldset.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { IxListItemComponent } from 'app/modules/forms/ix-forms/components/ix-list/ix-list-item/ix-list-item.component';
import { IxListComponent } from 'app/modules/forms/ix-forms/components/ix-list/ix-list.component';
import { IxSelectComponent } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.component';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { IxFormatterService } from 'app/modules/forms/ix-forms/services/ix-formatter.service';
import {
  forbiddenAsyncValues,
} from 'app/modules/forms/ix-forms/validators/forbidden-values-validation/forbidden-values-validation';
import { ModalHeaderComponent } from 'app/modules/slide-ins/components/modal-header/modal-header.component';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';
import {
  SelectImageDialog,
  ContainerImageWithId,
} from 'app/pages/containers/components/container-wizard/select-image-dialog/select-image-dialog.component';
import { ContainerConfigStore } from 'app/pages/containers/stores/container-config.store';
import { ContainersStore } from 'app/pages/containers/stores/containers.store';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

@Component({
  selector: 'ix-container-form',
  templateUrl: './container-form.component.html',
  styleUrls: ['./container-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    IxCheckboxComponent,
    IxFieldsetComponent,
    IxInputComponent,
    IxListComponent,
    IxListItemComponent,
    IxSelectComponent,
    MatButton,
    MatCard,
    MatCardContent,
    ModalHeaderComponent,
    ReactiveFormsModule,
    TestDirective,
    TranslateModule,
    FormActionsComponent,
  ],
  providers: [ContainerConfigStore],
  host: {
    '(window:beforeunload)': 'onBeforeUnload($event)',
  },
})
export class ContainerFormComponent implements OnInit {
  private api = inject(ApiService);
  private formBuilder = inject(NonNullableFormBuilder);
  private matDialog = inject(MatDialog);
  private formErrorHandler = inject(FormErrorHandlerService);
  private translate = inject(TranslateService);
  private snackbar = inject(SnackbarService);
  private dialogService = inject(DialogService);
  protected formatter = inject(IxFormatterService);
  private errorHandler = inject(ErrorHandlerService);
  slideInRef = inject<SlideInRef<Container | undefined, boolean>>(SlideInRef);
  private containersStore = inject(ContainersStore, { optional: true });
  private router = inject(Router);
  private containerConfigStore = inject(ContainerConfigStore);
  private destroyRef = inject(DestroyRef);

  protected readonly isLoading = signal<boolean>(false);
  protected readonly requiredRoles = [Role.ContainerWrite];

  protected readonly slashRootNode = [slashRootNode];

  protected readonly timeOptions$ = of(mapToOptions(containerTimeLabels, this.translate));

  protected readonly capabilitiesPolicyOptions$ = of([
    { label: this.translate.instant('Default'), value: ContainerCapabilitiesPolicy.Default },
    { label: this.translate.instant('Allow'), value: ContainerCapabilitiesPolicy.Allow },
    { label: this.translate.instant('Deny'), value: ContainerCapabilitiesPolicy.Deny },
  ]);

  protected readonly forbiddenNames$ = this.api.call('container.query', [
    [], { select: ['name'], order_by: ['name'] },
  ]).pipe(
    map((containers) => containers
      .map((container) => container.name)
      .filter((name) => name !== this.editingContainer?.name)),
  );

  protected isAdvancedMode = false;

  protected readonly isEditMode = signal<boolean>(false);
  protected editingContainer: Container | null = null;
  protected readonly title = computed(() => {
    if (this.isEditMode()) {
      return this.translate.instant('Edit Container: {name}', {
        name: this.editingContainer?.name || '',
      });
    }
    return this.translate.instant('Add Container');
  });

  protected readonly hasPreferredPool = computed(() => {
    const config = this.containerConfigStore.config();
    return Boolean(config?.preferred_pool);
  });

  // Observable for config changes (field initializer has injection context)
  private config$ = toObservable(this.containerConfigStore.config);

  poolOptions$ = this.api.call('container.pool_choices').pipe(
    choicesToOptions(),
    tap((options) => {
      if (options.length && !this.form.controls.pool.value && !this.isEditMode()) {
        this.form.controls.pool.setValue(`${options[0].value}`);
      }
    }),
  );

  protected readonly form = this.formBuilder.group({
    name: [
      '',
      [Validators.required, Validators.minLength(1), Validators.maxLength(200), Validators.pattern(/^[a-zA-Z0-9-]+$/)],
      [forbiddenAsyncValues(this.forbiddenNames$)],
    ],
    pool: [''],
    use_preferred_pool: [true],
    description: [''],
    autostart: [true],
    image: [''],
    cpuset: [''],
    time: [ContainerTime.Local],
    shutdown_timeout: [30, [Validators.min(5), Validators.max(300)]],
    init: [null as string | null],
    initdir: [null as string | null],
    inituser: [null as string | null],
    initgroup: [null as string | null],
    capabilities_policy: [ContainerCapabilitiesPolicy.Default],
    environment_variables: new FormArray<ContainerEnvVariablesFormGroup>([]),
    use_default_network: [true],
    usb_devices: [[] as string[]],
    disks: this.formBuilder.array<FormGroup<{
      source: FormControl<string>;
      destination?: FormControl<string>;
    }>>([]),
  });

  private hasSetupValidators = false;

  constructor() {
    this.editingContainer = this.slideInRef.getData();
  }

  onBeforeUnload(event: BeforeUnloadEvent): void {
    if (this.form.dirty) {
      event.preventDefault();
    }
  }

  ngOnInit(): void {
    // Initialize config store to load preferred pool settings
    this.containerConfigStore.initialize();

    // Setup form validators when config is loaded (for creation mode only)
    this.config$.pipe(
      filter((config) => config !== null && !this.isEditMode() && !this.hasSetupValidators),
      take(1),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(() => {
      this.hasSetupValidators = true;
      this.setupValidatorsForCreation();
    });

    if (this.editingContainer) {
      this.loadContainerForEditing(this.editingContainer.id);
    } else {
      this.setupForCreation();
    }

    // Handle pool validation based on use_preferred_pool checkbox
    this.form.controls.use_preferred_pool.valueChanges.pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe((usePreferredPool) => {
      if (this.hasPreferredPool() && !this.isEditMode()) {
        if (usePreferredPool) {
          this.form.controls.pool.clearValidators();
          this.form.controls.pool.setValue('');
        } else {
          this.form.controls.pool.setValidators(Validators.required);
        }
        this.form.controls.pool.updateValueAndValidity();
      }
    });

    this.slideInRef.requireConfirmationWhen(() => {
      return of(this.form.dirty);
    });
  }

  private setupForCreation(): void {
    this.isEditMode.set(false);
    this.editingContainer = null;

    this.form.controls.image.setValidators([Validators.required, Validators.minLength(1), Validators.maxLength(200)]);

    this.form.reset({
      autostart: true,
      use_preferred_pool: true,
      time: ContainerTime.Local,
      shutdown_timeout: 30,
      init: null,
      initdir: null,
      inituser: null,
      initgroup: null,
      capabilities_policy: ContainerCapabilitiesPolicy.Default,
      use_default_network: true,
      usb_devices: [],
    });
  }

  private setupValidatorsForCreation(): void {
    // Set pool validators: required only if no preferred pool is set
    if (this.hasPreferredPool()) {
      this.form.controls.pool.clearValidators();
    } else {
      this.form.controls.pool.setValidators(Validators.required);
    }
    this.form.controls.pool.updateValueAndValidity();
  }

  private loadContainerForEditing(containerId: number): void {
    this.isEditMode.set(true);

    this.form.controls.pool.clearValidators();
    this.form.controls.pool.updateValueAndValidity();
    this.form.controls.image.clearValidators();
    this.form.controls.image.updateValueAndValidity();

    this.isLoading.set(true);
    this.api.call('container.get_instance', [containerId]).pipe(
      this.errorHandler.withErrorHandler(),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: (container: Container) => {
        this.editingContainer = container;
        this.populateFormForEdit(container);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.slideInRef.close({ response: false, error: true });
      },
    });
  }

  private populateFormForEdit(container: Container): void {
    this.form.patchValue({
      name: container.name,
      description: container.description || '',
      autostart: container.autostart,
      cpuset: container.cpuset || '',
      time: container.time as ContainerTime,
      shutdown_timeout: container.shutdown_timeout,
      init: container.init,
      initdir: container.initdir || '',
      inituser: container.inituser || '',
      initgroup: container.initgroup || '',
      capabilities_policy: container.capabilities_policy as ContainerCapabilitiesPolicy,
    });

    if (container.initenv && Object.keys(container.initenv).length > 0) {
      for (const [name, value] of Object.entries(container.initenv)) {
        this.addEnvironmentVariableWithValue(name, String(value));
      }
    }
  }

  protected onBrowseCatalogImages(): void {
    this.matDialog
      .open(SelectImageDialog, {
        minWidth: '90vw',
        data: {
          remote: ContainerRemote.LinuxContainers,
          type: ContainerType.Container,
        },
      })
      .afterClosed()
      .pipe(filter(Boolean), takeUntilDestroyed(this.destroyRef))
      .subscribe((image: ContainerImageWithId) => {
        this.form.controls.image.setValue(image.id);
      });
  }

  protected addDisk(): void {
    const control = this.formBuilder.group({
      source: ['', Validators.required],
      destination: ['', Validators.required],
    }) as FormGroup<{
      source: FormControl<string>;
      destination?: FormControl<string>;
    }>;

    this.form.controls.disks.push(control);
  }

  protected removeDisk(index: number): void {
    this.form.controls.disks.removeAt(index);
  }

  protected submit(): void {
    this.isLoading.set(true);

    if (this.isEditMode()) {
      this.updateContainer().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: (updatedInstance) => {
          this.isLoading.set(false);
          this.form.markAsPristine();
          this.snackbar.success(this.translate.instant('Container updated'));

          this.slideInRef.close({ response: true, error: false });

          if (this.containersStore && updatedInstance) {
            this.containersStore.containerUpdated(updatedInstance);
          }
        },
        error: (error: unknown) => {
          this.isLoading.set(false);
          this.formErrorHandler.handleValidationErrors(error, this.form);
        },
      });
    } else {
      this.createContainer().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: (container) => {
          this.isLoading.set(false);
          this.form.markAsPristine();
          this.snackbar.success(this.translate.instant('Container created'));
          this.slideInRef.close({ response: true, error: false });
          this.containersStore?.initialize();
          if (container?.id) {
            this.router.navigate(['/containers', 'view', container.id]);
          }
        },
        error: (error: unknown) => {
          this.isLoading.set(false);
          this.formErrorHandler.handleValidationErrors(error, this.form);
        },
      });
    }
  }

  protected addEnvironmentVariable(): void {
    const control = this.formBuilder.group({
      name: ['', Validators.required],
      value: ['', Validators.required],
    });

    this.form.controls.environment_variables.push(control);
  }

  private addEnvironmentVariableWithValue(name: string, value: string): void {
    const control = this.formBuilder.group({
      name: [name, Validators.required],
      value: [value, Validators.required],
    });

    this.form.controls.environment_variables.push(control);
  }

  protected removeEnvironmentVariable(index: number): void {
    this.form.controls.environment_variables.removeAt(index);
  }

  private createContainer(): Observable<Container> {
    const payload = this.getCreatePayload();

    const job$ = this.api.job('container.create', [payload]);

    return this.dialogService
      .jobDialog(job$, { title: this.translate.instant('Creating Container') })
      .afterClosed().pipe(
        map((job) => {
          if (!job?.result) {
            throw new Error('Container creation was cancelled');
          }
          return job.result;
        }),
      );
  }

  private updateContainer(): Observable<Container> {
    const payload = this.getUpdatePayload();

    return this.api.call('container.update', [this.editingContainer.id, payload]);
  }

  private getCreatePayload(): CreateContainer {
    const form = this.form.getRawValue();

    const payload: CreateContainer = {
      uuid: crypto.randomUUID(),
      name: form.name,
      pool: (this.hasPreferredPool() && form.use_preferred_pool) ? '' : form.pool,
      image: this.parseImageField(form.image),
      autostart: form.autostart,
    };

    if (form.description) payload.description = form.description;

    if (form.cpuset) payload.cpuset = form.cpuset;

    if (form.time) payload.time = form.time;
    if (form.shutdown_timeout) payload.shutdown_timeout = form.shutdown_timeout;

    if (form.init !== null && form.init !== '') payload.init = form.init;
    if (form.initdir !== null && form.initdir !== '') payload.initdir = form.initdir;
    if (form.inituser !== null && form.inituser !== '') payload.inituser = form.inituser;
    if (form.initgroup !== null && form.initgroup !== '') payload.initgroup = form.initgroup;

    if (form.capabilities_policy) payload.capabilities_policy = form.capabilities_policy;

    const envVars = this.getEnvironmentVariablesPayload();
    if (Object.keys(envVars).length > 0) {
      payload.initenv = envVars;
    }

    return payload;
  }

  private getUpdatePayload(): UpdateContainer {
    const form = this.form.getRawValue();
    const payload: UpdateContainer = {};

    if (form.name !== this.editingContainer.name) payload.name = form.name;
    if (form.description !== (this.editingContainer.description || '')) payload.description = form.description;
    if (form.autostart !== this.editingContainer.autostart) payload.autostart = form.autostart;

    if (form.cpuset !== (this.editingContainer.cpuset || '')) payload.cpuset = form.cpuset || null;

    if (form.time !== (this.editingContainer.time as ContainerTime)) payload.time = form.time;
    if (form.shutdown_timeout !== this.editingContainer.shutdown_timeout) {
      payload.shutdown_timeout = form.shutdown_timeout;
    }

    if (form.init !== this.editingContainer.init) payload.init = form.init;
    if (form.initdir !== (this.editingContainer.initdir || '')) payload.initdir = form.initdir || null;
    if (form.inituser !== (this.editingContainer.inituser || '')) payload.inituser = form.inituser || null;
    if (form.initgroup !== (this.editingContainer.initgroup || '')) payload.initgroup = form.initgroup || null;

    if (form.capabilities_policy !== (this.editingContainer.capabilities_policy as ContainerCapabilitiesPolicy)) {
      payload.capabilities_policy = form.capabilities_policy;
    }

    const envVars = this.getEnvironmentVariablesPayload();
    if (JSON.stringify(envVars) !== JSON.stringify(this.editingContainer.initenv || {})) {
      payload.initenv = envVars;
    }

    return payload;
  }

  /**
   * Parses container image string into name and version components.
   *
   * Container images follow a colon-separated format with varying structures:
   *
   * 1. Full format (5+ parts): "name:major:arch:variant:version_timestamp:time"
   *    Example: "almalinux:10:amd64:default:20250924_23:08"
   *    - name: "almalinux:10:amd64:default"
   *    - version: "20250924_23:08"
   *
   * 2. Simple format (2-4 parts): "name:version" or "name:tag:version"
   *    Example: "ubuntu:22.04"
   *    - name: "ubuntu"
   *    - version: "22.04"
   *
   * 3. No version (1 part): "name"
   *    Example: "alpine"
   *    - name: "alpine"
   *    - version: ""
   *
   * @param imageString The full image identifier string from the API
   * @returns Object containing separated name and version strings
   */
  private parseImageField(imageString: string): { name: string; version: string } {
    // For container images like "almalinux:10:amd64:default:20250924_23:08"
    // The base name format is typically "name:major:arch:variant"
    // So we split and take the first 4 parts as name, everything after as version
    const parts = imageString.split(':');
    if (parts.length >= 5) {
      // Container image format: name:major:arch:variant:version_part1:version_part2...
      const name = parts.slice(0, 4).join(':'); // "almalinux:10:amd64:default"
      const version = parts.slice(4).join(':'); // "20250924_23:08"
      return { name, version };
    }
    if (parts.length >= 2) {
      // Fallback: last part is version, everything else is name
      const version = parts[parts.length - 1];
      const name = parts.slice(0, -1).join(':');
      return { name, version };
    }
    // Fallback if no colon found - shouldn't happen with our current data
    return { name: imageString, version: '' };
  }

  private getEnvironmentVariablesPayload(): Record<string, string> {
    return this.form.controls.environment_variables.controls.reduce((env: Record<string, string>, control) => {
      const name = control.get('name')?.value;
      const value = control.get('value')?.value;

      if (name && value) {
        env[name] = value;
      }
      return env;
    }, {});
  }

  protected readonly containersHelptext = containersHelptext;
}
