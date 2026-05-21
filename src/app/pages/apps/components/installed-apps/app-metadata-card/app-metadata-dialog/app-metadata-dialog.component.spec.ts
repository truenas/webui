import { DialogRef, DIALOG_DATA } from '@angular/cdk/dialog';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Spectator, createComponentFactory, mockProvider } from '@ngneat/spectator/jest';
import { TnDialogHarness } from '@truenas/ui-components';
import { AppMetadata } from 'app/interfaces/app.interface';
import {
  AppMetadataDialog,
  AppMetadataDialogData,
} from 'app/pages/apps/components/installed-apps/app-metadata-card/app-metadata-dialog/app-metadata-dialog.component';

describe('AppMetadataDialog', () => {
  let spectator: Spectator<AppMetadataDialog>;
  let loader: HarnessLoader;

  const metadata = {
    capabilities: [
      { name: 'CHOWN', description: 'Change file ownership.' },
    ],
    host_mounts: [
      { hostPath: '/dev/dri', description: 'Needed for GPU access.' },
    ],
    run_as_context: [
      {
        uid: 0,
        gid: 0,
        user_name: 'root',
        group_name: 'root',
        description: 'Runs as root.',
      },
    ],
  } as AppMetadata;

  const data: AppMetadataDialogData = {
    name: 'netdata',
    metadata,
  };

  const createComponent = createComponentFactory({
    component: AppMetadataDialog,
    providers: [
      mockProvider(DialogRef),
      { provide: DIALOG_DATA, useValue: data },
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('titles the dialog shell with the app name', async () => {
    const dialog = await loader.getHarness(TnDialogHarness);

    expect(await dialog.getTitle()).toBe('netdata Metadata');
  });

  it('renders each metadata section with its entries', async () => {
    const dialog = await loader.getHarness(TnDialogHarness);
    const content = await dialog.getContentText();

    expect(content).toContain('Host Mounts');
    expect(content).toContain('/dev/dri');
    expect(content).toContain('Capabilities');
    expect(content).toContain('CHOWN');
    expect(content).toContain('Run As Context');
    expect(content).toContain('root');
  });

  it('closes the dialog when the Close action is clicked', async () => {
    const dialogRef = spectator.inject(DialogRef);
    const dialog = await loader.getHarness(TnDialogHarness);

    await dialog.clickActionButton('Close');

    expect(dialogRef.close).toHaveBeenCalled();
  });
});
