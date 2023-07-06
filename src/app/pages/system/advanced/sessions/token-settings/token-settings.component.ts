import {
  Component, ChangeDetectionStrategy, OnInit, ChangeDetectorRef,
} from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { IxSlideInRef } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in-ref';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { AppState } from 'app/store';
import { defaultPreferences } from 'app/store/preferences/default-preferences.constant';
import { lifetimeTokenUpdated } from 'app/store/preferences/preferences.actions';
import { selectPreferences } from 'app/store/preferences/preferences.selectors';

@UntilDestroy()
@Component({
  templateUrl: 'token-settings.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TokenSettingsComponent implements OnInit {
  isFormLoading = false;
  form = this.fb.group({
    token_lifetime: [defaultPreferences.lifetime, [
      Validators.required,
      Validators.min(30),
      Validators.max(Math.floor(2 ** 31 / 1000 - 1)), // Max value for setTimeout
    ]],
  });

  constructor(
    private fb: FormBuilder,
    private slideInRef: IxSlideInRef<TokenSettingsComponent>,
    private store$: Store<AppState>,
    private cdr: ChangeDetectorRef,
    private snackbar: SnackbarService,
    private translate: TranslateService,
  ) {}

  ngOnInit(): void {
    this.store$.select(selectPreferences).pipe(untilDestroyed(this)).subscribe((preferences) => {
      if (preferences.lifetime) {
        this.form.controls.token_lifetime.setValue(preferences.lifetime);
        this.cdr.markForCheck();
      }
    });
  }

  onSubmit(): void {
    this.snackbar.success(this.translate.instant('Settings saved'));
    this.store$.dispatch(lifetimeTokenUpdated({ lifetime: this.form.value.token_lifetime }));
    this.slideInRef.close();
  }
}
