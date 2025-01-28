import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, computed, signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  FormArray,
  FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators,
} from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import {
  filter,
  map, Observable, of,
  switchMap,
} from 'rxjs';
import { nameValidatorRegex } from 'app/constants/name-validator.constant';
import { Role } from 'app/enums/role.enum';
import {
  VirtualizationDeviceType,
  VirtualizationGpuType,
  VirtualizationNicType,
  virtualizationNicTypeLabels,
  VirtualizationProxyProtocol,
  virtualizationProxyProtocolLabels,
  VirtualizationRemote,
  VirtualizationType,
  virtualizationTypeIcons,
} from 'app/enums/virtualization.enum';
import { mapToOptions } from 'app/helpers/options.helper';
import { containersHelptext } from 'app/helptext/virtualization/containers';
import { Option } from 'app/interfaces/option.interface';
import {
  CreateVirtualizationInstance,
  InstanceEnvVariablesFormGroup,
  VirtualizationDevice,
  VirtualizationInstance,
} from 'app/interfaces/virtualization.interface';
import { AuthService } from 'app/modules/auth/auth.service';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxCheckboxComponent } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.component';
import { IxCheckboxListComponent } from 'app/modules/forms/ix-forms/components/ix-checkbox-list/ix-checkbox-list.component';
import { IxExplorerComponent } from 'app/modules/forms/ix-forms/components/ix-explorer/ix-explorer.component';
import { IxFileInputComponent } from 'app/modules/forms/ix-forms/components/ix-file-input/ix-file-input.component';
import { IxFormGlossaryComponent } from 'app/modules/forms/ix-forms/components/ix-form-glossary/ix-form-glossary.component';
import { IxFormSectionComponent } from 'app/modules/forms/ix-forms/components/ix-form-section/ix-form-section.component';
import { IxIconGroupComponent } from 'app/modules/forms/ix-forms/components/ix-icon-group/ix-icon-group.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { IxListItemComponent } from 'app/modules/forms/ix-forms/components/ix-list/ix-list-item/ix-list-item.component';
import { IxListComponent } from 'app/modules/forms/ix-forms/components/ix-list/ix-list.component';
import { IxRadioGroupComponent } from 'app/modules/forms/ix-forms/components/ix-radio-group/ix-radio-group.component';
import { IxSelectComponent } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.component';
import { ReadOnlyComponent } from 'app/modules/forms/ix-forms/components/readonly-badge/readonly-badge.component';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { IxFormatterService } from 'app/modules/forms/ix-forms/services/ix-formatter.service';
import { cpuValidator } from 'app/modules/forms/ix-forms/validators/cpu-validation/cpu-validation';
import { forbiddenAsyncValues } from 'app/modules/forms/ix-forms/validators/forbidden-values-validation/forbidden-values-validation';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';
import {
  SelectImageDialogComponent, VirtualizationImageWithId,
} from 'app/pages/virtualization/components/instance-wizard/select-image-dialog/select-image-dialog.component';
import { VirtualizationConfigStore } from 'app/pages/virtualization/stores/virtualization-config.store';
import { defaultVncPort } from 'app/pages/virtualization/virtualization.constants';
import { FilesystemService } from 'app/services/filesystem.service';
import { UploadService } from 'app/services/upload.service';

enum SelectImageType {
  Load = 'LOAD',
  Choose = 'CHOOSE',
}

@UntilDestroy()
@Component({
  selector: 'ix-instance-wizard',
  standalone: true,
  imports: [
    AsyncPipe,
    IxCheckboxComponent,
    IxCheckboxListComponent,
    IxExplorerComponent,
    IxFormGlossaryComponent,
    IxFormSectionComponent,
    IxInputComponent,
    IxListComponent,
    IxListItemComponent,
    IxSelectComponent,
    IxRadioGroupComponent,
    IxFileInputComponent,
    MatButton,
    NgxSkeletonLoaderModule,
    PageHeaderComponent,
    ReactiveFormsModule,
    ReadOnlyComponent,
    TestDirective,
    TranslateModule,
    IxIconGroupComponent,
  ],
  templateUrl: './instance-wizard.component.html',
  styleUrls: ['./instance-wizard.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InstanceWizardComponent {
  protected readonly isLoading = signal<boolean>(false);
  protected readonly requiredRoles = [Role.VirtGlobalWrite];
  protected readonly virtualizationTypeIcons = virtualizationTypeIcons;

  protected readonly hasPendingInterfaceChanges = toSignal(this.api.call('interface.has_pending_changes'));

  protected readonly proxyProtocols$ = of(mapToOptions(virtualizationProxyProtocolLabels, this.translate));
  protected readonly bridgedNicTypeLabel = virtualizationNicTypeLabels.get(VirtualizationNicType.Bridged);
  protected readonly macVlanNicTypeLabel = virtualizationNicTypeLabels.get(VirtualizationNicType.Macvlan);

  protected readonly forbiddenNames$ = this.api.call('virt.instance.query', [
    [], { select: ['name'], order_by: ['name'] },
  ]).pipe(map((keys) => keys.map((key) => key.name)));

  readonly SelectImageType = SelectImageType;

  bridgedNicDevices$ = this.getNicDevicesOptions(VirtualizationNicType.Bridged);
  macVlanNicDevices$ = this.getNicDevicesOptions(VirtualizationNicType.Macvlan);

  usbDevices$ = this.api.call('virt.device.usb_choices').pipe(
    map((choices) => Object.values(choices).map((choice) => ({
      label: `${choice.product} (${choice.product_id})`,
      value: choice.product_id.toString(),
    }))),
  );

  imageOptions$: Observable<Option<SelectImageType>[]> = of([
    { label: this.translate.instant('Use a Linux image (linuxcontainer.org)'), value: SelectImageType.Choose },
    { label: this.translate.instant('Upload an ISO image'), value: SelectImageType.Load },
  ]);

  gpuDevices$ = this.api.call(
    'virt.device.gpu_choices',
    [VirtualizationGpuType.Physical],
  ).pipe(
    map((choices) => Object.entries(choices).map(([pci, gpu]) => ({
      label: gpu.description,
      value: pci,
    }))),
  );

  protected readonly form = this.formBuilder.nonNullable.group({
    name: [
      '',
      [Validators.required, Validators.minLength(1), Validators.maxLength(200), Validators.pattern(nameValidatorRegex)],
      [forbiddenAsyncValues(this.forbiddenNames$)],
    ],
    instance_type: [VirtualizationType.Container, Validators.required],
    image_type: [SelectImageType.Choose, [Validators.required]],
    image_file: [null as File[], [Validators.required]],
    image_file_name: ['', [Validators.required]],
    image: ['', [Validators.required, Validators.minLength(1), Validators.maxLength(200)]],
    enable_vnc: [false],
    vnc_port: [defaultVncPort, [Validators.min(5900), Validators.max(65535)]],
    vnc_password: [null as string],
    cpu: ['', [cpuValidator()]],
    memory: [null as number],
    tpm: [false],
    root_disk_size: [10],
    secure_boot: [false],
    use_default_network: [true],
    usb_devices: [[] as string[]],
    gpu_devices: [[] as string[]],
    bridged_nics: [[] as string[]],
    mac_vlan_nics: [[] as string[]],
    proxies: this.formBuilder.array<FormGroup<{
      source_proto: FormControl<VirtualizationProxyProtocol>;
      source_port: FormControl<number>;
      dest_proto: FormControl<VirtualizationProxyProtocol>;
      dest_port: FormControl<number>;
    }>>([]),
    disks: this.formBuilder.array<FormGroup<{
      source: FormControl<string>;
      destination: FormControl<string>;
    }>>([]),
    environment_variables: new FormArray<InstanceEnvVariablesFormGroup>([]),
  });

  get hasRequiredRoles(): Observable<boolean> {
    return this.authService.hasRole(this.requiredRoles);
  }

  protected readonly instanceType = signal<VirtualizationType>(this.form.value.instance_type);
  protected readonly isContainer = computed(() => this.instanceType() === VirtualizationType.Container);
  protected readonly isVm = computed(() => this.instanceType() === VirtualizationType.Vm);

  readonly directoryNodeProvider = computed(() => {
    if (this.isVm()) {
      return this.filesystem.getFilesystemNodeProvider({ zvolsOnly: true });
    }

    return this.filesystem.getFilesystemNodeProvider({ datasetsAndZvols: true });
  });

  protected defaultIpv4Network = computed(() => {
    return this.configStore.config()?.v4_network || 'N/A';
  });

  protected defaultIpv6Network = computed(() => {
    return this.configStore.config()?.v6_network || 'N/A';
  });

  constructor(
    private api: ApiService,
    private formBuilder: FormBuilder,
    private matDialog: MatDialog,
    private router: Router,
    private formErrorHandler: FormErrorHandlerService,
    private translate: TranslateService,
    private snackbar: SnackbarService,
    private dialogService: DialogService,
    protected formatter: IxFormatterService,
    protected configStore: VirtualizationConfigStore,
    private authService: AuthService,
    private filesystem: FilesystemService,
    private uploadService: UploadService,
  ) {
    this.configStore.initialize();
    this.form.controls.image_file.disable();
    this.form.controls.image_file_name.disable();
    this.form.controls.image_type.valueChanges.pipe(untilDestroyed(this)).subscribe((type) => {
      if (type === SelectImageType.Choose) {
        this.form.controls.image_file.disable();
        this.form.controls.image_file_name.disable();
        this.form.controls.image.enable();
      } else {
        this.form.controls.image_file.enable();
        this.form.controls.image_file_name.enable();
        this.form.controls.image.disable();
      }
    });
    this.form.controls.image_file.valueChanges.pipe(untilDestroyed(this)).subscribe((file) => {
      this.form.controls.image_file_name.setValue(file?.[0] ? `${file[0].name.replace('.iso', '')}_${Date.now()}.iso` : '');
    });
    this.form.controls.instance_type.valueChanges.pipe(untilDestroyed(this)).subscribe((type) => {
      if (type === VirtualizationType.Container) {
        this.form.controls.image_type.setValue(SelectImageType.Choose);
      }
      this.instanceType.set(type);
      if (type === VirtualizationType.Container) {
        this.form.controls.cpu.setValidators(cpuValidator());
        this.form.controls.memory.clearValidators();
      } else {
        this.form.controls.cpu.setValidators([Validators.required, cpuValidator()]);
        this.form.controls.memory.setValidators([Validators.required]);
      }
    });
  }

  protected onBrowseImages(): void {
    this.matDialog
      .open(SelectImageDialogComponent, {
        minWidth: '90vw',
        data: {
          remote: VirtualizationRemote.LinuxContainers,
          type: this.form.controls.instance_type.value,
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
      source_port: [null as number, Validators.required],
      dest_proto: [VirtualizationProxyProtocol.Tcp],
      dest_port: [null as number, Validators.required],
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
    });

    if (this.isVm()) {
      control.removeControl('destination');
    }

    this.form.controls.disks.push(control);
  }

  protected removeDisk(index: number): void {
    this.form.controls.disks.removeAt(index);
  }

  protected onSubmit(): void {
    (this.form.value.image_type === SelectImageType.Load ? this.importIsoImage() : of(null)).pipe(
      switchMap(() => this.createInstance()),
      untilDestroyed(this),
    ).subscribe({
      next: (instance) => {
        this.snackbar.success(this.translate.instant('Instance created'));
        this.router.navigate(['/virtualization', 'view', instance?.id]);
      },
      error: (error: unknown) => {
        this.formErrorHandler.handleValidationErrors(error, this.form);
      },
    });
  }

  addEnvironmentVariable(): void {
    const control = this.formBuilder.group({
      name: ['', Validators.required],
      value: ['', Validators.required],
    });

    this.form.controls.environment_variables.push(control);
  }

  removeEnvironmentVariable(index: number): void {
    this.form.controls.environment_variables.removeAt(index);
  }

  private createInstance(): Observable<VirtualizationInstance> {
    const payload = this.getPayload();
    const job$ = this.api.job('virt.instance.create', [payload]);

    return this.dialogService
      .jobDialog(job$, { title: this.translate.instant('Creating Instance') })
      .afterClosed().pipe(map((job) => job.result));
  }

  private importIsoImage(): Observable<string> {
    const job$ = this.uploadService.uploadAsJob({
      file: this.form.value.image_file[0],
      method: 'virt.volume.import_iso',
      params: [{
        name: this.form.value.image_file_name,
        upload_iso: true,
      }],
    });

    return this.dialogService
      .jobDialog(job$, { title: this.translate.instant('Uploading Image') })
      .afterClosed().pipe(map((job) => job.result?.name));
  }

  private getPayload(): CreateVirtualizationInstance {
    const devices = this.getDevicesPayload();
    const values = this.form.getRawValue();

    const payload = {
      devices,
      autostart: true,
      instance_type: values.instance_type,
      enable_vnc: this.isVm() ? values.enable_vnc : false,
      vnc_port: this.isVm() && values.enable_vnc ? values.vnc_port || defaultVncPort : null,
      name: values.name,
      cpu: values.cpu,
      memory: values.memory,
      image: values.image,
      ...(this.isContainer() ? { environment: this.environmentVariablesPayload } : null),
    } as CreateVirtualizationInstance;

    if (this.isVm()) {
      payload.root_disk_size = values.root_disk_size;
      payload.secure_boot = values.secure_boot;

      if (values.enable_vnc) {
        payload.vnc_password = values.vnc_password;
      }
    }

    if (values.image_type === SelectImageType.Load) {
      delete payload.image;
      payload.source_type = null;
    }

    return payload;
  }

  private getNicDevicesOptions(nicType: VirtualizationNicType): Observable<Option[]> {
    return this.api.call('virt.device.nic_choices', [nicType]).pipe(
      map((choices) => Object.values(choices).map((choice) => ({
        label: choice,
        value: choice,
      }))),
    );
  }

  private get environmentVariablesPayload(): Record<string, string> {
    return this.form.controls.environment_variables.controls.reduce((env: Record<string, string>, control) => {
      const name = control.get('name')?.value;
      const value = control.get('value')?.value;

      if (name && value) {
        env[name] = value;
      }
      return env;
    }, {});
  }

  private getDevicesPayload(): VirtualizationDevice[] {
    const iso = this.form.value.image_type === SelectImageType.Load
      ? [
          {
            dev_type: VirtualizationDeviceType.Disk,
            source: this.form.value.image_file_name,
            destination: null as string,
            boot_priority: 1,
          },
        ]
      : [];

    const disks = this.form.controls.disks.value.map((proxy) => ({
      dev_type: VirtualizationDeviceType.Disk,
      source: proxy.source,
      ...(this.isContainer() ? { destination: proxy.destination } : null),
    }));

    const usbDevices: { dev_type: VirtualizationDeviceType; product_id: string }[] = [];
    for (const productId of this.form.controls.usb_devices.value) {
      usbDevices.push({
        dev_type: VirtualizationDeviceType.Usb,
        product_id: productId,
      });
    }

    const gpuDevices: { pci: string; dev_type: VirtualizationDeviceType }[] = [];
    for (const pci of this.form.controls.gpu_devices.value) {
      gpuDevices.push({
        pci,
        dev_type: VirtualizationDeviceType.Gpu,
      });
    }
    const macVlanNics: { parent: string; dev_type: VirtualizationDeviceType; nic_type: VirtualizationNicType }[] = [];
    if (!this.form.controls.use_default_network.value) {
      for (const parent of this.form.controls.mac_vlan_nics.value) {
        macVlanNics.push({
          parent,
          dev_type: VirtualizationDeviceType.Nic,
          nic_type: VirtualizationNicType.Macvlan,
        });
      }
    }

    const bridgedNics: { parent: string; dev_type: VirtualizationDeviceType; nic_type: VirtualizationNicType }[] = [];
    if (!this.form.controls.use_default_network.value) {
      for (const parent of this.form.controls.bridged_nics.value) {
        bridgedNics.push({
          parent,
          dev_type: VirtualizationDeviceType.Nic,
          nic_type: VirtualizationNicType.Bridged,
        });
      }
    }

    const proxies = this.form.controls.proxies.value.map((proxy) => ({
      dev_type: VirtualizationDeviceType.Proxy,
      source_proto: proxy.source_proto,
      source_port: proxy.source_port,
      dest_proto: proxy.dest_proto,
      dest_port: proxy.dest_port,
    }));

    const tpmDevice = [];
    if (this.isVm() && this.form.value.tpm) {
      tpmDevice.push({
        dev_type: VirtualizationDeviceType.Tpm,
      });
    }

    return [
      ...iso,
      ...disks,
      ...proxies,
      ...macVlanNics,
      ...bridgedNics,
      ...usbDevices,
      ...gpuDevices,
      ...tpmDevice,
    ] as VirtualizationDevice[];
  }

  protected readonly containersHelptext = containersHelptext;
}
