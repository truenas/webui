import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import {
  CloudBackupCardComponent,
} from 'app/pages/data-protection/cloud-backup/cloud-backup-card/cloud-backup-card.component';
import {
  CloudBackupFormComponent,
} from 'app/pages/data-protection/cloud-backup/cloud-backup-form/cloud-backup-form.component';
import { IxChainedSlideInService } from 'app/services/ix-chained-slide-in.service';

describe('CloudBackupCardComponent', () => {
  let spectator: Spectator<CloudBackupCardComponent>;
  let loader: HarnessLoader;
  const createComponent = createComponentFactory({
    component: CloudBackupCardComponent,
    providers: [
      mockProvider(IxChainedSlideInService, {
        open: jest.fn(() => of({
          response: true,
        })),
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('opens Cloud Backup form when Add button is pressed', async () => {
    const addButton = await loader.getHarness(MatButtonHarness.with({ text: 'Add' }));
    await addButton.click();

    expect(spectator.inject(IxChainedSlideInService).open).toHaveBeenCalledWith(CloudBackupFormComponent);
  });
});
