import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject } from '@angular/core';
import { Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormBuilder } from '@ngneat/reactive-forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { User } from '@sentry/angular';
import { of } from 'rxjs';
import { AuthService } from 'app/services/auth/auth.service';
import { DialogService } from 'app/services/dialog.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  templateUrl: './renew-two-factor-dialog.component.html',
  styleUrls: ['./renew-two-factor-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RenewTwoFactorDialogComponent {

  isFormLoading = false;

  form = this.fb.group({
    interval: [null as number, [Validators.required]],
    otp_digits: [null as number, [Validators.required]],
  });

  readonly otpDigitOptions$ = of([
    { label: '6', value: 6 },
    { label: '7', value: 7 },
    { label: '8', value: 8 },
  ]);

  constructor(
    public dialogRef: MatDialogRef<RenewTwoFactorDialogComponent>,
    private ws: WebSocketService,
    @Inject(MAT_DIALOG_DATA) public user: User,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
    private dialogService: DialogService,
    private errorHandler: ErrorHandlerService,
    private authService: AuthService,
  ) { }

  renew(): void {
    this.isFormLoading = true;
    this.cdr.markForCheck();
    this.authService.renewUser2FaSecret(this.form.value.interval, this.form.value.otp_digits).pipe(
      untilDestroyed(this),
    ).subscribe({
      next: () => {
        this.dialogRef.close(true);
        this.cdr.markForCheck();
      },
      error: (error) => {
        this.dialogService.error(this.errorHandler.parseError(error));
        this.dialogRef.close(false);
      },
    });
  }
}