import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatTooltip } from '@angular/material/tooltip';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { MockComponent, MockDirective } from 'ng-mocks';
import { ServiceName } from 'app/enums/service-name.enum';
import { ServiceStatus } from 'app/enums/service-status.enum';
import { Service } from 'app/interfaces/service.interface';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { MapValuePipe } from 'app/modules/pipes/map-value/map-value.pipe';
import { ServiceStateButtonComponent } from 'app/pages/sharing/components/shares-dashboard/service-state-button/service-state-button.component';

describe('ServiceStateButtonComponent', () => {
  let spectator: Spectator<ServiceStateButtonComponent>;
  let loader: HarnessLoader;

  const createComponent = createComponentFactory({
    component: ServiceStateButtonComponent,
    imports: [
      MapValuePipe,
    ],
    declarations: [
      MockComponent(IxIconComponent),
      MockDirective(MatTooltip),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    spectator.fixture.detectChanges();
  });

  it('shows service status based on service state', async () => {
    const loadingButton = await loader.getHarness(MatButtonHarness.with({ text: 'LOADING' }));
    expect(loadingButton).toExist();
    expect((await (await loadingButton.host()).getAttribute('class'))?.split(' ').includes('fn-theme-orange')).toBe(true);

    spectator.setInput('service', { id: 1, service: ServiceName.Nfs, state: ServiceStatus.Running } as Service);
    spectator.setInput('count', 5);
    const runningButton = await loader.getHarness(MatButtonHarness.with({ text: 'RUNNING' }));
    expect(runningButton).toExist();

    spectator.setInput('service', { id: 1, service: ServiceName.Nfs, state: ServiceStatus.Stopped } as Service);
    const stoppedButton = await loader.getHarness(MatButtonHarness.with({ text: 'STOPPED' }));
    expect(stoppedButton).toExist();
    expect((await (await stoppedButton.host()).getAttribute('class'))?.split(' ').includes('fn-theme-red')).toBe(true);

    spectator.setInput('count', 0);
    expect((await (await stoppedButton.host()).getAttribute('class'))?.split(' ').includes('fn-theme-red')).toBe(true);
  });
});
