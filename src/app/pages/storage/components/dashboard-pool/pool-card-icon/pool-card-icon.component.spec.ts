import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { TnIconHarness } from '@truenas/ui-components';
import { PoolCardIconType } from 'app/enums/pool-card-icon-type.enum';
import { PoolCardIconComponent } from 'app/pages/storage/components/dashboard-pool/pool-card-icon/pool-card-icon.component';

describe('PoolCardIconComponent', () => {
  let spectator: Spectator<PoolCardIconComponent>;
  let loader: HarnessLoader;
  const createComponent = createComponentFactory({
    component: PoolCardIconComponent,
  });

  it('renders icon when type is safe', async () => {
    spectator = createComponent({
      props: { type: PoolCardIconType.Safe, tooltip: '' },
    });
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    const icon = await loader.getHarness(TnIconHarness);
    expect(await icon.getName()).toBe('check-circle');
  });

  it('renders icon when type is warn', async () => {
    spectator = createComponent({
      props: { type: PoolCardIconType.Warn, tooltip: '' },
    });
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    const icon = await loader.getHarness(TnIconHarness);
    expect(await icon.getName()).toBe('alert-circle');
  });

  it('renders icon when type is faulted', async () => {
    spectator = createComponent({
      props: { type: PoolCardIconType.Faulted, tooltip: '' },
    });
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    const icon = await loader.getHarness(TnIconHarness);
    expect(await icon.getName()).toBe('help-circle-outline');
  });

  it('renders icon when type is error', async () => {
    spectator = createComponent({
      props: { type: PoolCardIconType.Error, tooltip: '' },
    });
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    const icon = await loader.getHarness(TnIconHarness);
    expect(await icon.getName()).toBe('close-circle');
  });
});
