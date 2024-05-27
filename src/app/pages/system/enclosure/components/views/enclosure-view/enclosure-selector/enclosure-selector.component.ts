import {
  ChangeDetectionStrategy, Component, computed, input, output,
} from '@angular/core';
import { DashboardEnclosure } from 'app/interfaces/enclosure.interface';
import { EnclosureStore } from 'app/pages/system/enclosure/services/enclosure.store';

@Component({
  selector: 'ix-enclosure-selector',
  templateUrl: './enclosure-selector.component.html',
  styleUrl: './enclosure-selector.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IxEnclosureSelectorComponent {
  enclosures = input.required<DashboardEnclosure[]>();

  enclosureSelected = output<string>();
  selectedEnclosure = computed(() => this.store.selectedEnclosure().id);

  constructor(
    private store: EnclosureStore,
  ) {}

  selectEnclosure(enclosureId: string): void {
    this.enclosureSelected.emit(enclosureId);
  }
}
