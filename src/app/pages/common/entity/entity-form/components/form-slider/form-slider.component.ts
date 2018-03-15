import { Component, ViewContainerRef, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';

import { FieldConfig } from '../../models/field-config.interface';
import { Field } from '../../models/field.interface';
import { TooltipComponent } from '../tooltip/tooltip.component';

@Component({
  selector: 'form-slider',
  templateUrl: './form-slider.component.html',
  styleUrls: ['./form-slider.component.css'],
})
export class FormSliderComponent implements Field, OnInit {
  config: FieldConfig;
  group: FormGroup;
  fieldShow: string;
  public value: any;

  constructor(public translate: TranslateService) {}

  ngOnInit() {
    this.value = this.config.min;
    this.group.controls[this.config.name].valueChanges.subscribe((res) => {
      this.value = res;
    })
  }

  updateValue($event) {
    this.value = $event.value;
  }
}
