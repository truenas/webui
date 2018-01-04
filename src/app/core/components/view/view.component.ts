import { Component, Input, OnInit } from '@angular/core';
import { Subject } from 'rxjs/Subject';
import { CoreEvent } from 'app/core/services/core.service';
import { View } from 'app/core/classes/view';

// This makes the metadata available globally
// Deal Breaker: Angular injects the component's
// directory path forcing relative paths
export const ViewComponentMetadata = {
  selector: 'view',
  templateUrl: './view.component.html',
  styleUrls: ['./view.component.css']
}

@Component(ViewComponentMetadata)
export class ViewComponent extends View {

  readonly componentName = ViewComponent;
  protected _data: any;
  public viewController: Subject<CoreEvent>

  constructor(){
    super();
  }

  ngOnInit() {

  }
  
  set data(data:any){
    this._data = data;
  }

  get data(){
    return this._data;
  }
}
