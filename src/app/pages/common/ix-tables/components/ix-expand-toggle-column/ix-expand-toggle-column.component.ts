import {
  Component,
  Output, EventEmitter, Input, ViewChild, OnDestroy, OnInit, ChangeDetectorRef, ChangeDetectionStrategy,
} from '@angular/core';
import { MatColumnDef } from '@angular/material/table';
import { IxTableComponent } from 'app/pages/common/ix-tables/components/ix-table/ix-table.component';

@Component({
  selector: 'ix-expand-toggle-column',
  templateUrl: './ix-expand-toggle-column.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IxExpandToggleColumnComponent<T = unknown> implements OnInit, OnDestroy {
  @Input() expandedRow: T;
  @Output() toggle = new EventEmitter<T>();
  @ViewChild(MatColumnDef, { static: false }) columnDef: MatColumnDef;

  constructor(
    private table: IxTableComponent<T>,
    private cdr: ChangeDetectorRef,
  ) { }

  onClick(row: T): void {
    this.toggle.emit(row);
  }

  ngOnInit(): void {
    if (this.table) {
      this.cdr.detectChanges();
      this.table.addColumnDef(this.columnDef);
    }
  }

  ngOnDestroy(): void {
    if (this.table) {
      this.table.removeColumnDef(this.columnDef);
    }
  }
}
