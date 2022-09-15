import {
  Component, ChangeDetectionStrategy, ChangeDetectorRef,
} from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { SedUser } from 'app/enums/sed-user.enum';
import { helptextSystemAdvanced } from 'app/helptext/system/advanced';
import { AdvancedConfig } from 'app/interfaces/advanced-config.interface';
import { matchOtherValidator } from 'app/modules/entity/entity-form/validators/password-validation/password-validation';
import { EntityUtils } from 'app/modules/entity/utils';
import { IxValidatorsService } from 'app/modules/ix-forms/services/ix-validators.service';
import { WebSocketService } from 'app/services';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { AppState } from 'app/store';
import { advancedConfigUpdated } from 'app/store/system-config/system-config.actions';

@UntilDestroy()
@Component({
  templateUrl: 'sed-form.component.html',
  styleUrls: ['./sed-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SedFormComponent {
  isFormLoading = false;
  title = helptextSystemAdvanced.fieldset_sed;
  form = this.fb.group({
    sed_user: ['' as SedUser, Validators.required],
    sed_passwd: [''],
    sed_passwd2: ['', [
      this.validatorsService.withMessage(
        matchOtherValidator('sed_passwd'),
        this.translate.instant('SED password and confirmation should match.'),
      ),
    ]],
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
    private slideInService: IxSlideInService,
    private cdr: ChangeDetectorRef,
    private store$: Store<AppState>,
  ) {}

  setupForm(group: AdvancedConfig, sedPassword: string): void {
    this.form.patchValue({
      sed_user: group?.sed_user,
      sed_passwd: sedPassword,
    });
    this.cdr.markForCheck();
  }

  onSubmit(): void {
    this.isFormLoading = true;

    const values = this.form.value;
    delete values.sed_passwd2;

    this.ws.call('system.advanced.update', [values]).pipe(untilDestroyed(this)).subscribe({
      next: () => {
        this.isFormLoading = false;
        this.cdr.markForCheck();
        this.slideInService.close();
        this.store$.dispatch(advancedConfigUpdated());
      },
      error: (error) => {
        this.isFormLoading = false;
        new EntityUtils().handleWsError(this, error);
        this.cdr.markForCheck();
      },
    });
  }
}
