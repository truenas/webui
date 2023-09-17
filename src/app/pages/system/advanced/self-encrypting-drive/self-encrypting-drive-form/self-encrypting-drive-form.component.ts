import {
  Component, ChangeDetectionStrategy, ChangeDetectorRef, OnInit,
} from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { forkJoin, of } from 'rxjs';
import { take } from 'rxjs/operators';
import { SedUser } from 'app/enums/sed-user.enum';
import { helptextSystemAdvanced } from 'app/helptext/system/advanced';
import { WebsocketError } from 'app/interfaces/websocket-error.interface';
import { IxSlideInRef } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in-ref';
import { IxValidatorsService } from 'app/modules/ix-forms/services/ix-validators.service';
import { matchOthersFgValidator } from 'app/modules/ix-forms/validators/password-validation/password-validation';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { DialogService } from 'app/services/dialog.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { WebSocketService } from 'app/services/ws.service';
import { AppState } from 'app/store';
import { advancedConfigUpdated } from 'app/store/system-config/system-config.actions';
import { waitForAdvancedConfig } from 'app/store/system-config/system-config.selectors';

@UntilDestroy()
@Component({
  templateUrl: 'self-encrypting-drive-form.component.html',
  styleUrls: ['./self-encrypting-drive-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SelfEncryptingDriveFormComponent implements OnInit {
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

  constructor(
    private fb: FormBuilder,
    private ws: WebSocketService,
    private translate: TranslateService,
    private validatorsService: IxValidatorsService,
    private slideInRef: IxSlideInRef<SelfEncryptingDriveFormComponent>,
    private errorHandler: ErrorHandlerService,
    private cdr: ChangeDetectorRef,
    private store$: Store<AppState>,
    private snackbar: SnackbarService,
    private dialogService: DialogService,
  ) {}

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
        this.slideInRef.close();
        this.store$.dispatch(advancedConfigUpdated());
      },
      error: (error: WebsocketError) => {
        this.isFormLoading = false;
        this.dialogService.error(this.errorHandler.parseWsError(error));
        this.cdr.markForCheck();
      },
    });
  }

  private loadConfig(): void {
    this.isFormLoading = true;
    this.cdr.markForCheck();

    forkJoin([
      this.store$.pipe(
        waitForAdvancedConfig,
        take(1),
      ),
      this.ws.call('system.advanced.sed_global_password'),
    ])
      .pipe(untilDestroyed(this))
      .subscribe({
        next: ([config, sedPassword]) => {
          this.form.patchValue({
            sed_user: config.sed_user,
            sed_passwd: sedPassword,
          });
          this.isFormLoading = false;
          this.cdr.markForCheck();
        },
        error: (error: WebsocketError) => {
          this.dialogService.error(this.errorHandler.parseWsError(error));
          this.isFormLoading = false;
          this.cdr.markForCheck();
        },
      });
  }
}
