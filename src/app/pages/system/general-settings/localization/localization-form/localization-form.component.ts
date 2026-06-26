import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { TranslateModule } from '@ngx-translate/core';
import { TnFormFieldComponent, TnFormSectionComponent, TnSelectComponent } from '@truenas/ui-components';
import { sortBy } from 'lodash-es';
import { of } from 'rxjs';
import { map } from 'rxjs/operators';
import { helptextSystemGeneral as helptext } from 'app/helptext/system/general';
import { LocalizationSettings } from 'app/interfaces/localization-settings.interface';
import { SimpleAsyncComboboxProvider } from 'app/modules/forms/ix-forms/classes/simple-async-combobox-provider';
import { IxComboboxComponent } from 'app/modules/forms/ix-forms/components/ix-combobox/ix-combobox.component';
import {
  FormSubmitEvent,
  IxFormComponent,
  SubmitResult,
} from 'app/modules/forms/ix-forms/components/ix-form/ix-form.component';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
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
    AsyncPipe,
    IxFormComponent,
    ReactiveFormsModule,
    TnFormSectionComponent,
    TnFormFieldComponent,
    TnSelectComponent,
    IxComboboxComponent,
    TranslateModule,
  ],
})
export class LocalizationFormComponent implements OnInit {
  private sysGeneralService = inject(SystemGeneralService);
  private fb = inject(FormBuilder);
  private api = inject(ApiService);
  private store$ = inject<Store<AppState>>(Store);
  slideInRef = inject<SlideInRef<LocalizationSettings, boolean>>(SlideInRef);

  fieldsetTitle = helptext.localeTitle;

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

  protected handleSubmit = (event: FormSubmitEvent): SubmitResult => ({
    request$: this.api.call('system.general.update', [event.allValues]),
    onSuccess: () => {
      this.store$.dispatch(generalConfigUpdated());
      this.store$.dispatch(systemInfoUpdated());
    },
    closeWith: () => true,
  });
}
