import {
  ChangeDetectionStrategy, Component, computed, input, output,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { TranslateModule } from '@ngx-translate/core';
import { FilterPreset, QueryFilters } from 'app/interfaces/query-api.interface';
import { TestDirective } from 'app/modules/test-id/test.directive';

@Component({
  selector: 'ix-filter-presets',
  templateUrl: './filter-presets.component.html',
  styleUrls: ['./filter-presets.component.scss'],
  standalone: true,
  imports: [TranslateModule, MatButtonModule, TestDirective],
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
