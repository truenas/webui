import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormControl } from '@ngneat/reactive-forms';
import { TranslateModule } from '@ngx-translate/core';
import {
  TnButtonComponent, TnDialogShellComponent, TnFormFieldComponent, TnInputComponent,
} from '@truenas/ui-components';
import { FibreChannelHost } from 'app/interfaces/fibre-channel.interface';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { LoaderService } from 'app/modules/loader/loader.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

@Component({
  selector: 'ix-virtual-ports-number-dialog',
  templateUrl: './virtual-ports-number-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TnDialogShellComponent,
    TnFormFieldComponent,
    TnInputComponent,
    FormActionsComponent,
    TnButtonComponent,
    ReactiveFormsModule,
    TranslateModule,
  ],
})
export class VirtualPortsNumberDialog {
  private api = inject(ApiService);
  private loader = inject(LoaderService);
  protected dialogRef = inject<DialogRef<unknown, VirtualPortsNumberDialog>>(DialogRef);
  private errorHandler = inject(ErrorHandlerService);
  private destroyRef = inject(DestroyRef);
  private host = inject<FibreChannelHost>(DIALOG_DATA);

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
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => this.dialogRef.close(true));
  }
}
