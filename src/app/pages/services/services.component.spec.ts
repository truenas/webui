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
import { CoreComponents } from 'app/core/components/core-components.module';
import { CoreService } from 'app/core/services/core-service/core.service';
import { mockWebsocket, mockCall } from 'app/core/testing/utils/mock-websocket.utils';
import { ServiceStatus } from 'app/enums/service-status.enum';
import { Service } from 'app/interfaces/service.interface';
import { EntityModule } from 'app/pages/common/entity/entity.module';
import { IxTableModule } from 'app/pages/common/ix-tables/ix-table.module';
import { IxTableHarness } from 'app/pages/common/ix-tables/testing/ix-table.harness';
import { ServicesComponent } from 'app/pages/services/services.component';
import { DialogService, IscsiService, WebSocketService } from 'app/services';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { ServiceName, serviceNames } from '../../enums/service-name.enum';

const fakeDataSource: Service[] = [...serviceNames.keys()]
  .filter((service) => ![ServiceName.Gluster, ServiceName.Afp].includes(service))
  .map((service, id) => {
    return {
      id,
      service,
      state: ServiceStatus.Stopped,
      enable: false,
    } as Service;
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
      mockProvider(CoreService),
      mockProvider(IscsiService),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    ws = spectator.inject(WebSocketService);
    spectator.fixture.detectChanges();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should show table headers', async () => {
    const table = await loader.getHarness(IxTableHarness);
    const headerRow = await table.getHeaderRow();

    expect(headerRow).toMatchObject({
      name: 'Name',
      state: 'Running',
      enable: 'Start Automatically',
      actions: '',
    });
  });

  it('should show table rows', async () => {
    const table = await loader.getHarness(IxTableHarness);
    const cells = await table.getCells(true);
    const expectedData = [...serviceNames.keys()]
      .filter((service) => ![ServiceName.Gluster, ServiceName.Afp].includes(service))
      .map((service) => [serviceNames.get(service), '', '', 'edit']);
    const expectedRows = [['Name', 'Running', 'Start Automatically', ''], ...expectedData];

    expect(cells).toEqual(expectedRows);
  });

  it('should redirect to configure service page', async () => {
    const editButton = await loader.getHarness(MatButtonHarness.with({ text: 'edit' }));
    await editButton.click();

    expect(spectator.inject(Router).navigate).toHaveBeenCalledWith(['/services', 'dynamicdns']);
  });

  it('should check service state changes', async () => {
    const slideToggle = await loader.getHarness(MatSlideToggleHarness);
    await slideToggle.toggle();

    expect(await slideToggle.isChecked()).toBeTruthy();
    expect(ws.call).toHaveBeenCalledWith('service.start', ['dynamicdns']);
  });

  it('should check service autostart changes', async () => {
    const checkbox = await loader.getHarness(MatCheckboxHarness);
    await checkbox.check();

    expect(await checkbox.isChecked()).toBeTruthy();
    expect(ws.call).toHaveBeenCalledWith('service.update', [0, { enable: true }]);
  });
});
