import {Component, Input, OnInit, OnChanges, SimpleChanges} from '@angular/core';
import {FormGroup} from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';

import { Subject } from 'rxjs/Subject';
import { ControlConfig } from '../../models/control-config.interface';
import { Control} from '../../models/control.interface';

@Component({
  selector : 'toolbar-multimenu',
  styleUrls : [ 'toolbar-multimenu.component.scss' ],
  templateUrl: 'toolbar-multimenu.component.html'
})
export class ToolbarMultimenuComponent implements OnInit, OnChanges {
  @Input() config?: ControlConfig; 
  @Input() controller: Subject<any>;
  allSelected:boolean = false;
  public values: any[] = [];
  private selectStates: boolean [] = [];
  constructor(public translate: TranslateService) {}

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
    } else {
      this.values.push(value);
    }
    this.selectStates[index] = !this.selectStates[index];
    this.updateController();
  }

  updateController(){
    this.config.value = this.values;
    let message: Control = {name: this.config.name, value: this.values};
    this.controller.next(message);
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
}
