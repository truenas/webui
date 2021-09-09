import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import _ from 'lodash';
import { Observable, of } from 'rxjs';
import { helptext_system_general as helptext } from 'app/helptext/system/general';
import { Option } from 'app/interfaces/option.interface';
import { SystemGeneralConfig } from 'app/interfaces/system-config.interface';
import { EntityUtils } from 'app/pages/common/entity/utils';
import { SystemGeneralService } from 'app/services';

@UntilDestroy()
@Component({
  selector: 'localization-form2',
  templateUrl: './localization-form2.component.html',
  styleUrls: ['./localization-form2.component.scss'],
})
export class LocalizationForm2 implements OnInit {
  fieldsetTitle = helptext.localeTitle;
  readonly languageFCName = 'language';
  sortLanguagesByName = true;

  formGroup: FormGroup;

  language: any = {
    label: helptext.stg_language.placeholder,
    tooltip: helptext.stg_language.tooltip,
  };
  private configData: SystemGeneralConfig;

  makeLanguageList(): void {
    this.sysGeneralService.languageChoices().pipe(untilDestroyed(this)).subscribe((languageList) => {
      const options = Object.keys(languageList || {}).map((key) => ({
        label: this.sortLanguagesByName
          ? `${languageList[key]} (${key})`
          : `${key} (${languageList[key]})`,
        value: key,
      }));
      this.language.options = of(_.sortBy(
        options,
        this.sortLanguagesByName ? 'label' : 'value',
      ));
      this.formGroup.get('language').setValue(this.configData?.language);
    }, (err: any) => {
      new EntityUtils().handleError(this, err);
    });
  }

  constructor(private sysGeneralService: SystemGeneralService, private fb: FormBuilder) {
    this.sysGeneralService.getGeneralConfig$
      .pipe(untilDestroyed(this)).subscribe((res) => {
        this.configData = res;
        this.formGroup.get('language').setValue(this.configData.language);
      });
  }

  filterLanguage(options: Option[], value: string): Observable<Option[]> {
    const filtered = options.filter((option: Option) => {
      return option.label.toLowerCase().includes(value.toLowerCase())
        || option.value.toString().toLowerCase().includes(value.toLowerCase());
    });
    return of(filtered);
  }

  ngOnInit(): void {
    this.formGroup = this.fb.group({
      language: [this.configData?.language, [Validators.required]],
    });

    this.makeLanguageList();
  }

  getKeyByValue(object: { [key: string]: unknown }, value: unknown): string {
    return Object.keys(object).find((key) => object[key] === value);
  }

  submit(value: any): void {
    value;
    // console.log("value", value);
  }
}
