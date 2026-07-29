import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { TnChipHarness } from '@truenas/ui-components';
import { FilterPreset, QueryFilters } from 'app/interfaces/query-api.interface';
import { FilterPresetsComponent } from './filter-presets.component';

interface MockPresetExample {
  username: string;
  api_key?: string;
  ssh?: boolean;
}

describe('FilterPresetsComponent', () => {
  let spectator: Spectator<FilterPresetsComponent<MockPresetExample>>;
  let loader: HarnessLoader;
  const createComponent = createComponentFactory({
    component: FilterPresetsComponent<MockPresetExample>,
  });

  const presets: FilterPreset<MockPresetExample>[] = [
    {
      label: 'Has API Access',
      query: [['api_key', '!=', null]] as QueryFilters<MockPresetExample>,
    },
    {
      label: 'Has SSH Access',
      query: [['ssh', '=', true]] as QueryFilters<MockPresetExample>,
    },
  ];

  beforeEach(() => {
    spectator = createComponent({
      props: {
        presets,
        selectedPresetLabels: new Set(),
      },
    });

    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('renders all visible preset chips', async () => {
    const chips = await loader.getAllHarnesses(TnChipHarness);
    const labels = await Promise.all(chips.map((chip) => chip.getLabel()));

    expect(labels).toContain('+ Has API Access');
    expect(labels).toContain('+ Has SSH Access');
  });

  it('does not render a chip if it was already selected', async () => {
    spectator.setInput('selectedPresetLabels', new Set(['Has SSH Access']));
    spectator.detectChanges();

    const chips = await loader.getAllHarnesses(TnChipHarness);
    const labels = await Promise.all(chips.map((chip) => chip.getLabel()));

    expect(labels).toContain('+ Has API Access');
    expect(labels).not.toContain('+ Has SSH Access');
  });

  it('emits filtersChanged when a preset is selected', async () => {
    const emitSpy = jest.spyOn(spectator.component.filtersChanged, 'emit');

    const apiChip = await loader.getHarness(TnChipHarness.with({ label: '+ Has API Access' }));
    await apiChip.click();

    expect(emitSpy).toHaveBeenCalledWith({
      filters: [[['api_key', '!=', null]]],
      selectedLabels: new Set(['Has API Access']),
    });
  });
});
