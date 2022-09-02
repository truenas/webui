import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit,
} from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { WebSocketService } from 'app/services';

@UntilDestroy()
@Component({
  selector: 'ix-signin-form',
  templateUrl: './signin-form.component.html',
  styleUrls: ['./signin-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SigninFormComponent implements OnInit {
  form = this.formBuilder.group({
    username: ['', Validators.required],
    password: ['', Validators.required],
    otp: ['', Validators.required],
  });

  hasTwoFactor = false;
  isLoading = false;

  constructor(
    private formBuilder: FormBuilder,
    private ws: WebSocketService,
    private cdr: ChangeDetectorRef,
    private snackbar: SnackbarService,
  ) { }

  ngOnInit(): void {
    this.checkForTwoFactor();
  }

  // TODO: Autofocus
  // TODO: Check the need for firefox fix from Alex
  // this.autofill.monitor(this.usernameInput).pipe(untilDestroyed(this)).subscribe(() => {
  //   if (!this.didSetFocus) {
  //     this.didSetFocus = true;
  //     this.usernameInput.nativeElement.focus();
  //   }
  // });

  onSubmit(): void {
    this.isLoading = true;
    this.cdr.markForCheck();
    const formValues = this.form.value;

    const request$ = this.hasTwoFactor
      ? this.ws.login(formValues.username, formValues.password, formValues.otp)
      : this.ws.login(formValues.username, formValues.password);

    request$.pipe(untilDestroyed(this)).subscribe(
      () => {
        this.isLoading = false;
        this.cdr.markForCheck();

        // TODO: Figure out callback
        // this.loginCallback(result)
      },
      // TODO: Handle error
    );
  }

  private checkForTwoFactor(): void {
    this.ws.call('auth.two_factor_auth').pipe(untilDestroyed(this)).subscribe((hasTwoFactor) => {
      this.hasTwoFactor = hasTwoFactor;
      if (hasTwoFactor) {
        this.form.controls.otp.enable();
      } else {
        this.form.controls.otp.disable();
      }
      this.cdr.markForCheck();
    });
  }
}
