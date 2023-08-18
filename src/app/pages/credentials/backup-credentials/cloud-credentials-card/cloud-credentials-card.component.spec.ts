import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatDialog } from '@angular/material/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { mockCall, mockWebsocket } from 'app/core/testing/utils/mock-websocket.utils';
import { IxSlideInRef } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in-ref';
import { IxTable2Module } from 'app/modules/ix-table2/ix-table2.module';
import { CloudCredentialsCardComponent } from 'app/pages/credentials/backup-credentials/cloud-credentials-card/cloud-credentials-card.component';
import { CloudCredentialsFormComponent } from 'app/pages/credentials/backup-credentials/cloud-credentials-form/cloud-credentials-form.component';
import { DialogService } from 'app/services/dialog.service';
import { IxSlideInService } from 'app/services/ix-slide-in.service';

describe('CloudCredentialsCardComponent', () => {
  let spectator: Spectator<CloudCredentialsCardComponent>;
  let loader: HarnessLoader;

  const createComponent = createComponentFactory({
    component: CloudCredentialsCardComponent,
    imports: [
      IxTable2Module,
    ],
    providers: [
      mockWebsocket([
        mockCall('cloudsync.credentials.query', []),
        mockCall('cloudsync.credentials.delete'),
      ]),
      mockProvider(DialogService, {
        confirm: () => of(true),
      }),
      mockProvider(IxSlideInService, {
        onClose$: of(),
      }),
      mockProvider(IxSlideInRef),
      mockProvider(MatDialog, {
        open: jest.fn(() => ({
          afterClosed: () => of(true),
        })),
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('checks page title', () => {
    const title = spectator.query('h3');
    expect(title).toHaveText('Cloud Credentials');
  });

  it('opens form when "Add" button is pressed', async () => {
    const addButton = await loader.getHarness(MatButtonHarness.with({ text: 'Add' }));
    await addButton.click();

    expect(spectator.inject(IxSlideInService).open).toHaveBeenCalledWith(CloudCredentialsFormComponent);
  });

  it('opens form when "Edit" button is pressed', async () => {
    const editButton = await loader.getHarness(MatButtonHarness.with({ selector: '[aria-label="Edit"]' }));
    await editButton.click();

    expect(spectator.inject(IxSlideInService).open).toHaveBeenCalledWith(CloudCredentialsFormComponent, {
      data: {},
    });
  });

  it('opens delete dialog when "Delete" button is pressed', async () => {
    const deleteButton = await loader.getHarness(MatButtonHarness.with({ selector: '[aria-label="Delete"]' }));
    await deleteButton.click();

    expect(spectator.inject(MatDialog).open).toHaveBeenCalledWith('', {
      data: {},
    });
  });
});
