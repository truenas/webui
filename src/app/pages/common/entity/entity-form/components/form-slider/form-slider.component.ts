import { Component, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { MatSliderChange } from '@angular/material/slider/slider';
import { TranslateService } from '@ngx-translate/core';

import { FieldConfig } from '../../models/field-config.interface';
import { Field } from '../../models/field.interface';

@Component({
  selector: 'form-slider',
  templateUrl: './form-slider.component.html',
  styleUrls: ['./form-slider.component.scss'],
})
export class FormSliderComponent implements Field, OnInit {
  config: FieldConfig;
  group: FormGroup;
  fieldShow: string;
  value: any;

  constructor(public translate: TranslateService) {}

  ngOnInit(): void {
    this.value = this.config.min;
    this.group.controls[this.config.name].valueChanges.subscribe((res) => {
      this.value = res;
    });
  }

  updateValue($event: MatSliderChange): void {
    this.value = $event.value;
  }
}
