import { Component, ViewContainerRef, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';

import { FieldConfig } from '../../models/field-config.interface';
import { Field } from '../../models/field.interface';
import { TooltipComponent } from '../tooltip/tooltip.component';
import * as _ from 'lodash';

@Component({
  selector: 'form-toggle-button',
  templateUrl: './form-toggle-button.component.html',
  styleUrls: ['./form-toggle-button.component.css']
})
export class FormToggleButtonComponent implements Field, OnInit {
  config: FieldConfig;
  group: FormGroup;
  fieldShow: string;
  public groupValue: Array < any >= [];
  protected init: boolean;
  protected control: any;

  constructor(public translate: TranslateService) {}

  ngOnInit() {
    this.init = true;
    this.control = this.group.controls[this.config.name];

    this.control.valueChanges.subscribe((res) => {
      if (this.init && this.config.options && res) {
        this.init = false;
        let all_selected = false;
        let values = _.split(this.control.value, ',');
        if (this.control.value == '*') {
          all_selected = true;
        }
        for (let i in this.config.options) {
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

  check(item) {
    this.init = false;
    item.checked = !item.checked;
    let target = _.findIndex(this.groupValue, _.unary(_.partialRight(_.includes, item.value)));
    if (target > -1) {
      this.groupValue.splice(target, 1);
    } else {
      this.groupValue.push(item.value);
    }
    this.control.setValue(this.groupValue);
  }
}
