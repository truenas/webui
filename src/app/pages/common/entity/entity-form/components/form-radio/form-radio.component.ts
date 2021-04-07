import {Component} from '@angular/core';
import {FormGroup} from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs/Subscription';

import {FieldConfig} from '../../models/field-config.interface';
import {Field} from '../../models/field.interface';
import {TooltipComponent} from '../tooltip/tooltip.component';

@Component({
  selector : 'form-radio',
  styleUrls :
      [ 'form-radio.component.scss', '../dynamic-field/dynamic-field.css' ],
  templateUrl : './form-radio.component.html',
})
export class FormRadioComponent implements Field {
  config: FieldConfig;
  group: FormGroup;
  fieldShow: string;
  radioValue: any;
  valueChangesSubscription: Subscription;

  constructor(public translate: TranslateService) {}
  ngOnInit() {
    this.valueChangesSubscription = this.group.controls[this.config.name].valueChanges.subscribe(res => this.radioValue = res)
  }

  ngOnDestroy() {
    this.valueChangesSubscription.unsubscribe();
  }

  onChangeRadio($event) {
    if (this.config.onChange !== undefined && this.config.onChange != null) {
      this.config.onChange({ event: $event });
    }
  }
}
