import { Component } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import * as _ from 'lodash';
import { Subscription } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { helptext_system_general as helptext } from 'app/helptext/system/general';
import { Choices } from 'app/interfaces/choices.interface';
import { FormConfiguration } from 'app/interfaces/entity-form.interface';
import { Option } from 'app/interfaces/option.interface';
import { SystemGeneralConfig } from 'app/interfaces/system-config.interface';
import { EntityFormComponent } from 'app/pages/common/entity/entity-form';
import { FieldConfig, FormSelectConfig, FormComboboxConfig } from 'app/pages/common/entity/entity-form/models/field-config.interface';
import { FieldSet } from 'app/pages/common/entity/entity-form/models/fieldset.interface';
import { EntityUtils } from 'app/pages/common/entity/utils';
import {
  DialogService, LanguageService, SystemGeneralService, WebSocketService,
} from 'app/services';
import { AppLoaderService } from 'app/services/app-loader/app-loader.service';
import { LocaleService } from 'app/services/locale.service';
import { ModalService } from 'app/services/modal.service';

@UntilDestroy()
@Component({
  selector: 'app-localization-form',
  template: '<entity-form [conf]="this"></entity-form>',
  providers: [],
})
export class LocalizationFormComponent implements FormConfiguration {
  protected updateCall = 'system.general.update';
  sortLanguagesByName = true;
  languageList: Choices;
  languageKey: string;
  title = helptext.localeTitle;
  protected isOneColumnForm = true;
  fieldConfig: FieldConfig[] = [];

  fieldSets: FieldSet[] = [
    {
      name: helptext.stg_fieldset_loc,
      label: true,
      config: [
        {
          type: 'combobox',
          name: 'language',
          placeholder: helptext.stg_language.placeholder,
          tooltip: helptext.stg_language.tooltip,
          options: [],
        },
        {
          type: 'select',
          name: 'kbdmap',
          placeholder: helptext.stg_kbdmap.placeholder,
          tooltip: helptext.stg_kbdmap.tooltip,
          options: [{ label: '---', value: null }],
        },
        {
          type: 'combobox',
          name: 'timezone',
          placeholder: helptext.stg_timezone.placeholder,
          tooltip: helptext.stg_timezone.tooltip,
          options: [{ label: '---', value: null }],
        },
        {
          type: 'select',
          name: 'date_format',
          placeholder: helptext.date_format.placeholder,
          tooltip: helptext.date_format.tooltip,
          options: [],
          isLoading: true,
        },
        {
          type: 'select',
          name: 'time_format',
          placeholder: helptext.time_format.placeholder,
          tooltip: helptext.time_format.tooltip,
          options: [],
          isLoading: true,
        },
      ],
    },
  ];

  private entityForm: EntityFormComponent;
  private configData: SystemGeneralConfig;

  constructor(
    protected language: LanguageService,
    protected ws: WebSocketService,
    protected dialog: DialogService,
    protected loader: AppLoaderService,
    private sysGeneralService: SystemGeneralService,
    public localeService: LocaleService,
    private modalService: ModalService,
  ) {}

  prerequisite(): Promise<boolean> {
    return this.sysGeneralService.getGeneralConfig$.pipe(
      map((configData) => {
        this.configData = configData;
        return true;
      }),
      take(1),
      untilDestroyed(this),
    ).toPromise();
  }

  afterInit(entityEdit: EntityFormComponent): void {
    this.entityForm = entityEdit;
    this.setTimeOptions(this.configData.timezone);
    this.makeLanguageList();

    this.sysGeneralService.kbdMapChoices().pipe(untilDestroyed(this)).subscribe((mapChoices) => {
      const config: FormSelectConfig = this.fieldSets
        .find((set) => set.name === helptext.stg_fieldset_loc)
        .config.find((config: FormSelectConfig) => config.name === 'kbdmap');
      config.options = mapChoices;
      this.entityForm.formGroup.controls['kbdmap'].setValue(this.configData.kbdmap);
    });

    this.sysGeneralService.timezoneChoices().pipe(untilDestroyed(this)).subscribe((tzChoices) => {
      tzChoices = _.sortBy(tzChoices, [(o) => o.label.toLowerCase()]);
      const config = this.fieldSets
        .find((set) => set.name === helptext.stg_fieldset_loc)
        .config.find((config) => config.name === 'timezone') as FormComboboxConfig;
      config.options = tzChoices;
      this.entityForm.formGroup.controls['timezone'].setValue(this.configData.timezone);
    });

    this.getDateTimeFormats();
    this.localeService.dateTimeFormatChange$.pipe(untilDestroyed(this)).subscribe(() => {
      this.getDateTimeFormats();
    });

    entityEdit.formGroup.controls['language'].valueChanges.pipe(untilDestroyed(this)).subscribe((res: string) => {
      this.languageKey = this.getKeyByValue(this.languageList, res);
      if (this.languageList[res]) {
        entityEdit.formGroup.controls['language'].setValue(`${this.languageList[res]}`);
      }
    });
  }

  setTimeOptions(tz: string): void {
    const timeOptions = this.localeService.getTimeFormatOptions(tz);
    const timeConfig: FormSelectConfig = this.fieldSets
      .find((set) => set.name === helptext.stg_fieldset_loc)
      .config.find((config) => config.name === 'time_format');
    timeConfig.options = timeOptions;

    const dateOptions = this.localeService.getDateFormatOptions(tz);
    const dateConfig: FormSelectConfig = this.fieldSets
      .find((set) => set.name === helptext.stg_fieldset_loc)
      .config.find((config) => config.name === 'date_format');
    dateConfig.options = dateOptions;
  }

  getDateTimeFormats(): void {
    this.entityForm.formGroup.controls['date_format'].setValue(this.localeService.getPreferredDateFormat());

    const dateFormatConfig: FormSelectConfig = _.find(this.fieldConfig, { name: 'date_format' });
    dateFormatConfig.isLoading = false;

    this.entityForm.formGroup.controls['time_format'].setValue(this.localeService.getPreferredTimeFormat());
    const timeFormatConfig: FormSelectConfig = _.find(this.fieldConfig, { name: 'time_format' });
    timeFormatConfig.isLoading = false;
  }

  makeLanguageList(): void {
    this.sysGeneralService.languageChoices().pipe(untilDestroyed(this)).subscribe((res) => {
      this.languageList = res;
      const options: Option[] = Object.keys(this.languageList || {}).map((key) => ({
        label: this.sortLanguagesByName
          ? `${this.languageList[key]} (${key})`
          : `${key} (${this.languageList[key]})`,
        value: key,
      }));
      const config = this.fieldSets
        .find((set) => set.name === helptext.stg_fieldset_loc)
        .config.find((config) => config.name === 'language') as FormComboboxConfig;
      config.options = _.sortBy(
        options,
        this.sortLanguagesByName ? 'label' : 'value',
      );
      this.entityForm.formGroup.controls['language'].setValue(this.configData.language);
    });
  }

  beforeSubmit(value: any): void {
    value.language = this.languageKey;
  }

  afterSubmit(value: any): void {
    this.setTimeOptions(value.timezone);
    this.language.setLanguage(value.language);
  }

  customSubmit(body: any): Subscription {
    this.localeService.saveDateTimeFormat(body.date_format, body.time_format);
    delete body.date_format;
    delete body.time_format;
    this.loader.open();
    return this.ws.call('system.general.update', [body]).pipe(untilDestroyed(this)).subscribe(() => {
      this.sysGeneralService.refreshSysGeneral();
      this.loader.close();
      this.entityForm.success = true;
      this.entityForm.formGroup.markAsPristine();
      this.modalService.close('slide-in-form');
      this.afterSubmit(body);
    }, (res) => {
      this.loader.close();
      this.modalService.close('slide-in-form');
      new EntityUtils().handleWSError(this.entityForm, res);
    });
  }

  getKeyByValue(object: { [key: string]: unknown }, value: unknown): string {
    return Object.keys(object).find((key) => object[key] === value);
  }
}
