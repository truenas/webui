import {
  Component, ChangeDetectionStrategy, ChangeDetectorRef, OnInit,
} from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { Role } from 'app/enums/role.enum';
import { SedUser } from 'app/enums/sed-user.enum';
import { helptextSystemAdvanced } from 'app/helptext/system/advanced';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { ChainedRef } from 'app/modules/ix-forms/components/ix-slide-in/chained-component-ref';
import { matchOthersFgValidator } from 'app/modules/ix-forms/validators/password-validation/password-validation';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { elements } from 'app/pages/system/advanced/self-encrypting-drive/self-encrypting-drive-form/self-encrypting-drive-form.elements';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { WebSocketService } from 'app/services/ws.service';
import { AppState } from 'app/store';
import { advancedConfigUpdated } from 'app/store/system-config/system-config.actions';

export interface SedConfig {
  sedUser: SedUser;
  sedPassword: string;
}

@UntilDestroy()
@Component({
  templateUrl: 'self-encrypting-drive-form.component.html',
  styleUrls: ['./self-encrypting-drive-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SelfEncryptingDriveFormComponent implements OnInit {
  protected requiredRoles = [Role.FullAdmin];
  protected readonly searchElements = elements;

  isFormLoading = false;
  title = helptextSystemAdvanced.fieldset_sed;
  form = this.fb.group({
    sed_user: ['' as SedUser, Validators.required],
    sed_passwd: [''],
    sed_passwd2: [''],
  }, {
    validators: [
      matchOthersFgValidator(
        'sed_passwd2',
        ['sed_passwd'],
        this.translate.instant('SED password and confirmation should match.'),
      ),
    ],
  });

  readonly sedUserOptions$ = of([
    { label: SedUser.User, value: SedUser.User },
    { label: SedUser.Master, value: SedUser.Master },
  ]);

  readonly labels = {
    sed_user: helptextSystemAdvanced.sed_user_placeholder,
    sed_passwd: helptextSystemAdvanced.sed_passwd_placeholder,
    sed_passwd2: helptextSystemAdvanced.sed_passwd2_placeholder,
  };

  readonly tooltips = {
    sed_user: helptextSystemAdvanced.sed_user_tooltip,
    sed_passwd: helptextSystemAdvanced.sed_passwd_tooltip,
  };

  private sedConfig: SedConfig;

  constructor(
    private fb: FormBuilder,
    private ws: WebSocketService,
    private translate: TranslateService,
    private errorHandler: ErrorHandlerService,
    private cdr: ChangeDetectorRef,
    private store$: Store<AppState>,
    private snackbar: SnackbarService,
    private dialogService: DialogService,
    private chainedRef: ChainedRef<SedConfig>,
  ) {
    this.sedConfig = this.chainedRef.getData();
  }

  ngOnInit(): void {
    this.loadConfig();
  }

  onSubmit(): void {
    this.isFormLoading = true;

    const values = this.form.value;
    delete values.sed_passwd2;

    this.ws.call('system.advanced.update', [values]).pipe(untilDestroyed(this)).subscribe({
      next: () => {
        this.isFormLoading = false;
        this.snackbar.success(this.translate.instant('Settings saved'));
        this.cdr.markForCheck();
        this.chainedRef.close({ response: true, error: null });
        this.store$.dispatch(advancedConfigUpdated());
      },
      error: (error: unknown) => {
        this.isFormLoading = false;
        this.dialogService.error(this.errorHandler.parseError(error));
        this.cdr.markForCheck();
      },
    });
  }

  private loadConfig(): void {
    this.form.patchValue({
      sed_user: this.sedConfig.sedUser,
      sed_passwd: this.sedConfig.sedPassword,
    });
    this.isFormLoading = false;
    this.cdr.markForCheck();
  }
}
