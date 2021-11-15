import {
  ChangeDetectionStrategy,
  Component,
  ContentChild,
  Input,
  TemplateRef,
} from '@angular/core';
import { MatTextColumn } from '@angular/material/table';

@Component({
  selector: 'ix-table-column',
  templateUrl: './ix-table-column.component.html',
  styleUrls: ['./ix-table-column.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IxTableColumnComponent<T> extends MatTextColumn<T> {
  /**
   * Define custom width of the column
   */
  @Input() width: string;
  @ContentChild(TemplateRef) templateRef: TemplateRef<T>;
}
