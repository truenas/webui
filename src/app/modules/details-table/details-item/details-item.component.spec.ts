import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { createHostFactory, SpectatorHost } from '@ngneat/spectator/jest';
import { DetailsItemComponent } from 'app/modules/details-table/details-item/details-item.component';
import { TooltipHarness } from 'app/modules/tooltip/tooltip.harness';

describe('DetailsItemComponent', () => {
  let spectator: SpectatorHost<DetailsItemComponent>;
  let loader: HarnessLoader;
  const createComponent = createHostFactory({
    component: DetailsItemComponent,
  });

  beforeEach(() => {
    spectator = createComponent('<ix-details-item [label]="label" [tooltip]="tooltip">Value</ix-details-item>', {
      hostProps: {
        label: 'Label',
        tooltip: 'Tooltip',
      },
    });
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('renders label', () => {
    const label = spectator.query('.key-column');
    expect(label).toHaveText('Label');
  });

  it('renders tooltip', async () => {
    const tooltip = await loader.getHarness(TooltipHarness);
    expect(await tooltip.getMessage()).toBe('Tooltip');
  });

  it('renders value', () => {
    const value = spectator.query('.value-column');
    expect(value).toHaveText('Value');
  });
});
