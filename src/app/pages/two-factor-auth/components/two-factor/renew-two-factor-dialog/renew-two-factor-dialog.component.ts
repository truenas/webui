import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { FormBuilder } from '@ngneat/reactive-forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { of, switchMap } from 'rxjs';
import { take } from 'rxjs/operators';
import { AuthService } from 'app/services/auth/auth.service';
import { DialogService } from 'app/services/dialog.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  templateUrl: './renew-two-factor-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RenewTwoFactorDialogComponent {
  isFormLoading = false;

  form = this.fb.group({
    interval: [60, [Validators.required]],
    otp_digits: [6, [Validators.required]],
  });

  readonly otpDigitOptions$ = of([
    { label: '6', value: 6 },
    { label: '7', value: 7 },
    { label: '8', value: 8 },
  ]);

  constructor(
    public dialogRef: MatDialogRef<RenewTwoFactorDialogComponent>,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
    private dialogService: DialogService,
    private errorHandler: ErrorHandlerService,
    private authService: AuthService,
    private ws: WebSocketService,
  ) { }

  renew(): void {
    this.isFormLoading = true;
    this.cdr.markForCheck();
    this.authService.user$.pipe(
      take(1),
      switchMap((user) => {
        return this.ws.call(
          'user.renew_2fa_secret',
          [user.username, { interval: this.form.value.interval, otp_digits: this.form.value.otp_digits }],
        );
      }),
      untilDestroyed(this),
    ).subscribe({
      next: () => {
        this.authService.refreshUser();
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
