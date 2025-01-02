import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { FormsModule } from '@angular/forms';
import { MatSlideToggleHarness } from '@angular/material/slide-toggle/testing';
import { Router } from '@angular/router';
import {
  createComponentFactory, mockProvider, Spectator,
} from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { MockComponent } from 'ng-mocks';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { NavigateAndInteractService } from 'app/directives/navigate-and-interact/navigate-and-interact.service';
import { ServiceName, serviceNames } from 'app/enums/service-name.enum';
import { ServiceStatus } from 'app/enums/service-status.enum';
import { Service } from 'app/interfaces/service.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { SearchInput1Component } from 'app/modules/forms/search-input1/search-input1.component';
import { IxIconHarness } from 'app/modules/ix-icon/ix-icon.harness';
import { IxTableHarness } from 'app/modules/ix-table/components/ix-table/ix-table.harness';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';
import { ApiService } from 'app/modules/websocket/api.service';
import { ServiceFtpComponent } from 'app/pages/services/components/service-ftp/service-ftp.component';
import { ServiceNfsComponent } from 'app/pages/services/components/service-nfs/service-nfs.component';
import { ServiceSmartComponent } from 'app/pages/services/components/service-smart/service-smart.component';
import { ServiceSmbComponent } from 'app/pages/services/components/service-smb/service-smb.component';
import { ServiceSnmpComponent } from 'app/pages/services/components/service-snmp/service-snmp.component';
import { ServiceSshComponent } from 'app/pages/services/components/service-ssh/service-ssh.component';
import {
  ServiceStateColumnComponent,
} from 'app/pages/services/components/service-state-column/service-state-column.component';
import { ServiceUpsComponent } from 'app/pages/services/components/service-ups/service-ups.component';
import { ServicesComponent } from 'app/pages/services/services.component';
import {
  GlobalTargetConfigurationComponent,
} from 'app/pages/sharing/iscsi/global-target-configuration/global-target-configuration.component';
import { IscsiService } from 'app/services/iscsi.service';
import { OldSlideInService } from 'app/services/old-slide-in.service';
import { initialState } from 'app/store/services/services.reducer';
import { selectServices } from 'app/store/services/services.selectors';

const hiddenServices = [ServiceName.Gluster, ServiceName.Afp];
const fakeDataSource: Service[] = [...serviceNames.entries()]
  .filter(([serviceName]) => !hiddenServices.includes(serviceName))
  .map(([service], id) => {
    return {
      id,
      service,
      state: ServiceStatus.Stopped,
      enable: false,
    } as Service;
  });

describe('ServicesComponent', () => {
  let spectator: Spectator<ServicesComponent>;
  let loader: HarnessLoader;
  let api: ApiService;
  let table: IxTableHarness;

  const createComponent = createComponentFactory({
    component: ServicesComponent,
    imports: [
      FormsModule,
      MockComponent(PageHeaderComponent),
      SearchInput1Component,
    ],
    declarations: [
      ServiceStateColumnComponent,
    ],
    providers: [
      mockAuth(),
      mockApi([
        mockCall('service.update', 1),
        mockCall('service.start'),
        mockCall('service.stop'),
      ]),
      mockProvider(DialogService),
      mockProvider(OldSlideInService),
      mockProvider(IscsiService),
      mockProvider(NavigateAndInteractService),
      provideMockStore({
        initialState,
        selectors: [{
          selector: selectServices,
          value: fakeDataSource,
        }],
      }),
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    api = spectator.inject(ApiService);
    table = await loader.getHarness(IxTableHarness);
  });

  it('should show table rows', async () => {
    const expectedData = [...serviceNames.keys()]
      .filter((service) => !hiddenServices.includes(service))
      .map((service) => [serviceNames.get(service), '', '', '']);

    const expectedRows = [
      ['Name', 'Running', 'Start Automatically', ''],
      ...expectedData,
    ];

    const tableData = await table.getCellTexts();
    expect(tableData).toEqual(expectedRows);
  });

  describe('edit', () => {
    it('should open iSCSI global configuration form', async () => {
      const serviceIndex = fakeDataSource.findIndex((item) => item.service === ServiceName.Iscsi) + 1;
      const editButton = await table.getHarnessInCell(IxIconHarness.with({ name: 'edit' }), serviceIndex, 3);
      await editButton.click();

      expect(spectator.inject(OldSlideInService).open).toHaveBeenCalledWith(GlobalTargetConfigurationComponent);
    });

    it('should open FTP configuration when edit button is pressed', async () => {
      const serviceIndex = fakeDataSource.findIndex((item) => item.service === ServiceName.Ftp) + 1;
      const editButton = await table.getHarnessInCell(IxIconHarness.with({ name: 'edit' }), serviceIndex, 3);
      await editButton.click();

      expect(spectator.inject(OldSlideInService).open).toHaveBeenCalledWith(ServiceFtpComponent, { wide: true });
    });

    it('should open NFS configuration when edit button is pressed', async () => {
      const serviceIndex = fakeDataSource.findIndex((item) => item.service === ServiceName.Nfs) + 1;
      const editButton = await table.getHarnessInCell(IxIconHarness.with({ name: 'edit' }), serviceIndex, 3);
      await editButton.click();

      expect(spectator.inject(OldSlideInService).open).toHaveBeenCalledWith(ServiceNfsComponent, { wide: true });
    });

    it('should open SNMP configuration when edit button is pressed', async () => {
      const serviceIndex = fakeDataSource.findIndex((item) => item.service === ServiceName.Snmp) + 1;
      const editButton = await table.getHarnessInCell(IxIconHarness.with({ name: 'edit' }), serviceIndex, 3);
      await editButton.click();

      expect(spectator.inject(OldSlideInService).open).toHaveBeenCalledWith(ServiceSnmpComponent, { wide: true });
    });

    it('should open UPS configuration when edit button is pressed', async () => {
      const serviceIndex = fakeDataSource.findIndex((item) => item.service === ServiceName.Ups) + 1;
      const editButton = await table.getHarnessInCell(IxIconHarness.with({ name: 'edit' }), serviceIndex, 3);
      await editButton.click();

      expect(spectator.inject(OldSlideInService).open).toHaveBeenCalledWith(ServiceUpsComponent, { wide: true });
    });

    it('should open SSH configuration when edit button is pressed', async () => {
      const serviceIndex = fakeDataSource.findIndex((item) => item.service === ServiceName.Ssh) + 1;
      const editButton = await table.getHarnessInCell(IxIconHarness.with({ name: 'edit' }), serviceIndex, 3);
      await editButton.click();

      expect(spectator.inject(OldSlideInService).open).toHaveBeenCalledWith(ServiceSshComponent);
    });

    it('should open SMB configuration when edit button is pressed', async () => {
      const serviceIndex = fakeDataSource.findIndex((item) => item.service === ServiceName.Cifs) + 1;
      const editButton = await table.getHarnessInCell(IxIconHarness.with({ name: 'edit' }), serviceIndex, 3);
      await editButton.click();

      expect(spectator.inject(OldSlideInService).open).toHaveBeenCalledWith(ServiceSmbComponent);
    });

    it('should open S.M.A.R.T. configuration when edit button is pressed', async () => {
      const serviceIndex = fakeDataSource.findIndex((item) => item.service === ServiceName.Smart) + 1;
      const editButton = await table.getHarnessInCell(IxIconHarness.with({ name: 'edit' }), serviceIndex, 3);
      await editButton.click();

      expect(spectator.inject(OldSlideInService).open).toHaveBeenCalledWith(ServiceSmartComponent);
    });
  });

  describe('view sessions', () => {
    it('should navigate to view Sessions for SMB when Sessions button is pressed', async () => {
      const router = spectator.inject(Router);
      jest.spyOn(router, 'navigate').mockResolvedValue(true);

      const serviceIndex = fakeDataSource.findIndex((item) => item.service === ServiceName.Cifs) + 1;
      const sessionsButton = await table.getHarnessInCell(IxIconHarness.with({ name: 'list' }), serviceIndex, 3);
      await sessionsButton.click();

      expect(router.navigate).toHaveBeenCalledWith(['/sharing', 'smb', 'status', 'sessions']);
    });

    it('should navigate to view Sessions for NFS when Sessions button is pressed', async () => {
      const router = spectator.inject(Router);
      jest.spyOn(router, 'navigate').mockResolvedValue(true);

      const serviceIndex = fakeDataSource.findIndex((item) => item.service === ServiceName.Nfs) + 1;
      const sessionsButton = await table.getHarnessInCell(IxIconHarness.with({ name: 'list' }), serviceIndex, 3);
      await sessionsButton.click();

      expect(router.navigate).toHaveBeenCalledWith(['/sharing', 'nfs', 'sessions']);
    });
  });

  it('should change service enable state when slide is checked', async () => {
    const serviceIndex = fakeDataSource.findIndex((item) => item.service === ServiceName.Ftp) + 1;
    const toggle = await table.getHarnessInCell(MatSlideToggleHarness, serviceIndex, 1);

    expect(await toggle.isChecked()).toBe(false);

    await toggle.check();

    expect(api.call).toHaveBeenCalledWith('service.start', [ServiceName.Ftp, { silent: false }]);
  });

  it('should change service autostart state when checkbox is ticked', async () => {
    const toggle = await table.getHarnessInCell(MatSlideToggleHarness, 1, 2);

    expect(await toggle.isChecked()).toBe(false);

    await toggle.check();

    expect(api.call).toHaveBeenCalledWith('service.update', [0, { enable: true }]);
  });

  it('should show audit log icon for SMB service', async () => {
    const router = spectator.inject(Router);
    jest.spyOn(router, 'navigate').mockResolvedValue(true);

    const serviceIndex = fakeDataSource.findIndex((item) => item.service === ServiceName.Cifs) + 1;
    const logsButton = await table.getHarnessInCell(IxIconHarness.with({ name: 'receipt_long' }), serviceIndex, 3);

    await logsButton.click();

    expect(router.navigate).toHaveBeenCalledWith([
      '/system/audit/{"searchQuery":{"isBasicQuery":false,"filters":[["service","=","SMB"]]}}',
    ]);
  });
});
