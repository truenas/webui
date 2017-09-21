import { Component, ViewContainerRef, AfterViewInit, OnInit, ViewChild } from '@angular/core';
import { FormGroup } from '@angular/forms';

import { FieldConfig } from '../../models/field-config.interface';
import { Field } from '../../models/field.interface';
import { TooltipComponent } from '../tooltip/tooltip.component';
import { FormSliderComponent } from '../form-slider/form-slider.component';
import { FormToggleButtonComponent } from '../form-toggle-button/form-toggle-button.component';
import { EntityFormService } from '../../services/entity-form.service';

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
  @ViewChild('tabGroup') tabGroup;

  constructor(protected entityFormService: EntityFormService, ) {}
  ngAfterViewInit() {
    this.active_tab = this.config.tabs[this.tabGroup.selectedIndex];
    this.setControlValue();
  }

  ngOnInit() {
    this.tabFormGroup = this.entityFormService.createFormGroup(this.config.tabs);
    this.control = this.group.controls[this.config.name];
    for (let item in this.tabFormGroup.controls) {
      this.tabFormGroup.controls[item].valueChanges.subscribe(() => {
        this.setControlValue();
      })
    }
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
    this.control.setValue(this.value);
  }
}
