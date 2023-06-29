import { Spectator, createComponentFactory } from '@ngneat/spectator/jest';
import { AppMetadata } from 'app/interfaces/chart-release.interface';
import { AppSectionExpandCollapseComponent } from 'app/pages/apps/components/app-section-expand-collapse/app-section-expand-collapse.component';
import { AppMetadataCardComponent } from 'app/pages/apps/components/installed-apps/app-metadata-card/app-metadata-card.component';

describe('AppMetadataCardComponent', () => {
  let spectator: Spectator<AppMetadataCardComponent>;

  const appMetadata: AppMetadata = {
    capabilities: Array.from({ length: 2 }).map((value, index) => ({
      name: `X${index}`,
      description: `This is being used to do X${index} thing`,
    })),
    hostMounts: Array.from({ length: 3 }).map((value, index) => ({
      hostPath: `/dev/proc${index}`,
      description: 'Required by netdata for xyz',
    })),
    runAsContext: Array.from({ length: 4 }).map((value, index) => ({
      uid: index,
      gid: index,
      userName: `ix-test-${index}`,
      groupName: `ix-test-${index}`,
      description: 'Why this needs to be done',
    })),
  };

  const createComponent = createComponentFactory({
    component: AppMetadataCardComponent,
    declarations: [
      AppSectionExpandCollapseComponent,
    ],
    providers: [],
  });

  beforeEach(() => {
    spectator = createComponent({
      props: {
        appMetadata,
      },
    });
  });

  function getDetails(selector: string): Record<string, string> {
    return spectator.queryAll(selector).reduce((acc, item: HTMLElement) => {
      const key = item.querySelector('.label').textContent;
      const value = item.querySelector('.value').textContent;
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
});
