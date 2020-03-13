import {Location} from '@angular/common';
import {
  Component,
  ContentChildren,
  Input,
  Output,
  EventEmitter,
  OnDestroy,
  OnInit,
  QueryList,
  TemplateRef,
  ViewChildren,
  OnChanges,
  AfterViewInit
} from '@angular/core';
//import {FormBuilder, FormControl, FormGroup, FormArray, Validators} from '@angular/forms';
import * as _ from 'lodash';
import { TranslateService } from '@ngx-translate/core';

import {AppLoaderService} from '../../../../services/app-loader/app-loader.service';
import {EntityTemplateDirective} from '../entity-template.directive';
import {EntityUtils} from '../utils';

import { Subscription } from 'rxjs/Subscription';
import { CoreEvent } from 'app/core/services/core.service';
import { Subject } from 'rxjs/Subject';
import { Control } from './models/control.interface';
import { ControlConfig } from './models/control-config.interface';




@Component({
  selector : 'entity-toolbar',
  templateUrl : './entity-toolbar.component.html',
  styleUrls : [ './entity-toolbar.component.css' ],
})
export class EntityToolbarComponent implements OnInit, OnDestroy, AfterViewInit, OnChanges {

  @Input('conf') conf: ControlConfig[];
  @Input() target: Subject<CoreEvent>;
  public controller: Subject<Control>;
  //public values: Control[];
  public values: any;
  //public conf: ControlConfig[];

  /*public defaultConfig:ControlConfig[] = [
    {
      type:"button",
      name:'Devices',
      label:"Test Button",
      value:false,
      disabled:false
    }, 
    {
      type:"menu",
      name:'Sources',
      label:"Test Menu",
      disabled:false,
      options: ['Option1','Option2','Option3']
    } ,
    {
      type:"multimenu",
      name:'Multi',
      label:"Test Multimenu",
      disabled:false,
      options: ['Option1','Option2','Option3']
    } 
  ]*/

  constructor(
    protected loader: AppLoaderService,
    public translate: TranslateService) {
    this.controller = new Subject();
    //this.conf = this.defaultConfig;
  }

  ngAfterViewInit() {
    this.init();
  }

  ngOnInit() {
    this.controller.subscribe((evt:Control) => {
      let clone = Object.assign([], this.values);
      let control = clone[evt.name] = evt.value
      //control.value = evt.value;
      this.values = clone;
      this.target.next({name:"ToolbarChanged", data:this.values});
    })

    this.target.subscribe((evt:CoreEvent) => {
      switch(evt.name){
        case "Refresh":
          // The parent can ping toolbar for latest values
          // Useful for getting initial values
          this.target.next({name:"ToolbarChanged", data:this.values});
        break;
      }
    });
  }

  init(){
    // Setup Initial Values
    let obj = {}
    this.conf.forEach((item) => {
      obj[item.name] = item.value;
    });
    this.values = obj;
  }

  ngOnChanges(changes) {
    if (changes.conf) {
      // Do Stuff
      this.init();
    }
  }


  ngOnDestroy() { 
    // Clean up after ourselves...
  }
}
