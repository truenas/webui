import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, signal, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { Store } from '@ngrx/store';
import { TranslateModule } from '@ngx-translate/core';
import { sortBy } from 'lodash-es';
import { of } from 'rxjs';
import { map } from 'rxjs/operators';
import { helptextSystemGeneral as helptext } from 'app/helptext/system/general';
import { LocalizationSettings } from 'app/interfaces/localization-settings.interface';
import { SimpleAsyncComboboxProvider } from 'app/modules/forms/ix-forms/classes/simple-async-combobox-provider';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxComboboxComponent } from 'app/modules/forms/ix-forms/components/ix-combobox/ix-combobox.component';
import { IxFieldsetComponent } from 'app/modules/forms/ix-forms/components/ix-fieldset/ix-fieldset.component';
import { IxSelectComponent } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.component';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { ModalHeaderComponent } from 'app/modules/slide-ins/components/modal-header/modal-header.component';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';
import { SystemGeneralService } from 'app/services/system-general.service';
import { AppState } from 'app/store';
import { generalConfigUpdated } from 'app/store/system-config/system-config.actions';
import { systemInfoUpdated } from 'app/store/system-info/system-info.actions';

@Component({
  selector: 'ix-localization-form',
  templateUrl: './localization-form.component.html',
  styleUrls: ['./localization-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ModalHeaderComponent,
    MatCard,
    MatCardContent,
    ReactiveFormsModule,
    IxFieldsetComponent,
    IxComboboxComponent,
    IxSelectComponent,
    FormActionsComponent,
    MatButton,
    TestDirective,
    TranslateModule,
  ],
})
export class LocalizationFormComponent implements OnInit {
  private sysGeneralService = inject(SystemGeneralService);
  private fb = inject(FormBuilder);
  protected api = inject(ApiService);
  private errorHandler = inject(FormErrorHandlerService);
  private store$ = inject<Store<AppState>>(Store);
  slideInRef = inject<SlideInRef<LocalizationSettings, boolean>>(SlideInRef);
  private destroyRef = inject(DestroyRef);

  fieldsetTitle = helptext.localeTitle;

  isFormLoading = signal<boolean>(false);

  protected localizationSettings: LocalizationSettings;

  formGroup = this.fb.nonNullable.group({
    kbdmap: [''],
    timezone: ['', [Validators.required]],
  });

  protected kbdMap = {
    fcName: 'kbdmap',
    label: helptext.kbdmap.label,
    options: this.sysGeneralService.kbdMapChoices(),
  };

  protected timezone = {
    fcName: 'timezone',
    label: helptext.timezone.label,
    provider: new SimpleAsyncComboboxProvider(this.sysGeneralService.timezoneChoices().pipe(map(
      (tzChoices) => sortBy(tzChoices, [(option) => option.label.toLowerCase()]),
    ))),
  };

  constructor() {
    this.slideInRef.requireConfirmationWhen(() => {
      return of(this.formGroup.dirty);
    });

    this.localizationSettings = this.slideInRef.getData();
  }

  ngOnInit(): void {
    if (this.localizationSettings) {
      this.setupForm();
    }
  }

  protected setupForm(): void {
    this.formGroup.patchValue({
      kbdmap: this.localizationSettings.kbdMap,
      timezone: this.localizationSettings.timezone,
    });
  }

  protected submit(): void {
    const values = this.formGroup.getRawValue();
    this.isFormLoading.set(true);

    this.api.call('system.general.update', [values]).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.store$.dispatch(generalConfigUpdated());
        this.store$.dispatch(systemInfoUpdated());
        this.isFormLoading.set(false);
        this.slideInRef.close({ response: true });
      },
      error: (error: unknown) => {
        this.isFormLoading.set(false);
        this.errorHandler.handleValidationErrors(error, this.formGroup);
      },
    });
  }
}
