import { Component, OnDestroy, OnInit } from '@angular/core';
import { UntypedFormGroup } from '@angular/forms';
import { MatRadioChange } from '@angular/material/radio';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { FormRadioConfig } from 'app/modules/entity/entity-form/models/field-config.interface';
import { Field } from 'app/modules/entity/entity-form/models/field.interface';

@UntilDestroy()
@Component({
  styleUrls: ['form-radio.component.scss', '../dynamic-field/dynamic-field.scss'],
  templateUrl: './form-radio.component.html',
})
export class FormRadioComponent implements Field, OnInit, OnDestroy {
  config: FormRadioConfig;
  group: UntypedFormGroup;
  fieldShow: string;
  radioValue: string | number;
  valueChangesSubscription: Subscription;

  get radioLayout(): string {
    return this.config.inlineFields ? 'row wrap' : 'column';
  }

  get radioFlex(): string {
    if (this.radioLayout === 'column') return '100%';

    if (this.radioLayout === 'row wrap' && this.config.inlineFieldFlex) {
      return this.config.inlineFieldFlex;
    }
    return '50%';
  }

  constructor(public translate: TranslateService) {}

  ngOnInit(): void {
    this.valueChangesSubscription = this.group.controls[this.config.name].valueChanges
      .pipe(untilDestroyed(this))
      .subscribe((res) => this.radioValue = res);
  }

  ngOnDestroy(): void {
    this.valueChangesSubscription.unsubscribe();
  }

  onChangeRadio($event: MatRadioChange): void {
    if (this.config.onChange !== undefined && this.config.onChange !== null) {
      this.config.onChange({ event: $event });
    }
  }
}
