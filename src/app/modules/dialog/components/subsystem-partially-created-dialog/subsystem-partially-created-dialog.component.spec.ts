import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { NvmeOfSubsystem } from 'app/interfaces/nvme-of.interface';
import { SubsystemPartiallyCreatedDialogComponent } from './subsystem-partially-created-dialog.component';

describe('SubsystemPartiallyCreatedDialogComponent', () => {
  let spectator: Spectator<SubsystemPartiallyCreatedDialogComponent>;
  let loader: HarnessLoader;

  const mockSubsystem = {
    id: 1,
    name: 'test-subsystem',
    subnqn: 'nqn.2023-01.io.truenas:test-subsystem',
    serial: '1234567890',
    allow_any_host: true,
    pi_enable: null,
    qix_max: null,
    ieee_oui: null,
    ana: null,
    ports: [1, 2],
    hosts: [1, 2],
    namespaces: [1, 2],
  } as NvmeOfSubsystem;

  const mockErrors = [
    'Ports Error: Port 7000 already in use.',
    'Hosts Error: Host ABC not found.',
    'Namespaces Error: /mnt/test already used.',
  ];

  const createComponent = createComponentFactory({
    component: SubsystemPartiallyCreatedDialogComponent,
    providers: [
      {
        provide: MAT_DIALOG_DATA,
        useValue: {
          subsystem: mockSubsystem,
          relatedErrors: mockErrors,
        },
      },
      {
        provide: MatDialogRef,
        useValue: {
          close: jest.fn(),
        },
      },
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('shows the title', () => {
    expect(spectator.query('h1')).toHaveText('Saved Partially');
  });

  it('shows the intro message with subsystem name', () => {
    const content = spectator.query('div[mat-dialog-content]');
    expect(content?.textContent).toContain(' Subsystem "test-subsystem" has been created. However, we could not create some related items: Ports Error: Port 7000 already in use.Hosts Error: Host ABC not found.Namespaces Error: /mnt/test already used. Please create related items manually. ');
  });

  it('renders all related error messages in a list', () => {
    const listItems = spectator.queryAll('li');
    expect(listItems).toHaveLength(mockErrors.length);
    mockErrors.forEach((err, i) => {
      expect(listItems[i]).toHaveText(err);
    });
  });

  it('shows a Close button and closes dialog on click', async () => {
    const button = await loader.getHarness(MatButtonHarness.with({ selector: '[mat-dialog-close]' }));
    await button.click();

    expect(spectator.inject(MatDialogRef).close).toHaveBeenCalled();
  });
});
