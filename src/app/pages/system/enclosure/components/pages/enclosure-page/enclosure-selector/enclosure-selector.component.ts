import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TnTestIdDirective } from '@truenas/ui-components';
import { normalizeTestIdParts } from 'app/modules/test-id/normalize-test-id.utils';
import { EnclosureSideComponent } from 'app/pages/system/enclosure/components/enclosure-side/enclosure-side.component';
import { EnclosureStore } from 'app/pages/system/enclosure/services/enclosure.store';
import { diskStatusTint } from 'app/pages/system/enclosure/utils/disk-status-tint.utils';

@Component({
  selector: 'ix-enclosure-selector',
  templateUrl: './enclosure-selector.component.html',
  styleUrl: './enclosure-selector.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TnTestIdDirective,
    RouterLink,
    EnclosureSideComponent,
  ],
})
export class EnclosureSelectorComponent {
  private store = inject(EnclosureStore);

  readonly enclosures = this.store.enclosures;

  readonly selectedEnclosure = computed(() => this.store.selectedEnclosure()?.id);

  readonly diskStatusTint = diskStatusTint;

  /**
   * Enclosure models carry digits (`M50`, `MINI-3.0-E`), and the library's kebab-casing does not
   * split a letter→digit boundary the way `[ixTest]` did — so the id is pre-normalized here to
   * keep `link-select-enclosure-m-50` byte-identical. See {@link normalizeTestIdParts}.
   */
  protected readonly selectorLinks = computed(() => this.enclosures().map((enclosure) => ({
    enclosure,
    testId: normalizeTestIdParts(['select-enclosure', enclosure.model]),
  })));
}
