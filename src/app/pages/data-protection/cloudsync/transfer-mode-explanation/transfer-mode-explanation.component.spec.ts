import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { TnIconHarness } from '@truenas/ui-components';
import { TransferMode } from 'app/enums/transfer-mode.enum';
import { helptextCloudSync } from 'app/helptext/data-protection/cloudsync/cloudsync';
import { TransferModeExplanationComponent } from './transfer-mode-explanation.component';

describe('TransferModeExplanationComponent', () => {
  let spectator: Spectator<TransferModeExplanationComponent>;
  let loader: HarnessLoader;
  const createComponent = createComponentFactory({
    component: TransferModeExplanationComponent,
  });

  beforeEach(() => {
    spectator = createComponent({
      props: {
        mode: TransferMode.Sync,
      },
    });
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('shows icon for the transfer mode provided', async () => {
    const icon = await loader.getHarness(TnIconHarness);

    expect(await icon.getName()).toBe('sync');
  });

  it('shows the transfer mode description', () => {
    const description = spectator.query('.description')!;

    expect(description.innerHTML).toEqual(helptextCloudSync.syncModeExplanation);
  });
});
