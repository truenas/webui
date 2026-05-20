import { Spectator, createComponentFactory } from '@ngneat/spectator/jest';
import { AppMetadata } from 'app/interfaces/app.interface';
import { CardExpandCollapseComponent } from 'app/modules/card-expand-collapse/card-expand-collapse.component';
import {
  AppMetadataListComponent,
} from 'app/pages/apps/components/installed-apps/app-metadata-card/app-metadata-list/app-metadata-list.component';

describe('AppMetadataListComponent', () => {
  let spectator: Spectator<AppMetadataListComponent>;

  const appMetadata = {
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

  const createComponent = createComponentFactory({
    component: AppMetadataListComponent,
    imports: [CardExpandCollapseComponent],
  });

  it('renders every metadata section with its entries', () => {
    spectator = createComponent({ props: { appMetadata } });

    const titles = spectator.queryAll('section h4').map((title) => title.textContent?.trim());
    expect(titles).toEqual(['Host Mounts', 'Capabilities', 'Run As Context']);
    expect(spectator.query('.details-list')).toContainText('/dev/dri');
  });

  it('omits sections that have no entries', () => {
    spectator = createComponent({
      props: {
        appMetadata: { ...appMetadata, host_mounts: [], capabilities: [] } as AppMetadata,
      },
    });

    expect(spectator.queryAll('section')).toHaveLength(1);
    expect(spectator.query('section h4')).toHaveText('Run As Context');
  });

  it('wraps each section in a collapsible container when expandable', () => {
    spectator = createComponent({ props: { appMetadata, expandable: true } });

    expect(spectator.queryAll('section')).toHaveLength(0);
    expect(spectator.query('#hostMounts')).toExist();
    expect(spectator.query('#capabilities')).toExist();
    expect(spectator.query('#runAsContext')).toExist();
  });

  it('omits sections that have no entries in the expandable layout', () => {
    spectator = createComponent({
      props: {
        appMetadata: { ...appMetadata, host_mounts: [], capabilities: [] } as AppMetadata,
        expandable: true,
      },
    });

    expect(spectator.query('#hostMounts')).not.toExist();
    expect(spectator.query('#capabilities')).not.toExist();
    expect(spectator.query('#runAsContext')).toExist();
  });
});
