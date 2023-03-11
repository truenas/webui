import {
  Component, ElementRef, Input, ViewChild, OnInit, AfterViewInit,
} from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { fromEvent as observableFromEvent } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { EntityTableAddActionsConfig } from 'app/modules/entity/entity-table/entity-table-add-actions/entity-table-add-actions-config.interface';
import { EntityTableComponent } from 'app/modules/entity/entity-table/entity-table.component';
import { EntityTableAction } from 'app/modules/entity/entity-table/entity-table.interface';
import { EntityTableService } from 'app/services/entity-table.service';

@UntilDestroy()
@Component({
  selector: 'ix-entity-table-add-actions',
  templateUrl: './entity-table-add-actions.component.html',
  styleUrls: ['./entity-table-add-actions.component.scss'],
})
export class EntityTableAddActionsComponent implements OnInit, AfterViewInit {
  @ViewChild('filter', { static: false }) filter: ElementRef<HTMLInputElement>;
  @Input() entity: EntityTableComponent<Record<string, unknown>>;
  filterValue = '';

  actions: EntityTableAction[];
  menuTriggerMessage = 'Click for options';
  direction = 'left';

  get totalActions(): number {
    const addAction = this.entity.conf.routeAdd || this.entity.conf.doAdd ? 1 : 0;
    return this.actions.length + addAction;
  }

  get conf(): EntityTableAddActionsConfig {
    return this.entity.conf as EntityTableAddActionsConfig;
  }

  constructor(private entityTableService: EntityTableService) { }

  ngOnInit(): void {
    this.actions = this.entity.getAddActions();

    this.entityTableService.addActionsUpdater$.pipe(untilDestroyed(this)).subscribe((actions: EntityTableAction[]) => {
      this.actions = actions;
    });

    this.filterValue = this.entity.conf.filterValue || '';
  }

  ngAfterViewInit(): void {
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

      this.entity.filter(this.filterValue);
    }
  }

  resetFilter(): void {
    this.filterValue = '';
    this.filter.nativeElement.value = '';
    this.entity.filter('');
  }
}
