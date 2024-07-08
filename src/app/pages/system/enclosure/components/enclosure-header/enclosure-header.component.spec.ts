import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { DashboardEnclosure } from 'app/interfaces/enclosure.interface';
import {
  EnclosureHeaderComponent,
} from 'app/pages/system/enclosure/components/enclosure-header/enclosure-header.component';
import {
  SetEnclosureLabelDialogComponent,
} from 'app/pages/system/enclosure/components/set-enclosure-label-dialog/set-enclosure-label-dialog.component';
import { EnclosureStore } from 'app/pages/system/enclosure/services/enclosure.store';

describe('EnclosureHeaderComponent', () => {
  let spectator: Spectator<EnclosureHeaderComponent>;
  let loader: HarnessLoader;
  const createComponent = createComponentFactory({
    component: EnclosureHeaderComponent,
    shallow: true,
    providers: [
      mockProvider(MatDialog),
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
    jest.spyOn(spectator.inject(MatDialog), 'open').mockReturnValue({
      afterClosed: () => of('new label'),
    } as MatDialogRef<SetEnclosureLabelDialogComponent>);

    const editLabel = await loader.getHarness(MatButtonHarness.with({ text: 'Edit Label' }));
    await editLabel.click();

    expect(spectator.inject(MatDialog).open).toHaveBeenCalledWith(SetEnclosureLabelDialogComponent, {
      data: {
        currentLabel: 'My Enclosure',
        defaultLabel: 'M50',
        enclosureId: 'enclosure-id',
      },
    });

    expect(spectator.inject(EnclosureStore).renameSelectedEnclosure).toHaveBeenCalledWith('new label');
  });
});
