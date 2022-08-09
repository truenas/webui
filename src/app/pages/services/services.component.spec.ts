import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { FormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatCheckboxHarness } from '@angular/material/checkbox/testing';
import { MatSlideToggleHarness } from '@angular/material/slide-toggle/testing';
import { Router } from '@angular/router';
import { SpectatorRouting } from '@ngneat/spectator';
import {
  createRoutingFactory, mockProvider,
} from '@ngneat/spectator/jest';
import { CoreComponents } from 'app/core/core-components.module';
import { mockWebsocket, mockCall } from 'app/core/testing/utils/mock-websocket.utils';
import { ServiceName, serviceNames } from 'app/enums/service-name.enum';
import { ServiceStatus } from 'app/enums/service-status.enum';
import { ServiceRow } from 'app/interfaces/service.interface';
import { EntityModule } from 'app/modules/entity/entity.module';
import { IxTableModule } from 'app/modules/ix-tables/ix-table.module';
import { IxTableHarness } from 'app/modules/ix-tables/testing/ix-table.harness';
import { ServicesComponent } from 'app/pages/services/services.component';
import { DialogService, IscsiService, WebSocketService } from 'app/services';
import { IxSlideInService } from 'app/services/ix-slide-in.service';

const hiddenServices = [ServiceName.Gluster, ServiceName.Afp];
const fakeDataSource: ServiceRow[] = [...serviceNames.entries()]
  .filter(([serviceName]) => !hiddenServices.includes(serviceName))
  .map(([service, name], id) => {
    return {
      id,
      service,
      name,
      state: ServiceStatus.Stopped,
      enable: false,
    } as ServiceRow;
  });

describe('ServicesComponent', () => {
  let spectator: SpectatorRouting<ServicesComponent>;
  let loader: HarnessLoader;
  let ws: WebSocketService;

  const createComponent = createRoutingFactory({
    component: ServicesComponent,
    imports: [
      CoreComponents,
      EntityModule,
      IxTableModule,
      FormsModule,
    ],
    providers: [
      mockWebsocket([
        mockCall('service.query', fakeDataSource),
        mockCall('service.update'),
        mockCall('service.start'),
        mockCall('service.stop'),
      ]),
      mockProvider(DialogService),
      mockProvider(IxSlideInService),
      mockProvider(IscsiService),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    ws = spectator.inject(WebSocketService);
    spectator.fixture.detectChanges();
  });

  it('should show table rows', async () => {
    const table = await loader.getHarness(IxTableHarness);
    const cells = await table.getCells(true);
    const expectedData = [...serviceNames.keys()]
      .filter((service) => !hiddenServices.includes(service))
      .map((service) => [serviceNames.get(service), '', '', 'edit']);

    expectedData.sort((a, b) => a[0].localeCompare(b[0]));

    const expectedRows = [['Name', 'Running', 'Start Automatically', ''], ...expectedData];

    expect(cells).toEqual(expectedRows);
  });

  it('should redirect to configure service page when edit button is pressed', async () => {
    const table = await loader.getHarness(IxTableHarness);
    const firstRow = await table.getFirstRow();
    const serviceKey = [...serviceNames.entries()].find(([, value]) => value === firstRow.name)[0];

    const editButton = await table.getHarness(MatButtonHarness.with({ text: 'edit' }));
    await editButton.click();

    expect(spectator.inject(Router).navigate).toHaveBeenCalledWith(['/services', serviceKey]);
  });

  it('should change service enable state when slide is checked', async () => {
    const table = await loader.getHarness(IxTableHarness);
    const firstRow = await table.getFirstRow();
    const serviceKey = [...serviceNames.entries()].find(([, value]) => value === firstRow.name)[0];

    const slideToggle = await table.getHarness(MatSlideToggleHarness);
    await slideToggle.toggle();

    expect(await slideToggle.isChecked()).toBeTruthy();
    expect(ws.call).toHaveBeenCalledWith('service.start', [serviceKey, { silent: false }]);
  });

  it('should change service autostart state when checkbox is ticked', async () => {
    const checkbox = await loader.getHarness(MatCheckboxHarness);
    await checkbox.check();

    expect(await checkbox.isChecked()).toBeTruthy();
    expect(ws.call).toHaveBeenCalledWith('service.update', [0, { enable: true }]);
  });
});
