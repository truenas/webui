import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, OnInit,
  inject, input, output, signal, viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormBuilder, FormControl, Validators, ReactiveFormsModule,
} from '@angular/forms';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import {
  InputType, TnBannerComponent, TnButtonComponent, TnCheckboxComponent, TnFormFieldComponent,
  TnFormSectionComponent, TnInputComponent, TnRadioComponent, TnRadioGroupComponent, TnSelectComponent,
} from '@truenas/ui-components';
import { BehaviorSubject, EMPTY, Observable, forkJoin, of } from 'rxjs';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import { macAddressInvalidMessage } from 'app/constants/mac-address.constant';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { DatasetType } from 'app/enums/dataset.enum';
import { ExplorerNodeType } from 'app/enums/explorer-type.enum';
import { mntPath } from 'app/enums/mnt-path.enum';
import { Role } from 'app/enums/role.enum';
import {
  VmDeviceType, vmDeviceTypeLabels, VmDiskMode, vmDiskModeLabels, VmNicType, vmNicTypeLabels,
  VmDisplayType,
} from 'app/enums/vm.enum';
import { isApiCallError, transformApiCallErrorMessage } from 'app/helpers/api.helper';
import { assertUnreachable } from 'app/helpers/assert-unreachable.utils';
import { choicesToOptions, nicChoicesToOptions, singleArrayToOptions } from 'app/helpers/operators/options.operators';
import { mapToOptions } from 'app/helpers/options.helper';
import { helptextDevice } from 'app/helptext/vm/devices/device-add-edit';
import { SelectOption } from 'app/interfaces/option.interface';
import {
  VmDevice, VmDeviceUpdate, VmDiskDevice,
} from 'app/interfaces/vm-device.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { SimpleAsyncComboboxProvider } from 'app/modules/forms/ix-forms/classes/simple-async-combobox-provider';
import { IxComboboxComponent } from 'app/modules/forms/ix-forms/components/ix-combobox/ix-combobox.component';
import { IxErrorsComponent } from 'app/modules/forms/ix-forms/components/ix-errors/ix-errors.component';
import { ExplorerCreateDatasetComponent } from 'app/modules/forms/ix-forms/components/ix-explorer/explorer-create-dataset/explorer-create-dataset.component';
import { IxExplorerComponent } from 'app/modules/forms/ix-forms/components/ix-explorer/ix-explorer.component';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { IxValidatorsService } from 'app/modules/forms/ix-forms/services/ix-validators.service';
import { FileValidatorService } from 'app/modules/forms/ix-forms/validators/file-validator/file-validator.service';
import { SidePanelHostForm } from 'app/modules/slide-ins/side-panel-form.directive';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { ApiService } from 'app/modules/websocket/api.service';
import {
  AnnotatedZvolOption, buildAnnotatedZvolOptions,
} from 'app/pages/vm/utils/build-annotated-zvol-options.utils';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';
import { FilesystemService } from 'app/services/filesystem.service';
import { NetworkService } from 'app/services/network.service';


const specifyCustom = T('Specify custom');

export interface DeviceFormData {
  virtualMachineId?: number;
  device?: VmDevice;
  vmName?: string;
}

@Component({
  selector: 'ix-device-form',
  templateUrl: './device-form.component.html',
  styleUrls: ['./device-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    AsyncPipe,
    ReactiveFormsModule,
    TnFormSectionComponent,
    TnFormFieldComponent,
    TnSelectComponent,
    TnInputComponent,
    TnCheckboxComponent,
    TnRadioComponent,
    TnRadioGroupComponent,
    IxExplorerComponent,
    ExplorerCreateDatasetComponent,
    IxComboboxComponent,
    RequiresRolesDirective,
    TnButtonComponent,
    IxErrorsComponent,
    TranslateModule,
    TnBannerComponent,
  ],
})
export class DeviceFormComponent implements OnInit, SidePanelHostForm {
  private formBuilder = inject(FormBuilder);
  private api = inject(ApiService);
  private translate = inject(TranslateService);
  private snackbar = inject(SnackbarService);
  private networkService = inject(NetworkService);
  private validators = inject(IxValidatorsService);
  private filesystemService = inject(FilesystemService);
  private formErrorHandler = inject(FormErrorHandlerService);
  private cdr = inject(ChangeDetectorRef);
  private dialogService = inject(DialogService);
  private errorHandler = inject(ErrorHandlerService);
  private fileValidator = inject(FileValidatorService);
  private destroyRef = inject(DestroyRef);

  /**
   * Device + VM context, supplied by the `<tn-side-panel>` host. Required: `onSend()` posts
   * `vm: this.virtualMachineId`, which is only ever assigned from this input, so a panel opened
   * without it would render a form that looks fine and then save against an undefined VM.
   */
  readonly deviceFormData = input.required<DeviceFormData>();

  /** Emitted to the hosting `<tn-side-panel>` after a successful save. */
  readonly closed = output<boolean>();

  readonly requiredRoles = [Role.VmDeviceWrite];
  protected readonly InputType = InputType;

  private readonly isLoading = signal(false);
  private vmName: string;

  /**
   * Gates the panel footer Save on the same controls `hasUnsavedChanges()` guards: the three
   * standalone controls live outside `typeSpecificForm` but are part of the same submission,
   * and `typeControl` carries `Validators.required`. They use `!.invalid` rather than `.valid`
   * because `.valid` is false for a *disabled* control, which would silently lock Save with
   * nothing on screen to explain it should a type-specific branch ever disable one of them.
   * `typeSpecificForm` keeps the `.valid` spelling so a PENDING async validator inside it
   * doesn't read as submittable.
   *
   * `typeControl` is checked first on purpose: `typeSpecificForm` is keyed off its value and
   * resolves to `undefined` for one outside `VmDeviceType`, so the short-circuit is what keeps
   * a cleared type from dereferencing it.
   */
  canSubmit(): boolean {
    return !this.typeControl.invalid
      && !this.orderControl.invalid
      && !this.newOrExistingControl.invalid
      && this.typeSpecificForm.valid
      && !this.isLoading();
  }

  /** Whether the form is currently submitting; the host shows a progress bar while true. */
  isBusy(): boolean {
    return this.isLoading();
  }

  /**
   * `isLoading` is only ever set around a submit (this form has no initial load), so it
   * doubles as the host's "Saving…" signal for the footer Save.
   */
  isSubmitting(): boolean {
    return this.isLoading();
  }

  /**
   * Entry point for the `<tn-side-panel>` footer Save. Gated here rather than relying on the
   * host disabling the button, so the invariant lives in the one component that owns the forms —
   * and so a second click during the PCI pre-flight window can't fire a duplicate create.
   */
  submit(): void {
    if (!this.canSubmit()) {
      return;
    }
    this.confirmAndSend();
  }

  hasUnsavedChanges(): boolean {
    // The three standalone controls live outside `typeSpecificForm` but are rendered in the
    // same panel, so edits confined to them must still trip the host's close guard.
    //
    // `typeSpecificForm` is guarded by the type check rather than read with `?.`: the getter is
    // keyed off `typeControl` and its default branch calls `assertUnreachable`, which logs on
    // every pass. This guard is the host's close guard, so it can run repeatedly for one dismissal
    // (backdrop, Escape, X) — checking the value up front keeps a cleared type off that branch
    // entirely instead of logging each time.
    return this.typeControl.dirty
      || this.orderControl.dirty
      || this.newOrExistingControl.dirty
      || (this.typeControl.value !== null && this.typeSpecificForm.dirty);
  }

  get isNew(): boolean {
    return !this.existingDevice;
  }

  getCurrentDisplayType(): VmDisplayType | null {
    if (!this.isNew && this.existingDevice?.attributes?.dtype === VmDeviceType.Display) {
      return this.existingDevice.attributes.type;
    }
    return this.displayForm.value.type || null;
  }

  protected getCurrentDisplayTypeLabel(): string {
    const displayType = this.getCurrentDisplayType();
    if (displayType === VmDisplayType.Spice) {
      return 'SPICE';
    }
    if (displayType === VmDisplayType.Vnc) {
      return 'VNC';
    }
    return this.translate.instant('Unknown');
  }

  private updateDisplayFormForType(displayType: VmDisplayType | null): void {
    if (displayType === VmDisplayType.Vnc) {
      // VNC-specific: disable web interface, set maxLength for password
      this.displayForm.controls.web.patchValue(false);
      this.displayForm.controls.web.disable();
      this.displayForm.controls.web_port.disable();
      this.displayForm.controls.bind.setValidators([Validators.required]);
      this.displayForm.controls.password.setValidators([Validators.required, Validators.maxLength(8)]);
    } else if (displayType === VmDisplayType.Spice) {
      // SPICE: enable web interface, remove maxLength restriction
      this.displayForm.controls.web.enable();
      this.displayForm.controls.bind.setValidators([Validators.required]);
      this.displayForm.controls.password.setValidators([Validators.required]);
    } else {
      // No display type selected: clear validators for bind and password
      this.displayForm.controls.bind.clearValidators();
      this.displayForm.controls.password.clearValidators();
    }

    // Update validation state
    this.displayForm.controls.bind.updateValueAndValidity();
    this.displayForm.controls.password.updateValueAndValidity();
  }

  existingDevice: VmDevice;
  private hostData: DeviceFormData;

  readonly rawFileExplorer = viewChild<IxExplorerComponent>('rawFileExplorer');

  typeControl = new FormControl(VmDeviceType.Cdrom, Validators.required);
  orderControl = new FormControl(null as number | null);
  newOrExistingControl = new FormControl<'new' | 'existing'>('existing');

  cdromForm = this.formBuilder.nonNullable.group({
    path: [mntPath, Validators.required],
  });

  diskForm = this.formBuilder.group({
    path: ['', Validators.required],
    datastore: [''],
    volsize: [null as number | null],
    type: [null as VmDiskMode | null],
    sectorsize: [0],
  });

  nicForm = this.formBuilder.group({
    type: [null as VmNicType | null, Validators.required],
    mac: ['', this.validators.withMessage(
      Validators.pattern(this.networkService.macRegex),
      this.translate.instant(macAddressInvalidMessage),
    )],
    nic_attach: ['', Validators.required],
    trust_guest_rx_filters: [false],
  });

  rawFileForm = this.formBuilder.group({
    path: ['', [Validators.required, this.fileValidator.fileIsSelectedInExplorer(this.rawFileExplorer)]],
    sectorsize: [0],
    type: [null as VmDiskMode | null],
    // `tn-input` in `InputType.Size` mode emits the parsed byte count (or null for empty /
    // unparseable text), so this is a plain number the API can take as-is.
    size: [null as number | null],
    exists: [false as boolean | null],
  });

  pciForm = this.formBuilder.nonNullable.group({
    pptdev: ['', Validators.required],
  });

  displayForm = this.formBuilder.group({
    type: [null as VmDisplayType | null, Validators.required],
    bind: [''],
    password: [''],
    resolution: ['1920x1080'],
    port: [null as number | null],
    web: [true],
    web_port: [null as number | null, [Validators.min(5900), Validators.max(65535)]],
  });

  usbForm = this.formBuilder.group({
    controller_type: ['', Validators.required],
    device: ['', Validators.required],
    usb: this.formBuilder.group({
      vendor_id: ['', Validators.required],
      product_id: ['', Validators.required],
    }),
  });

  readonly helptext = helptextDevice;
  readonly VmDeviceType = VmDeviceType;
  readonly VmDisplayType = VmDisplayType;

  readonly newOrExistingOptions = [
    { label: this.translate.instant('Create new disk image'), value: 'new' as const },
    { label: this.translate.instant('Use existing disk image'), value: 'existing' as const },
  ];

  readonly datastoreOptions$ = this.api
    .call('pool.filesystem_choices', [[DatasetType.Filesystem]])
    .pipe(singleArrayToOptions());

  readonly usbDeviceOptions$ = this.api.call('vm.device.usb_passthrough_choices').pipe(
    map((usbDevices) => {
      const options = Object.entries(usbDevices).map(([id, device]) => {
        let label = id;
        label += device.capability?.product ? ` ${device.capability.product}` : '';
        label += device.capability?.vendor ? ` (${device.capability.vendor})` : '';
        return { label, value: id };
      });
      options.push({
        label: this.translate.instant(specifyCustom),
        value: specifyCustom,
      });
      return options;
    }),
  );

  readonly usbControllerOptions$ = this.api.call('vm.device.usb_controller_choices').pipe(
    map((usbControllers) => {
      return Object.entries(usbControllers).map(([key, controller]) => {
        return {
          label: controller,
          value: key,
        };
      });
    }),
  );

  readonly bindOptions$ = this.api.call('vm.device.bind_choices').pipe(choicesToOptions());
  readonly resolutions$ = this.api.call('vm.resolution_choices').pipe(choicesToOptions());
  readonly nicOptions$ = this.api.call('vm.device.nic_attach_choices').pipe(nicChoicesToOptions());
  readonly nicTypes$ = of(mapToOptions(vmNicTypeLabels, this.translate));
  readonly displayTypes$ = new BehaviorSubject<{ label: string; value: VmDisplayType }[]>([]);

  readonly passthroughProvider = new SimpleAsyncComboboxProvider(
    this.api.call('vm.device.passthrough_device_choices').pipe(
      map((passthroughDevices) => {
        return Object.keys(passthroughDevices).map((id) => {
          return {
            label: passthroughDevices[id].description || id,
            value: id,
          };
        });
      }),
    ),
  );

  zvolOptions$: Observable<SelectOption[]>;
  private annotatedZvolOptions: AnnotatedZvolOption[] = [];

  readonly fileNodeProvider = this.filesystemService.getFilesystemNodeProvider();

  readonly deviceTypeOptions = mapToOptions(vmDeviceTypeLabels, this.translate);
  readonly deviceTypes$ = new BehaviorSubject(this.deviceTypeOptions);

  readonly diskModes$ = of(mapToOptions(vmDiskModeLabels, this.translate));
  readonly sectorSizes$ = of([
    { label: this.translate.instant('Default'), value: 0 },
    { label: '512', value: 512 },
    { label: '4096', value: 4096 },
  ]);

  get typeSpecificForm(): DeviceFormComponent['cdromForm']
    | DeviceFormComponent['diskForm']
    | DeviceFormComponent['nicForm']
    | DeviceFormComponent['rawFileForm']
    | DeviceFormComponent['pciForm']
    | DeviceFormComponent['usbForm']
    | DeviceFormComponent['displayForm'] {
    switch (this.typeControl.value) {
      case VmDeviceType.Cdrom:
        return this.cdromForm;
      case VmDeviceType.Disk:
        return this.diskForm;
      case VmDeviceType.Nic:
        return this.nicForm;
      case VmDeviceType.Raw:
        return this.rawFileForm;
      case VmDeviceType.Pci:
        return this.pciForm;
      case VmDeviceType.Usb:
        return this.usbForm;
      case VmDeviceType.Display:
        return this.displayForm;
      default:
        assertUnreachable(this.typeControl.value);
        return undefined;
    }
  }

  private virtualMachineId: number;

  get selectedZvolOtherVmNames(): string[] {
    const selectedPath = this.diskForm.controls.path.value;
    const match = this.annotatedZvolOptions.find((opt) => opt.value === selectedPath);
    return match?.otherVmNames ?? [];
  }

  /**
   * Resolves the host-supplied context and derives the zvol options from it. Runs at the top of
   * `ngOnInit` rather than in the constructor because the `deviceFormData` input the
   * `<tn-side-panel>` host sets is only populated before `ngOnInit`.
   */
  private resolveHostData(): void {
    this.hostData = this.deviceFormData();
    this.vmName = this.hostData.vmName;

    const existingDiskPath = this.hostData.device?.attributes?.dtype === VmDeviceType.Disk
      ? (this.hostData.device as VmDiskDevice).attributes.path
      : null;

    this.zvolOptions$ = forkJoin([
      this.api.call('vm.device.disk_choices'),
      this.api.call('vm.device.query'),
      this.api.call('vm.query', [[], { select: ['id', 'name'] }]),
    ]).pipe(
      tap(([choices, allDevices, vms]) => {
        const diskDevices = allDevices.filter(
          (device): device is VmDiskDevice => device.attributes.dtype === VmDeviceType.Disk,
        );
        this.annotatedZvolOptions = buildAnnotatedZvolOptions(
          choices,
          diskDevices,
          vms,
          this.hostData.virtualMachineId ?? null,
          existingDiskPath,
        );
      }),
      map(() => this.annotatedZvolOptions.map((option) => this.toSelectOption(option))),
      catchError(() => of([])),
    );
  }

  ngOnInit(): void {
    this.resolveHostData();

    this.usbForm.controls.usb.disable();
    this.usbForm.controls.device.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((device) => {
      if (device === specifyCustom) {
        this.usbForm.controls.usb.enable();
      } else {
        this.usbForm.controls.usb.disable();
      }
    });

    // Handle display type changes for new devices
    if (this.isNew) {
      this.displayForm.controls.type.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((displayType) => {
        this.updateDisplayFormForType(displayType);
      });

      // Initialize display form with no validators since no type is selected
      this.updateDisplayFormForType(null);
    }

    this.newOrExistingControl.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((value) => {
      this.setDiskFormValidators(value as 'new' | 'existing');
    });

    if (this.hostData.virtualMachineId) {
      this.virtualMachineId = this.hostData.virtualMachineId;
      this.setVirtualMachineId();
    }

    if (this.hostData.device) {
      this.existingDevice = this.hostData.device;
      this.setDeviceForEdit();
    }

    this.handleDeviceTypeChange();
    this.setupRawFileExistsTracking();
  }

  private toSelectOption(option: AnnotatedZvolOption): SelectOption {
    if (option.usedByCurrentVm) {
      return {
        label: `${option.label} (${this.translate.instant('attached')})`,
        value: option.value,
        disabled: true,
      };
    }
    return { label: option.label, value: option.value };
  }

  setVirtualMachineId(): void {
    this.hideDisplayIfCannotBeAdded();
  }

  setDeviceForEdit(): void {
    this.typeControl.setValue(this.existingDevice.attributes.dtype);
    this.orderControl.setValue(this.existingDevice.order);
    switch (this.existingDevice.attributes.dtype) {
      case VmDeviceType.Pci:
        this.pciForm.patchValue(this.existingDevice.attributes);
        break;
      case VmDeviceType.Raw:
        this.rawFileForm.patchValue({
          ...this.existingDevice.attributes,
          sectorsize: this.existingDevice.attributes.logical_sectorsize === null
            ? 0
            : this.existingDevice.attributes.logical_sectorsize,
          exists: true,
        });
        break;
      case VmDeviceType.Nic:
        this.nicForm.patchValue(this.existingDevice.attributes);
        break;
      case VmDeviceType.Display:
        this.displayForm.patchValue({
          type: this.existingDevice.attributes.type,
          bind: this.existingDevice.attributes.bind,
          password: this.existingDevice.attributes.password,
          resolution: this.existingDevice.attributes.resolution,
          port: this.existingDevice.attributes.port,
          web: this.existingDevice.attributes.web,
          web_port: this.existingDevice.attributes.web_port,
        });
        // Configure form for the specific display type
        this.updateDisplayFormForType(this.existingDevice.attributes.type);
        break;
      case VmDeviceType.Disk:
        this.diskForm.patchValue({
          ...this.existingDevice.attributes,
          sectorsize: this.existingDevice.attributes.logical_sectorsize === null
            ? 0
            : this.existingDevice.attributes.logical_sectorsize,
        });
        break;
      case VmDeviceType.Cdrom:
        this.cdromForm.patchValue(this.existingDevice.attributes);
        break;
      case VmDeviceType.Usb:
        if (!this.existingDevice.attributes.device) {
          this.existingDevice.attributes.device = specifyCustom;
        }
        this.usbForm.patchValue(this.existingDevice.attributes);
        break;
      default:
        assertUnreachable(this.existingDevice as never);
    }
  }

  generateMacAddress(): void {
    this.api.call('vm.random_mac').pipe(
      this.errorHandler.withErrorHandler(),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe((randomMac) => {
      this.nicForm.patchValue({ mac: randomMac });
    });
  }

  handleDeviceTypeChange(): void {
    this.typeControl.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((type) => {
      if (type === VmDeviceType.Nic && this.nicForm.value.mac === '') {
        this.generateMacAddress();
      }
    });
  }

  /**
   * Tracks when a file is selected from the explorer and updates the exists field.
   * - Sets exists to true when a file is selected from the tree
   * - Sets exists to false when a directory is selected or path is cleared
   * - Does not update exists when path is manually typed (handled by shouldIncludeExistsField)
   */
  setupRawFileExistsTracking(): void {
    this.rawFileForm.controls.path.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      const explorer = this.rawFileExplorer();
      const selectedNode = explorer?.lastSelectedNode();

      if (selectedNode?.type === ExplorerNodeType.File) {
        // User selected an existing file from the tree
        this.rawFileForm.patchValue({ exists: true }, { emitEvent: false });
      } else if (selectedNode?.type === ExplorerNodeType.Directory) {
        // User selected a directory - reset exists
        this.rawFileForm.patchValue({ exists: false }, { emitEvent: false });
      } else if (!this.rawFileForm.value.path) {
        // Path was cleared - reset exists
        this.rawFileForm.patchValue({ exists: false }, { emitEvent: false });
      }
      // Note: if no node selected (manual typing), don't update exists here
    });

    // set up a subscription that updates the *path field's* validity upon changing the size field, since
    // if the user were to submit a nonexistent path without a size, (which is allowed) it would affect
    // the path field with an API error asking the user to provide the size. so, providing the size should
    // clear the error message.
    this.rawFileForm.controls.size.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((size) => {
      if (size) {
        this.rawFileForm.controls.path.updateValueAndValidity();
      }
    });

    // update the validity immediately on setup
    this.rawFileForm.controls.path.updateValueAndValidity({ emitEvent: false });
  }

  /**
   * Determines whether to include the 'exists' field in the raw file device attributes.
   *
   * Logic:
   * 1. Editing existing device: always include exists: true
   * 2. File selected from explorer: include exists: true
   * 3. Creating new file (size specified): omit exists (backend will create file)
   * 4. Manual path without size: assume existing file, include exists: true
   *
   * @returns true if exists field should be included in the API call
   */
  private shouldIncludeExistsField(): boolean {
    // If editing an existing device, always include exists: true
    if (!this.isNew) {
      return true;
    }

    const explorer = this.rawFileExplorer();
    const selectedNode = explorer?.lastSelectedNode();
    const hasSize = !!this.rawFileForm.value.size;

    // User selected an existing file from the tree
    if (selectedNode?.type === ExplorerNodeType.File) {
      return true;
    }

    // Creating a new file (size is specified) - don't include exists
    if (hasSize) {
      return false;
    }

    // Path was typed manually and no size specified - assume existing file
    return true;
  }

  /**
   * Implicit form submission (Enter in a field); delegates to the same gated entry point as the
   * panel footer Save so there is one gate rather than two that can drift. The gate matters more
   * here than on the footer: the container's busy overlay blocks the mouse, not the keyboard, so
   * a second Enter would otherwise fire a duplicate create while a submit is in flight.
   */
  protected onSubmit(event: SubmitEvent): void {
    event.preventDefault();
    this.submit();
  }

  /**
   * Submits, first confirming with the user when a PCI passthrough device has no reset
   * mechanism.
   *
   * The busy flag is raised before the pre-flight calls rather than inside `onSend()`, so that
   * the footer Save is disabled (and the panel shows progress) for the whole window instead of
   * only once the create/update starts — otherwise a second click during the two round-trips
   * and the confirmation dialog could stack another dialog and a duplicate create.
   */
  private confirmAndSend(): void {
    if (this.typeControl.value !== VmDeviceType.Pci) {
      this.onSend();
      return;
    }

    this.isLoading.set(true);

    this.confirmPciResetMechanism()
      .pipe(
        // Spelled out rather than `withErrorHandler()` because a failed pre-flight call has to
        // release the busy flag as well — that operator swallows the failure into EMPTY, which
        // never reaches the subscriber below and would leave the form locked.
        catchError((error: unknown) => {
          this.isLoading.set(false);
          this.errorHandler.showErrorModal(error);
          return EMPTY;
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((confirmed) => {
        if (!confirmed) {
          this.isLoading.set(false);
          return;
        }
        // `onSend()` takes over the flag that is already raised.
        this.onSend();
      });
  }

  /**
   * Emits whether the PCI device may be submitted: `true` outright when it has a reset mechanism
   * (or is an isolated GPU), otherwise whatever the user answers in the warning dialog.
   */
  private confirmPciResetMechanism(): Observable<boolean> {
    return forkJoin([
      this.api.call('vm.device.passthrough_device_choices'),
      this.api.call('system.advanced.config'),
    ]).pipe(
      switchMap(([passthroughDevices, advancedConfig]) => {
        const dev = this.pciForm.controls.pptdev.value;
        if (passthroughDevices[dev]?.reset_mechanism_defined || advancedConfig.isolated_gpu_pci_ids.includes(dev)) {
          return of(true);
        }

        return this.dialogService.confirm({
          title: this.translate.instant('Warning'),
          message: this.translate.instant('PCI device does not have a reset mechanism defined and you may experience inconsistent/degraded behavior when starting/stopping the VM.'),
        });
      }),
    );
  }

  private onSend(): void {
    this.isLoading.set(true);

    const update: VmDeviceUpdate = {
      vm: this.virtualMachineId,
      order: this.orderControl.value,
      attributes: this.getUpdateAttributes(),
    };

    const request$ = this.isNew
      ? this.api.call('vm.device.create', [update])
      : this.api.call('vm.device.update', [this.existingDevice.id, update]);

    request$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          if (this.isNew) {
            this.snackbar.success(this.translate.instant('Device added'));
          } else {
            this.snackbar.success(this.translate.instant('Device updated'));
          }
          this.isLoading.set(false);
          this.closed.emit(true);
        },
        error: (error: unknown) => {
          this.handleFormError(error);
          this.isLoading.set(false);
          // Unlike the success path — where `isLoading` is a signal and `closed` tears the panel
          // down anyway — `handleValidationErrors` writes errors onto the form controls, which
          // are not signals, so OnPush needs telling.
          this.cdr.markForCheck();
        },
      });
  }

  /**
   * helper function for processing form errors coming from the API.
   * currently has the following behavior:
   *   * if we get an API error while on the raw device form, transform the error message
   *     'Path must exist when "exists" is set' to something more user-friendly.
   *   * otherwise, propagate the error normally to `handleValidationErrors`.
   */
  private handleFormError(error: unknown): void {
    if (this.typeControl.value === VmDeviceType.Raw && isApiCallError(error)) {
      const transformedError = transformApiCallErrorMessage(
        error,
        'Path must exist when "exists" is set',
        this.translate.instant('The specified file path does not exist. Please select an existing file or specify a file size to create a new file.'),
      );
      this.formErrorHandler.handleValidationErrors(transformedError, this.rawFileForm);
    } else {
      this.formErrorHandler.handleValidationErrors(error, this.typeSpecificForm);
    }
  }

  private setDiskFormValidators(mode: 'new' | 'existing'): void {
    if (mode === 'new') {
      this.diskForm.controls.datastore.setValidators(Validators.required);
      this.diskForm.controls.volsize.setValidators(Validators.required);
      this.diskForm.controls.path.clearValidators();
    } else {
      this.diskForm.controls.path.setValidators(Validators.required);
      this.diskForm.controls.datastore.clearValidators();
      this.diskForm.controls.volsize.clearValidators();
    }
    this.diskForm.controls.path.updateValueAndValidity();
    this.diskForm.controls.datastore.updateValueAndValidity();
    this.diskForm.controls.volsize.updateValueAndValidity();
  }

  private getUpdateAttributes(): VmDeviceUpdate['attributes'] {
    const values = {
      ...this.typeSpecificForm.value,
      dtype: this.typeControl.value,
    };

    if ('device' in values && values.device === specifyCustom) {
      values.device = null;
    }

    if ('sectorsize' in values) {
      const { sectorsize, ...otherAttributes } = values;
      // Remove exists from otherAttributes if present
      if ('exists' in otherAttributes) {
        delete (otherAttributes as { exists?: boolean }).exists;
      }

      // Handle creating a new zvol for disk devices
      if (this.typeControl.value === VmDeviceType.Disk && this.newOrExistingControl.value === 'new') {
        const randomSuffix = crypto.randomUUID().slice(0, 8);
        const vmName = this.vmName?.replace(/\s+/g, '-') || 'vm';
        const zvolName = `${this.diskForm.value.datastore}/${vmName}-${randomSuffix}`;

        return {
          dtype: VmDeviceType.Disk,
          create_zvol: true,
          zvol_name: zvolName,
          zvol_volsize: this.diskForm.value.volsize,
          type: this.diskForm.value.type,
          logical_sectorsize: sectorsize === 0 ? null : sectorsize,
          physical_sectorsize: sectorsize === 0 ? null : sectorsize,
        } as VmDeviceUpdate['attributes'];
      }

      // Remove datastore and volsize from disk device attributes (only used for create-new)
      if ('datastore' in otherAttributes) {
        delete (otherAttributes as { datastore?: string }).datastore;
      }
      if ('volsize' in otherAttributes) {
        delete (otherAttributes as { volsize?: number | null }).volsize;
      }

      const attributes = {
        ...otherAttributes,
        logical_sectorsize: sectorsize === 0 ? null : sectorsize,
        physical_sectorsize: sectorsize === 0 ? null : sectorsize,
      };

      // Include exists field for raw file devices when file exists
      if (this.typeControl.value === VmDeviceType.Raw && this.shouldIncludeExistsField()) {
        (attributes as { exists?: boolean }).exists = true;
      }

      return attributes as VmDeviceUpdate['attributes'];
    }

    // Handle display device attributes
    if (this.typeControl.value === VmDeviceType.Display) {
      const displayValues = this.displayForm.value;
      return {
        dtype: VmDeviceType.Display,
        type: displayValues.type,
        bind: displayValues.bind,
        password: displayValues.password,
        resolution: displayValues.resolution,
        port: displayValues.port,
        web: displayValues.type === VmDisplayType.Spice ? displayValues.web : false,
        web_port: displayValues.type === VmDisplayType.Spice ? displayValues.web_port : null,
      } as VmDeviceUpdate['attributes'];
    }

    return values as VmDeviceUpdate['attributes'];
  }

  /**
   * Only one display of each type can be added.
   */
  private hideDisplayIfCannotBeAdded(): void {
    this.api.call('vm.get_display_devices', [this.virtualMachineId])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((devices) => {
        const spiceDevices = devices.filter((device) => device.attributes.type === VmDisplayType.Spice);
        const vncDevices = devices.filter((device) => device.attributes.type === VmDisplayType.Vnc);

        // If editing an existing device, allow the current device type
        if (this.existingDevice && this.existingDevice.attributes.dtype === VmDeviceType.Display) {
          const currentType = this.existingDevice.attributes.type;
          const availableTypes = [
            { label: 'SPICE', value: VmDisplayType.Spice },
            { label: 'VNC', value: VmDisplayType.Vnc },
          ].filter((type) => type.value === currentType
            || (type.value === VmDisplayType.Spice && spiceDevices.length === 0)
            || (type.value === VmDisplayType.Vnc && vncDevices.length === 0));
          this.displayTypes$.next(availableTypes);
          return;
        }

        // For new devices, show available display types
        const availableTypes = [
          { label: 'SPICE', value: VmDisplayType.Spice },
          { label: 'VNC', value: VmDisplayType.Vnc },
        ].filter((type) => (type.value === VmDisplayType.Spice && spiceDevices.length === 0)
          || (type.value === VmDisplayType.Vnc && vncDevices.length === 0));

        this.displayTypes$.next(availableTypes);

        // Auto-select display type if only one is available
        if (availableTypes.length === 1 && this.isNew) {
          const singleAvailableType = availableTypes[0].value;
          this.displayForm.patchValue({ type: singleAvailableType });
          this.displayForm.controls.type.markAsTouched();
          this.displayForm.controls.type.updateValueAndValidity();
          this.updateDisplayFormForType(singleAvailableType);
        }

        // Hide display option from device type dropdown if no display types are available
        if (availableTypes.length === 0) {
          const optionsWithoutDisplay = this.deviceTypeOptions.filter(
            (option) => option.value !== VmDeviceType.Display,
          );
          this.deviceTypes$.next(optionsWithoutDisplay);
        } else {
          // Ensure display option is available in device type dropdown
          this.deviceTypes$.next(this.deviceTypeOptions);
        }
      });
  }
}
