import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { mockCall, mockJob, mockWebsocket } from 'app/core/testing/utils/mock-websocket.utils';
import { ContainerConfig } from 'app/interfaces/container-config.interface';
import { KubernetesConfig } from 'app/interfaces/kubernetes-config.interface';
import { NetworkInterface } from 'app/interfaces/network-interface.interface';
import { ApplicationsService } from 'app/pages/applications/applications.service';
import { KubernetesSettingsComponent } from 'app/pages/applications/kubernetes-settings/kubernetes-settings.component';
import { IxFormsModule } from 'app/pages/common/ix-forms/ix-forms.module';
import { FormErrorHandlerService } from 'app/pages/common/ix-forms/services/form-error-handler.service';
import { IxFormHarness } from 'app/pages/common/ix-forms/testing/ix-form.harness';
import { AppLoaderService, DialogService, WebSocketService } from 'app/services';
import { IxSlideInService } from 'app/services/ix-slide-in.service';

describe('KubernetesSettingsComponent', () => {
  let spectator: Spectator<KubernetesSettingsComponent>;
  let loader: HarnessLoader;
  let ws: WebSocketService;
  const createComponent = createComponentFactory({
    component: KubernetesSettingsComponent,
    imports: [
      IxFormsModule,
      ReactiveFormsModule,
    ],
    providers: [
      mockWebsocket([
        mockCall('kubernetes.config', {
          node_ip: '10.123.45.67',
          route_v4_interface: 'enp0s7',
          route_v4_gateway: '10.123.45.1',
          configure_gpus: true,
          cluster_cidr: '172.16.0.0/16',
          service_cidr: '172.17.0.0/16',
          cluster_dns_ip: '172.17.0.1',
        } as KubernetesConfig),
        mockJob('kubernetes.update'),
      ]),
      mockProvider(ApplicationsService, {
        getContainerConfig: jest.fn(() => of({
          enable_image_updates: true,
        } as ContainerConfig)),
        getBindIpChoices: () => of({
          '10.123.45.67': '10.123.45.67',
          '10.123.45.11': '10.123.45.11',
        }),
        getInterfaces: () => of([
          { name: 'enp0s7' },
          { name: 'enp0s8' },
        ] as NetworkInterface[]),
      }),
      mockProvider(DialogService, {
        confirm: jest.fn(() => of(true)),
      }),
      mockProvider(AppLoaderService),
      mockProvider(IxSlideInService),
      mockProvider(FormErrorHandlerService),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    ws = spectator.inject(WebSocketService);
  });

  it('loads current config and shows values in the form', async () => {
    const form = await loader.getHarness(IxFormHarness);
    const values = await form.getValues();

    expect(ws.call).toHaveBeenCalledWith('kubernetes.config');
    expect(spectator.inject(ApplicationsService).getContainerConfig).toHaveBeenCalled();
    expect(values).toEqual({
      'Node IP': '10.123.45.67',
      'Route v4 Interface': 'enp0s7',
      'Route v4 Gateway': '10.123.45.1',
      'Enable Container Image Updates': true,
      'Enable GPU support': true,
      'Cluster CIDR': '172.16.0.0/16',
      'Service CIDR': '172.17.0.0/16',
      'Cluster DNS IP': '172.17.0.1',
    });
  });

  it('saves updated config without warning when basic settings are updated', async () => {
    const form = await loader.getHarness(IxFormHarness);
    await form.fillForm({
      'Node IP': '10.123.45.11',
      'Route v4 Interface': 'enp0s8',
      'Route v4 Gateway': '10.123.45.13',
      'Enable Container Image Updates': false,
      'Enable GPU support': false,
    });

    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    await saveButton.click();

    expect(spectator.inject(DialogService).confirm).not.toHaveBeenCalledWith();
    expect(ws.job).toHaveBeenCalledWith('kubernetes.update', [{
      node_ip: '10.123.45.11',
      route_v4_interface: 'enp0s8',
      route_v4_gateway: '10.123.45.13',
      configure_gpus: false,
      cluster_cidr: '172.16.0.0/16',
      service_cidr: '172.17.0.0/16',
      cluster_dns_ip: '172.17.0.1',
    }]);
    expect(spectator.inject(ApplicationsService).updateContainerConfig).toHaveBeenCalledWith(false);
  });

  it('shows warning and saves config when settings requiring re-initialization are changed', async () => {
    const form = await loader.getHarness(IxFormHarness);
    await form.fillForm({
      'Enable GPU support': false,
      'Cluster CIDR': '172.16.1.0/16',
      'Service CIDR': '172.17.1.0/16',
      'Cluster DNS IP': '172.17.1.1',
    });

    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    await saveButton.click();

    expect(spectator.inject(DialogService).confirm).toHaveBeenCalled();
    expect(ws.job).toHaveBeenCalledWith('kubernetes.update', [{
      node_ip: '10.123.45.67',
      route_v4_interface: 'enp0s7',
      route_v4_gateway: '10.123.45.1',
      configure_gpus: false,
      cluster_cidr: '172.16.1.0/16',
      service_cidr: '172.17.1.0/16',
      cluster_dns_ip: '172.17.1.1',
    }]);
  });
});
