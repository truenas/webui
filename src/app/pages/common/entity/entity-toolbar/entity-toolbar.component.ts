import { Location } from '@angular/common';
import {
  Component,
  ContentChildren,
  Input,
  Output,
  EventEmitter,
  OnDestroy,
  QueryList,
  TemplateRef,
  ViewChildren,
  OnChanges,
} from '@angular/core';

import * as _ from 'lodash';
import { TranslateService } from '@ngx-translate/core';

import {AppLoaderService} from '../../../../services/app-loader/app-loader.service';
import {EntityTemplateDirective} from '../entity-template.directive';
import {EntityUtils} from '../utils';

import { Subscription } from 'rxjs/Subscription';
import { CoreEvent } from 'app/core/services/core.service';
import { Subject } from 'rxjs';
import { Control } from './models/control.interface';
import { ToolbarConfig, ControlConfig } from './models/control-config.interface';
import { GlobalAction } from 'app/components/common/pagetitle/pagetitle.component';

@Component({
  selector : 'entity-toolbar',
  templateUrl : './entity-toolbar.component.html',
  styleUrls : [ './entity-toolbar.component.css' ],
})
export class EntityToolbarComponent implements OnDestroy, OnChanges, GlobalAction {

  @Input('conf') conf: ToolbarConfig; //ControlConfig[];
  public config;
  public controller: Subject<Control>;
  public values: any;

  constructor(
    protected loader: AppLoaderService,
    public translate: TranslateService) {
    this.controller = new Subject();
  }

  init(){
    this.controller.subscribe((evt:Control) => {
      let clone = Object.assign([], this.values);
      let control = clone[evt.name] = evt.value
      this.values = clone;
      clone['event_control'] = evt.name;
      this.config.target.next({name:"ToolbarChanged", data:clone});
    })

    this.config.target.subscribe((evt:CoreEvent) => {
      switch(evt.name){
        case "Refresh":
          // The parent can ping toolbar for latest values
          // Useful for getting initial values
          this.config.target.next({name:"ToolbarChanged", data:this.values});
        break;
        case "UpdateControls":
          this.config.controls = evt.data;
        break;
      }
    });

    // Setup Initial Values
    let obj = {}
    this.config.controls.forEach((item) => {
      obj[item.name] = item.value;
    });
    this.values = obj;
  }

  ngOnChanges(changes) {
    if (changes.conf) {
      // Do Stuff
      this.config = changes.conf.currentValue; // For when config is provided via template
      this.init();
    }
  }


  ngOnDestroy() { 
    // Clean up after ourselves...
  }

  // For when config is provided via JS
  applyConfig(conf){
    this.config = conf;
    this.init();
  }
}
