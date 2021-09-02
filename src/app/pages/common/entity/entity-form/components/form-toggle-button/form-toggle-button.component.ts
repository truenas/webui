import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormGroup } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import * as _ from 'lodash';
import { FormToggleButtonConfig } from 'app/pages/common/entity/entity-form/models/field-config.interface';
import { Field } from 'app/pages/common/entity/entity-form/models/field.interface';

@UntilDestroy()
@Component({
  selector: 'form-toggle-button',
  templateUrl: './form-toggle-button.component.html',
  styleUrls: ['./form-toggle-button.component.scss'],
})
export class FormToggleButtonComponent implements Field, OnInit {
  config: FormToggleButtonConfig;
  group: FormGroup;
  fieldShow: string;
  groupValue: any[] = [];
  protected init: boolean;
  protected control: AbstractControl;

  constructor(public translate: TranslateService) {}

  ngOnInit(): void {
    this.init = true;
    this.control = this.group.controls[this.config.name];

    this.control.valueChanges.pipe(untilDestroyed(this)).subscribe((res: any) => {
      if (this.init && this.config.options && res) {
        this.init = false;
        let all_selected = false;
        const values = _.split(this.control.value, ',');
        if (this.control.value == '*') {
          all_selected = true;
        }
        for (const i in this.config.options) {
          if (_.indexOf(values, this.config.options[i].value) > -1) {
            this.config.options[i].checked = false;
            this.check(this.config.options[i]);
          }

          if (all_selected) {
            this.config.options[i].checked = false;
            this.check(this.config.options[i]);
          }
        }
      }
    });
  }

  check(item: any): void {
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
