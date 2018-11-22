import { Component, ViewChild, Output, EventEmitter, AfterViewInit} from '@angular/core';
import { FormGroup } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { Observable } from 'rxjs/Observable';

import { FieldConfig } from '../../models/field-config.interface';
import { Field } from '../../models/field.interface';
import { TooltipComponent } from '../tooltip/tooltip.component';
import { MatOptionSelectionChange } from '@angular/material/core';

@Component({
  selector: 'form-select',
  styleUrls: ['form-select.component.scss', '../dynamic-field/dynamic-field.css'],
  templateUrl: './form-select.component.html',
})
export class FormSelectComponent implements Field, AfterViewInit {
  config: FieldConfig;
  group: FormGroup;
  fieldShow: string;

  @ViewChild('selectTrigger') matSelect;
  @ViewChild('field') field;

  public selected:any;
  public allSelected: boolean;
  public selectedValues: any[] = []; 
  public selectStates: boolean[] = []; // Collection of checkmark states
  public selectAllStateCache: boolean[] = []; // Cache the state when select all was toggled
  public selectAllValueCache: boolean[] = []; // Cache the state when select all was toggled
  private _formValue:any;
  get formValue(){
    return this._formValue;
  }
  set formValue(value: any){
    let result = this.config.multiple ? this.selectedValues: this.selected;
    this._formValue = result
  }

  constructor(public translate: TranslateService) {
  }

  ngAfterViewInit(){
    this.selectStates = this.config.options.map(item => false);
    //let testOptions = this.matSelect.options._results;
  }

  onChangeOption($event) {
    if (this.config.onChangeOption !== undefined && this.config.onChangeOption != null) {
      this.config.onChangeOption({ event: $event });
    }
  }

  onSelect(option, index){
    this.selected = option.value;
    this.group.value[this.config.name] = this.selected;
    this.formValue = this.selected;
  }

  onToggleSelectAll(){
    if(!this.allSelected){
      // Cache all the things...
      this.selectAllStateCache = Object.assign([],this.selectStates);// cache the checkmark states
      this.selectAllValueCache = Object.assign([],this.selectedValues);// cache the values
      
      // Deal with the values...
      const newValues = this.config.options.map(item => item.value);
      this.selectedValues = newValues;

      // Deal with checkmark states...
      this.selectStates.fill(true);

      // ensure all template elements that care, know that everything is selected
      this.allSelected = true;
    } else {
      this.selectStates = this.selectAllStateCache;
      this.selectedValues = this.selectAllValueCache;
      this.allSelected = false;
    }
    
    //let testOption = this.matSelect.options._results[0];
  }

  onToggleSelect(option, index){
    if(!this.config.multiple){
      this.onSelect(option,index);
      return;
    }
    let currentState = this.selectStates[index];
    this.selectStates[index] = !currentState;

    this.updateValues();
    this.group.value[this.config.name] = this.selectedValues;
    
  }

  updateValues(){
    let newValues = [];
    this.selectStates.forEach((item, index) => {
      if(item){
        newValues.push(this.config.options[index].value);
      }
    });
    this.selectedValues = newValues;
    this.formValue = '';
  }
}
