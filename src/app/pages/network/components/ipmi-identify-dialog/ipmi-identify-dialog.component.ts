import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { IpmiIdentify } from 'app/interfaces/ipmi.interface';
import { FormErrorHandlerService } from 'app/modules/ix-forms/services/form-error-handler.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { AppLoaderService, DialogService, WebSocketService } from 'app/services';

const indefinitelyOption = 'indefinitely' as const;

@UntilDestroy()
@Component({
  templateUrl: './ipmi-identify-dialog.component.html',
  styleUrls: ['./ipmi-identify-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IpmiIdentifyDialogComponent {
  form = this.formBuilder.group({
    duration: [null as number | typeof indefinitelyOption, Validators.required],
  });

  durationOptions$ = of([
    { label: this.translate.instant('Indefinitely'), value: indefinitelyOption },
    { label: this.translate.instant('15 seconds'), value: 15 },
    { label: this.translate.instant('30 seconds'), value: 30 },
    { label: this.translate.instant('1 minute'), value: 60 },
    { label: this.translate.instant('2 minute'), value: 120 },
    { label: this.translate.instant('3 minute'), value: 180 },
    { label: this.translate.instant('4 minute'), value: 240 },
    { label: this.translate.instant('Turn OFF'), value: 0 },
  ]);

  constructor(
    private formBuilder: FormBuilder,
    private loader: AppLoaderService,
    private ws: WebSocketService,
    private translate: TranslateService,
    private errorHandler: FormErrorHandlerService,
    private dialogService: DialogService,
    private dialogRef: MatDialogRef<IpmiIdentifyDialogComponent>,
    private snackbar: SnackbarService,
  ) {}

  onSubmit(): void {
    this.loader.open();
    const selection = this.form.value.duration;
    const successMessage = selection === 0
      ? this.translate.instant('Flashing stopped.')
      : this.translate.instant('Now flashing...');

    let params: IpmiIdentify;
    if (selection === indefinitelyOption) {
      params = { force: true };
    } else {
      params = { seconds: selection };
    }

    this.ws.call('ipmi.identify', [params])
      .pipe(untilDestroyed(this))
      .subscribe({
        next: () => {
          this.loader.close();
          this.dialogRef.close();
          this.snackbar.success(successMessage);
        },
        error: (error) => {
          this.loader.close();
          this.errorHandler.handleWsFormError(error, this.form);
        },
      });
  }
}
