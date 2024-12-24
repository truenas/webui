import { Spectator } from '@ngneat/spectator';
import { createComponentFactory, mockProvider } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { DockerStatus } from 'app/enums/docker-status.enum';
import { MapValuePipe } from 'app/modules/pipes/map-value/map-value.pipe';
import { DockerStatusComponent } from 'app/pages/apps/components/installed-apps/docker-status/docker-status.component';
import { DockerStore } from 'app/pages/apps/store/docker.store';

describe('DockerStatusComponent', () => {
  let spectator: Spectator<DockerStatusComponent>;

  const createComponent = createComponentFactory({
    component: DockerStatusComponent,
    imports: [MapValuePipe],
  });

  function setupTest(status: DockerStatus | null): void {
    spectator = createComponent({
      providers: [
        mockProvider(DockerStore, {
          status$: of(status),
        }),
      ],
    });
  }

  it('checks status for Running docker status', () => {
    setupTest(DockerStatus.Running);
    expect(spectator.query('.status-wrapper span')).toHaveText('Apps Service Running');
  });

  it('checks status for Initializing docker status', () => {
    setupTest(DockerStatus.Initializing);
    expect(spectator.query('.status-wrapper span')).toHaveText('Initializing Apps Service');
  });

  it('checks status for Failed docker status', () => {
    setupTest(DockerStatus.Failed);
    expect(spectator.query('.status-wrapper span')).toHaveText('Error In Apps Service');
  });

  it('checks status for Stopped docker status', () => {
    setupTest(DockerStatus.Stopped);
    expect(spectator.query('.status-wrapper span')).toHaveText('Apps Service Stopped');
  });

  it('checks status for Stopping docker status', () => {
    setupTest(DockerStatus.Stopping);
    expect(spectator.query('.status-wrapper span')).toHaveText('Stopping Apps Service');
  });

  it('checks status for Pending docker status', () => {
    setupTest(DockerStatus.Pending);
    expect(spectator.query('.status-wrapper span')).toHaveText('Apps Service Pending');
  });

  it('checks status for Unconfigured docker status', () => {
    setupTest(DockerStatus.Unconfigured);
    expect(spectator.query('.status-wrapper span')).toHaveText('Apps Service Not Configured');
  });

  it('hides docker status when it is not set', () => {
    setupTest(null);
    expect(spectator.query('.status-wrapper span')).not.toExist();
  });
});
