import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, computed, effect, OnInit, signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  FormArray,
  FormControl,
  FormGroup,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { unionBy } from 'lodash-es';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import {
  filter, map, Observable, of, startWith, tap,
} from 'rxjs';
import { Role } from 'app/enums/role.enum';
import {
  DiskIoBus,
  diskIoBusLabels,
  VirtualizationDeviceType,
  VirtualizationGpuType,
  VirtualizationNicType,
  virtualizationNicTypeLabels,
  VirtualizationProxyProtocol,
  virtualizationProxyProtocolLabels,
  VirtualizationRemote,
  VirtualizationSource,
  VirtualizationType,
  virtualizationTypeIcons,
  VolumeContentType,
} from 'app/enums/virtualization.enum';
import { singleArrayToOptions } from 'app/helpers/operators/options.operators';
import { mapToOptions } from 'app/helpers/options.helper';
import { instancesHelptext } from 'app/helptext/instances/instances';
import { Option } from 'app/interfaces/option.interface';
import {
  CreateVirtualizationInstance,
  InstanceEnvVariablesFormGroup,
  VirtualizationDevice,
  VirtualizationInstance,
  VirtualizationVolume,
} from 'app/interfaces/virtualization.interface';
import { AuthService } from 'app/modules/auth/auth.service';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxCheckboxComponent } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.component';
import {
  IxCheckboxListComponent,
} from 'app/modules/forms/ix-forms/components/ix-checkbox-list/ix-checkbox-list.component';
import { IxExplorerComponent } from 'app/modules/forms/ix-forms/components/ix-explorer/ix-explorer.component';
import {
  IxFormGlossaryComponent,
} from 'app/modules/forms/ix-forms/components/ix-form-glossary/ix-form-glossary.component';
import {
  IxFormSectionComponent,
} from 'app/modules/forms/ix-forms/components/ix-form-section/ix-form-section.component';
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
import {
  forbiddenAsyncValues,
} from 'app/modules/forms/ix-forms/validators/forbidden-values-validation/forbidden-values-validation';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';
import {
  PciPassthroughDialog,
} from 'app/pages/instances/components/common/pci-passthough-dialog/pci-passthrough-dialog.component';
import {
  VolumesDialog,
  VolumesDialogOptions,
} from 'app/pages/instances/components/common/volumes-dialog/volumes-dialog.component';
import {
  SelectImageDialog,
  VirtualizationImageWithId,
} from 'app/pages/instances/components/instance-wizard/select-image-dialog/select-image-dialog.component';
import { defaultVncPort } from 'app/pages/instances/instances.constants';
import { VirtualizationConfigStore } from 'app/pages/instances/stores/virtualization-config.store';
import { FilesystemService } from 'app/services/filesystem.service';

@UntilDestroy()
@Component({
  selector: 'ix-instance-wizard',
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
    MatButton,
    NgxSkeletonLoaderModule,
    PageHeaderComponent,
    ReactiveFormsModule,
    ReadOnlyComponent,
    TestDirective,
    TranslateModule,
    IxIconGroupComponent,
    MatIconButton,
    IxIconComponent,
  ],
  templateUrl: './instance-wizard.component.html',
  styleUrls: ['./instance-wizard.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InstanceWizardComponent implements OnInit {
  protected readonly isLoading = signal<boolean>(false);
  protected readonly requiredRoles = [Role.VirtGlobalWrite];
  protected readonly virtualizationTypeIcons = virtualizationTypeIcons;

  protected readonly hasPendingInterfaceChanges = toSignal(this.api.call('interface.has_pending_changes'));

  protected readonly diskIoBusOptions$ = of(mapToOptions(diskIoBusLabels, this.translate));

  protected readonly proxyProtocols$ = of(mapToOptions(virtualizationProxyProtocolLabels, this.translate));
  protected readonly bridgedNicTypeLabel = virtualizationNicTypeLabels.get(VirtualizationNicType.Bridged);
  protected readonly macVlanNicTypeLabel = virtualizationNicTypeLabels.get(VirtualizationNicType.Macvlan);

  protected readonly forbiddenNames$ = this.api.call('virt.instance.query', [
    [], { select: ['name'], order_by: ['name'] },
  ]).pipe(map((keys) => keys.map((key) => key.name)));

  readonly VirtualizationSource = VirtualizationSource;

  bridgedNicDevices$ = this.getNicDevicesOptions(VirtualizationNicType.Bridged);
  macVlanNicDevices$ = this.getNicDevicesOptions(VirtualizationNicType.Macvlan);

  usbDevices$ = this.api.call('virt.device.usb_choices').pipe(
    map((choices) => Object.values(choices).map((choice) => ({
      label: `${choice.product} (${choice.product_id})`,
      value: choice.product_id.toString(),
    }))),
  );

  imageSourceTypeOptions$: Observable<Option<VirtualizationSource>[]> = of([
    { label: this.translate.instant('Use a Linux image (linuxcontainers.org)'), value: VirtualizationSource.Image },
    { label: this.translate.instant('Upload ISO, import a zvol or use another volume'), value: VirtualizationSource.Zvol },
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

  protected poolOptions$ = this.configStore.state$.pipe(
    filter((state) => !state.isLoading),
    map((state) => state.config?.storage_pools),
    singleArrayToOptions(),
    tap((options) => {
      if (options.length && !this.form.controls.storage_pool.value) {
        this.form.controls.storage_pool.setValue(`${options[0].value}`);
      }
    }),
  );

  protected hasOnePool = computed(() => this.configStore.config()?.storage_pools?.length === 1);

  protected readonly form = this.formBuilder.group({
    name: [
      '',
      [Validators.required, Validators.minLength(1), Validators.maxLength(200), Validators.pattern(/^[a-zA-Z0-9-]+$/)],
      [forbiddenAsyncValues(this.forbiddenNames$)],
    ],
    instance_type: [VirtualizationType.Container, Validators.required],
    source_type: [VirtualizationSource.Image, [Validators.required]],
    boot_from: [null as string | null],
    volume_type: [null as VolumeContentType | null],
    root_disk_io_bus: [DiskIoBus.Nvme, []],
    volume: ['', [Validators.required]],
    image: ['', [Validators.required, Validators.minLength(1), Validators.maxLength(200)]],
    enable_vnc: [false],
    vnc_port: [defaultVncPort, [Validators.min(5900), Validators.max(65535)]],
    vnc_password: [null as string | null],
    cpu: ['', [cpuValidator()]],
    memory: [null as number | null],
    storage_pool: [null as string | null, [Validators.required]],
    tpm: [false],
    secure_boot: [false],
    root_disk_size: [10],
    use_default_network: [true],
    usb_devices: [[] as string[]],
    gpu_devices: [[] as string[]],
    pci_devices: [[] as Option<string>[]],
    bridged_nics: [[] as string[]],
    mac_vlan_nics: [[] as string[]],
    proxies: this.formBuilder.array<FormGroup<{
      source_proto: FormControl<VirtualizationProxyProtocol>;
      source_port: FormControl<number | null>;
      dest_proto: FormControl<VirtualizationProxyProtocol>;
      dest_port: FormControl<number | null>;
    }>>([]),
    disks: this.formBuilder.array<FormGroup<{
      source: FormControl<string>;
      destination?: FormControl<string>;
      io_bus?: FormControl<DiskIoBus>;
    }>>([]),
    environment_variables: new FormArray<InstanceEnvVariablesFormGroup>([]),
  });

  readonly bootFromOptions$: Observable<Option[]> = this.form.controls.disks.statusChanges.pipe(
    startWith(null),
    map(() => {
      return this.form.controls.disks.controls
        .filter((control) => control.controls.source?.value)
        .map((control) => {
          const source = control.controls.source?.value;
          return { label: source, value: source };
        });
    }),
  );

  get hasRequiredRoles(): Observable<boolean> {
    return this.authService.hasRole(this.requiredRoles);
  }

  get isZvolSourceType(): boolean {
    return this.form.value.source_type === VirtualizationSource.Zvol;
  }

  get secureBootTooltip(): string {
    if (this.form.controls.secure_boot.disabled) {
      return this.form.controls.secure_boot.value
        ? this.translate.instant(instancesHelptext.secureBootOnRequiredTooltip)
        : this.translate.instant(instancesHelptext.secureBootOffRequiredTooltip);
    }

    return this.translate.instant(instancesHelptext.secureBootTooltip);
  }

  protected readonly instanceType = signal<VirtualizationType>(this.form.getRawValue().instance_type);
  protected readonly isContainer = computed(() => this.instanceType() === VirtualizationType.Container);
  protected readonly isVm = computed(() => this.instanceType() === VirtualizationType.Vm);

  readonly datasetProvider = this.filesystem.getFilesystemNodeProvider({ datasetsOnly: true });

  protected defaultIpv4Network = computed(() => {
    return this.configStore.config()?.v4_network || this.translate.instant('N/A');
  });

  protected defaultIpv6Network = computed(() => {
    return this.configStore.config()?.v6_network || this.translate.instant('N/A');
  });

  protected readonly of = of;

  constructor(
    private api: ApiService,
    private formBuilder: NonNullableFormBuilder,
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
  ) {
    this.configStore.initialize();

    effect(() => {
      if (!this.form.value.storage_pool && this.hasOnePool()) {
        this.form.patchValue({ storage_pool: this.configStore.config()?.storage_pools?.[0] });
      }
    });

    this.listenForSourceTypeChanges();
    this.listenForInstanceTypeChanges();
  }

  ngOnInit(): void {
    this.bootFromOptions$.pipe(
      untilDestroyed(this),
    ).subscribe((disks) => {
      const bootFromControl = this.form.controls.boot_from;

      if (bootFromControl.value && !disks.find((disk) => disk.value === bootFromControl.value)) {
        bootFromControl.reset();
      }

      if (disks.length === 1) {
        bootFromControl.setValue(disks[0].value as string);
      }
    });
  }

  protected onBrowseCatalogImages(): void {
    this.matDialog
      .open(SelectImageDialog, {
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

        if (this.isVm()) {
          if (typeof image.secureboot === 'boolean' && image.secureboot !== null) {
            this.form.controls.secure_boot.setValue(image.secureboot);
            this.form.controls.secure_boot.disable();
          } else {
            this.form.controls.secure_boot.enable();
          }
        }
      });
  }

  protected onSelectRootVolume(): void {
    this.matDialog
      .open<VolumesDialog, VolumesDialogOptions, VirtualizationVolume>(VolumesDialog, {
        minWidth: '90vw',
        data: {
          selectionMode: true,
          config: this.configStore.config(),
        },
      })
      .afterClosed()
      .pipe(filter(Boolean), untilDestroyed(this))
      .subscribe((volume) => {
        this.form.patchValue({
          volume_type: volume.content_type,
        });

        this.form.patchValue({ volume: volume.id });
      });
  }

  protected onSelectVolume(targetField: FormControl<string>): void {
    this.matDialog
      .open<VolumesDialog, VolumesDialogOptions, VirtualizationVolume>(VolumesDialog, {
        minWidth: '90vw',
        data: {
          config: this.configStore.config(),
          selectionMode: true,
        },
      })
      .afterClosed()
      .pipe(filter(Boolean), untilDestroyed(this))
      .subscribe((volume) => {
        targetField.setValue(volume.id);
      });
  }

  protected addProxy(): void {
    const control = this.formBuilder.group({
      source_proto: [VirtualizationProxyProtocol.Tcp],
      source_port: [null as number | null, Validators.required],
      dest_proto: [VirtualizationProxyProtocol.Tcp],
      dest_port: [null as number | null, Validators.required],
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
      io_bus: [DiskIoBus.Nvme, Validators.required],
    }) as FormGroup<{
      source: FormControl<string>;
      destination?: FormControl<string>;
      io_bus?: FormControl<DiskIoBus>;
      boot_priority?: FormControl<number>;
    }>;

    if (this.isVm()) {
      control.removeControl('destination');
    }

    if (this.isContainer()) {
      control.removeControl('io_bus');
    }

    this.form.controls.disks.push(control);
  }

  protected removeDisk(index: number): void {
    this.form.controls.disks.removeAt(index);
  }

  protected onSubmit(): void {
    this.createInstance().pipe(untilDestroyed(this)).subscribe({
      next: (instance) => {
        this.snackbar.success(this.translate.instant('Instance created'));
        this.router.navigate(['/instances', 'view', instance?.id]);
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

  private getPayload(): CreateVirtualizationInstance {
    const devices = this.getDevicesPayload();
    const values = this.form.getRawValue();

    let sourceType = VirtualizationSource.Image;
    if (values.volume_type === VolumeContentType.Iso) {
      sourceType = VirtualizationSource.Iso;
    } else if (values.volume_type === VolumeContentType.Block) {
      sourceType = VirtualizationSource.Volume;
    }

    const payload = {
      devices,
      autostart: true,
      instance_type: values.instance_type,
      enable_vnc: this.isVm() ? values.enable_vnc : false,
      vnc_port: this.isVm() && values.enable_vnc ? values.vnc_port || defaultVncPort : null,
      name: values.name,
      cpu: values.cpu,
      memory: values.memory || null,
      image: values.source_type === VirtualizationSource.Image ? values.image : null,
      storage_pool: values.storage_pool,
      // TODO: Messy, clean up on API side.
      source_type: sourceType,
      iso_volume: values.volume_type === VolumeContentType.Iso ? values.volume : null,
      volume: values.volume_type === VolumeContentType.Block ? values.volume : null,
      ...(this.isContainer() ? { environment: this.environmentVariablesPayload } : null),
    } as CreateVirtualizationInstance;

    if (this.isVm()) {
      payload.secure_boot = values.secure_boot;
      payload.root_disk_io_bus = values.root_disk_io_bus;
      payload.root_disk_size = values.root_disk_size;

      if (values.enable_vnc) {
        payload.vnc_password = values.vnc_password;
      }
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
    const disks = this.form.controls.disks.value.map((disk) => {
      const diskPayload = {
        dev_type: VirtualizationDeviceType.Disk,
        source: disk.source,
      };

      if (this.isContainer()) {
        return {
          ...diskPayload,
          destination: disk.destination,
        };
      }

      return {
        ...diskPayload,
        io_bus: disk.io_bus,
        boot_priority: this.form.controls.boot_from.value === disk.source ? 1 : 0,
      };
    });

    const usbDevices: { dev_type: VirtualizationDeviceType; product_id: string }[] = [];
    for (const productId of this.form.controls.usb_devices.value) {
      usbDevices.push({
        dev_type: VirtualizationDeviceType.Usb,
        product_id: productId,
      });
    }

    const gpuDevices: { pci: string; dev_type: VirtualizationDeviceType; gpu_type: VirtualizationGpuType }[] = [];
    for (const pci of this.form.controls.gpu_devices.value) {
      gpuDevices.push({
        pci,
        dev_type: VirtualizationDeviceType.Gpu,
        gpu_type: VirtualizationGpuType.Physical,
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

    const pciDevices = this.form.controls.pci_devices.value.map((pci) => ({
      dev_type: VirtualizationDeviceType.Pci,
      address: pci.value,
    }));

    const tpmDevice = [];
    if (this.isVm() && this.form.value.tpm) {
      tpmDevice.push({
        dev_type: VirtualizationDeviceType.Tpm,
      });
    }

    return [
      ...disks,
      ...proxies,
      ...macVlanNics,
      ...bridgedNics,
      ...usbDevices,
      ...gpuDevices,
      ...tpmDevice,
      ...pciDevices,
    ] as VirtualizationDevice[];
  }

  protected onAddPciPassthrough(): void {
    this.matDialog
      .open(PciPassthroughDialog, {
        minWidth: '90vw',
        data: {
          existingDeviceAddresses: this.form.getRawValue().pci_devices.map((device: Option) => device.value),
        },
      })
      .afterClosed()
      .pipe(untilDestroyed(this))
      .subscribe((addedDevices: Option<string>[] | undefined) => {
        if (!addedDevices?.length) {
          return;
        }

        this.form.patchValue({
          pci_devices: unionBy(this.form.controls.pci_devices.value, addedDevices, 'value'),
        });
      });
  }

  protected removePciDevice(address: string): void {
    this.form.patchValue({
      pci_devices: this.form.controls.pci_devices.value.filter((device: Option) => device.value !== address),
    });
  }

  protected readonly instancesHelptext = instancesHelptext;

  private listenForInstanceTypeChanges(): void {
    this.form.controls.instance_type.valueChanges.pipe(untilDestroyed(this)).subscribe((type) => {
      if (type === VirtualizationType.Container) {
        this.form.controls.source_type.setValue(VirtualizationSource.Image);
      }
      this.instanceType.set(type);

      this.form.controls.image.reset();
      this.form.controls.disks.clear();
      this.form.controls.proxies.clear();

      if (type === VirtualizationType.Container) {
        this.form.controls.cpu.setValidators(cpuValidator());
        this.form.controls.memory.clearValidators();
        this.form.controls.boot_from.clearValidators();
      } else {
        this.form.controls.cpu.setValidators([Validators.required, cpuValidator()]);
        this.form.controls.memory.setValidators([Validators.required]);
        this.form.controls.boot_from.setValidators([Validators.required]);
      }
    });
  }

  private listenForSourceTypeChanges(): void {
    this.form.controls.volume.disable();

    this.form.controls.source_type.valueChanges.pipe(untilDestroyed(this)).subscribe((type) => {
      this.form.controls.image.disable();
      this.form.controls.volume.disable();

      if (type === VirtualizationSource.Image) {
        this.form.controls.image.enable();
      } else if (type === VirtualizationSource.Iso) {
        this.form.controls.volume.enable();
      }
    });
  }
}
