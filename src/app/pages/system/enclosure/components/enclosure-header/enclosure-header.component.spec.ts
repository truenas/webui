import { HarnessLoader } from '@angular/cdk/testing';
import { TnDialog } from '@truenas/ui-components';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { DialogRef } from '@angular/cdk/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { DashboardEnclosure } from 'app/interfaces/enclosure.interface';
import {
  EnclosureHeaderComponent,
} from 'app/pages/system/enclosure/components/enclosure-header/enclosure-header.component';
import {
  SetEnclosureLabelDialog,
} from 'app/pages/system/enclosure/components/set-enclosure-label-dialog/set-enclosure-label-dialog.component';
import { EnclosureStore } from 'app/pages/system/enclosure/services/enclosure.store';

describe('EnclosureHeaderComponent', () => {
  let spectator: Spectator<EnclosureHeaderComponent>;
  let loader: HarnessLoader;
  const createComponent = createComponentFactory({
    component: EnclosureHeaderComponent,
    shallow: true,
    providers: [
      mockProvider(TnDialog),
      mockProvider(EnclosureStore, {
        enclosureLabel: () => 'My Enclosure',
        selectedEnclosure: () => ({
          id: 'enclosure-id',
          name: 'M50',
          label: 'My enclosure',
        } as DashboardEnclosure),
        renameSelectedEnclosure: jest.fn(),
      }),
      mockAuth(),
    ],
  });

  beforeEach(() => {
    spectator = createComponent({
      props: {
        title: 'Disks on My Enclosure',
      },
    });
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('shows provided title', () => {
    expect(spectator.query('h3')).toHaveText('Disks on My Enclosure');
  });

  it('opens edit dialog when Edit Label is pressed', async () => {
    jest.spyOn(spectator.inject(TnDialog), 'open').mockReturnValue({
      closed: of('new label'),
    } as DialogRef<unknown, SetEnclosureLabelDialog>);

    const editLabel = await loader.getHarness(MatButtonHarness.with({ text: 'Edit Label' }));
    await editLabel.click();

    expect(spectator.inject(TnDialog).open).toHaveBeenCalledWith(SetEnclosureLabelDialog, {
      data: {
        currentLabel: 'My Enclosure',
        defaultLabel: 'M50',
        enclosureId: 'enclosure-id',
      },
    });

    expect(spectator.inject(EnclosureStore).renameSelectedEnclosure).toHaveBeenCalledWith('new label');
  });
});
