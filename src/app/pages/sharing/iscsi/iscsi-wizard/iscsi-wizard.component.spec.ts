import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatStepperModule } from '@angular/material/stepper';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { Store } from '@ngrx/store';
import { provideMockStore } from '@ngrx/store/testing';
import { of } from 'rxjs';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { LicenseFeature } from 'app/enums/license-feature.enum';
import { ServiceName } from 'app/enums/service-name.enum';
import { ServiceStatus } from 'app/enums/service-status.enum';
import { Dataset } from 'app/interfaces/dataset.interface';
import { IscsiGlobalSession } from 'app/interfaces/iscsi-global-config.interface';
import {
  IscsiAuthAccess, IscsiExtent, IscsiInitiatorGroup, IscsiPortal, IscsiTarget, IscsiTargetExtent,
} from 'app/interfaces/iscsi.interface';
import { Service } from 'app/interfaces/service.interface';
import { SystemInfo } from 'app/interfaces/system-info.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxListHarness } from 'app/modules/forms/ix-forms/components/ix-list/ix-list.harness';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { SLIDE_IN_DATA } from 'app/modules/slide-ins/slide-in.token';
import { IscsiWizardComponent } from 'app/pages/sharing/iscsi/iscsi-wizard/iscsi-wizard.component';
import { ExtentWizardStepComponent } from 'app/pages/sharing/iscsi/iscsi-wizard/steps/extent-wizard-step/extent-wizard-step.component';
import { ProtocolOptionsWizardStepComponent } from 'app/pages/sharing/iscsi/iscsi-wizard/steps/protocol-options-wizard-step/protocol-options-wizard-step.component';
import { TargetWizardStepComponent } from 'app/pages/sharing/iscsi/iscsi-wizard/steps/target-wizard-step/target-wizard-step.component';
import { SlideInService } from 'app/services/slide-in.service';
import { ApiService } from 'app/services/websocket/api.service';
import { AppState } from 'app/store';
import { checkIfServiceIsEnabled } from 'app/store/services/services.actions';
import { selectServices } from 'app/store/services/services.selectors';
import { selectSystemInfo } from 'app/store/system-info/system-info.selectors';

describe('IscsiWizardComponent', () => {
  let spectator: Spectator<IscsiWizardComponent>;
  let loader: HarnessLoader;
  let form: IxFormHarness;
  let store$: Store<AppState>;

  const createComponent = createComponentFactory({
    component: IscsiWizardComponent,
    imports: [
      ReactiveFormsModule,
      MatStepperModule,
      TargetWizardStepComponent,
      ExtentWizardStepComponent,
      ProtocolOptionsWizardStepComponent,
    ],
    providers: [
      mockAuth(),
      mockProvider(SlideInService),
      mockProvider(DialogService, {
        confirm: jest.fn(() => of(true)),
      }),
      mockApi([
        mockCall('fc.capable', true),
        mockCall('iscsi.global.sessions', [] as IscsiGlobalSession[]),
        mockCall('iscsi.extent.query', []),
        mockCall('iscsi.target.query', []),
        mockCall('iscsi.portal.query', []),
        mockCall('iscsi.auth.query', []),
        mockCall('iscsi.extent.disk_choices', {}),
        mockCall('iscsi.portal.listen_ip_choices', {
          '0.0.0.0': '0.0.0.0',
          '192.168.1.3': '192.168.1.3',
          '::': '::',
        }),
        mockCall('pool.dataset.create', { id: 'my pool/test_zvol' } as Dataset),
        mockCall('iscsi.extent.create', { id: 11 } as IscsiExtent),
        mockCall('iscsi.auth.create', { id: 12, tag: 12 } as IscsiAuthAccess),
        mockCall('iscsi.portal.create', { id: 13 } as IscsiPortal),
        mockCall('iscsi.initiator.create', { id: 14 } as IscsiInitiatorGroup),
        mockCall('iscsi.target.create', { id: 15 } as IscsiTarget),
        mockCall('iscsi.targetextent.create', { id: 16 } as IscsiTargetExtent),
      ]),
      provideMockStore({
        selectors: [
          {
            selector: selectServices,
            value: [{
              service: ServiceName.Iscsi,
              id: 4,
              enable: false,
              state: ServiceStatus.Stopped,
            } as Service],
          },
          {
            selector: selectSystemInfo,
            value: {
              version: 'TrueNAS-SCALE-22.12',
              license: {
                features: [LicenseFeature.FibreChannel],
              },
            } as SystemInfo,
          },
        ],
      }),
      mockProvider(SlideInRef),
      { provide: SLIDE_IN_DATA, useValue: undefined },
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();

    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    form = await loader.getHarness(IxFormHarness);
    store$ = spectator.inject(Store);
    jest.spyOn(store$, 'dispatch');
  });

  it('creates objects when wizard is submitted', fakeAsync(async () => {
    spectator.tick(100);

    await form.fillForm({
      Name: 'test-name',
      Device: 'Create New',
      'Pool/Dataset': '/mnt/new_pool',
      Size: 1024,
      Portal: 'Create New',
      Initiators: ['initiator1', 'initiator2'],
    });

    const addIpAddressButton = await loader.getHarness(IxListHarness.with({ label: 'IP Address' }));
    await addIpAddressButton.pressAddButton();

    await form.fillForm(
      {
        'IP Address': '::',
      },
    );

    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    await saveButton.click();
    tick();

    expect(spectator.inject(ApiService).call).toHaveBeenNthCalledWith(8, 'pool.dataset.create', [{
      name: 'new_pool/test-name',
      type: 'VOLUME',
      volsize: 1073741824,
    }]);

    expect(spectator.inject(ApiService).call).toHaveBeenNthCalledWith(9, 'iscsi.extent.create', [{
      blocksize: 512,
      disk: 'zvol/my+pool/test_zvol',
      insecure_tpc: true,
      name: 'test-name',
      rpm: 'SSD',
      type: 'DISK',
      xen: false,
    }]);

    expect(spectator.inject(ApiService).call).toHaveBeenNthCalledWith(10, 'iscsi.portal.create', [{
      comment: 'test-name',
      listen: [{ ip: '::' }],
    }]);

    expect(spectator.inject(ApiService).call).toHaveBeenNthCalledWith(11, 'iscsi.initiator.create', [{
      comment: 'test-name',
      initiators: ['initiator1', 'initiator2'],
    }]);

    expect(spectator.inject(ApiService).call).toHaveBeenNthCalledWith(12, 'iscsi.target.create', [{
      name: 'test-name',
      mode: 'ISCSI',
      groups: [{
        auth: null,
        authmethod: 'NONE',
        initiator: 14,
        portal: 13,
      }],
    }]);

    expect(spectator.inject(ApiService).call).toHaveBeenNthCalledWith(13, 'iscsi.targetextent.create', [{
      extent: 11,
      target: 15,
    }]);

    expect(store$.dispatch).toHaveBeenCalledWith(checkIfServiceIsEnabled({ serviceName: ServiceName.Iscsi }));

    expect(spectator.inject(SlideInRef).close).toHaveBeenCalled();
  }));
});
