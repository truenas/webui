import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit,
} from '@angular/core';
import { FormBuilder, FormControl, Validators } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { BehaviorSubject, of } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  VmDeviceType, VmDiskMode, VmDisplayType, VmNicType,
} from 'app/enums/vm.enum';
import { assertUnreachable } from 'app/helpers/assert-unreachable.utils';
import { arrayToOptions, choicesToOptions } from 'app/helpers/options.helper';
import helptext from 'app/helptext/vm/devices/device-add-edit';
import {
  VmDevice, VmDeviceUpdate,
} from 'app/interfaces/vm-device.interface';
import { regexValidator } from 'app/modules/entity/entity-form/validators/regex-validation';
import { SimpleAsyncComboboxProvider } from 'app/modules/ix-forms/classes/simple-async-combobox-provider';
import { FormErrorHandlerService } from 'app/modules/ix-forms/services/form-error-handler.service';
import { NetworkService, VmService, WebSocketService } from 'app/services';
import { FilesystemService } from 'app/services/filesystem.service';
import { IxSlideInService } from 'app/services/ix-slide-in.service';

@UntilDestroy()
@Component({
  templateUrl: './device-form.component.html',
  styleUrls: ['./device-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeviceFormComponent implements OnInit {
  isLoading = false;

  get title(): string {
    return this.isNew
      ? this.translate.instant('Add Device')
      : this.translate.instant('Edit Device');
  }

  get isNew(): boolean {
    return !this.existingDevice;
  }

  existingDevice: VmDevice;

  typeControl = new FormControl(VmDeviceType.Cdrom, Validators.required);
  orderControl = new FormControl(null as number);

  cdromForm = this.formBuilder.group({
    path: ['/mnt', Validators.required],
  });

  diskForm = this.formBuilder.group({
    path: ['', Validators.required],
    type: [null as VmDiskMode],
    sectorsize: [0],
  });

  nicForm = this.formBuilder.group({
    type: [null as VmNicType, Validators.required],
    mac: ['', regexValidator(this.networkService.macRegex)],
    nic_attach: ['', Validators.required],
    trust_guest_rx_filters: [false],
  });

  rawFileForm = this.formBuilder.group({
    path: ['', Validators.required],
    sectorsize: [0],
    type: [null as VmDiskMode],
    size: [null as number],
  });

  pciForm = this.formBuilder.group({
    pptdev: ['', Validators.required],
  });

  displayForm = this.formBuilder.group({
    port: [null as number],
    resolution: [''],
    bind: [''],
    password: ['', Validators.maxLength(8)],
    type: [VmDisplayType.Vnc],
    web: [true],
  });

  readonly helptext = helptext;
  readonly VmDeviceType = VmDeviceType;

  readonly bindOptions$ = this.ws.call('vm.device.bind_choices').pipe(choicesToOptions());
  readonly resolutions$ = this.ws.call('vm.resolution_choices').pipe(choicesToOptions());
  readonly nicOptions$ = this.networkService.getVmNicChoices().pipe(choicesToOptions());
  readonly nicTypes$ = of(this.vmService.getNicTypes()).pipe(arrayToOptions());
  readonly passthroughProvider = new SimpleAsyncComboboxProvider(
    this.ws.call('vm.device.passthrough_device_choices').pipe(
      map((passthroughDevices) => {
        return Object.keys(passthroughDevices).map((id) => {
          return {
            label: id,
            value: id,
          };
        });
      }),
    ),
  );
  readonly zvolProvider = new SimpleAsyncComboboxProvider(
    this.ws.call('vm.device.disk_choices').pipe(choicesToOptions()),
  );

  readonly fileNodeProvider = this.filesystemService.getFilesystemNodeProvider();

  readonly deviceTypeOptions = [
    {
      label: this.translate.instant('CD-ROM'),
      value: VmDeviceType.Cdrom,
    }, {
      label: this.translate.instant('NIC'),
      value: VmDeviceType.Nic,
    }, {
      label: this.translate.instant('Disk'),
      value: VmDeviceType.Disk,
    }, {
      label: this.translate.instant('Raw File'),
      value: VmDeviceType.Raw,
    }, {
      label: this.translate.instant('PCI Passthrough Device'),
      value: VmDeviceType.Pci,
    }, {
      label: this.translate.instant('Display'),
      value: VmDeviceType.Display,
    },
  ];
  readonly deviceTypes$ = new BehaviorSubject(this.deviceTypeOptions);

  readonly diskModes$ = of([
    { label: 'AHCI', value: VmDiskMode.Ahci },
    { label: 'VirtIO', value: VmDiskMode.Virtio },
  ]);
  readonly sectorSizes$ = of([
    { label: this.translate.instant('Default'), value: 0 },
    { label: '512', value: 512 },
    { label: '4096', value: 4096 },
  ]);
  readonly displayTypes$ = of([
    { label: 'VNC', value: VmDisplayType.Vnc },
    { label: 'SPICE', value: VmDisplayType.Spice },
  ]);

  get typeSpecificForm(): DeviceFormComponent['cdromForm']
  | DeviceFormComponent['diskForm']
  | DeviceFormComponent['nicForm']
  | DeviceFormComponent['rawFileForm']
  | DeviceFormComponent['pciForm']
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
      case VmDeviceType.Display:
        return this.displayForm;
      default:
        assertUnreachable(this.typeControl.value);
    }
  }

  private virtualMachineId: number;

  constructor(
    private formBuilder: FormBuilder,
    private ws: WebSocketService,
    private translate: TranslateService,
    private networkService: NetworkService,
    private filesystemService: FilesystemService,
    private vmService: VmService,
    private errorHandler: FormErrorHandlerService,
    private cdr: ChangeDetectorRef,
    private slideIn: IxSlideInService,
  ) {}

  ngOnInit(): void {
    this.generateMacWhenNicIsSelected();
  }

  setVirtualMachineId(id: number): void {
    this.virtualMachineId = id;
    this.hideDisplayIfCannotBeAdded();
  }

  setDeviceForEdit(device: VmDevice): void {
    this.existingDevice = device;
    this.typeControl.setValue(device.dtype);
    this.orderControl.setValue(device.order);
    switch (device.dtype) {
      case VmDeviceType.Pci:
        this.pciForm.patchValue(device.attributes);
        break;
      case VmDeviceType.Raw:
        this.rawFileForm.patchValue({
          ...device.attributes,
          sectorsize: device.attributes.logical_sectorsize === null
            ? 0
            : device.attributes.logical_sectorsize,
        });
        break;
      case VmDeviceType.Nic:
        this.nicForm.patchValue(device.attributes);
        break;
      case VmDeviceType.Display:
        this.displayForm.patchValue(device.attributes);
        break;
      case VmDeviceType.Disk:
        this.diskForm.patchValue({
          ...device.attributes,
          sectorsize: device.attributes.logical_sectorsize === null
            ? 0
            : device.attributes.logical_sectorsize,
        });
        break;
      case VmDeviceType.Cdrom:
        this.cdromForm.patchValue(device.attributes);
        break;
      default:
        assertUnreachable(device);
    }
  }

  generateMacAddress(): void {
    this.ws.call('vm.random_mac').pipe(untilDestroyed(this)).subscribe((randomMac) => {
      this.nicForm.patchValue({ mac: randomMac });
    });
  }

  generateMacWhenNicIsSelected(): void {
    this.typeControl.valueChanges.pipe(untilDestroyed(this)).subscribe((type) => {
      if (type === VmDeviceType.Nic && this.nicForm.value.mac === '') {
        this.generateMacAddress();
      }
    });
  }

  onSubmit(event: SubmitEvent): void {
    event.preventDefault();
    this.isLoading = true;

    const update: VmDeviceUpdate = {
      vm: this.virtualMachineId,
      dtype: this.typeControl.value,
      order: this.orderControl.value,
      attributes: this.getUpdateAttributes(),
    };

    const request$ = this.isNew
      ? this.ws.call('vm.device.create', [update])
      : this.ws.call('vm.device.update', [this.existingDevice.id, update]);

    request$
      .pipe(untilDestroyed(this))
      .subscribe({
        next: () => {
          this.isLoading = false;
          this.cdr.markForCheck();
          this.slideIn.close();
        },
        error: (error) => {
          this.errorHandler.handleWsFormError(error, this.typeSpecificForm);
          this.isLoading = false;
          this.cdr.markForCheck();
        },
      });
  }

  private getUpdateAttributes(): VmDeviceUpdate['attributes'] {
    if ('sectorsize' in this.typeSpecificForm.value) {
      const { sectorsize, ...otherAttributes } = this.typeSpecificForm.value;
      return {
        ...otherAttributes,
        logical_sectorsize: sectorsize === 0 ? null : sectorsize,
        physical_sectorsize: sectorsize === 0 ? null : sectorsize,
      };
    }

    return this.typeSpecificForm.value;
  }

  /**
   * Only one display of each type can be added.
   */
  private hideDisplayIfCannotBeAdded(): void {
    this.ws.call('vm.get_display_devices', [this.virtualMachineId])
      .pipe(untilDestroyed(this))
      .subscribe((devices) => {
        if (devices.length < 2) {
          return;
        }

        const optionsWithoutDisplay = this.deviceTypeOptions.filter((option) => option.value !== VmDeviceType.Display);
        this.deviceTypes$.next(optionsWithoutDisplay);
      });
  }
}
