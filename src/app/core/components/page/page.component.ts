import { Component } from '@angular/core';
import { Subject } from 'rxjs/Subject';
import { ViewControllerComponent } from 'app/core/components/viewcontroller/viewcontroller.component';
import { CardComponent } from 'app/core/components/card/card.component';
import { CoreService, CoreEvent } from 'app/core/services/core.service';
import { CoreServiceInjector } from 'app/core/services/coreserviceinjector';
import { Display } from 'app/core/components/display/display.component';

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
