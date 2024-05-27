import {
  ChangeDetectionStrategy, Component, computed, input, output,
} from '@angular/core';
import { DashboardEnclosure } from 'app/interfaces/enclosure.interface';

@Component({
  selector: 'ix-enclosure-selector',
  templateUrl: './enclosure-selector.component.html',
  styleUrl: './enclosure-selector.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IxEnclosureSelectorComponent {
  enclosures = input.required<DashboardEnclosure[]>();

  enclosureSelected = output<string>();
  selectedEnclosure = computed(() => {
    const enclosures = this.enclosures();
    return enclosures[0]?.id;
  });

  selectEnclosure(enclosureId: string): void {
    this.enclosureSelected.emit(enclosureId);
  }
}
