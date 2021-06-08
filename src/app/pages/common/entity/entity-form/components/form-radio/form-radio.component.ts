import { Component } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { MatRadioChange } from '@angular/material/radio/radio';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { FieldConfig } from 'app/pages/common/entity/entity-form/models/field-config.interface';
import { Field } from 'app/pages/common/entity/entity-form/models/field.interface';

@UntilDestroy()
@Component({
  selector: 'form-radio',
  styleUrls:
      ['form-radio.component.scss', '../dynamic-field/dynamic-field.scss'],
  templateUrl: './form-radio.component.html',
})
export class FormRadioComponent implements Field {
  config: FieldConfig;
  group: FormGroup;
  fieldShow: string;
  radioValue: any;
  valueChangesSubscription: Subscription;

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
    if (this.config.onChange !== undefined && this.config.onChange != null) {
      this.config.onChange({ event: $event });
    }
  }
}
