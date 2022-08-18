import { Component, OnInit } from '@angular/core';
import { AbstractControl, UntypedFormGroup } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import * as _ from 'lodash';
import {
  FormToggleButtonConfig,
  FormToggleButtonOption,
} from 'app/modules/entity/entity-form/models/field-config.interface';
import { Field } from 'app/modules/entity/entity-form/models/field.interface';

@UntilDestroy()
@Component({
  templateUrl: './form-toggle-button.component.html',
  styleUrls: ['./form-toggle-button.component.scss'],
})
export class FormToggleButtonComponent implements Field, OnInit {
  config: FormToggleButtonConfig;
  group: UntypedFormGroup;
  fieldShow: string;
  groupValue: unknown[] = [];
  protected init: boolean;
  protected control: AbstractControl;

  constructor(public translate: TranslateService) {}

  ngOnInit(): void {
    this.init = true;
    this.control = this.group.controls[this.config.name];

    this.control.valueChanges.pipe(untilDestroyed(this)).subscribe((res: unknown) => {
      if (!this.init || !this.config.options || !res) {
        return;
      }

      this.init = false;
      let allSelected = false;
      const values = _.split(this.control.value, ',');
      if (this.control.value === '*') {
        allSelected = true;
      }
      this.config.options.forEach((option) => {
        if (_.indexOf(values, option.value) > -1) {
          option.checked = false;
          this.check(option);
        }

        if (allSelected) {
          option.checked = false;
          this.check(option);
        }
      });
    });
  }

  check(item: FormToggleButtonOption): void {
    this.init = false;
    item.checked = !item.checked;
    const target = _.findIndex(this.groupValue, _.unary(_.partialRight(_.includes, item.value)));
    if (target > -1) {
      this.groupValue.splice(target, 1);
    } else {
      this.groupValue.push(item.value);
    }
    this.control.setValue(this.groupValue);
  }
}
