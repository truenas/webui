import { Component, ViewContainerRef, AfterViewInit, OnInit, ViewChild } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';

import { FieldConfig } from '../../models/field-config.interface';
import { Field } from '../../models/field.interface';
import { TooltipComponent } from '../tooltip/tooltip.component';
import { FormSliderComponent } from '../form-slider/form-slider.component';
import { FormToggleButtonComponent } from '../form-toggle-button/form-toggle-button.component';
import { EntityFormService } from '../../services/entity-form.service';
import * as _ from 'lodash';

@Component({
  selector: 'form-task',
  templateUrl: './form-task.component.html',
  styleUrls: ['./form-task.component.css'],
})
export class FormTaskComponent implements Field, AfterViewInit, OnInit {
  config: FieldConfig;
  group: FormGroup;
  fieldShow: string;

  public tabFormGroup: any;
  protected control: any;
  protected active_tab: any;
  protected value: any;
  protected init: boolean;
  @ViewChild('tabGroup', { static: true}) tabGroup;

  constructor(protected entityFormService: EntityFormService, 
              public translate: TranslateService) {}
  ngAfterViewInit() {
    this.active_tab = this.config.tabs[this.tabGroup.selectedIndex];
    this.setControlValue();
  }

  ngOnInit() {
    this.init = true;

    this.tabFormGroup = this.entityFormService.createFormGroup(this.config.tabs);
    this.control = this.group.controls[this.config.name];
    for (let item in this.tabFormGroup.controls) {
      this.tabFormGroup.controls[item].valueChanges.subscribe(() => {
        this.setControlValue();
      })
    }

    this.group.controls[this.config.name].valueChanges.subscribe((res) => {
      if (this.init && res) {
        this.init = false;
        if (_.startsWith(this.control.value, '*/')) {
          this.tabGroup.selectedIndex = 0
          this.active_tab = this.config.tabs[0];
          this.value = Number(_.trim(this.control.value, '*/'));
          this.tabFormGroup.controls[this.active_tab.name].setValue(this.value);
        } else {
          this.tabGroup.selectedIndex = 1;
          this.active_tab = this.config.tabs[1];
          this.tabFormGroup.controls[this.active_tab.name].setValue(this.control.value.split(','));
        }
      }

    });
  }

  onSelectChange($event: any) {
    this.active_tab = this.config.tabs[this.tabGroup.selectedIndex];
    this.setControlValue();
  }

  setControlValue() {
    this.value = this.tabFormGroup.controls[this.active_tab.name].value;
    if (this.active_tab.type == 'slider' && this.value) {
      this.value = '*/' + this.value;
    }
    if (this.active_tab.type == 'togglebutton' && this.value) {
      this.value = this.value.join();
    }
    this.control.setValue(this.value);
  }
}
