import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { TnTestIdDirective, TnTooltipDirective } from '@truenas/ui-components';

/**
 * The test-id suffix the legacy `[ixTest]` directive resolved for each kind of
 * plain-text cell. `ix-cell-text` and `ix-cell-schedule` rendered the value as
 * text but tagged it differently, and `ix-cell-yes-no` tagged a translated
 * Yes/No the same way again — so the caller picks the shape rather than the
 * component guessing it from the value.
 */
export type TextCellTestIdSuffix = 'row-text' | 'row-yesno' | 'row-schedule';

/**
 * tn-table replacement for the ix-table `textColumn` / `yesNoColumn` /
 * `scheduleColumn` cell renderers.
 *
 * Renders a value as text with the legacy test-id shape
 * (`text-<title>-<row tag>-<suffix>`) and an optional tooltip. Shared so a
 * migrated list declares one element per column instead of repeating the
 * `<span tnTestIdType="text" [tnTestId]="[…]">` block a dozen times, and so the
 * id shape lives in one place rather than in every template that renders a row.
 *
 * The host is a `<span>`, which the legacy directive prefixed with `text`, so
 * the migrated markup declares the same prefix through `tnTestIdType`.
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
