import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { DashboardEnclosure } from 'app/interfaces/enclosure.interface';
import { PageHeaderModule } from 'app/modules/page-header/page-header.module';
import {
  EnclosureDashboardComponent,
} from 'app/pages/system/enclosure/components/enclosure-dashboard/enclosure-dashboard.component';
import {
  SetEnclosureLabelDialogComponent,
} from 'app/pages/system/enclosure/components/enclosure-dashboard/set-enclosure-label-dialog/set-enclosure-label-dialog.component';
import { EnclosureStore } from 'app/pages/system/enclosure/services/enclosure.store';

describe('EnclosureDashboardComponent', () => {
  let spectator: Spectator<EnclosureDashboardComponent>;
  let loader: HarnessLoader;
  const createComponent = createComponentFactory({
    component: EnclosureDashboardComponent,
    shallow: true,
    imports: [
      PageHeaderModule,
    ],
    providers: [
      mockProvider(MatDialog),
      mockProvider(EnclosureStore, {
        selectedEnclosure$: of({
          id: 'enclosure-id',
          name: 'M50',
          label: 'Current label',
        } as DashboardEnclosure),
        initiate: jest.fn(),
        renameSelectedEnclosure: jest.fn(),
      }),
    ],
  });

  beforeEach(() => {
  });

  it('opens edit dialog when Edit Label is pressed', async () => {
    console.info('start of opens edit dialog');
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);

    console.info('a');
    jest.spyOn(spectator.inject(MatDialog), 'open').mockReturnValue({
      afterClosed: () => of('new label'),
    } as MatDialogRef<SetEnclosureLabelDialogComponent>);

    console.info('b');
    const editLabel = await loader.getHarness(MatButtonHarness.with({ text: 'Edit Label' }));
    await editLabel.click();

    console.info('c');
    expect(spectator.inject(MatDialog).open).toHaveBeenCalledWith(SetEnclosureLabelDialogComponent, {
      data: {
        currentLabel: 'Current label',
        defaultLabel: 'M50',
        enclosureId: 'enclosure-id',
      },
    });

    console.info('d');
    expect(spectator.inject(EnclosureStore).renameSelectedEnclosure).toHaveBeenCalledWith('new label');
  });

  it('initializes store when component is initialized', () => {
    console.info('start of initializes store');
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    expect(spectator.inject(EnclosureStore).initiate).toHaveBeenCalled();
    console.info('end of first case');
  });
});
