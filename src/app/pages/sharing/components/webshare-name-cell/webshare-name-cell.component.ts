import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { TnIconComponent, TnTooltipDirective } from '@truenas/ui-components';
import { Column, ColumnComponent } from 'app/modules/ix-table/interfaces/column-component.class';
import { TestDirective } from 'app/modules/test-id/test.directive';

export interface WebShareTableRow {
  id: number;
  name: string;
  path: string;
  isHomeBase?: boolean;
}

@Component({
  selector: 'ix-webshare-name-cell',
  templateUrl: './webshare-name-cell.component.html',
  styleUrls: ['./webshare-name-cell.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TnIconComponent,
    TnTooltipDirective,
    TestDirective,
    TranslateModule,
  ],
})
export class WebShareNameCellComponent extends ColumnComponent<WebShareTableRow> {}

export function webShareNameColumn(
  options: Partial<WebShareNameCellComponent>,
): Column<WebShareTableRow, WebShareNameCellComponent> {
  return { type: WebShareNameCellComponent, ...options };
}
