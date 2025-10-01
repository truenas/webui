import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, OnInit, signal, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  FormArray,
  FormControl,
  FormGroup,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { Router, ActivatedRoute } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import {
  filter, map, Observable, of, tap,
} from 'rxjs';
import { slashRootNode } from 'app/constants/basic-root-nodes.constant';
import { Role } from 'app/enums/role.enum';
import {
  ContainerCapabilitiesPolicy,
  ContainerTime,
  VirtualizationProxyProtocol,
  virtualizationProxyProtocolLabels,
  VirtualizationRemote,
  VirtualizationSource,
  VirtualizationType,
} from 'app/enums/virtualization.enum';
import { choicesToOptions } from 'app/helpers/operators/options.operators';
import { mapToOptions } from 'app/helpers/options.helper';
import { instancesHelptext } from 'app/helptext/instances/instances';
import {
  CreateVirtualizationInstance,
  UpdateVirtualizationInstance,
  InstanceEnvVariablesFormGroup,
  VirtualizationInstance,
} from 'app/interfaces/virtualization.interface';
import { AuthService } from 'app/modules/auth/auth.service';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxCheckboxComponent } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.component';
import {
  IxFormGlossaryComponent,
} from 'app/modules/forms/ix-forms/components/ix-form-glossary/ix-form-glossary.component';
import {
  IxFormSectionComponent,
} from 'app/modules/forms/ix-forms/components/ix-form-section/ix-form-section.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { IxListItemComponent } from 'app/modules/forms/ix-forms/components/ix-list/ix-list-item/ix-list-item.component';
import { IxListComponent } from 'app/modules/forms/ix-forms/components/ix-list/ix-list.component';
import { IxSelectComponent } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.component';
import { ReadOnlyComponent } from 'app/modules/forms/ix-forms/components/readonly-badge/readonly-badge.component';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { IxFormatterService } from 'app/modules/forms/ix-forms/services/ix-formatter.service';
import {
  forbiddenAsyncValues,
} from 'app/modules/forms/ix-forms/validators/forbidden-values-validation/forbidden-values-validation';
import { LoaderService } from 'app/modules/loader/loader.service';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { UnsavedChangesService } from 'app/modules/unsaved-changes/unsaved-changes.service';
import { ApiService } from 'app/modules/websocket/api.service';
import {
  SelectImageDialog,
  VirtualizationImageWithId,
} from 'app/pages/instances/components/instance-wizard/select-image-dialog/select-image-dialog.component';
import { VirtualizationConfigStore } from 'app/pages/instances/stores/virtualization-config.store';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

@UntilDestroy()
@Component({
  selector: 'ix-instance-wizard',
  imports: [
    AsyncPipe,
    IxCheckboxComponent,
    IxFormGlossaryComponent,
    IxFormSectionComponent,
    IxInputComponent,
    IxListComponent,
    IxListItemComponent,
    IxSelectComponent,
    MatButton,
    NgxSkeletonLoaderModule,
    PageHeaderComponent,
    ReactiveFormsModule,
    ReadOnlyComponent,
    TestDirective,
    TranslateModule,
  ],
  templateUrl: './instance-wizard.component.html',
  styleUrls: ['./instance-wizard.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InstanceWizardComponent implements OnInit {
  private api = inject(ApiService);
  private formBuilder = inject(NonNullableFormBuilder);
  private matDialog = inject(MatDialog);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private formErrorHandler = inject(FormErrorHandlerService);
  private translate = inject(TranslateService);
  private snackbar = inject(SnackbarService);
  private dialogService = inject(DialogService);
  protected formatter = inject(IxFormatterService);
  protected configStore = inject(VirtualizationConfigStore);
  private authService = inject(AuthService);
  private unsavedChangesService = inject(UnsavedChangesService);
  private loader = inject(LoaderService);
  private errorHandler = inject(ErrorHandlerService);

  protected readonly isLoading = signal<boolean>(false);
  protected readonly requiredRoles = [Role.LxcConfigWrite];
  protected readonly hasPendingInterfaceChanges = toSignal(this.api.call('interface.has_pending_changes'));

  protected readonly slashRootNode = [slashRootNode];

  protected readonly proxyProtocols$ = of(mapToOptions(virtualizationProxyProtocolLabels, this.translate));

  protected readonly timeOptions$ = of([
    { label: this.translate.instant('Local'), value: ContainerTime.Local },
    { label: this.translate.instant('UTC'), value: ContainerTime.Utc },
  ]);

  protected readonly capabilitiesPolicyOptions$ = of([
    { label: this.translate.instant('Default'), value: ContainerCapabilitiesPolicy.Default },
    { label: this.translate.instant('Allow'), value: ContainerCapabilitiesPolicy.Allow },
    { label: this.translate.instant('Deny'), value: ContainerCapabilitiesPolicy.Deny },
  ]);


  protected readonly forbiddenNames$ = this.api.call('container.query', [
    [], { select: ['name'], order_by: ['name'] },
  ]).pipe(
    map((instances) => instances
      .map((instance) => instance.name)
      .filter((name) => name !== this.editingInstance?.name)),
  );

  readonly VirtualizationSource = VirtualizationSource;


  // Mode tracking
  protected readonly isEditMode = signal<boolean>(false);
  protected editingInstance: VirtualizationInstance | null = null;
  protected readonly pageTitle = computed(() => {
    if (this.isEditMode()) {
      return this.translate.instant('Edit Container: {name}', {
        name: this.editingInstance?.name || '',
      });
    }
    return this.translate.instant('Create Container');
  });

  protected readonly submitButtonText = computed(() => {
    return this.isEditMode() ? this.translate.instant('Save') : this.translate.instant('Create');
  });


  poolOptions$ = this.api.call('container.pool_choices').pipe(
    choicesToOptions(),
    tap((options) => {
      if (options.length && !this.form.controls.pool.value && !this.isEditMode()) {
        this.form.controls.pool.setValue(`${options[0].value}`);
      }
    }),
  );

  protected readonly form = this.formBuilder.group({
    // Basic Configuration
    name: [
      '',
      [Validators.required, Validators.minLength(1), Validators.maxLength(200), Validators.pattern(/^[a-zA-Z0-9-]+$/)],
      [forbiddenAsyncValues(this.forbiddenNames$)],
    ],
    pool: [''], // Required for create, not shown for edit
    description: [''],
    autostart: [true],
    image: [''], // Required for create, not shown for edit

    // CPU Configuration
    vcpus: [null as number | null, [Validators.min(1)]],
    cores: [null as number | null, [Validators.min(1)]],
    threads: [null as number | null, [Validators.min(1)]],
    cpuset: [''],

    // Memory
    memory: [null as number | null, [Validators.min(20)]],

    // Time Configuration
    time: [ContainerTime.Local],
    shutdown_timeout: [30, [Validators.min(5), Validators.max(300)]],

    // Init Process
    init: ['/sbin/init'],
    initdir: [''],
    inituser: [''],
    initgroup: [''],

    // Capabilities
    capabilities_policy: [ContainerCapabilitiesPolicy.Default],

    // Environment Variables
    environment_variables: new FormArray<InstanceEnvVariablesFormGroup>([]),

    // Network
    use_default_network: [true],

    // Devices
    usb_devices: [[] as string[]],
    gpu_devices: [[] as string[]],

    // Proxies
    proxies: this.formBuilder.array<FormGroup<{
      source_proto: FormControl<VirtualizationProxyProtocol>;
      source_port: FormControl<number | null>;
      dest_proto: FormControl<VirtualizationProxyProtocol>;
      dest_port: FormControl<number | null>;
    }>>([]),

    // Disks
    disks: this.formBuilder.array<FormGroup<{
      source: FormControl<string>;
      destination?: FormControl<string>;
    }>>([]),
  });

  get hasRequiredRoles(): Observable<boolean> {
    return this.authService.hasRole(this.requiredRoles);
  }

  constructor() {
    this.configStore.initialize();
  }

  ngOnInit(): void {
    // Check if we're in edit mode from the route
    this.route.paramMap.pipe(
      untilDestroyed(this),
    ).subscribe((params) => {
      const instanceId = params.get('id');
      if (instanceId) {
        this.loadInstanceForEditing(Number(instanceId));
      } else {
        this.setupForCreation();
      }
    });
  }

  private setupForCreation(): void {
    this.isEditMode.set(false);
    this.editingInstance = null;

    // Set required validators for creation
    this.form.controls.pool.setValidators(Validators.required);
    this.form.controls.image.setValidators([Validators.required, Validators.minLength(1), Validators.maxLength(200)]);
    this.form.controls.init.setValue('/sbin/init');

    // Reset form for new creation
    this.form.reset({
      autostart: true,
      time: ContainerTime.Local,
      shutdown_timeout: 30,
      init: '/sbin/init',
      capabilities_policy: ContainerCapabilitiesPolicy.Default,
      use_default_network: true,
      usb_devices: [],
      gpu_devices: [],
    });
  }

  private loadInstanceForEditing(instanceId: number): void {
    this.isEditMode.set(true);

    // Remove validators that are only for creation
    this.form.controls.pool.clearValidators();
    this.form.controls.pool.updateValueAndValidity();
    this.form.controls.image.clearValidators();
    this.form.controls.image.updateValueAndValidity();

    // Load the instance data with loader
    this.loader.open();
    this.api.call('container.get_instance', [instanceId]).pipe(
      this.errorHandler.withErrorHandler(),
      untilDestroyed(this),
    ).subscribe({
      next: (instance: VirtualizationInstance) => {
        this.editingInstance = instance;
        this.populateFormForEdit(instance);
        this.loader.close();
      },
      error: () => {
        this.loader.close();
        this.router.navigate(['/containers']);
      },
    });
  }

  private populateFormForEdit(instance: VirtualizationInstance): void {
    // Basic fields
    this.form.patchValue({
      name: instance.name,
      description: instance.description || '',
      autostart: instance.autostart,
      vcpus: instance.vcpus,
      cores: instance.cores,
      threads: instance.threads,
      cpuset: instance.cpuset || '',
      memory: instance.memory,
      time: instance.time as ContainerTime,
      shutdown_timeout: instance.shutdown_timeout,
      init: instance.init,
      initdir: instance.initdir || '',
      inituser: instance.inituser || '',
      initgroup: instance.initgroup || '',
      capabilities_policy: instance.capabilities_policy as ContainerCapabilitiesPolicy,
    });

    // Environment variables
    if (instance.initenv && Object.keys(instance.initenv).length > 0) {
      for (const [name, value] of Object.entries(instance.initenv)) {
        this.addEnvironmentVariableWithValue(name, String(value));
      }
    }

    // TODO: Load other complex fields like devices, proxies, disks when API provides them
  }

  protected canDeactivate(): Observable<boolean> {
    return this.form.dirty ? this.unsavedChangesService.showConfirmDialog() : of(true);
  }


  protected onBrowseCatalogImages(): void {
    this.matDialog
      .open(SelectImageDialog, {
        minWidth: '90vw',
        data: {
          remote: VirtualizationRemote.LinuxContainers,
          type: VirtualizationType.Container,
        },
      })
      .afterClosed()
      .pipe(filter(Boolean), untilDestroyed(this))
      .subscribe((image: VirtualizationImageWithId) => {
        this.form.controls.image.setValue(image.id);
      });
  }

  protected addProxy(): void {
    const control = this.formBuilder.group({
      source_proto: [VirtualizationProxyProtocol.Tcp],
      source_port: [null as number | null, [Validators.required, Validators.min(1), Validators.max(65535)]],
      dest_proto: [VirtualizationProxyProtocol.Tcp],
      dest_port: [null as number | null, [Validators.required, Validators.min(1), Validators.max(65535)]],
    });

    this.form.controls.proxies.push(control);
  }

  protected removeProxy(index: number): void {
    this.form.controls.proxies.removeAt(index);
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

  protected onSubmit(): void {
    // Show loader for both create and update
    this.loader.open();

    if (this.isEditMode()) {
      this.updateInstance().pipe(untilDestroyed(this)).subscribe({
        next: () => {
          this.loader.close();
          this.form.markAsPristine();
          this.snackbar.success(this.translate.instant('Container updated'));
          this.router.navigate(['/containers', 'view', this.editingInstance?.id]);
        },
        error: (error: unknown) => {
          this.loader.close();
          this.formErrorHandler.handleValidationErrors(error, this.form);
        },
      });
    } else {
      this.createInstance().pipe(untilDestroyed(this)).subscribe({
        next: (instance) => {
          this.loader.close();
          this.form.markAsPristine();
          this.snackbar.success(this.translate.instant('Container created'));
          this.router.navigate(['/containers', 'view', instance?.id]);
        },
        error: (error: unknown) => {
          this.loader.close();
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

  private createInstance(): Observable<VirtualizationInstance> {
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

  private updateInstance(): Observable<VirtualizationInstance> {
    const payload = this.getUpdatePayload();

    return this.api.call('container.update', [this.editingInstance.id, payload]);
  }

  private getCreatePayload(): CreateVirtualizationInstance {
    const form = this.form.getRawValue();

    const payload: CreateVirtualizationInstance = {
      uuid: crypto.randomUUID(),
      name: form.name,
      pool: form.pool,
      image: this.parseImageField(form.image),
      autostart: form.autostart,
    };

    // Add optional fields
    if (form.description) payload.description = form.description;

    // CPU configuration
    if (form.vcpus) payload.vcpus = form.vcpus;
    if (form.cores) payload.cores = form.cores;
    if (form.threads) payload.threads = form.threads;
    if (form.cpuset) payload.cpuset = form.cpuset;

    // Memory
    if (form.memory) payload.memory = form.memory;

    // Time configuration
    if (form.time) payload.time = form.time;
    if (form.shutdown_timeout) payload.shutdown_timeout = form.shutdown_timeout;

    // Init process
    if (form.init) payload.init = form.init;
    if (form.initdir) payload.initdir = form.initdir;
    if (form.inituser) payload.inituser = form.inituser;
    if (form.initgroup) payload.initgroup = form.initgroup;

    // Capabilities
    if (form.capabilities_policy) payload.capabilities_policy = form.capabilities_policy;

    // Environment variables
    const envVars = this.getEnvironmentVariablesPayload();
    if (Object.keys(envVars).length > 0) {
      payload.initenv = envVars;
    }

    // USB, GPU, disks and proxies - commented out until API support is available
    // These features will be enabled once the container API supports them

    return payload;
  }

  private getUpdatePayload(): UpdateVirtualizationInstance {
    const form = this.form.getRawValue();
    const payload: UpdateVirtualizationInstance = {};

    // Only include fields that have changed
    if (form.name !== this.editingInstance.name) payload.name = form.name;
    if (form.description !== (this.editingInstance.description || '')) payload.description = form.description;
    if (form.autostart !== this.editingInstance.autostart) payload.autostart = form.autostart;

    // CPU configuration
    if (form.vcpus !== this.editingInstance.vcpus) payload.vcpus = form.vcpus;
    if (form.cores !== this.editingInstance.cores) payload.cores = form.cores;
    if (form.threads !== this.editingInstance.threads) payload.threads = form.threads;
    if (form.cpuset !== (this.editingInstance.cpuset || '')) payload.cpuset = form.cpuset || null;

    // Memory
    if (form.memory !== this.editingInstance.memory) payload.memory = form.memory;

    // Time configuration
    if (form.time !== (this.editingInstance.time as ContainerTime)) payload.time = form.time;
    if (form.shutdown_timeout !== this.editingInstance.shutdown_timeout) {
      payload.shutdown_timeout = form.shutdown_timeout;
    }

    // Init process
    if (form.init !== this.editingInstance.init) payload.init = form.init;
    if (form.initdir !== (this.editingInstance.initdir || '')) payload.initdir = form.initdir || null;
    if (form.inituser !== (this.editingInstance.inituser || '')) payload.inituser = form.inituser || null;
    if (form.initgroup !== (this.editingInstance.initgroup || '')) payload.initgroup = form.initgroup || null;

    // Capabilities
    if (form.capabilities_policy !== (this.editingInstance.capabilities_policy as ContainerCapabilitiesPolicy)) {
      payload.capabilities_policy = form.capabilities_policy;
    }

    // Environment variables
    const envVars = this.getEnvironmentVariablesPayload();
    if (JSON.stringify(envVars) !== JSON.stringify(this.editingInstance.initenv || {})) {
      payload.initenv = envVars;
    }

    return payload;
  }

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

  protected readonly instancesHelptext = instancesHelptext;
}
