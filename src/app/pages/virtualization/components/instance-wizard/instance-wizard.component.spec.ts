import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import {
  createRoutingFactory,
  mockProvider,
  SpectatorRouting,
} from '@ngneat/spectator/jest';
import { MockComponent } from 'ng-mocks';
import { Observable, of } from 'rxjs';
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
import { InstanceWizardComponent } from 'app/pages/virtualization/components/instance-wizard/instance-wizard.component';
import { VirtualizationImageWithId } from 'app/pages/virtualization/components/instance-wizard/select-image-dialog/select-image-dialog.component';
import { AuthService } from 'app/services/auth/auth.service';
import { WebSocketService } from 'app/services/ws.service';

describe('InstanceFormComponent', () => {
  let spectator: SpectatorRouting<InstanceWizardComponent>;
  let loader: HarnessLoader;
  let form: IxFormHarness;

  const createComponent = createRoutingFactory({
    component: InstanceWizardComponent,
    declarations: [
      MockComponent(PageHeaderComponent),
    ],
    providers: [
      mockProvider(AuthService, { hasRole: () => of(true) }),
      mockProvider(Router),
      mockWebSocket([
        mockCall('virt.instance.query', [{
          id: 'test',
          name: 'test',
          type: VirtualizationType.Container,
          autostart: false,
          cpu: 'Intel Xeon',
          memory: 2 * GiB,
        } as VirtualizationInstance]),
        mockCall('virt.instance.get_instance', {
          cpu: '1-3',
          memory: 2 * GiB,
          name: 'test',
        } as VirtualizationInstance),
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
      mockProvider(MatDialog, {
        open: jest.fn(() => ({
          afterClosed: () => of({
            id: 'almalinux/8/cloud',
            label: 'Almalinux 8 Cloud',
          } as VirtualizationImageWithId),
        })),
      }),
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    form = await loader.getHarness(IxFormHarness);
  });

  describe('Create instance', () => {
    it('opens SelectImageDialogComponent when Browse image button is pressed and show image label when image is selected', async () => {
      const browseButton = await loader.getHarness(MatButtonHarness.with({ text: 'Browse' }));
      await browseButton.click();

      expect(spectator.inject(MatDialog).open).toHaveBeenCalled();
      expect(await form.getValues()).toMatchObject({
        Image: 'Almalinux 8 Cloud',
      });
    });

    it('creates new instance when form is submitted', async () => {
      await form.fillForm({
        Name: 'new',
        Autostart: true,
        'CPU Configuration': '1-2',
        'Memory Size': '1 GiB',
      });

      const browseButton = await loader.getHarness(MatButtonHarness.with({ text: 'Browse' }));
      await browseButton.click();

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save Instance' }));
      await saveButton.click();

      expect(spectator.inject(WebSocketService).job).toHaveBeenCalledWith('virt.instance.create', [{
        name: 'new',
        autostart: true,
        cpu: '1-2',
        image: 'almalinux/8/cloud',
        memory: GiB,
      }]);
      expect(spectator.inject(DialogService).jobDialog).toHaveBeenCalled();
      expect(spectator.inject(SnackbarService).success).toHaveBeenCalled();
    });
  });

  describe('Edit instance', () => {
    it('loads instance data in edit mode and populates the form', async () => {
      spectator.component.editingInstanceId = 'test';
      spectator.component.ngOnInit();

      expect(await form.getValues()).toMatchObject({
        Autostart: false,
        'CPU Configuration': '1-3',
        'Memory Size': '2 GiB',
      });
    });

    it('updates an instance when form is submitted', async () => {
      spectator.component.editingInstanceId = 'test';
      spectator.component.ngOnInit();

      await form.fillForm({
        Autostart: true,
        'CPU Configuration': '2-5',
        'Memory Size': '1 GiB',
      });

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save Instance' }));
      await saveButton.click();

      expect(spectator.inject(WebSocketService).job).toHaveBeenCalledWith('virt.instance.update', ['test', {
        autostart: true,
        cpu: '2-5',
        memory: GiB,
        environment: null,
      }]);
      expect(spectator.inject(DialogService).jobDialog).toHaveBeenCalled();
      expect(spectator.inject(SnackbarService).success).toHaveBeenCalled();
    });
  });
});
