import {
  Component, AfterViewInit, OnInit, ViewChild,
} from '@angular/core';
import { AbstractControl, FormGroup } from '@angular/forms';
import { MatTabGroup } from '@angular/material/tabs';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import * as _ from 'lodash';
import {
  FieldConfig,
  FormTaskConfig,
} from 'app/pages/common/entity/entity-form/models/field-config.interface';
import { Field } from 'app/pages/common/entity/entity-form/models/field.interface';
import { EntityFormService } from 'app/pages/common/entity/entity-form/services/entity-form.service';

@UntilDestroy()
@Component({
  selector: 'form-task',
  templateUrl: './form-task.component.html',
  styleUrls: ['./form-task.component.scss'],
})
export class FormTaskComponent implements Field, AfterViewInit, OnInit {
  config: FormTaskConfig;
  group: FormGroup;
  fieldShow: string;

  tabFormGroup: FormGroup;
  protected control: AbstractControl;
  protected active_tab: FieldConfig;
  protected value: any;
  protected init: boolean;
  @ViewChild('tabGroup', { static: true }) tabGroup: MatTabGroup;

  constructor(protected entityFormService: EntityFormService,
    public translate: TranslateService) {}

  ngAfterViewInit(): void {
    this.active_tab = this.config.tabs[this.tabGroup.selectedIndex];
    this.setControlValue();
  }

  ngOnInit(): void {
    this.init = true;

    this.tabFormGroup = this.entityFormService.createFormGroup(this.config.tabs);
    this.control = this.group.controls[this.config.name];
    for (const item in this.tabFormGroup.controls) {
      this.tabFormGroup.controls[item].valueChanges.pipe(untilDestroyed(this)).subscribe(() => {
        this.setControlValue();
      });
    }

    this.group.controls[this.config.name].valueChanges.pipe(untilDestroyed(this)).subscribe((res) => {
      if (this.init && res) {
        this.init = false;
        if (_.startsWith(this.control.value, '*/')) {
          this.tabGroup.selectedIndex = 0;
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

  onSelectChange(): void {
    this.active_tab = this.config.tabs[this.tabGroup.selectedIndex];
    this.setControlValue();
  }

  setControlValue(): void {
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
