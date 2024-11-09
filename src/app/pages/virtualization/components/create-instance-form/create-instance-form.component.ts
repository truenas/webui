import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, OnInit, signal,
} from '@angular/core';
import {
  FormBuilder, FormControl, ReactiveFormsModule, Validators,
} from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { map, Observable } from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import {
  VirtualizationDeviceType,
  VirtualizationGpuType, VirtualizationRemote, VirtualizationType,
} from 'app/enums/virtualization.enum';
import { Option } from 'app/interfaces/option.interface';
import {
  AvailableGpu,
  AvailableUsb,
  CreateVirtualizationInstance,
  VirtualizationDevice,
} from 'app/interfaces/virtualization.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxCheckboxComponent } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.component';
import { IxFieldsetComponent } from 'app/modules/forms/ix-forms/components/ix-fieldset/ix-fieldset.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { IxFormatterService } from 'app/modules/forms/ix-forms/services/ix-formatter.service';
import { cpuValidator } from 'app/modules/forms/ix-forms/validators/cpu-validation/cpu-validation';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import {
  SelectImageDialogComponent, VirtualizationImageWithId,
} from 'app/pages/virtualization/components/create-instance-form/select-image-dialog/select-image-dialog.component';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  selector: 'ix-create-instance-form',
  standalone: true,
  imports: [
    PageHeaderComponent,
    IxInputComponent,
    ReactiveFormsModule,
    TranslateModule,
    IxCheckboxComponent,
    MatButton,
    RequiresRolesDirective,
    TestDirective,
    IxFieldsetComponent,
    AsyncPipe,
  ],
  templateUrl: './create-instance-form.component.html',
  styleUrls: ['./create-instance-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateInstanceFormComponent implements OnInit {
  protected readonly isLoading = signal<boolean>(false);

  usbDevices$ = this.ws.call('virt.device.usb_choices').pipe(
    map((choices: Record<string, AvailableUsb>) => Object.values(choices).map((choice) => ({
      label: choice.product,
      value: choice.product_id,
    }))),
    untilDestroyed(this),
  );

  // TODO: MV supports only [Container, Physical] for now (based on the response)
  gpuDevices$ = this.ws.call(
    'virt.device.gpu_choices',
    [VirtualizationType.Container, VirtualizationGpuType.Physical],
  ).pipe(
    map((choices: Record<string, AvailableGpu>) => Object.values(choices).map((choice) => ({
      label: choice.description,
      value: choice.vendor,
    }))),
    untilDestroyed(this),
  );

  protected readonly form = this.formBuilder.nonNullable.group({
    name: ['', Validators.required],
    cpu: ['', [Validators.required, cpuValidator()]],
    usb_devices: this.formBuilder.group({}),
    gpu_devices: this.formBuilder.group({}),
    autostart: [false],
    memory: [null as number, Validators.required],
    image: ['', Validators.required],
  });

  protected readonly visibleImageName = new FormControl('');

  constructor(
    private ws: WebSocketService,
    private formBuilder: FormBuilder,
    private matDialog: MatDialog,
    private router: Router,
    private formErrorHandler: FormErrorHandlerService,
    private translate: TranslateService,
    private snackbar: SnackbarService,
    private dialogService: DialogService,
    protected formatter: IxFormatterService,
  ) {}

  ngOnInit(): void {
    this.setupDeviceControls(this.usbDevices$, 'usb_devices');
    this.setupDeviceControls(this.gpuDevices$, 'gpu_devices');
  }

  protected onBrowseImages(): void {
    this.matDialog
      .open(SelectImageDialogComponent, {
        minWidth: '80vw',
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
        this.visibleImageName.setValue(image.label);
      });
  }

  protected onSubmit(): void {
    const payload = this.getPayload();
    const job$ = this.ws.job('virt.instance.create', [payload]);

    this.dialogService
      .jobDialog(job$, { title: this.translate.instant('Saving Instance') })
      .afterClosed()
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (newInstance) => {
          this.snackbar.success(this.translate.instant('Instance saved'));
          this.router.navigate(['/virtualization/view', newInstance.id]);
        },
        error: (error) => {
          this.formErrorHandler.handleWsFormError(error, this.form);
        },
      });
  }

  private getPayload(): CreateVirtualizationInstance {
    return {
      name: this.form.controls.name.value,
      cpu: this.form.controls.cpu.value,
      autostart: this.form.controls.autostart.value,
      memory: this.form.controls.memory.value,
      image: this.form.controls.image.value,
      devices: [
        ...Object.entries(this.form.controls.usb_devices.value || {})
          .filter(([_, isSelected]) => isSelected)
          .map(([productId]) => ({
            dev_type: VirtualizationDeviceType.Usb,
            product_id: productId,
          })),
        ...Object.entries(this.form.controls.gpu_devices.value || {})
          .filter(([_, isSelected]) => isSelected)
          .map(([gpuType]) => ({
            dev_type: VirtualizationDeviceType.Gpu,
            gpu_type: gpuType,
          })),
      ] as VirtualizationDevice[],
    } as CreateVirtualizationInstance;
  }

  private setupDeviceControls(devices$: Observable<Option[]>, controlName: 'usb_devices' | 'gpu_devices'): void {
    devices$.pipe(untilDestroyed(this)).subscribe((devices) => {
      const deviceGroup = this.form.controls[controlName];
      devices.forEach((device) => {
        deviceGroup.addControl(device.value as string, this.formBuilder.control(false));
      });
    });
  }
}
