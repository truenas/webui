import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import {
  ChangeDetectionStrategy, Component, computed, inject,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import {
  TnBannerComponent, TnButtonComponent, TnCheckboxComponent, TnDialogShellComponent, TnFormFieldComponent,
} from '@truenas/ui-components';
import { containersHelptext } from 'app/helptext/containers/containers';
import { Container, ContainerDeleteOptions } from 'app/interfaces/container.interface';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { isContainerStopped } from 'app/pages/containers/utils/container-status.utils';

@Component({
  selector: 'ix-delete-container-dialog',
  templateUrl: './delete-container-dialog.component.html',
  styleUrls: ['./delete-container-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TnDialogShellComponent,
    TnBannerComponent,
    TnButtonComponent,
    TnCheckboxComponent,
    TnFormFieldComponent,
    FormActionsComponent,
    ReactiveFormsModule,
    TranslateModule,
  ],
})
export class DeleteContainerDialog {
  private formBuilder = inject(FormBuilder);
  protected dialogRef = inject<DialogRef<ContainerDeleteOptions | false, DeleteContainerDialog>>(DialogRef);
  protected container = inject<Container>(DIALOG_DATA);

  protected readonly helptext = containersHelptext.deleteDialog;

  protected readonly form = this.formBuilder.nonNullable.group({
    force: [false],
    recursive: [false],
    confirm: [false],
  });

  /**
   * Middleware refuses to delete a container that is not stopped unless `force` is set,
   * so pre-check the box (and explain why) instead of letting the user walk into the refusal.
   */
  protected readonly isStopped = isContainerStopped(this.container);

  private readonly formValue = toSignal(this.form.valueChanges, { initialValue: this.form.getRawValue() });

  protected readonly isRecursive = computed(() => Boolean(this.formValue().recursive));
  protected readonly canDelete = computed(() => Boolean(this.formValue().confirm));

  constructor() {
    if (!this.isStopped) {
      this.form.controls.force.setValue(true);
    }
  }

  protected onDelete(): void {
    const { force, recursive } = this.form.getRawValue();

    this.dialogRef.close({ force, recursive });
  }
}
