import { Component, ViewChild, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { FormGroup, FormControl } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { iXAbstractObject } from 'app/core/classes/ix-abstractobject';

import { Subject } from 'rxjs';
import { ControlConfig } from '../../models/control-config.interface';
import { Control } from '../../models/control.interface';

@Component({
  selector : 'toolbar-multiselect',
  templateUrl: './toolbar-multiselect.component.html'
})
export class ToolbarMultiSelectComponent extends iXAbstractObject implements OnInit, OnChanges {
  @ViewChild('selectTrigger') mySel;
  @Input() config?: ControlConfig; 
  @Input() controller: Subject<any>;
  allSelected:boolean = null;
  public values: any[] = [];
  private selectStates: boolean [] = [];

  constructor(public translate: TranslateService) {
    super()
  }

  ngOnChanges(changes:SimpleChanges){
    if(changes.config){
    }
  }

  ngOnInit(){
    this.selectStates.length = this.config.options.length;
    this.selectStates.fill(false);
    this.values.push(this.config.options[0]);
    this.selectStates[0] = true;
    this.updateController();
  }

  onClick(value, index){

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
    let message: Control = {name: this.config.name, value: this.values};
    this.controller.next(message);
  }

  checkLength(){
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
