import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import {
  MAT_DIALOG_DATA, MatDialogClose, MatDialogRef, MatDialogTitle,
} from '@angular/material/dialog';
import { FormControl } from '@ngneat/reactive-forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import { FibreChannelHost } from 'app/interfaces/fibre-channel.interface';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { LoaderService } from 'app/modules/loader/loader.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

@UntilDestroy()
@Component({
  selector: 'ix-virtual-ports-number-dialog',
  templateUrl: './virtual-ports-number-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormActionsComponent,
    MatButton,
    MatDialogClose,
    MatDialogTitle,
    ReactiveFormsModule,
    TestDirective,
    TranslateModule,
    IxInputComponent,
  ],
})
export class VirtualPortsNumberDialog {
  private api = inject(ApiService);
  private loader = inject(LoaderService);
  private dialogRef = inject<MatDialogRef<VirtualPortsNumberDialog>>(MatDialogRef);
  private errorHandler = inject(ErrorHandlerService);
  private host = inject<FibreChannelHost>(MAT_DIALOG_DATA);

  protected form = new FormGroup({
    virtualPorts: new FormControl(0, [Validators.required, Validators.min(0)]),
  });

  constructor() {
    const host = this.host;

    this.form.setValue({
      virtualPorts: host.npiv,
    });
  }

  protected submit(): void {
    this.api
      .call('fc.fc_host.update', [this.host.id, { npiv: this.form.value.virtualPorts }])
      .pipe(
        this.loader.withLoader(),
        this.errorHandler.withErrorHandler(),
        untilDestroyed(this),
      )
      .subscribe(() => this.dialogRef.close(true));
  }
}
