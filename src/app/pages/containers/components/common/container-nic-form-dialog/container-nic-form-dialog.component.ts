import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, computed, inject, signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import {
  MAT_DIALOG_DATA, MatDialogActions, MatDialogClose, MatDialogContent, MatDialogRef, MatDialogTitle,
} from '@angular/material/dialog';
import { FormBuilder } from '@ngneat/reactive-forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  map, Observable, of, startWith,
} from 'rxjs';
import { ContainerNicDeviceType, containerNicDeviceTypeLabels } from 'app/enums/container.enum';
import { ContainerNicDevice } from 'app/interfaces/container.interface';
import { IxCheckboxComponent } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { IxSelectComponent } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.component';
import { IxValidatorsService } from 'app/modules/forms/ix-forms/services/ix-validators.service';
import { TestDirective } from 'app/modules/test-id/test.directive';

export interface ContainerNicFormDialogData {
  nic?: string; // NIC key for adding
  device?: ContainerNicDevice & { id: number }; // Existing device for editing
}

@Component({
  selector: 'ix-container-nic-form-dialog',
  templateUrl: './container-nic-form-dialog.component.html',
  standalone: true,
  imports: [
    MatDialogContent,
    MatDialogActions,
    MatDialogClose,
    MatDialogTitle,
    TestDirective,
    ReactiveFormsModule,
    IxCheckboxComponent,
    IxInputComponent,
    IxSelectComponent,
    AsyncPipe,
    MatButton,
    TranslateModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContainerNicFormDialog {
  private fb = inject(FormBuilder);
  private ixValidator = inject(IxValidatorsService);
  private translate = inject(TranslateService);
  private matDialogRef = inject<MatDialogRef<ContainerNicFormDialog>>(MatDialogRef);
  private dialogData = inject<ContainerNicFormDialogData>(MAT_DIALOG_DATA);

  protected readonly isEditMode = computed(() => !!this.dialogData.device);

  protected readonly nic = signal(
    this.dialogData.nic || this.dialogData.device?.nic_attach || '',
  );

  protected readonly nicTypeOptions = of([
    {
      label: this.translate.instant(
        containerNicDeviceTypeLabels.get(
          ContainerNicDeviceType.Virtio,
        ) || ContainerNicDeviceType.Virtio,
      ),
      value: ContainerNicDeviceType.Virtio,
    },
    {
      label: this.translate.instant(
        containerNicDeviceTypeLabels.get(ContainerNicDeviceType.E1000) || ContainerNicDeviceType.E1000,
      ),
      value: ContainerNicDeviceType.E1000,
    },
  ]);

  protected readonly form = this.fb.group({
    type: [this.getInitialType(), Validators.required],
    use_default: [this.getInitialUseDefault()],
    mac: [this.getInitialMac(), [
      this.ixValidator.withMessage(
        Validators.pattern('^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$|^([0-9A-Fa-f]{4}\\.){2}([0-9A-Fa-f]{4})$'),
        this.translate.instant('Not a valid MAC address'),
      ),
    ]],
    trust_guest_rx_filters: [this.getInitialTrustGuestRxFilters()],
  });

  private getInitialType(): ContainerNicDeviceType {
    return this.dialogData.device?.type || ContainerNicDeviceType.Virtio;
  }

  private getInitialUseDefault(): boolean {
    return this.dialogData.device ? !this.dialogData.device.mac : true;
  }

  private getInitialMac(): string {
    return this.dialogData.device?.mac || '';
  }

  private getInitialTrustGuestRxFilters(): boolean {
    return this.dialogData.device?.trust_guest_rx_filters || false;
  }

  protected readonly isValid$: Observable<boolean> = this.form.valueChanges.pipe(
    map((value) => {
      // Type must always be valid
      if (!this.form.controls.type.valid) {
        return false;
      }

      // In edit mode, MAC can be empty (means use default) or valid
      if (this.isEditMode()) {
        const mac = value.mac?.trim();
        return !mac || this.form.controls.mac.valid;
      }

      // In add mode, either use default or MAC must be valid
      return value.use_default || this.form.controls.mac.valid;
    }),
    startWith(true),
  );

  protected readonly useDefault = toSignal(this.form.controls.use_default.value$);
  protected readonly selectedType = toSignal(this.form.controls.type.value$);
  protected readonly isVirtio = computed(() => this.selectedType() === ContainerNicDeviceType.Virtio);

  protected saveDevice(): void {
    // Build result differently based on NIC type to ensure trust_guest_rx_filters
    // is NEVER included for E1000 devices
    const isVirtio = this.form.value.type === ContainerNicDeviceType.Virtio;

    if (isVirtio) {
      // For VIRTIO: include trust_guest_rx_filters
      const result: {
        type: ContainerNicDeviceType;
        useDefault: boolean;
        mac?: string;
        trust_guest_rx_filters: boolean;
      } = {
        type: this.form.value.type,
        useDefault: this.isEditMode() ? false : this.form.value.use_default,
        trust_guest_rx_filters: this.form.value.trust_guest_rx_filters,
      };

      if (this.isEditMode()) {
        result.mac = this.form.value.mac || undefined;
      } else if (!this.form.value.use_default) {
        result.mac = this.form.value.mac;
      }

      this.matDialogRef.close(result);
    } else {
      // For E1000: explicitly exclude trust_guest_rx_filters
      const result: {
        type: ContainerNicDeviceType;
        useDefault: boolean;
        mac?: string;
      } = {
        type: this.form.value.type,
        useDefault: this.isEditMode() ? false : this.form.value.use_default,
      };

      if (this.isEditMode()) {
        result.mac = this.form.value.mac || undefined;
      } else if (!this.form.value.use_default) {
        result.mac = this.form.value.mac;
      }

      this.matDialogRef.close(result);
    }
  }
}
