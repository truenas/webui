import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Spectator, createComponentFactory, mockProvider } from '@ngneat/spectator/jest';
import { TnDialog, TnIconButtonHarness } from '@truenas/ui-components';
import { App, AppMetadata } from 'app/interfaces/app.interface';
import { CardExpandCollapseComponent } from 'app/modules/card-expand-collapse/card-expand-collapse.component';
import { AppMetadataCardComponent } from 'app/pages/apps/components/installed-apps/app-metadata-card/app-metadata-card.component';
import {
  AppMetadataDialog,
} from 'app/pages/apps/components/installed-apps/app-metadata-card/app-metadata-dialog/app-metadata-dialog.component';

describe('AppMetadataCardComponent', () => {
  let spectator: Spectator<AppMetadataCardComponent>;
  let loader: HarnessLoader;

  const appMetadata = {
    capabilities: Array.from({ length: 2 }).map((value, index) => ({
      name: `X${index}`,
      description: `This is being used to do X${index} thing`,
    })),
    host_mounts: Array.from({ length: 3 }).map((value, index) => ({
      hostPath: `/dev/proc${index}`,
      description: 'Required by netdata for xyz',
    })),
    run_as_context: Array.from({ length: 4 }).map((value, index) => ({
      uid: index,
      gid: index,
      user_name: `ix-test-${index}`,
      group_name: `ix-test-${index}`,
      description: 'Why this needs to be done',
    })),
  } as AppMetadata;

  const app = { name: 'app-name' } as App;

  const createComponent = createComponentFactory({
    component: AppMetadataCardComponent,
    imports: [CardExpandCollapseComponent],
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

  function getDetails(selector: string): Record<string, string> {
    return spectator.queryAll(selector).reduce((acc, item: HTMLElement) => {
      const key = item.querySelector('.label')!.textContent!;
      const value = item.querySelector('.value')!.textContent!;
      acc[key] = value;
      return acc;
    }, {} as Record<string, string>);
  }

  it('shows header', () => {
    expect(spectator.query('mat-card-header h3')).toHaveText('Application Metadata');
  });

  it('checks hostMounts entries', () => {
    const hostMounts = getDetails('#hostMounts .details-item');

    expect(spectator.query('#hostMounts h4')).toHaveText('Host Mounts');
    expect(hostMounts).toEqual({
      '/dev/proc0': 'Required by netdata for xyz',
      '/dev/proc1': 'Required by netdata for xyz',
      '/dev/proc2': 'Required by netdata for xyz',
    });
  });

  it('checks capabilities entries', () => {
    const capabilities = getDetails('#capabilities .details-item');

    expect(spectator.query('#capabilities h4')).toHaveText('Capabilities');
    expect(capabilities).toEqual({
      X0: 'This is being used to do X0 thing',
      X1: 'This is being used to do X1 thing',
    });
  });

  it('checks runAsContext entries', () => {
    expect(spectator.query('#runAsContext h4')).toHaveText('Run As Context');

    const runAsContextEntries = spectator.queryAll('#runAsContext .details-entry');
    expect(runAsContextEntries).toHaveLength(4);
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
