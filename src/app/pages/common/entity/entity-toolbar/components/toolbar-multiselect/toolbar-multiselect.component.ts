import { Component, ViewChild, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { FormGroup, FormControl } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';

import { Subject } from 'rxjs';
import { ControlConfig } from '../../models/control-config.interface';
import { Control } from '../../models/control.interface';

@Component({
  selector : 'toolbar-multiselect',
  templateUrl: './toolbar-multiselect.component.html'
})
export class ToolbarMultiSelectComponent implements OnInit, OnChanges {
  @ViewChild('selectTrigger') mySel;
  @Input() config?: ControlConfig; 
  @Input() controller: Subject<any>;
  allSelected:boolean = null;
  public values: any[] = [];
  private selectStates: boolean [] = [];
  //public formValue;
  //public formControl: FormControl;
  //public multiselectOptions;

  constructor(public translate: TranslateService) {}

  ngOnChanges(changes:SimpleChanges){
    if(changes.config){
      console.warn("Config Changed!");
      console.warn(changes.config); 
      //let extraOption = [{ label: "Select All", value: "select_all" }];
      //this.multiselectOptions = extraOption.concat(this.config.options);
    }
  }

  ngOnInit(){
    //this.formControl = new FormControl();
    this.selectStates.length = this.config.options.length;
    this.selectStates.fill(false);
    this.values.push(this.config.options[0]);
    this.selectStates[0] = true;
    this.updateController();
  }

  onClick(value, index){
    /*if(value == 'select_all'){
      this.checkAll();
      return;
    }*/

    if(this.selectStates[index]){
      if(this.checkLength()){this.allSelected = false;}
      let vIndex = this.values.indexOf(value);
      this.values.splice(vIndex,1);
      this.mySel.options.forEach( (item) => item.deselect());
    } else {
      this.values.push(value);
      this.mySel.options.forEach( (item) => item.select());
    }
    this.mySel.close();
    this.selectStates[index] = !this.selectStates[index];
    this.updateController();
  }

  updateController(){
    this.config.value = this.values;
    //this.formControl.setValue(this.values);
    let message: Control = {name: this.config.name, value: this.values};
    this.controller.next(message);
    console.log(this.config.value == this.values);
    //console.log(this.formControl);
  }

  checkLength(){
    //return true;
    return this.values.length === this.selectStates.length;
  }

  checkAll(){
    this.allSelected = this.checkLength();
    if(!this.allSelected){
      this.selectStates.fill(true);
      this.values = Object.assign([],this.config.options);
    } else {
      this.selectStates.fill(false);
      this.values = [];
    }
    this.updateController();
  }

  isChecked(option){
    return true;
  }

  onChangeOption(e){
  }

  compareValues(x, y):boolean{
    return x == y;
  }
}
