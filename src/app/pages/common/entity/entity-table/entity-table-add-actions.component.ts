import { Component, ElementRef, Input, ViewChild, OnInit, AfterViewInit, OnDestroy, OnChanges, SimpleChanges} from '@angular/core';
import { fromEvent as observableFromEvent } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { TranslateService } from '@ngx-translate/core';

import {EntityTableComponent} from './entity-table.component';


@Component({
  selector : 'app-entity-table-add-actions',
  templateUrl: './entity-table-add-actions.component.html'
})
export class EntityTableAddActionsComponent implements OnInit, AfterViewInit, OnDestroy, OnChanges {
  @ViewChild('filter', { static: false}) filter: ElementRef;
  @Input('entity') entity: EntityTableComponent;
  public conf: any;

  public actions: any[];
  public menuTriggerMessage:string = "Click for options";

  public spin: boolean = true;
  public direction: string = 'left';
  public animationMode: string = 'fling';
  get totalActions(){
    let addAction = this.entity.conf.route_add ? 1 : 0;
    return this.actions.length + addAction;
  }

  constructor(protected translate: TranslateService) { }

  ngOnInit() {
    this.actions = this.entity.getAddActions();
  }

  ngOnDestroy(){
  }

  ngAfterViewInit(){
    this.filterInit();
  }

  ngOnChanges(changes:SimpleChanges){
    console.log(changes);
  }

  applyConfig(entity: any){
    this.entity = entity;
    this.conf = entity.conf;
    this.filterInit();
  }

  //Set the filter event handler.
  filterInit(){
    if (this.filter && this.entity) {
      observableFromEvent(this.filter.nativeElement, 'keyup').pipe(
        debounceTime(150),
        distinctUntilChanged(),)
        .subscribe((evt) => {
          this.entity.filter(this.filter.nativeElement.value);
        });
    }
  }

}
