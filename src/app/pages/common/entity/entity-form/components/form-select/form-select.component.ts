import { Component, ViewChild, Output, EventEmitter, AfterViewInit, AfterViewChecked, ChangeDetectorRef } from '@angular/core';
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
export class FormSelectComponent implements Field, AfterViewInit, AfterViewChecked {
  config: FieldConfig;
  group: FormGroup;
  fieldShow: string;
  control:any;

  @ViewChild('selectTrigger', { static: true}) matSelect;
  @ViewChild('field', { static: true}) field;

  public formReady:boolean = false;
  public initialValue:any;
  public selected:any;
  public allSelected: boolean;
  public selectedValues: any[] = []; 
  public selectStates: boolean[] = []; // Collection of checkmark states
  public selectAllStateCache: boolean[] = []; // Cache the state when select all was toggled
  public selectAllValueCache: boolean[] = []; // Cache the state when select all was toggled
  public customTriggerValue:any;
  private _formValue:any;
  get formValue(){
    return this._formValue;
  }
  set formValue(value: any){
    let result = this.config.multiple ? this.selectedValues: this.selected;
    this._formValue = result
  }

  constructor(public translate: TranslateService, public cd: ChangeDetectorRef) {
  }

  ngAfterViewInit(){
    this.selectStates = this.config.options.map(item => false);
    //let testOptions = this.matSelect.options._results;
    
    this.control = this.group.controls[this.config.name];
    // if control has a value on init
    if(this.control.value && this.control.value.length > 0){
        this.selectedValues = this.control.value;
    }
    this.control.valueChanges.subscribe((evt) => {
      if(evt) {
        if(this.config.multiple && evt.length > 0){
          this.selectedValues = evt;
          this.group.value[this.config.name] = this.selectedValues;
          const newStates = this.config.options.map(item => this.selectedValues.indexOf(item.value) !== -1);
          const triggerValue = [];
          for (let i = 0; i < this.config.options.length; i++) {
            const item = this.config.options[i];
            if (this.selectedValues.indexOf(item.value) !== -1) {
              triggerValue.push(item.label)
            }
          }
          this.selectStates = newStates;
          this.customTriggerValue = triggerValue;
        }
      }
    });
  }

  ngAfterViewChecked(){
    if(!this.formReady  && typeof this.config.options !== "undefined" && this.config.options && this.config.options.length > 0){
        let keys = Object.keys(this.group.controls);
        let newStates = this.config.options.map(item => this.selectedValues.indexOf(item.value) !== -1);
        this.selectStates = newStates;
        this.updateValues();
        this.formReady = true;
        this.cd.detectChanges();
    }
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

  isDisabled(index){
    let option = this.config.options[index];
    return option.disabled ? option.disabled : false;
  }
  isHiddenFromDisplay(index){
    const option = this.config.options[index];
    return option.hiddenFromDisplay ? option.hiddenFromDisplay : false;
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
    let triggerValue = [];
    this.selectStates.forEach((item, index) => {
      if(item){
        newValues.push(this.config.options[index].value);
        triggerValue.push(this.config.options[index].label);
      }
    });
    this.selectedValues = newValues;
    this.customTriggerValue = triggerValue;
    this.formValue = '';
  }
}
