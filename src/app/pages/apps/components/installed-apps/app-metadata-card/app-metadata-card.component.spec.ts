import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Spectator, createComponentFactory, mockProvider } from '@ngneat/spectator/jest';
import { TnDialog, TnIconButtonHarness } from '@truenas/ui-components';
import { App, AppMetadata } from 'app/interfaces/app.interface';
import { AppMetadataCardComponent } from 'app/pages/apps/components/installed-apps/app-metadata-card/app-metadata-card.component';
import {
  AppMetadataDialog,
} from 'app/pages/apps/components/installed-apps/app-metadata-card/app-metadata-dialog/app-metadata-dialog.component';
import {
  AppMetadataListComponent,
} from 'app/pages/apps/components/installed-apps/app-metadata-card/app-metadata-list/app-metadata-list.component';

describe('AppMetadataCardComponent', () => {
  let spectator: Spectator<AppMetadataCardComponent>;
  let loader: HarnessLoader;

  const appMetadata = {
    capabilities: [{ name: 'CHOWN', description: 'Change file ownership.' }],
    host_mounts: [{ hostPath: '/dev/dri', description: 'Needed for GPU access.' }],
    run_as_context: [{
      uid: 0,
      gid: 0,
      user_name: 'root',
      group_name: 'root',
      description: 'Runs as root.',
    }],
  } as AppMetadata;

  const app = { name: 'app-name' } as App;

  const createComponent = createComponentFactory({
    component: AppMetadataCardComponent,
    imports: [AppMetadataListComponent],
    providers: [
      mockProvider(TnDialog),
    ],
  });

  beforeEach(() => {
    spectator = createComponent({
      props: {
        app,
        appMetadata,
      },
    });
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('shows header', () => {
    expect(spectator.query('mat-card-header h3')).toHaveText('Application Metadata');
  });

  it('renders the metadata list with the expandable layout', () => {
    const list = spectator.query(AppMetadataListComponent);

    expect(list).toBeTruthy();
    expect(list!.appMetadata()).toBe(appMetadata);
    expect(list!.expandable()).toBe(true);
  });

  it('does not render the expand button when no app is provided', async () => {
    spectator.setInput('app', null);

    const buttons = await loader.getAllHarnesses(TnIconButtonHarness.with({ name: 'open-in-new' }));
    expect(buttons).toHaveLength(0);
  });

  it('opens metadata in a larger dialog when expand button is clicked', async () => {
    const tnDialog = spectator.inject(TnDialog);
    const expandButton = await loader.getHarness(
      TnIconButtonHarness.with({ name: 'open-in-new' }),
    );

    await expandButton.click();

    expect(tnDialog.open).toHaveBeenCalledWith(AppMetadataDialog, {
      data: {
        name: app.name,
        metadata: appMetadata,
      },
    });
  });
});
