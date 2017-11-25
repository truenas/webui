import { Component } from '@angular/core';
import { Page, PageOptions } from '../../../core/classes/page';
import { Subject } from 'rxjs/Subject';

@Component({
  selector: 'test-page',
  templateUrl: './test-page.component.html',
  styleUrls: ['./test-page.component.css']
})
export class TestPage extends Page {

  constructor(){
    super({ events:new Subject(), data:[], url:"Test Page" });
  }
}
