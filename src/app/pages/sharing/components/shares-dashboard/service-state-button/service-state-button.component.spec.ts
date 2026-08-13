import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { TnTooltipDirective } from '@truenas/ui-components';
import { MockDirective } from 'ng-mocks';
import { ServiceName } from 'app/enums/service-name.enum';
import { ServiceStatus } from 'app/enums/service-status.enum';
import { Service } from 'app/interfaces/service.interface';
import { MapValuePipe } from 'app/modules/pipes/map-value/map-value.pipe';
import { ServiceStateButtonComponent } from 'app/pages/sharing/components/shares-dashboard/service-state-button/service-state-button.component';

describe('ServiceStateButtonComponent', () => {
  let spectator: Spectator<ServiceStateButtonComponent>;

  const createComponent = createComponentFactory({
    component: ServiceStateButtonComponent,
    imports: [
      MapValuePipe,
    ],
    declarations: [
      MockDirective(TnTooltipDirective),
    ],
  });

  const getStatus = (): HTMLElement => spectator.query('.service-status') as HTMLElement;

  beforeEach(() => {
    spectator = createComponent();
    spectator.fixture.detectChanges();
  });

  it('shows service status based on service state', () => {
    spectator.setInput('service', { id: 1, service: ServiceName.Nfs, state: ServiceStatus.Running } as Service);

    expect(getStatus()).toHaveText('Running');
    expect(getStatus()).toHaveClass('fn-theme-green');

    spectator.setInput('service', { id: 1, service: ServiceName.Nfs, state: ServiceStatus.Stopped } as Service);

    expect(getStatus()).toHaveText('Stopped');
    expect(getStatus()).toHaveClass('fn-theme-grey');
  });

  it('exposes the status as a labelled status region', () => {
    spectator.setInput('service', { id: 1, service: ServiceName.Nfs, state: ServiceStatus.Running } as Service);

    expect(getStatus()).toHaveAttribute('role', 'status');
    expect(getStatus()).toHaveAttribute('aria-roledescription', 'Service status');
    // Preserved verbatim from the `<button [ixTest]>` this readout replaced.
    expect(getStatus()).toHaveAttribute('data-test', 'button-service-status-nfs');
  });
});
