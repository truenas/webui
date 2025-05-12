import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, inject, signal,
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
  map, Observable, startWith,
} from 'rxjs';
import { IxCheckboxComponent } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
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
    AsyncPipe,
    MatButton,
    TranslateModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InstanceNicMacDialog {
  protected readonly nic = signal(inject<string>(MAT_DIALOG_DATA));
  protected readonly form = this.fb.group({
    use_default: [true as boolean],
    mac: ['', [Validators.required, this.ixValidator.withMessage(
      Validators.pattern('^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$|^([0-9A-Fa-f]{4}\\.){2}([0-9A-Fa-f]{4})$'),
      this.translate.instant('Not a valid MAC address'),
    )]],
  });

  protected readonly isValid$: Observable<boolean> = this.form.valueChanges.pipe(
    map((value) => value.use_default || this.form.controls.mac.valid),
    startWith(true),
  );

  protected readonly useDefault = toSignal(this.form.controls.use_default.value$);

  constructor(
    private fb: FormBuilder,
    private ixValidator: IxValidatorsService,
    private translate: TranslateService,
    private matDialogRef: MatDialogRef<InstanceNicMacDialog>,
  ) { }

  protected addDevice(): void {
    if (this.form.value.use_default) {
      this.matDialogRef.close({ useDefault: true });
      return;
    }
    this.matDialogRef.close({ mac: this.form.value.mac });
  }
}
