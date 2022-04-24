import {
  Component, ElementRef, Input, ViewChild, OnInit, AfterViewInit,
} from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { fromEvent as observableFromEvent } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { GlobalAction } from 'app/interfaces/global-action.interface';
import { EntityTableAddActionsConfig } from 'app/modules/entity/entity-table/entity-table-add-actions/entity-table-add-actions-config.interface';
import { EntityTableComponent } from 'app/modules/entity/entity-table/entity-table.component';
import { EntityTableAction } from 'app/modules/entity/entity-table/entity-table.interface';

@UntilDestroy()
@Component({
  selector: 'app-entity-table-add-actions',
  templateUrl: './entity-table-add-actions.component.html',
  styleUrls: ['./entity-table-add-actions.component.scss'],
})
export class EntityTableAddActionsComponent implements GlobalAction, OnInit, AfterViewInit {
  @ViewChild('filter', { static: false }) filter: ElementRef;
  @Input() entity: EntityTableComponent;
  conf: EntityTableAddActionsConfig;
  filterValue = '';

  actions: EntityTableAction[];
  menuTriggerMessage = 'Click for options';
  spin = true;
  direction = 'left';

  get totalActions(): number {
    const addAction = this.entity.conf.routeAdd || this.entity.conf.doAdd ? 1 : 0;
    return this.actions.length + addAction;
  }

  ngOnInit(): void {
    this.actions = this.entity.getAddActions();
  }

  ngAfterViewInit(): void {
    this.filterInit();
  }

  applyConfig(entity: EntityTableComponent): void {
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
        .pipe(untilDestroyed(this)).subscribe(() => {
          this.filterValue = this.filter.nativeElement.value;
          this.entity.filter(this.filter.nativeElement.value);
        });
    }
  }

  resetFilter(): void {
    this.filterValue = '';
    this.filter.nativeElement.value = '';
    this.entity.filter('');
  }
}
