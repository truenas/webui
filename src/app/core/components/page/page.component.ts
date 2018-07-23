import { Component } from '@angular/core';
import { Subject } from 'rxjs/Subject';
import { ViewControllerComponent } from '../viewcontroller/viewcontroller.component';
import { CardComponent } from '../card/card.component';
import { CoreService, CoreEvent } from '../../services/core.service';
import { CoreServiceInjector } from '../../services/coreserviceinjector';
import { Display } from '../display/display.component';

export interface PageOptions {
  data: any[];
  events: Subject<CoreEvent>;
  url: string;
}

// This makes the metadata available globally 
// Deal-Breaker: Angular injects the component's 
// directory path forcing relative paths
export const PageComponentMetadata = {
  selector: 'page',
  template: '',
  styleUrls: ['./page.component.css']
}

@Component(PageComponentMetadata)
export class PageComponent {

  public name: string = "PageComponent";
  public url: string;
  protected core: CoreService;

  constructor(){
	  //super();
    this.core = CoreServiceInjector.get(CoreService);
  }
    
  ngAfterViewInit(){
    //this.loadView(CardComponent,{header:});
  }
     
}
