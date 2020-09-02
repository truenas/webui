import { Component, OnDestroy } from '@angular/core';
import { helptext_system_general as helptext } from 'app/helptext/system/general';
import { FieldSet } from 'app/pages/common/entity/entity-form/models/fieldset.interface';
import * as _ from 'lodash';
import { Subscription } from 'rxjs';
import { DialogService, LanguageService, SystemGeneralService, WebSocketService } from '../../../../services/';
import { AppLoaderService } from '../../../../services/app-loader/app-loader.service';
import { LocaleService } from 'app/services/locale.service';
import { FieldConfig } from '../../../common/entity/entity-form/models/field-config.interface';
import { EntityUtils } from '../../../common/entity/utils';

@Component({
  selector: 'app-localization-form',
  template: `<entity-form [conf]="this"></entity-form>`,
  providers: []
})
export class LocalizationFormComponent implements OnDestroy{
  protected queryCall = 'none';
  protected updateCall = 'system.general.update';
  public sortLanguagesByName = true;
  public languageList: { label: string; value: string }[] = [];
  public languageKey: string;  
  private dateTimeChangeSubscription: Subscription;
  public title = helptext.localeTitle;
  public fieldConfig: FieldConfig[] = []

  public fieldSets: FieldSet[] = [
    {
      name: helptext.stg_fieldset_loc,
      label: true,
      config: [
        {
          type: "combobox",
          name: "language",
          placeholder: helptext.stg_language.placeholder,
          tooltip: helptext.stg_language.tooltip,
          options: [],
        },
        {
          type: "select",
          name: "kbdmap",
          placeholder: helptext.stg_kbdmap.placeholder,
          tooltip: helptext.stg_kbdmap.tooltip,
          options: [{ label: "---", value: null }],
        },
        {
          type: "radio",
          name: "language_sort",
          placeholder: helptext.stg_language_sort_label,
          options: [
            {
              label: helptext.stg_language_sort_name,
              name: "language_name",
              value: true
            },
            {
              label: helptext.stg_language_sort_code,
              name: "language_code",
              value: false
            }
          ],
          value: true,
        },
        {
          type: 'combobox',
          name: 'timezone',
          placeholder: helptext.stg_timezone.placeholder,
          tooltip: helptext.stg_timezone.tooltip,
          options: [{ label: "---", value: null }],
        },
        {
          type: 'select',
          name: 'date_format',
          placeholder: helptext.date_format.placeholder,
          tooltip: helptext.date_format.tooltip,
          options: [],
          isLoading: true
        },
        { type: 'paragraph', name: 'spacer', width: '2%' },
        {
          type: 'select',
          name: 'time_format',
          placeholder: helptext.time_format.placeholder,
          tooltip: helptext.time_format.tooltip,
          options: [],
          isLoading: true
        }
      ]
    }
  ];

  private entityForm: any;
  private configData: any;

  constructor(
    protected language: LanguageService,
    protected ws: WebSocketService,
    protected dialog: DialogService,
    protected loader: AppLoaderService,
    private sysGeneralService: SystemGeneralService,
    public localeService: LocaleService
  ) {     
      this.sysGeneralService.sendLocalizationData$.subscribe(res => {
        this.configData = res;
      })
    }

  resourceTransformIncomingRestData(value) {
    console.log(this.configData)
    this.setTimeOptions(this.configData.timezone);
    return this.configData;
  }

  afterInit(entityEdit: any) {
    this.entityForm = entityEdit;

    this.makeLanguageList();

    this.sysGeneralService.kbdMapChoices().subscribe(mapChoices => {
      this.fieldSets
        .find(set => set.name === helptext.stg_fieldset_loc)
        .config.find(config => config.name === "kbdmap").options = mapChoices;
    });

    this.sysGeneralService.timezoneChoices().subscribe(tzChoices => {
      tzChoices = _.sortBy(tzChoices, [function(o) { return o.label.toLowerCase(); }]);
      this.fieldSets
        .find(set => set.name === helptext.stg_fieldset_loc)
        .config.find(config => config.name === "timezone").options = tzChoices;
    });
 
    entityEdit.formGroup.controls['language_sort'].valueChanges.subscribe((res)=> {
      res ? this.sortLanguagesByName = true : this.sortLanguagesByName = false;
      this.makeLanguageList();
    });

    this.getDateTimeFormats();
    this.dateTimeChangeSubscription = this.localeService.dateTimeFormatChange$.subscribe(() => {
      this.getDateTimeFormats();
    })

    entityEdit.formGroup.controls['language'].valueChanges.subscribe((res) => {
      this.languageKey = this.getKeyByValue(this.languageList, res);
      if (this.languageList[res]) {
        entityEdit.formGroup.controls['language'].setValue(`${this.languageList[res]}`);
      }
    });
  }

  setTimeOptions (tz: string) {
    const timeOptions = this.localeService.getTimeFormatOptions(tz);
    this.fieldSets
    .find(set => set.name === helptext.stg_fieldset_loc)
    .config.find(config => config.name === 'time_format').options = timeOptions;

    const dateOptions = this.localeService.getDateFormatOptions(tz);
    this.fieldSets
        .find(set => set.name === helptext.stg_fieldset_loc)
        .config.find(config => config.name === "date_format").options = dateOptions;

  }

  getDateTimeFormats() {
    this.entityForm.formGroup.controls['date_format'].setValue(this.localeService.getPreferredDateFormat());
    _.find(this.fieldConfig, { name: 'date_format' })['isLoading'] = false;
    this.entityForm.formGroup.controls['time_format'].setValue(this.localeService.getPreferredTimeFormat());
    _.find(this.fieldConfig, { name: 'time_format' })['isLoading'] = false;
  }

  makeLanguageList() {
    this.sysGeneralService.languageChoices().subscribe((res) => {
      this.languageList = res
      let options = 
        Object.keys(this.languageList || {}).map(key => ({
          label: this.sortLanguagesByName
            ? `${this.languageList[key]} (${key})`
            : `${key} (${this.languageList[key]})`,
          value: key
        }));
      this.fieldSets
        .find(set => set.name === helptext.stg_fieldset_loc)
        .config.find(config => config.name === "language").options = _.sortBy(
        options,
        this.sortLanguagesByName ? "label" : "value"
      );
    });
  }
   
  beforeSubmit(value) {
    delete value.language_sort;
    value.language = this.languageKey;
  }

  afterSubmit(value) {
    this.setTimeOptions(value.timezone);
    this.language.setLang(value.language);
  }

  public customSubmit(body) {
    this.localeService.saveDateTimeFormat(body.date_format, body.time_format);
    delete body.date_format;
    delete body.time_format;
    console.log(body)
    // this.loader.open();
    // return this.ws.call('system.general.update', [body]).subscribe(() => {
    //   this.loader.close();
    //   this.entityForm.success = true;
    //   this.entityForm.formGroup.markAsPristine();
    //   this.afterSubmit(body);
    // }, (res) => {
    //   this.loader.close();
    //   new EntityUtils().handleWSError(this.entityForm, res);
    // });
  }

  getKeyByValue(object, value) {
    return Object.keys(object).find(key => object[key] === value);
  }

  ngOnDestroy() {
    this.dateTimeChangeSubscription.unsubscribe();
  }

}
