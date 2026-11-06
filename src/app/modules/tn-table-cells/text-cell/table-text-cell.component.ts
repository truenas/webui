import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { TnTestIdDirective, TnTooltipDirective } from '@truenas/ui-components';
import { TableCellTestIdSuffix } from 'app/modules/tn-table/interfaces/table-column.interface';

/**
 * The test-id suffix the old column model gave each kind of text cell. The caller picks it because
 * text, schedule and yes/no cells tagged their text differently. Drawn from
 * {@link TableCellTestIdSuffix} so a details row tags a hidden column the way this cell tags a visible one.
 */
export type TextCellTestIdSuffix = Extract<TableCellTestIdSuffix, 'row-text' | 'row-yesno' | 'row-schedule'>;

/**
 * tn-table cell for text, yes/no and schedule values, with an optional tooltip. It keeps the legacy
 * test-id shape (`text-<title>-<row tag>-<suffix>`) in one place instead of in every row template;
 * the host is a `<span>`, which the legacy directive prefixed with `text`.
 */
@Component({
  selector: 'ix-table-text-cell',
  templateUrl: './table-text-cell.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TnTooltipDirective, TnTestIdDirective],
})
export class TableTextCellComponent {
  /** Already-translated cell text. */
  readonly value = input<string | number | null | undefined>();
  /** Column title segment for the test ID (e.g. the translated "Path"). */
  readonly title = input.required<string>();
  readonly uniqueRowTag = input.required<string>();
  /** Optional tooltip; an empty string renders no tooltip, as elsewhere. */
  readonly tooltip = input<string>('');
  readonly testIdSuffix = input<TextCellTestIdSuffix>('row-text');

  protected readonly testId = computed(() => [this.title(), this.uniqueRowTag(), this.testIdSuffix()]);
}
