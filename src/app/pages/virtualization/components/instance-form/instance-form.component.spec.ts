import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { Router } from '@angular/router';
import {
  createRoutingFactory,
  mockProvider,
  SpectatorRouting,
} from '@ngneat/spectator/jest';
import { MockComponent } from 'ng-mocks';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { GiB } from 'app/constants/bytes.constant';
import { fakeSuccessfulJob } from 'app/core/testing/utils/fake-job.utils';
import { mockCall, mockJob, mockWebSocket } from 'app/core/testing/utils/mock-websocket.utils';
import { VirtualizationType } from 'app/enums/virtualization.enum';
import { Job } from 'app/interfaces/job.interface';
import { VirtualizationInstance } from 'app/interfaces/virtualization.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { InstanceFormComponent } from 'app/pages/virtualization/components/instance-form/instance-form.component';
import { WebSocketService } from 'app/services/ws.service';

describe('InstanceFormComponent', () => {
  let spectator: SpectatorRouting<InstanceFormComponent>;
  let loader: HarnessLoader;
  let form: IxFormHarness;
  const createComponent = createRoutingFactory({
    component: InstanceFormComponent,
    declarations: [
      MockComponent(PageHeaderComponent),
    ],
    providers: [
      mockWebSocket([
        mockCall('virt.instance.query', [{
          id: 'test',
          name: 'test',
          type: VirtualizationType.Container,
          autostart: false,
          cpu: 'Intel Xeon',
          memory: 2 * GiB,
        } as VirtualizationInstance]),
        mockJob('virt.instance.create', fakeSuccessfulJob({ id: 'new' } as VirtualizationInstance)),
        mockJob('virt.instance.update', fakeSuccessfulJob({ id: 'test' } as VirtualizationInstance)),
      ]),
      mockProvider(SnackbarService),
      mockProvider(DialogService, {
        jobDialog: jest.fn((request$: Observable<Job>) => ({
          afterClosed: () => request$.pipe(
            map((job) => job.result),
          ),
        })),
      }),
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    form = await loader.getHarness(IxFormHarness);
  });

  describe('editing existing instance', () => {
    it('loads existing instance using router params and sets form values', async () => {
      spectator.setRouteParam('id', 'test');
      spectator.component.ngOnInit();

      expect(spectator.inject(WebSocketService).call)
        .toHaveBeenCalledWith('virt.instance.query', [[['id', '=', 'test']]]);

      expect(await form.getValues()).toEqual({
        Name: 'test',
        Autostart: false,
        CPU: 'Intel Xeon',
        Image: 'almalinux/8/cloud',
        'Memory Size': '2 GiB',
      });
    });

    it('updates existing instance when form is submitted', async () => {
      spectator.setRouteParam('id', 'test');
      spectator.component.ngOnInit();

      await form.fillForm({
        'Memory Size': '3 GiB',
      });

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save Instance' }));
      await saveButton.click();

      expect(spectator.inject(WebSocketService).job).toHaveBeenCalledWith('virt.instance.update', ['test', {
        cpu: 'Intel Xeon',
        memory: 3 * GiB,
      }]);
      expect(spectator.inject(DialogService).jobDialog).toHaveBeenCalled();
      expect(spectator.inject(SnackbarService).success).toHaveBeenCalled();
      expect(spectator.inject(Router).navigate).toHaveBeenCalledWith(['/virtualization/instance', 'test']);
    });
  });

  describe('creating a new instance', () => {
    it('creates new instance when form is submitted', async () => {
      await form.fillForm({
        Name: 'new',
        Autostart: true,
        CPU: 'Intel Xeon',
        'Memory Size': '1 GiB',
      });

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save Instance' }));
      await saveButton.click();

      expect(spectator.inject(WebSocketService).job).toHaveBeenCalledWith('virt.instance.create', [{
        name: 'new',
        autostart: true,
        cpu: 'Intel Xeon',
        image: 'almalinux/8/cloud',
        memory: GiB,
      }]);
      expect(spectator.inject(DialogService).jobDialog).toHaveBeenCalled();
      expect(spectator.inject(SnackbarService).success).toHaveBeenCalled();
      expect(spectator.inject(Router).navigate).toHaveBeenCalledWith(['/virtualization/instance', 'new']);
    });
  });
});
