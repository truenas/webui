import {
  ChangeDetectionStrategy, Component, input,
} from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { TnTestIdDirective } from '@truenas/ui-components';
import { SummaryItem, SummarySection } from 'app/modules/summary/summary.interface';
import { normalizeTestIdParts } from 'app/modules/test-id/normalize-test-id.utils';

@Component({
  selector: 'ix-summary',
  templateUrl: './summary.component.html',
  styleUrls: ['./summary.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TranslateModule,
    TnTestIdDirective,
  ],
})
export class SummaryComponent {
  readonly summary = input.required<SummarySection[]>();

  /**
   * Labels carry digits (`IPv4 Address`, `Disk 2`), and the library's kebab-casing does not split
   * a letter→digit boundary the way `[ixTest]` did — so the label is pre-normalized here to keep
   * `row-summary-i-pv-4-address` byte-identical. See {@link normalizeTestIdParts}.
   */
  protected rowTestId(item: SummaryItem): string[] {
    return normalizeTestIdParts(['summary', item.label]);
  }
}
