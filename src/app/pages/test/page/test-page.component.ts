import { Component } from '@angular/core';
//import { SubComponent } from '../../../core/decorators/subcomponent';

//import { Page, PageOptions } from '../../../core/components/page/page.component';
import { Subject } from 'rxjs/Subject';

@Component({
  selector: 'test-page',
  templateUrl: './test-page.component.html',
  styleUrls: ['./test-page.component.css']
})
export class TestPage {

  constructor(){
	  //super({ events:new Subject(), data:[], url:"Test Page" });
  }
}
