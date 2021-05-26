import {
  Component, ElementRef, Input, ViewChild, OnInit, AfterViewInit, OnDestroy, OnChanges, SimpleChanges,
} from '@angular/core';
import { fromEvent as observableFromEvent } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { TranslateService } from '@ngx-translate/core';
import { EntityTableComponent } from './entity-table.component';

@Component({
  selector: 'app-entity-table-add-actions',
  templateUrl: './entity-table-add-actions.component.html',
})
export class EntityTableAddActionsComponent implements OnInit, AfterViewInit, OnChanges {
  @ViewChild('filter', { static: false }) filter: ElementRef;
  @Input('entity') entity: EntityTableComponent;
  conf: any;

  actions: any[];
  menuTriggerMessage = 'Click for options';

  spin = true;
  direction = 'left';
  animationMode = 'fling';

  get totalActions(): number {
    const addAction = this.entity.conf.route_add ? 1 : 0;
    return this.actions.length + addAction;
  }

  constructor(protected translate: TranslateService) { }

  ngOnInit(): void {
    this.actions = this.entity.getAddActions();
  }

  ngAfterViewInit(): void {
    this.filterInit();
  }

  ngOnChanges(changes: SimpleChanges): void {
    console.log(changes);
  }

  applyConfig(entity: any): void {
    this.entity = entity;
    this.conf = entity.conf;
    this.filterInit();
  }

  // Set the filter event handler.
  filterInit(): void {
    if (this.filter && this.entity) {
      observableFromEvent(this.filter.nativeElement, 'keyup').pipe(
        debounceTime(150),
        distinctUntilChanged(),
      )
        .subscribe(() => {
          this.entity.filter(this.filter.nativeElement.value);
        });
    }
  }
}
