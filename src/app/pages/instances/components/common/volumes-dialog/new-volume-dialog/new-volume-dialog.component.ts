import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  FormsModule, NonNullableFormBuilder, ReactiveFormsModule, Validators,
} from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatDialogClose, MatDialogRef, MatDialogTitle } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import { GiB, MiB } from 'app/constants/bytes.constant';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { IxFormatterService } from 'app/modules/forms/ix-forms/services/ix-formatter.service';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';

@UntilDestroy()
@Component({
  selector: 'ix-new-volume-dialog',
  imports: [
    FormsModule,
    IxInputComponent,
    MatButton,
    MatDialogClose,
    MatDialogTitle,
    ReactiveFormsModule,
    TestDirective,
    TranslateModule,
    FormActionsComponent,
  ],
  templateUrl: './new-volume-dialog.component.html',
  styleUrl: './new-volume-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NewVolumeDialogComponent {
  protected form = this.formBuilder.group({
    name: this.formBuilder.control('', Validators.required),
    size: this.formBuilder.control(GiB, [Validators.required, Validators.min(MiB)]),
  });

  constructor(
    protected formatter: IxFormatterService,
    private api: ApiService,
    private loader: AppLoaderService,
    private errorHandler: ErrorHandlerService,
    private formBuilder: NonNullableFormBuilder,
    private dialogRef: MatDialogRef<NewVolumeDialogComponent, boolean>,
  ) {}

  protected onSubmit(): void {
    const values = this.form.getRawValue();

    this.api.call('virt.volume.create', [{
      ...values,
      size: values.size / MiB,
    }])
      .pipe(
        this.loader.withLoader(),
        this.errorHandler.catchError(),
        untilDestroyed(this),
      )
      .subscribe(() => this.dialogRef.close(true));
  }
}
