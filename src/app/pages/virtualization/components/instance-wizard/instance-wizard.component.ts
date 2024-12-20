import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, signal,
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
  map, Observable, of,
} from 'rxjs';
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
} from 'app/enums/virtualization.enum';
import { mapToOptions } from 'app/helpers/options.helper';
import { containersHelptext } from 'app/helptext/virtualization/containers';
import { Option } from 'app/interfaces/option.interface';
import {
  CreateVirtualizationInstance,
  InstanceEnvVariablesFormGroup,
  VirtualizationDevice,
} from 'app/interfaces/virtualization.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxCheckboxComponent } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.component';
import { IxCheckboxListComponent } from 'app/modules/forms/ix-forms/components/ix-checkbox-list/ix-checkbox-list.component';
import { IxExplorerComponent } from 'app/modules/forms/ix-forms/components/ix-explorer/ix-explorer.component';
import { IxFormGlossaryComponent } from 'app/modules/forms/ix-forms/components/ix-form-glossary/ix-form-glossary.component';
import { IxFormSectionComponent } from 'app/modules/forms/ix-forms/components/ix-form-section/ix-form-section.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { IxListItemComponent } from 'app/modules/forms/ix-forms/components/ix-list/ix-list-item/ix-list-item.component';
import { IxListComponent } from 'app/modules/forms/ix-forms/components/ix-list/ix-list.component';
import { IxSelectComponent } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.component';
import { ReadOnlyComponent } from 'app/modules/forms/ix-forms/components/readonly-badge/readonly-badge.component';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { IxFormatterService } from 'app/modules/forms/ix-forms/services/ix-formatter.service';
import { cpuValidator } from 'app/modules/forms/ix-forms/validators/cpu-validation/cpu-validation';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import {
  SelectImageDialogComponent, VirtualizationImageWithId,
} from 'app/pages/virtualization/components/instance-wizard/select-image-dialog/select-image-dialog.component';
import { AuthService } from 'app/services/auth/auth.service';
import { FilesystemService } from 'app/services/filesystem.service';
import { ApiService } from 'app/services/websocket/api.service';

@UntilDestroy()
@Component({
  selector: 'ix-instance-wizard',
  standalone: true,
  imports: [
    PageHeaderComponent,
    IxInputComponent,
    ReactiveFormsModule,
    TranslateModule,
    IxCheckboxComponent,
    MatButton,
    TestDirective,
    ReadOnlyComponent,
    AsyncPipe,
    IxListComponent,
    IxFormGlossaryComponent,
    IxFormSectionComponent,
    IxCheckboxListComponent,
    IxListItemComponent,
    IxSelectComponent,
    IxExplorerComponent,
    NgxSkeletonLoaderModule,
  ],
  templateUrl: './instance-wizard.component.html',
  styleUrls: ['./instance-wizard.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InstanceWizardComponent {
  protected readonly isLoading = signal<boolean>(false);
  protected readonly requiredRoles = [Role.VirtGlobalWrite];
  protected readonly VirtualizationNicType = VirtualizationNicType;

  protected readonly hasPendingInterfaceChanges = toSignal(this.api.call('interface.has_pending_changes'));

  protected readonly proxyProtocols$ = of(mapToOptions(virtualizationProxyProtocolLabels, this.translate));
  protected readonly bridgedNicTypeLabel = virtualizationNicTypeLabels.get(VirtualizationNicType.Bridged);
  protected readonly macVlanNicTypeLabel = virtualizationNicTypeLabels.get(VirtualizationNicType.Macvlan);

  readonly directoryNodeProvider = this.filesystem.getFilesystemNodeProvider();

  bridgedNicDevices$ = this.getNicDevicesOptions(VirtualizationNicType.Bridged);
  macVlanNicDevices$ = this.getNicDevicesOptions(VirtualizationNicType.Macvlan);

  usbDevices$ = this.api.call('virt.device.usb_choices').pipe(
    map((choices) => Object.values(choices).map((choice) => ({
      label: `${choice.product} (${choice.product_id})`,
      value: choice.product_id.toString(),
    }))),
  );

  // TODO: MV supports only [Container, Physical] for now (based on the response)
  gpuDevices$ = this.api.call(
    'virt.device.gpu_choices',
    [VirtualizationType.Container, VirtualizationGpuType.Physical],
  ).pipe(
    map((choices) => Object.entries(choices).map(([pci, gpu]) => ({
      label: gpu.description,
      value: pci,
    }))),
  );

  protected readonly form = this.formBuilder.nonNullable.group({
    name: ['', Validators.required],
    autostart: [false],
    image: ['', Validators.required],
    cpu: ['', [cpuValidator()]],
    memory: [null as number],
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
    private authService: AuthService,
    private filesystem: FilesystemService,
  ) {}

  protected onBrowseImages(): void {
    this.matDialog
      .open(SelectImageDialogComponent, {
        minWidth: '90vw',
        data: {
          remote: VirtualizationRemote.LinuxContainers,
        },
      })
      .afterClosed()
      .pipe(untilDestroyed(this))
      .subscribe((image: VirtualizationImageWithId) => {
        if (!image) {
          return;
        }

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

    this.form.controls.disks.push(control);
  }

  protected removeDisk(index: number): void {
    this.form.controls.disks.removeAt(index);
  }

  protected onSubmit(): void {
    const payload = this.getPayload();
    const job$ = this.api.job('virt.instance.create', [payload]);

    this.dialogService
      .jobDialog(job$, { title: this.translate.instant('Creating Instance') })
      .afterClosed()
      .pipe(untilDestroyed(this))
      .subscribe({
        next: ({ result }) => {
          this.snackbar.success(this.translate.instant('Instance created'));
          this.router.navigate(['/virtualization', 'view', result?.id]);
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

  private getPayload(): CreateVirtualizationInstance {
    const devices = this.getDevicesPayload();

    return {
      devices,
      name: this.form.controls.name.value,
      cpu: this.form.controls.cpu.value,
      autostart: this.form.controls.autostart.value,
      memory: this.form.controls.memory.value,
      image: this.form.controls.image.value,
      environment: this.environmentVariablesPayload,
    } as CreateVirtualizationInstance;
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
    const disks = this.form.controls.disks.value.map((proxy) => ({
      dev_type: VirtualizationDeviceType.Disk,
      source: proxy.source,
      destination: proxy.destination,
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
    for (const parent of this.form.controls.mac_vlan_nics.value) {
      macVlanNics.push({
        parent,
        dev_type: VirtualizationDeviceType.Nic,
        nic_type: VirtualizationNicType.Macvlan,
      });
    }

    const bridgedNics: { parent: string; dev_type: VirtualizationDeviceType; nic_type: VirtualizationNicType }[] = [];
    for (const parent of this.form.controls.bridged_nics.value) {
      bridgedNics.push({
        parent,
        dev_type: VirtualizationDeviceType.Nic,
        nic_type: VirtualizationNicType.Bridged,
      });
    }

    const proxies = this.form.controls.proxies.value.map((proxy) => ({
      dev_type: VirtualizationDeviceType.Proxy,
      source_proto: proxy.source_proto,
      source_port: proxy.source_port,
      dest_proto: proxy.dest_proto,
      dest_port: proxy.dest_port,
    }));

    return [
      ...disks,
      ...proxies,
      ...macVlanNics,
      ...bridgedNics,
      ...usbDevices,
      ...gpuDevices,
    ] as VirtualizationDevice[];
  }

  protected readonly containersHelptext = containersHelptext;
}
