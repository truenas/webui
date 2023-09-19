import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { fakeAsync, tick } from '@angular/core/testing';
import { FlexLayoutModule } from '@angular/flex-layout';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatStepperModule } from '@angular/material/stepper';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { mockCall, mockWebsocket } from 'app/core/testing/utils/mock-websocket.utils';
import { Dataset } from 'app/interfaces/dataset.interface';
import {
  IscsiAuthAccess, IscsiExtent, IscsiInitiatorGroup, IscsiPortal, IscsiTarget, IscsiTargetExtent,
} from 'app/interfaces/iscsi.interface';
import { IxSlideInRef } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in-ref';
import { SLIDE_IN_DATA } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in.token';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { IxFormHarness } from 'app/modules/ix-forms/testing/ix-form.harness';
import { IscsiWizardComponent } from 'app/pages/sharing/iscsi/iscsi-wizard/iscsi-wizard.component';
import { DeviceWizardStepComponent } from 'app/pages/sharing/iscsi/iscsi-wizard/steps/device-wizard-step/device-wizard-step.component';
import { InitiatorWizardStepComponent } from 'app/pages/sharing/iscsi/iscsi-wizard/steps/initiator-wizard-step/initiator-wizard-step.component';
import { PortalWizardStepComponent } from 'app/pages/sharing/iscsi/iscsi-wizard/steps/portal-wizard-step/portal-wizard-step.component';
import { DialogService } from 'app/services/dialog.service';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { WebSocketService } from 'app/services/ws.service';

describe('IscsiWizardComponent', () => {
  let spectator: Spectator<IscsiWizardComponent>;
  let loader: HarnessLoader;
  let form: IxFormHarness;

  const createComponent = createComponentFactory({
    component: IscsiWizardComponent,
    imports: [
      IxFormsModule,
      ReactiveFormsModule,
      FlexLayoutModule,
      MatStepperModule,
    ],
    declarations: [
      DeviceWizardStepComponent,
      PortalWizardStepComponent,
      InitiatorWizardStepComponent,
    ],
    providers: [
      mockProvider(IxSlideInService),
      mockProvider(DialogService),
      mockWebsocket([
        mockCall('iscsi.extent.query', []),
        mockCall('iscsi.target.query', []),
        mockCall('iscsi.portal.query', []),
        mockCall('iscsi.auth.query', []),
        mockCall('iscsi.extent.disk_choices', {}),
        mockCall('iscsi.portal.listen_ip_choices', {}),
        mockCall('pool.dataset.create', { id: 'my pool/test_zvol' } as Dataset),
        mockCall('iscsi.extent.create', { id: 11 } as IscsiExtent),
        mockCall('iscsi.auth.create', { id: 12, tag: 12 } as IscsiAuthAccess),
        mockCall('iscsi.portal.create', { id: 13 } as IscsiPortal),
        mockCall('iscsi.initiator.create', { id: 14 } as IscsiInitiatorGroup),
        mockCall('iscsi.target.create', { id: 15 } as IscsiTarget),
        mockCall('iscsi.targetextent.create', { id: 16 } as IscsiTargetExtent),
      ]),
      mockProvider(IxSlideInRef),
      { provide: SLIDE_IN_DATA, useValue: undefined },
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();

    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    form = await loader.getHarness(IxFormHarness);
  });

  it('creates objects when wizard is submitted', fakeAsync(async () => {
    await form.fillForm({
      Name: 'test-name',
      Device: 'Create New',
      'Pool/Dataset': '/mnt/new_pool',
      Size: 1024,
      Portal: 'Create New',
      Initiators: ['initiator1', 'initiator2'],
    });

    await form.fillForm({
      'Discovery Authentication Method': 'CHAP',
      'Discovery Authentication Group': 'Create New',
    });

    await form.fillForm({
      'Group ID': 1234,
      User: 'userName',
      Secret: '123456789qwerty',
      'Secret (Confirm)': '123456789qwerty',
    });

    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    await saveButton.click();
    tick();

    expect(spectator.inject(WebSocketService).call).toHaveBeenNthCalledWith(8, 'pool.dataset.create', [{
      name: 'new_pool/test-name',
      type: 'VOLUME',
      volsize: 1073741824,
    }]);

    expect(spectator.inject(WebSocketService).call).toHaveBeenNthCalledWith(9, 'iscsi.extent.create', [{
      blocksize: 512,
      disk: 'zvol/my+pool/test_zvol',
      insecure_tpc: true,
      name: 'test-name',
      rpm: 'SSD',
      type: 'DISK',
      xen: false,
    }]);

    expect(spectator.inject(WebSocketService).call).toHaveBeenNthCalledWith(10, 'iscsi.auth.create', [{
      secret: '123456789qwerty',
      tag: 1234,
      user: 'userName',
    }]);

    expect(spectator.inject(WebSocketService).call).toHaveBeenNthCalledWith(11, 'iscsi.portal.create', [{
      comment: 'test-name',
      discovery_authgroup: 12,
      discovery_authmethod: 'CHAP',
      listen: [],
    }]);

    expect(spectator.inject(WebSocketService).call).toHaveBeenNthCalledWith(12, 'iscsi.initiator.create', [{
      comment: 'test-name',
      initiators: ['initiator1', 'initiator2'],
    }]);

    expect(spectator.inject(WebSocketService).call).toHaveBeenNthCalledWith(13, 'iscsi.target.create', [{
      name: 'test-name',
      groups: [{
        auth: null,
        authmethod: 'NONE',
        initiator: 14,
        portal: 13,
      }],
    }]);

    expect(spectator.inject(WebSocketService).call).toHaveBeenNthCalledWith(14, 'iscsi.targetextent.create', [{
      extent: 11,
      target: 15,
    }]);

    expect(spectator.inject(IxSlideInRef).close).toHaveBeenCalled();
  }));
});
