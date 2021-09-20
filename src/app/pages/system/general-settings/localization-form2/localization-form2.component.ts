import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import _ from 'lodash';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { helptext_system_general as helptext } from 'app/helptext/system/general';
import { Option } from 'app/interfaces/option.interface';
import { SystemGeneralConfig } from 'app/interfaces/system-config.interface';
import { EntityUtils } from 'app/pages/common/entity/utils';
import {
  LanguageService, SystemGeneralService, WebSocketService,
} from 'app/services';
import { IxModalService } from 'app/services/ix-modal.service';
import { LocaleService } from 'app/services/locale.service';

@UntilDestroy()
@Component({
  selector: 'localization-form2',
  templateUrl: './localization-form2.component.html',
  styleUrls: ['./localization-form2.component.scss'],
})
export class LocalizationForm2Component implements OnInit {
  fieldsetTitle = helptext.localeTitle;

  formIsLoading = false;

  sortLanguagesByName = true;

  formGroup: FormGroup;

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

  private configData: SystemGeneralConfig;

  constructor(
    private sysGeneralService: SystemGeneralService,
    private fb: FormBuilder,
    public localeService: LocaleService,
    protected ws: WebSocketService,
    protected langService: LanguageService,
    private modalService: IxModalService,
    private router: Router,
  ) {
    this.sysGeneralService.getGeneralConfig$
      .pipe(untilDestroyed(this)).subscribe((res) => {
        this.configData = res;
        this.formGroup.get('language').setValue(this.configData?.language);
        this.formGroup.get('kbdmap').setValue(this.configData?.kbdmap);
        this.formGroup.get('timezone').setValue(this.configData?.timezone);
        this.setTimeOptions(this.configData.timezone);
      });
  }

  ngOnInit(): void {
    this.formGroup = this.fb.group({
      language: [this.configData?.language],
      kbdmap: [this.configData?.kbdmap],
      timezone: [this.configData?.timezone],
      date_format: [this.localeService.getPreferredDateFormat()],
      time_format: [this.localeService.getPreferredTimeFormat()],
    });
  }

  setTimeOptions(tz: string): void {
    const timeOptions = this.localeService.getTimeFormatOptions(tz);
    this.timeFormat.options = of(timeOptions);

    const dateOptions = this.localeService.getDateFormatOptions(tz);
    this.dateFormat.options = of(dateOptions);
  }

  submit(): void {
    const body = this.formGroup.value;
    this.formIsLoading = true;
    this.localeService.saveDateTimeFormat(body.date_format, body.time_format);
    delete body.date_format;
    delete body.time_format;
    this.ws.call('system.general.update', [body]).pipe(untilDestroyed(this)).subscribe(() => {
      this.sysGeneralService.refreshSysGeneral();
      this.formIsLoading = false;
      this.modalService.close();
      this.setTimeOptions(body.timezone);
      this.langService.setLanguage(body.language);
    }, (res) => {
      this.formIsLoading = false;
      this.modalService.close();
      new EntityUtils().handleWSError(this, res);
    });
  }

  cancel(): void {
    this.modalService.close();
  }
}
