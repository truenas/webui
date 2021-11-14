import {
  ChangeDetectionStrategy, Component,
} from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import _ from 'lodash';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { helptextSystemGeneral as helptext } from 'app/helptext/system/general';
import { LocalizationSettings } from 'app/interfaces/localization-settings.interface';
import { Option } from 'app/interfaces/option.interface';
import { FormErrorHandlerService } from 'app/pages/common/ix-forms/services/form-error-handler.service';
import { LanguageService, SystemGeneralService, WebSocketService } from 'app/services';
import { IxModalService } from 'app/services/ix-modal.service';
import { LocaleService } from 'app/services/locale.service';

@UntilDestroy()
@Component({
  selector: 'localization-form',
  templateUrl: './localization-form.component.html',
  styleUrls: ['./localization-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LocalizationFormComponent {
  fieldsetTitle = helptext.localeTitle;

  isFormLoading = false;

  sortLanguagesByName = true;

  formGroup: FormGroup = this.fb.group({
    language: [''],
    kbdmap: [''],
    timezone: [''],
    date_format: [''],
    time_format: [''],
  });

  language: {
    readonly fcName: 'language';
    label: string;
    tooltip: string;
    options: Observable<Option[]>;
  } = {
    fcName: 'language',
    label: helptext.stg_language.placeholder,
    tooltip: helptext.stg_language.tooltip,
    options: this.sysGeneralService.languageOptions(this.sortLanguagesByName),
  };

  kbdMap: {
    readonly fcName: 'kbdmap';
    label: string;
    tooltip: string;
    options: Observable<Option[]>;
  } = {
    fcName: 'kbdmap',
    label: helptext.stg_kbdmap.placeholder,
    tooltip: helptext.stg_kbdmap.tooltip,
    options: this.sysGeneralService.kbdMapChoices(),
  };

  timezone: {
    readonly fcName: 'timezone';
    label: string;
    tooltip: string;
    options: Observable<Option[]>;
  } = {
    fcName: 'timezone',
    label: helptext.stg_timezone.placeholder,
    tooltip: helptext.stg_timezone.tooltip,
    options: this.sysGeneralService.timezoneChoices().pipe(
      map((tzChoices) => _.sortBy(tzChoices, [(o) => o.label.toLowerCase()])),
    ),
  };

  dateFormat: {
    readonly fcName: 'date_format';
    label: string;
    tooltip: string;
    options?: Observable<Option[]>;
  } = {
    fcName: 'date_format',
    label: helptext.date_format.placeholder,
    tooltip: helptext.date_format.tooltip,
  };

  timeFormat: {
    readonly fcName: 'time_format';
    label: string;
    tooltip: string;
    options?: Observable<Option[]>;
  } = {
    fcName: 'time_format',
    label: helptext.time_format.placeholder,
    tooltip: helptext.time_format.tooltip,
  };

  constructor(
    private sysGeneralService: SystemGeneralService,
    private fb: FormBuilder,
    public localeService: LocaleService,
    protected ws: WebSocketService,
    protected langService: LanguageService,
    private modalService: IxModalService,
    private errorHandler: FormErrorHandlerService,
  ) { }

  setTimeOptions(tz: string): void {
    const timeOptions = this.localeService.getTimeFormatOptions(tz);
    this.timeFormat.options = of(timeOptions);
    const dateOptions = this.localeService.getDateFormatOptions(tz);
    this.dateFormat.options = of(dateOptions);
  }

  setupForm(localizationSettings: LocalizationSettings): void {
    this.setTimeOptions(localizationSettings.timezone);
    this.formGroup.patchValue({
      language: localizationSettings.language,
      kbdmap: localizationSettings.kbdMap,
      timezone: localizationSettings.timezone,
      date_format: localizationSettings.dateFormat,
      time_format: localizationSettings.timeFormat,
    });
  }

  submit(): void {
    const body = this.formGroup.value;
    this.isFormLoading = true;
    this.localeService.saveDateTimeFormat(body.date_format, body.time_format);
    delete body.date_format;
    delete body.time_format;
    this.ws.call('system.general.update', [body]).pipe(untilDestroyed(this)).subscribe(() => {
      this.sysGeneralService.refreshSysGeneral();
      this.isFormLoading = false;
      this.modalService.close();
      this.setTimeOptions(body.timezone);
      this.langService.setLanguage(body.language);
    }, (error) => {
      this.isFormLoading = false;
      this.errorHandler.handleWsFormError(error, this.formGroup);
    });
  }
}
