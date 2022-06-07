import { Component, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { MatSliderChange } from '@angular/material/slider/slider';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { FormSliderConfig } from 'app/modules/entity/entity-form/models/field-config.interface';
import { Field } from 'app/modules/entity/entity-form/models/field.interface';

@UntilDestroy()
@Component({
  selector: 'form-slider',
  templateUrl: './form-slider.component.html',
  styleUrls: ['./form-slider.component.scss'],
})
export class FormSliderComponent implements Field, OnInit {
  config: FormSliderConfig;
  group: FormGroup;
  fieldShow: string;
  value: number;

  constructor(public translate: TranslateService) {}

  ngOnInit(): void {
    this.value = this.config.min;
    this.group.controls[this.config.name].valueChanges.pipe(untilDestroyed(this)).subscribe((res) => {
      this.value = res;
    });
  }

  updateValue($event: MatSliderChange): void {
    this.value = $event.value;
  }
}
