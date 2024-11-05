import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatDialog } from '@angular/material/dialog';
import { createRoutingFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { of } from 'rxjs';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { mockCall, mockWebSocket } from 'app/core/testing/utils/mock-websocket.utils';
import { DirectoryServiceState } from 'app/enums/directory-service-state.enum';
import { NfsProtocol } from 'app/enums/nfs-protocol.enum';
import { RdmaProtocolName } from 'app/enums/service-name.enum';
import { NfsConfig } from 'app/interfaces/nfs-config.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { SLIDE_IN_DATA } from 'app/modules/slide-ins/slide-in.token';
import {
  AddSpnDialogComponent,
} from 'app/pages/services/components/service-nfs/add-spn-dialog/add-spn-dialog.component';
import { ServiceNfsComponent } from 'app/pages/services/components/service-nfs/service-nfs.component';
import { SlideInService } from 'app/services/slide-in.service';
import { WebSocketService } from 'app/services/ws.service';
import { selectIsEnterprise } from 'app/store/system-info/system-info.selectors';

describe('ServiceNfsComponent', () => {
  let spectator: Spectator<ServiceNfsComponent>;
  let loader: HarnessLoader;
  let ws: WebSocketService;
  let form: IxFormHarness;
  const createComponent = createRoutingFactory({
    component: ServiceNfsComponent,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      mockAuth(),
      mockWebSocket([
        mockCall('nfs.config', {
          allow_nonroot: false,
          servers: 3,
          bindip: ['192.168.1.117', '192.168.1.118'],
          protocols: [NfsProtocol.V3, NfsProtocol.V4],
          v4_krb: true,
          v4_domain: 'nfs-domain.com',
          mountd_port: 123,
          rpcstatd_port: 124,
          rpclockd_port: 124,
          userd_manage_gids: false,
          rdma: false,
        } as NfsConfig),
        mockCall('nfs.bindip_choices', {
          '192.168.1.117': '192.168.1.117',
          '192.168.1.118': '192.168.1.118',
          '192.168.1.119': '192.168.1.119',
        }),
        mockCall('nfs.update'),
        mockCall('rdma.capable_protocols', [RdmaProtocolName.Nfs]),
        mockCall('directoryservices.get_state', {
          activedirectory: DirectoryServiceState.Healthy,
          ldap: DirectoryServiceState.Disabled,
        }),
      ]),
      provideMockStore({
        selectors: [
          {
            selector: selectIsEnterprise,
            value: false,
          },
        ],
      }),
      mockProvider(SlideInService),
      mockProvider(FormErrorHandlerService),
      mockProvider(DialogService, {
        confirm: jest.fn(() => of(true)),
      }),
      mockProvider(MatDialog, {
        open: jest.fn(() => ({
          afterClosed: () => of(),
        })),
      }),
      mockProvider(SlideInRef),
      { provide: SLIDE_IN_DATA, useValue: undefined },
      mockAuth(),
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    ws = spectator.inject(WebSocketService);
    form = await loader.getHarness(IxFormHarness);
  });
  it('shows current settings for NFS service when form is opened', async () => {
    const values = await form.getValues();

    expect(ws.call).toHaveBeenCalledWith('nfs.config');
    expect(values).toEqual({
      'Bind IP Addresses': ['192.168.1.117', '192.168.1.118'],
      'Calculate number of threads dynamically': false,
      'Specify number of threads manually': '3',
      'Enabled Protocols': ['NFSv3', 'NFSv4'],
      'NFSv4 DNS Domain': 'nfs-domain.com',
      'Require Kerberos for NFSv4': true,
      'mountd(8) bind port': '123',
      'rpc.lockd(8) bind port': '124',
      'rpc.statd(8) bind port': '124',
      'Enable NFS over RDMA': false,
      'Allow non-root mount': false,
      'Manage Groups Server-side': false,
    });
  });

  it('sends an update payload to websocket when form is saved', async () => {
    await form.fillForm({
      'Bind IP Addresses': ['192.168.1.119'],
      'Calculate number of threads dynamically': true,
      'Enabled Protocols': ['NFSv4'],
      'NFSv4 DNS Domain': 'new-nfs-domain.com',
      'Allow non-root mount': true,
      'Manage Groups Server-side': true,
      'mountd(8) bind port': 554,
      'rpc.statd(8) bind port': 562,
      'rpc.lockd(8) bind port': 510,
    });

    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    await saveButton.click();

    expect(ws.call).toHaveBeenCalledWith('nfs.update', [{
      allow_nonroot: true,
      bindip: ['192.168.1.119'],
      protocols: [NfsProtocol.V4],
      v4_domain: 'new-nfs-domain.com',
      v4_krb: true,
      mountd_port: 554,
      rpclockd_port: 510,
      rpcstatd_port: 562,
      servers: null,
      userd_manage_gids: true,
      rdma: false,
    }]);
  });

  it('disables NFSv4 specific fields when NFSv4 is not enabled', async () => {
    await form.fillForm({
      'Enabled Protocols': ['NFSv3'],
    });

    const disabledControls = await form.getDisabledState();
    expect(disabledControls).toMatchObject({
      'NFSv4 DNS Domain': true,
      'Require Kerberos for NFSv4': true,
    });
  });

  it('should open dialog form when add SPN button is pressed', async () => {
    await form.fillForm({
      'Require Kerberos for NFSv4': true,
    });

    const addSpnButton = await loader.getHarness(MatButtonHarness.with({ text: 'Add SPN' }));
    await addSpnButton.click();
    expect(spectator.inject(DialogService).confirm).toHaveBeenCalled();
    expect(spectator.inject(MatDialog).open).toHaveBeenCalledWith(AddSpnDialogComponent);
  });

  it('disables RDMA field unless it is an enterprise system with RDMA capable NIC', async () => {
    expect(await form.getDisabledState()).toMatchObject({
      'Enable NFS over RDMA': true,
    });

    const mockStore$ = spectator.inject(MockStore);
    mockStore$.overrideSelector(selectIsEnterprise, true);
    spectator.detectChanges();

    expect(await form.getDisabledState()).toMatchObject({
      'Enable NFS over RDMA': true,
    });
  });
});
