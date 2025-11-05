import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, computed, OnInit, signal, inject,
} from '@angular/core';
import {
  FormBuilder, ReactiveFormsModule, Validators,
} from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Observable, of } from 'rxjs';
import { datasetsRootNode, zvolsRootNode } from 'app/constants/basic-root-nodes.constant';
import {
  ContainerDeviceType,
  containerDeviceTypeLabels,
} from 'app/enums/container.enum';
import { instancesHelptext } from 'app/helptext/instances/instances';
import {
  ContainerDevice,
  ContainerDiskDevice,
  ContainerFilesystemDevice,
  ContainerInstance,
  ContainerRawDevice,
} from 'app/interfaces/container.interface';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxCheckboxComponent } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.component';
import {
  ExplorerCreateDatasetComponent,
} from 'app/modules/forms/ix-forms/components/ix-explorer/explorer-create-dataset/explorer-create-dataset.component';
import { IxExplorerComponent } from 'app/modules/forms/ix-forms/components/ix-explorer/ix-explorer.component';
import { IxFieldsetComponent } from 'app/modules/forms/ix-forms/components/ix-fieldset/ix-fieldset.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { IxRadioGroupComponent } from 'app/modules/forms/ix-forms/components/ix-radio-group/ix-radio-group.component';
import { IxSelectComponent } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.component';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { ModalHeaderComponent } from 'app/modules/slide-ins/components/modal-header/modal-header.component';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';
import {
  containerPathValidator,
  diskPathValidator,
  poolPathValidator,
  rawFilePathValidator,
} from 'app/pages/instances/utils/storage-device-validators';
import { FilesystemService } from 'app/services/filesystem.service';

const bytesPerGib = 1024 ** 3;

type StorageDevice = ContainerDiskDevice | ContainerRawDevice | ContainerFilesystemDevice;

interface InstanceDiskFormOptions {
  instance: ContainerInstance;
  disk: StorageDevice | undefined;
}

@UntilDestroy()
@Component({
  selector: 'ix-instance-disk-form',
  styleUrls: ['./instance-disk-form.component.scss'],
  templateUrl: './instance-disk-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    IxCheckboxComponent,
    IxExplorerComponent,
    IxInputComponent,
    IxRadioGroupComponent,
    IxSelectComponent,
    ReactiveFormsModule,
    TranslateModule,
    MatCard,
    MatCardContent,
    ModalHeaderComponent,
    IxFieldsetComponent,
    FormActionsComponent,
    MatButton,
    TestDirective,
    ExplorerCreateDatasetComponent,
  ],
})
export class InstanceDiskFormComponent implements OnInit {
  private formBuilder = inject(FormBuilder);
  private errorHandler = inject(FormErrorHandlerService);
  private api = inject(ApiService);
  private translate = inject(TranslateService);
  private snackbar = inject(SnackbarService);
  private filesystem = inject(FilesystemService);
  private cdr = inject(ChangeDetectorRef);
  slideInRef = inject<SlideInRef<InstanceDiskFormOptions, boolean>>(SlideInRef);

  private existingDisk = signal<StorageDevice | null>(null);

  protected readonly isLoading = signal(false);

  private isInitializing = false;

  readonly datasetProvider = this.filesystem.getFilesystemNodeProvider({ datasetsOnly: true });
  readonly fileProvider = this.filesystem.getFilesystemNodeProvider();

  protected form = this.formBuilder.nonNullable.group({
    device_type: [
      ContainerDeviceType.Filesystem as
      | ContainerDeviceType.Disk
      | ContainerDeviceType.Raw
      | ContainerDeviceType.Filesystem,
      Validators.required,
    ],
    path: [''], // For DISK and RAW devices (zvol or file path)
    type: ['VIRTIO' as 'AHCI' | 'VIRTIO'], // Disk controller type
    create_zvol: [false], // For DISK devices - whether to create a new zvol
    zvol_parent: [''], // For DISK devices - parent dataset path when creating zvol
    zvol_name: [''], // For DISK devices - zvol name (just the name) when creating
    zvol_volsize: [null as number | null], // For DISK devices - zvol size in GiB
    exists: [false], // For RAW devices - whether to use existing file
    boot: [false], // Whether disk should be marked as bootable (RAW only)
    size: [null as number | null], // For RAW devices (size in GiB)
    logical_sectorsize: [null as 512 | 4096 | null], // Logical sector size
    physical_sectorsize: [null as 512 | 4096 | null], // Physical sector size
    iotype: [null as 'NATIVE' | 'THREADS' | 'IO_URING' | null], // I/O backend type
    serial: [''], // Serial number for virtual disk
    source: [''], // For FILESYSTEM devices (host directory)
    target: [''], // For FILESYSTEM devices (container mount point)
  });

  protected readonly deviceTypeOptions$ = of([
    {
      label: this.translate.instant(containerDeviceTypeLabels.get(ContainerDeviceType.Disk)),
      value: ContainerDeviceType.Disk,
      tooltip: instancesHelptext.deviceTypes.diskTooltip,
    },
    {
      label: this.translate.instant(containerDeviceTypeLabels.get(ContainerDeviceType.Raw)),
      value: ContainerDeviceType.Raw,
      tooltip: instancesHelptext.deviceTypes.rawTooltip,
    },
    {
      label: this.translate.instant(containerDeviceTypeLabels.get(ContainerDeviceType.Filesystem)),
      value: ContainerDeviceType.Filesystem,
      tooltip: instancesHelptext.deviceTypes.filesystemTooltip,
    },
  ]);

  protected readonly diskTypeOptions$ = of([
    { label: this.translate.instant(instancesHelptext.diskFormOptions.virtio), value: 'VIRTIO' },
    { label: this.translate.instant(instancesHelptext.diskFormOptions.ahci), value: 'AHCI' },
  ]);

  protected readonly sectorsizeOptions$ = of([
    { label: '512', value: 512 },
    { label: '4096', value: 4096 },
  ]);

  protected readonly iotypeOptions$ = of([
    { label: this.translate.instant(instancesHelptext.diskFormOptions.native), value: 'NATIVE' },
    { label: this.translate.instant(instancesHelptext.diskFormOptions.threads), value: 'THREADS' },
    { label: this.translate.instant(instancesHelptext.diskFormOptions.ioUring), value: 'IO_URING' },
  ]);

  protected readonly zvolsRootNode = [zvolsRootNode];
  protected readonly datasetsRootNode = [datasetsRootNode];

  protected isNew = computed(() => !this.existingDisk());

  protected title = computed(() => {
    const existingDisk = this.existingDisk();
    if (!existingDisk) {
      return this.translate.instant('Add Storage Device');
    }
    const deviceType = this.translate.instant(containerDeviceTypeLabels.get(existingDisk.dtype));
    return this.translate.instant('Edit {deviceType}', { deviceType });
  });

  protected get instance(): ContainerInstance {
    return this.slideInRef.getData().instance;
  }

  protected get selectedDeviceType(): ContainerDeviceType {
    return this.form.controls.device_type.value;
  }

  protected get isDiskDevice(): boolean {
    return this.selectedDeviceType === ContainerDeviceType.Disk;
  }

  protected get isRawDevice(): boolean {
    return this.selectedDeviceType === ContainerDeviceType.Raw;
  }

  protected get isFilesystemDevice(): boolean {
    return this.selectedDeviceType === ContainerDeviceType.Filesystem;
  }

  constructor() {
    this.slideInRef.requireConfirmationWhen(() => {
      return of(this.form.dirty);
    });

    // Update field requirements based on device type
    this.form.controls.device_type.valueChanges.pipe(untilDestroyed(this)).subscribe((deviceType) => {
      // Only clear fields when user is switching device types during creation, not during initialization
      const shouldClearFields = !this.isInitializing;
      this.updateFieldRequirements(deviceType, shouldClearFields);
    });

    // Update size field requirement based on exists checkbox for RAW devices
    this.form.controls.exists.valueChanges.pipe(untilDestroyed(this)).subscribe((exists) => {
      // Only clear fields when user is toggling during editing, not during initialization
      if (!this.isInitializing) {
        // Always clear path when toggling between modes
        this.form.controls.path.setValue('');
        if (!exists) {
          // Switching to create new file mode - also clear size
          this.form.controls.size.setValue(null);
        }
      }
      this.updateSizeValidation();
    });

    // Update zvol fields requirement based on create_zvol checkbox for DISK devices
    this.form.controls.create_zvol.valueChanges.pipe(untilDestroyed(this)).subscribe((createZvol) => {
      // Only clear fields when user is toggling during creation, not during initialization
      if (!this.isInitializing) {
        if (createZvol) {
          // Switching to create mode - clear path
          this.form.controls.path.setValue('');
        } else {
          // Switching to use existing mode - clear zvol fields
          this.form.controls.zvol_parent.setValue('');
          this.form.controls.zvol_name.setValue('');
          this.form.controls.zvol_volsize.setValue(null);
        }
      }
      this.updateZvolValidation();
    });
  }

  ngOnInit(): void {
    const disk = this.slideInRef.getData()?.disk;
    if (disk) {
      this.existingDisk.set(disk);

      /**
       * Initialization flow for editing existing devices:
       * 1. Set isInitializing flag to prevent valueChanges handlers from clearing fields
       * 2. Build form data from existing device
       * 3. Set device_type and checkboxes with { emitEvent: false } to avoid triggering handlers
       * 4. Update validators based on device type
       * 5. Trigger change detection to ensure template renders correct inputs (explorer vs readonly)
       * 6. Disable device_type field (cannot be changed when editing)
       * 7. Patch form values into the now-rendered inputs
       * 8. Clear isInitializing flag to allow normal valueChanges behavior
       */
      this.isInitializing = true;

      // Build patchValue object (device_type and checkboxes are set separately with emitEvent: false)
      const patchValue = this.buildPatchValueFromDisk(disk);

      // Step 3: Set device_type and checkboxes without emitting events to prevent valueChanges handlers
      this.form.controls.device_type.setValue(disk.dtype, { emitEvent: false });

      if (disk.dtype === ContainerDeviceType.Disk) {
        this.form.controls.create_zvol.setValue(disk.create_zvol ?? false, { emitEvent: false });
      } else if (disk.dtype === ContainerDeviceType.Raw) {
        // When editing, the file already exists regardless of how it was originally created
        this.form.controls.exists.setValue(true, { emitEvent: false });
      }

      // Step 4: Update validators based on device type and checkbox values
      this.updateFieldRequirements(disk.dtype, false);

      // Step 5: Manually trigger change detection to ensure template updates with correct inputs
      // This is necessary with OnPush strategy to render explorer/readonly inputs based on isNew()
      this.cdr.detectChanges();

      // Step 6: Disable device_type and checkboxes (cannot be changed when editing)
      this.form.controls.device_type.disable();
      if (disk.dtype === ContainerDeviceType.Disk) {
        this.form.controls.create_zvol.disable();
      } else if (disk.dtype === ContainerDeviceType.Raw) {
        this.form.controls.exists.disable();
      }

      // Step 7: Patch all remaining form values into the now-rendered inputs
      this.form.patchValue(patchValue);

      // Step 8: Clear initialization flag to allow valueChanges to fire normally going forward
      this.isInitializing = false;
    } else {
      // Set initial field requirements for new devices
      this.updateFieldRequirements(this.form.controls.device_type.value, false);
    }
  }

  private buildPatchValueFromDisk(disk: StorageDevice): Partial<typeof this.form.value> {
    const patchValue: Partial<typeof this.form.value> = {};

    if (disk.dtype === ContainerDeviceType.Disk) {
      patchValue.type = disk.type || 'VIRTIO';

      if (disk.create_zvol && disk.zvol_name) {
        // Split zvol_name into parent and name for editing
        const lastSlashIndex = disk.zvol_name.lastIndexOf('/');
        if (lastSlashIndex > 0) {
          const parentPath = disk.zvol_name.substring(0, lastSlashIndex);
          // Add /mnt/ prefix to parent path (only if not already present)
          patchValue.zvol_parent = parentPath.startsWith('/mnt/') ? parentPath : '/mnt/' + parentPath;
          patchValue.zvol_name = disk.zvol_name.substring(lastSlashIndex + 1);
        } else {
          patchValue.zvol_name = disk.zvol_name;
        }
        // Convert bytes to GiB for display
        patchValue.zvol_volsize = disk.zvol_volsize
          ? Math.round(disk.zvol_volsize / bytesPerGib)
          : null;
      } else {
        patchValue.path = disk.path || '';
      }

      patchValue.logical_sectorsize = disk.logical_sectorsize ?? null;
      patchValue.physical_sectorsize = disk.physical_sectorsize ?? null;
      patchValue.iotype = disk.iotype ?? null;
      patchValue.serial = disk.serial || '';
    } else if (disk.dtype === ContainerDeviceType.Raw) {
      patchValue.path = disk.path || '';
      patchValue.type = disk.type || 'VIRTIO';
      patchValue.boot = disk.boot ?? false;
      // Convert bytes to GiB for display
      patchValue.size = disk.size ? Math.round(disk.size / bytesPerGib) : null;
      patchValue.logical_sectorsize = disk.logical_sectorsize ?? null;
      patchValue.physical_sectorsize = disk.physical_sectorsize ?? null;
      patchValue.iotype = disk.iotype ?? null;
      patchValue.serial = disk.serial || '';
      patchValue.exists = true;
    } else if (disk.dtype === ContainerDeviceType.Filesystem) {
      // Add /mnt/ prefix to source for display in file explorer (only if not already present)
      if (disk.source) {
        patchValue.source = disk.source.startsWith('/mnt/') ? disk.source : '/mnt/' + disk.source;
      } else {
        patchValue.source = '';
      }
      patchValue.target = disk.target || '';
    }

    return patchValue;
  }

  private updateFieldRequirements(deviceType: ContainerDeviceType, clearValues = false): void {
    // Clear field values when switching device types (but not on init)
    if (clearValues) {
      this.form.controls.path.setValue('');
      this.form.controls.create_zvol.setValue(false);
      this.form.controls.zvol_parent.setValue('');
      this.form.controls.zvol_name.setValue('');
      this.form.controls.zvol_volsize.setValue(null);
      this.form.controls.exists.setValue(false);
      this.form.controls.boot.setValue(false);
      this.form.controls.size.setValue(null);
      this.form.controls.logical_sectorsize.setValue(null);
      this.form.controls.physical_sectorsize.setValue(null);
      this.form.controls.iotype.setValue(null);
      this.form.controls.serial.setValue('');
      this.form.controls.source.setValue('');
      this.form.controls.target.setValue('');
    }

    // Reset all field validators
    this.form.controls.path.clearValidators();
    this.form.controls.size.clearValidators();
    this.form.controls.source.clearValidators();
    this.form.controls.target.clearValidators();

    // Set validators based on device type
    if (deviceType === ContainerDeviceType.Disk) {
      // Path validation is handled by updateZvolValidation based on create_zvol value
      this.updateZvolValidation();
      this.form.controls.size.clearValidators();
      this.form.controls.source.clearValidators();
      this.form.controls.target.clearValidators();
    } else if (deviceType === ContainerDeviceType.Raw) {
      this.form.controls.path.setValidators([
        Validators.required,
        rawFilePathValidator(),
      ]);
      this.updateSizeValidation();
      this.form.controls.source.clearValidators();
      this.form.controls.target.clearValidators();
    } else if (deviceType === ContainerDeviceType.Filesystem) {
      this.form.controls.path.clearValidators();
      this.form.controls.size.clearValidators();
      this.form.controls.source.setValidators([
        Validators.required,
        poolPathValidator(),
      ]);
      this.form.controls.target.setValidators([
        Validators.required,
        containerPathValidator(),
      ]);
    }

    // Update validation state
    this.form.controls.path.updateValueAndValidity();
    this.form.controls.size.updateValueAndValidity();
    this.form.controls.source.updateValueAndValidity();
    this.form.controls.target.updateValueAndValidity();
  }

  private updateSizeValidation(): void {
    // Size is only required for RAW devices when creating new files (exists = false)
    const exists = this.form.controls.exists.value;

    this.form.controls.size.clearValidators();
    if (!exists) {
      // Creating new file - size is required
      this.form.controls.size.setValidators([
        Validators.required,
        Validators.min(1),
      ]);
    }
    // If exists = true, no validators needed (using existing file)

    this.form.controls.size.updateValueAndValidity();
  }

  private updateZvolValidation(): void {
    // Zvol parent, name and size are only required for DISK devices when creating new zvol (create_zvol = true)
    // Path is only required when using existing zvol (create_zvol = false)
    const createZvol = this.form.controls.create_zvol.value;

    this.form.controls.path.clearValidators();
    this.form.controls.zvol_parent.clearValidators();
    this.form.controls.zvol_name.clearValidators();
    this.form.controls.zvol_volsize.clearValidators();

    if (createZvol) {
      // Creating new zvol - parent, name and size are required, path is not
      this.form.controls.zvol_parent.setValidators([Validators.required]);
      this.form.controls.zvol_name.setValidators([Validators.required]);
      this.form.controls.zvol_volsize.setValidators([
        Validators.required,
        Validators.min(1),
      ]);
    } else {
      // Using existing zvol - path is required, parent/name/size are not
      this.form.controls.path.setValidators([
        Validators.required,
        diskPathValidator(),
      ]);
    }

    this.form.controls.path.updateValueAndValidity();
    this.form.controls.zvol_parent.updateValueAndValidity();
    this.form.controls.zvol_name.updateValueAndValidity();
    this.form.controls.zvol_volsize.updateValueAndValidity();
  }

  protected onSubmit(): void {
    this.isLoading.set(true);
    this.prepareRequest()
      .pipe(untilDestroyed(this))
      .subscribe({
        complete: () => {
          this.snackbar.success(this.translate.instant('Disk saved'));
          this.slideInRef.close({
            response: true,
          });
          this.isLoading.set(false);
        },
        error: (error: unknown) => {
          this.errorHandler.handleValidationErrors(error, this.form);
          this.isLoading.set(false);
        },
      });
  }

  private prepareRequest(): Observable<unknown> {
    const formValue = this.form.getRawValue();
    const deviceType = formValue.device_type;

    let payload: ContainerDevice;

    switch (deviceType) {
      case ContainerDeviceType.Disk:
        payload = {
          dtype: ContainerDeviceType.Disk,
          type: formValue.type,
          logical_sectorsize: formValue.logical_sectorsize || undefined,
          physical_sectorsize: formValue.physical_sectorsize || undefined,
          iotype: formValue.iotype || undefined,
          serial: formValue.serial || undefined,
        } as ContainerDiskDevice;

        // Include create_zvol fields only when creating new zvol
        if (formValue.create_zvol) {
          if (!formValue.zvol_parent || !formValue.zvol_name || !formValue.zvol_volsize) {
            throw new Error('zvol_parent, zvol_name, and zvol_volsize are required when create_zvol is true');
          }
          payload.create_zvol = true;
          // Combine parent path and zvol name, removing /mnt/ prefix and ensuring proper path format
          const parentPath = formValue.zvol_parent.replace(/^\/mnt\//, '');
          payload.zvol_name = `${parentPath}/${formValue.zvol_name}`;
          payload.zvol_volsize = formValue.zvol_volsize * bytesPerGib; // Convert GiB to bytes
        } else {
          // Include path only when using existing zvol
          if (!formValue.path) {
            throw new Error('path is required when create_zvol is false');
          }
          payload.path = formValue.path;
        }
        break;

      case ContainerDeviceType.Raw:
        if (!formValue.path) {
          throw new Error('path is required for RAW devices');
        }
        if (!formValue.exists && !formValue.size) {
          throw new Error('size is required when creating a new RAW file (exists is false)');
        }
        payload = {
          dtype: ContainerDeviceType.Raw,
          path: formValue.path,
          type: formValue.type,
          exists: formValue.exists,
          boot: formValue.boot || undefined,
          size: formValue.size ? formValue.size * bytesPerGib : undefined, // Convert GiB to bytes
          logical_sectorsize: formValue.logical_sectorsize || undefined,
          physical_sectorsize: formValue.physical_sectorsize || undefined,
          iotype: formValue.iotype || undefined,
          serial: formValue.serial || undefined,
        } as ContainerRawDevice;
        break;

      case ContainerDeviceType.Filesystem:
        if (!formValue.source || !formValue.target) {
          throw new Error('source and target are required for FILESYSTEM devices');
        }
        payload = {
          dtype: ContainerDeviceType.Filesystem,
          // Keep full absolute path (API requires /mnt/... prefix)
          source: formValue.source,
          target: formValue.target,
        } as ContainerFilesystemDevice;
        break;

      default:
        throw new Error('Unsupported device type: ' + String(deviceType));
    }

    const existingDisk = this.existingDisk();
    return existingDisk
      ? this.api.call('container.device.update', [existingDisk.id, {
        attributes: {
          ...payload,
          name: existingDisk.name,
        },
      }])
      : this.api.call('container.device.create', [{
        container: this.instance.id,
        attributes: payload,
      }]);
  }

  protected readonly instancesHelptext = instancesHelptext;
}
