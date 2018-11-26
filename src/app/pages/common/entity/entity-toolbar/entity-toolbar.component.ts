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
import { MatSnackBar } from '@angular/material';
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
  public values: Control[];
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
    public snackBar: MatSnackBar,
    public translate: TranslateService) {
    this.controller = new Subject();
    //this.conf = this.defaultConfig;
  }

  ngAfterViewInit() {
    this.controller.subscribe((evt:Control) => {
      let clone = Object.assign([], this.values);
      let control = clone.find(item => item.name == evt.name)
      control.value = evt.value;
      this.values = clone;
      this.target.next({name:"ToolbarChanged", data:this.values});
    })
  }

  ngOnInit() {
    // Setup Initial Values
    this.values = this.conf.map((item) => {
      return {name:item.name, value: item.value}
    });
    console.log(this.values);
  }

  init(){
  }

  ngOnChanges(changes) {
    if (changes.conf) {
      // Do Stuff
      console.warn(this.conf);
      this.ngOnInit();
    }
  }


  ngOnDestroy() { 
    // Clean up after ourselves...
  }
}
