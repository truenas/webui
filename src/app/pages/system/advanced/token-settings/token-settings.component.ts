import {
  Component, ChangeDetectionStrategy, OnInit, Inject,
} from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { UntilDestroy } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { WINDOW } from 'app/helpers/window.helper';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { AppState } from 'app/store';
import { advancedConfigUpdated } from 'app/store/system-config/system-config.actions';

@UntilDestroy()
@Component({
  templateUrl: 'token-settings.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TokenSettingsComponent implements OnInit {
  isFormLoading = false;
  form = this.fb.group({
    token_lifetime: [null as number, [Validators.required, Validators.min(30)]],
  });

  constructor(
    private fb: FormBuilder,
    private slideInService: IxSlideInService,
    private store$: Store<AppState>,
    @Inject(WINDOW) private window: Window,
  ) {}

  ngOnInit(): void {
    const lifetime = Number(this.window.localStorage.getItem('lifetime')) || null;
    this.form.controls.token_lifetime.setValue(lifetime);
  }

  onSubmit(): void {
    this.window.localStorage.setItem('lifetime', this.form.value.token_lifetime.toString());
    this.store$.dispatch(advancedConfigUpdated());
    this.slideInService.close();
  }
}
