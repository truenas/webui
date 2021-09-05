import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import _ from 'lodash';
import { of } from 'rxjs';
import { helptext_system_general as helptext } from 'app/helptext/system/general';
import { Choices } from 'app/interfaces/choices.interface';
import { Option } from 'app/interfaces/option.interface';
import { SystemGeneralConfig } from 'app/interfaces/system-config.interface';
import { SystemGeneralService } from 'app/services';

@UntilDestroy()
@Component({
  selector: 'localization-form2',
  templateUrl: './localization-form2.component.html',
  styleUrls: ['./localization-form2.component.scss'],
})
export class LocalizationForm2 implements OnInit {
  fieldsetTitle = helptext.localeTitle;
  languageKey: string;
  languageList: Choices;
  sortLanguagesByName = true;

  formGroup: FormGroup;

  language: any = {
    label: helptext.stg_language.placeholder,
    tooltip: helptext.stg_language.tooltip,
  };
  private configData: SystemGeneralConfig;

  makeLanguageList(): void {
    this.sysGeneralService.languageChoices().pipe(untilDestroyed(this)).subscribe((res) => {
      this.languageList = res;
      const options = Object.keys(this.languageList || {}).map((key) => ({
        label: this.sortLanguagesByName
          ? `${this.languageList[key]} (${key})`
          : `${key} (${this.languageList[key]})`,
        value: key,
      }));

      this.language.options = _.sortBy(
        options,
        this.sortLanguagesByName ? 'label' : 'value',
      );
      this.language.filteredOptions = of([...this.language.options]);
      this.formGroup.get('language').setValue(this.configData?.language);
    });
  }

  constructor(private sysGeneralService: SystemGeneralService, private fb: FormBuilder) {
    this.sysGeneralService.getGeneralConfig$
      .pipe(untilDestroyed(this)).subscribe((res) => {
        this.configData = res;
        this.formGroup.get('language').setValue(this.configData.language);
      });
  }

  filterLanguage(value: string): void {
    if (!value || (typeof value).toLowerCase() !== 'string') {
      return;
    }
    const filtered = Object.keys(this.languageList || {})
      .filter((key: string) =>
        this.languageList[key].toLowerCase()
          .includes(value.toLowerCase()));
    const filteredOptions = filtered.map((key) => ({
      label: this.sortLanguagesByName
        ? `${this.languageList[key]} (${key})`
        : `${key} (${this.languageList[key]})`,
      value: key,
    }));
    this.language.filteredOptions = of(filteredOptions);
  }

  ngOnInit(): void {
    this.formGroup = this.fb.group({
      language: [this.configData?.language, [Validators.required]],
    });
    this.makeLanguageList();

    this.formGroup.get('language').valueChanges.pipe(untilDestroyed(this)).subscribe((lan: any) => {
      if ((typeof lan).toLowerCase() !== typeof Option) {
        this.filterLanguage(lan);
      } else {
        this.languageKey = lan.key;
      }
      // this.languageKey = this.getKeyByValue(this.languageList, lan);
      // if (this.languageList[lan]) {
      //     this.formGroup.get('language').setValue(`${this.languageList[lan]}`);
      // }
    });
  }

  getKeyByValue(object: { [key: string]: unknown }, value: unknown): string {
    return Object.keys(object).find((key) => object[key] === value);
  }

  submit(value: any): void {
    value;
    // console.log("value", value);
  }
}
