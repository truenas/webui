import {
  ChangeDetectionStrategy, Component, computed,
} from '@angular/core';
import { EnclosureStore } from 'app/pages/system/enclosure/services/enclosure.store';

@Component({
  selector: 'ix-enclosure-selector',
  templateUrl: './enclosure-selector.component.html',
  styleUrl: './enclosure-selector.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IxEnclosureSelectorComponent {
  readonly enclosures = this.store.enclosures;

  readonly selectedEnclosure = computed(() => this.store.selectedEnclosure().id);

  constructor(
    private store: EnclosureStore,
  ) {}

  protected selectEnclosure(enclosureId: string): void {
    this.store.selectEnclosure(enclosureId);
  }
}
