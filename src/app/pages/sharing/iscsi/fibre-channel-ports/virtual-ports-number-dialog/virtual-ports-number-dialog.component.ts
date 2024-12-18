import {
  ChangeDetectionStrategy, Component, Inject,
} from '@angular/core';
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
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { ApiService } from 'app/services/websocket/api.service';

@UntilDestroy()
@Component({
  selector: 'ix-virtual-ports-number-dialog',
  templateUrl: './virtual-ports-number-dialog.component.html',
  standalone: true,
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
export class VirtualPortsNumberDialogComponent {
  protected form = new FormGroup({
    virtualPorts: new FormControl(0, [Validators.required, Validators.min(0)]),
  });

  constructor(
    private api: ApiService,
    private loader: AppLoaderService,
    private dialogRef: MatDialogRef<VirtualPortsNumberDialogComponent>,
    private errorHandler: ErrorHandlerService,
    @Inject(MAT_DIALOG_DATA) private host: FibreChannelHost,
  ) {
    this.form.setValue({
      virtualPorts: host.npiv,
    });
  }

  protected submit(): void {
    this.api
      .call('fc.fc_host.update', [this.host.id, { npiv: this.form.value.virtualPorts }])
      .pipe(
        this.loader.withLoader(),
        this.errorHandler.catchError(),
        untilDestroyed(this),
      )
      .subscribe(() => this.dialogRef.close(true));
  }
}
