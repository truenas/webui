import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatTooltip } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { Column, ColumnComponent } from 'app/modules/ix-table/interfaces/column-component.class';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { WebShareTableRow } from 'app/pages/sharing/webshare/webshare-list/webshare-list.component';

@Component({
  selector: 'ix-webshare-list-name-cell',
  templateUrl: './webshare-name-cell.component.html',
  styleUrls: ['./webshare-name-cell.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    IxIconComponent,
    MatTooltip,
    TranslateModule,
    TestDirective,
  ],
})
export class WebShareListNameCellComponent extends ColumnComponent<WebShareTableRow> {}

export function webShareListNameColumn(
  options: Partial<WebShareListNameCellComponent>,
): Column<WebShareTableRow, WebShareListNameCellComponent> {
  return { type: WebShareListNameCellComponent, ...options };
}
