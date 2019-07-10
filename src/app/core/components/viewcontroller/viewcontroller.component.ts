import { Component,ComponentRef, AfterViewInit, ViewChild } from '@angular/core';
import { CoreServiceInjector } from 'app/core/services/coreserviceinjector';
import { Display } from 'app/core/components/display/display.component';
import { CoreService, CoreEvent } from 'app/core/services/core.service';
import { ViewController } from 'app/core/classes/viewcontroller';
import { LayoutContainer, LayoutChild } from 'app/core/classes/layouts';
import { Subject } from 'rxjs';

export const ViewControllerMetadata = {
  template: `
  <div 
  fxLayoutWrap
  fxLayout="row" 
  fxLayoutAlign="space-around center" 
  fxLayoutGap="2%"
  >
    <display style="display:none;" #display></display>
  </div>
  `,
  styles:[ ':host {display:block;}' ]
}

export interface ViewConfig {
  componentName: any,
  componentData: any;
  controller?: Subject<any>;
}

@Component({
  selector: 'viewcontroller',
  template:ViewControllerMetadata.template,
  styles:ViewControllerMetadata.styles
})
export class ViewControllerComponent extends ViewController implements AfterViewInit {

  readonly componentName = ViewControllerComponent;
  @ViewChild('display', { static: true}) display;
  //public displayList: ComponentRef[] = [];
  protected core: CoreService;
  public controlEvents: Subject<CoreEvent> = new Subject();

  public layoutContainer:LayoutContainer = {layout:"row", align:"space-between center", gap:""}
  public layoutChild?:LayoutChild;

  constructor() {
    super();
    this.core = CoreServiceInjector.get(CoreService);
  }

  ngAfterViewInit(){
  }

  
  public create(component:any, container?:string){
    if(!container){ container = 'display'}
    let instance= this[container].create(component);
    return instance;
  }

  public addChild(instance, container?: string){
    if(!container){ container = 'display'}
    this[container].addChild(instance);
  }

  public removeChild(instance, container?: string){
    if(!container){ container = 'display'}
    this[container].removeChild(instance);
  }
}
