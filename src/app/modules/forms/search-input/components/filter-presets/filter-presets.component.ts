import {
  ChangeDetectionStrategy, Component, computed, input, output,
} from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { TnChipComponent } from '@truenas/ui-components';
import { FilterPreset, QueryFilters } from 'app/interfaces/query-api.interface';

@Component({
  selector: 'ix-filter-presets',
  templateUrl: './filter-presets.component.html',
  styleUrls: ['./filter-presets.component.scss'],
  standalone: true,
  imports: [TranslateModule, TnChipComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FilterPresetsComponent<T> {
  readonly presets = input.required<FilterPreset<T>[]>();
  readonly selectedPresetLabels = input<Set<string>>(new Set());
  readonly filtersChanged = output<{ filters: QueryFilters<T>[]; selectedLabels: Set<string> }>();

  protected visiblePresets = computed(() => {
    const selected = this.selectedPresetLabels();
    return this.presets().filter((preset) => !selected.has(preset.label));
  });

  togglePreset(preset: FilterPreset<T>): void {
    const current = new Set(this.selectedPresetLabels());
    if (current.has(preset.label)) {
      current.delete(preset.label);
    } else {
      current.add(preset.label);
    }

    const activePresets = this.presets().filter((presetItem) => current.has(presetItem.label));
    const allQueries = activePresets.map((presetItem) => presetItem.query);

    this.filtersChanged.emit({
      filters: allQueries,
      selectedLabels: current,
    });
  }
}
