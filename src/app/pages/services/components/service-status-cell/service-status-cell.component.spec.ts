import { createHostFactory, SpectatorHost } from '@ngneat/spectator/jest';
import { ServiceStatus } from 'app/enums/service-status.enum';
import { Service } from 'app/interfaces/service.interface';
import { MapValuePipe } from 'app/modules/pipes/map-value/map-value.pipe';
import { ServiceStatusCellComponent } from 'app/pages/services/components/service-status-cell/service-status-cell.component';

describe('ServiceStatusCellComponent', () => {
  let spectator: SpectatorHost<ServiceStatusCellComponent>;

  const createHost = createHostFactory({
    component: ServiceStatusCellComponent,
    imports: [
      MapValuePipe,
    ],
  });

  function setupTest(service: Service): void {
    spectator = createHost(`
      <ix-service-status-cell [service]="service"></ix-service-status-cell>
    `, { hostProps: { service } });
  }

  it('checks status for running service', () => {
    setupTest({ state: ServiceStatus.Running } as Service);

    expect(spectator.query('span')).toHaveText('Running');
  });

  it('checks status for stopped service', () => {
    setupTest({ state: ServiceStatus.Stopped } as Service);

    expect(spectator.query('span')).toHaveText('Stopped');
  });

  it('checks status for deploying service', () => {
    setupTest({ state: ServiceStatus.Stopped } as Service);

    expect(spectator.query('span')).toHaveText('Stopped');
  });
});
