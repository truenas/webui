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
import { UntilDestroy } from '@ngneat/until-destroy';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  map, Observable, of, startWith,
} from 'rxjs';
import { ContainerNicDeviceType, containerNicDeviceTypeLabels } from 'app/enums/container.enum';
import { IxCheckboxComponent } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { IxSelectComponent } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.component';
import { IxValidatorsService } from 'app/modules/forms/ix-forms/services/ix-validators.service';
import { TestDirective } from 'app/modules/test-id/test.directive';

@UntilDestroy()
@Component({
  selector: 'ix-instance-nic-mac-dialog',
  templateUrl: './instance-nic-mac-dialog.component.html',
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
export class InstanceNicMacDialog {
  private fb = inject(FormBuilder);
  private ixValidator = inject(IxValidatorsService);
  private translate = inject(TranslateService);
  private matDialogRef = inject<MatDialogRef<InstanceNicMacDialog>>(MatDialogRef);

  protected readonly nic = signal(inject<string>(MAT_DIALOG_DATA));

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
    type: [ContainerNicDeviceType.Virtio as ContainerNicDeviceType, Validators.required],
    use_default: [true as boolean],
    mac: ['', [Validators.required, this.ixValidator.withMessage(
      Validators.pattern('^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$|^([0-9A-Fa-f]{4}\\.){2}([0-9A-Fa-f]{4})$'),
      this.translate.instant('Not a valid MAC address'),
    )]],
    trust_guest_rx_filters: [false as boolean],
  });

  protected readonly isValid$: Observable<boolean> = this.form.valueChanges.pipe(
    map((value) => this.form.controls.type.valid && (value.use_default || this.form.controls.mac.valid)),
    startWith(true),
  );

  protected readonly useDefault = toSignal(this.form.controls.use_default.value$);
  protected readonly selectedType = toSignal(this.form.controls.type.value$);
  protected readonly isVirtio = computed(() => this.selectedType() === ContainerNicDeviceType.Virtio);

  protected addDevice(): void {
    const result: {
      type: ContainerNicDeviceType;
      useDefault: boolean;
      mac?: string;
      trust_guest_rx_filters: boolean;
    } = {
      type: this.form.value.type,
      useDefault: this.form.value.use_default,
      trust_guest_rx_filters: this.form.value.trust_guest_rx_filters,
    };

    if (!this.form.value.use_default) {
      result.mac = this.form.value.mac;
    }

    this.matDialogRef.close(result);
  }
}
