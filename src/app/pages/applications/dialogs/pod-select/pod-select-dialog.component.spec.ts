import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { fakeAsync } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { MockWebsocketService } from 'app/core/testing/classes/mock-websocket.service';
import { mockCall, mockWebsocket } from 'app/core/testing/utils/mock-websocket.utils';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { IxFormHarness } from 'app/modules/ix-forms/testing/ix-form.harness';
import { AppLoaderModule } from 'app/modules/loader/app-loader.module';
import { PodSelectDialogComponent } from 'app/pages/applications/dialogs/pod-select/pod-select-dialog.component';
import { PodSelectDialogType } from 'app/pages/applications/enums/pod-select-dialog.enum';

describe('PodSelectDialogComponent', () => {
  let spectator: Spectator<PodSelectDialogComponent>;
  let loader: HarnessLoader;
  let form: IxFormHarness;
  const createComponent = createComponentFactory({
    component: PodSelectDialogComponent,
    imports: [
      AppLoaderModule,
      ReactiveFormsModule,
      IxFormsModule,
    ],
    providers: [
      mockProvider(MatDialogRef),
      mockProvider(Router),
      mockWebsocket([
        mockCall('chart.release.pod_console_choices', {
          pod1: ['container11', 'container12', 'container13'],
          pod2: ['container21', 'container22'],
        }),
      ]),
    ],
  });

  describe('dialog type is Shell', () => {
    beforeEach(async () => {
      spectator = createComponent({
        providers: [
          {
            provide: MAT_DIALOG_DATA,
            useValue: {
              appName: 'app_name',
              type: PodSelectDialogType.Shell,
            },
          },
        ],
      });
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      form = await loader.getHarness(IxFormHarness);
    });

    it('redirects to Shell page when Choose is pressed', async () => {
      await form.fillForm({ Pods: 'pod2' });
      expect(await form.getValues()).toEqual({
        Pods: 'pod2',
        Containers: 'container21',
        Commands: '/bin/sh',
      });

      const chooseButton = await loader.getHarness(MatButtonHarness.with({ text: 'Choose' }));
      await chooseButton.click();
      expect(spectator.inject(Router).navigate).toHaveBeenCalledWith(['/apps/1/shell/', 'app_name', 'pod2', '/bin/sh']);
      expect(spectator.inject(MatDialogRef).close).toHaveBeenCalled();
    });
  });

  describe('dialog type is Logs', () => {
    beforeEach(async () => {
      spectator = createComponent({
        providers: [
          {
            provide: MAT_DIALOG_DATA,
            useValue: {
              appName: 'app_name',
              type: PodSelectDialogType.Logs,
            },
          },
        ],
      });
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      form = await loader.getHarness(IxFormHarness);
    });

    it('redirects to Logs page when Choose is pressed', async () => {
      await form.fillForm({ Pods: 'pod2' });
      expect(await form.getValues()).toEqual({
        Pods: 'pod2',
        Containers: 'container21',
        'Tail Lines': '500',
      });

      const chooseButton = await loader.getHarness(MatButtonHarness.with({ text: 'Choose' }));
      await chooseButton.click();
      expect(spectator.inject(Router).navigate).toHaveBeenCalledWith(['/apps/1/logs/', 'app_name', 'pod2', 'container21', '500']);
      expect(spectator.inject(MatDialogRef).close).toHaveBeenCalled();
    });

    it('warning dialog should be displayed if there are no pods', () => {
      const ws = spectator.inject(MockWebsocketService);
      ws.mockCall('chart.release.pod_console_choices', {});
      spectator.component.ngOnInit();
      spectator.detectChanges();
      const dialogContent = spectator.query('.mat-dialog-content ');
      expect(dialogContent).toHaveText('At least one pool must be available to use apps');
    });
  });

  describe('dialog type is PodLogs', () => {
    const mockCustomSubmit = jest.fn();
    const objSpy = {
      type: PodSelectDialogType.PodLogs,
      customSubmit: (dialog: PodSelectDialogComponent) => mockCustomSubmit(dialog),
      afterDialogInit: () => {},
    };
    const apps = [{ label: 'nextcloud-app1', value: 'nextcloud-app1' }, { label: 'nextcloud-app2', value: 'nextcloud-app2' }];
    const pods = [{ label: 'nextcloud-pod1', value: 'nextcloud-pod1' }, { label: 'nextcloud-pod2', value: 'nextcloud-pod2' }];
    const containers = [{ label: 'nextcloud-container1', value: 'nextcloud-container1' }, { label: 'nextcloud-container2', value: 'nextcloud-container2' }];
    const fillForm = async (): Promise<any> => {
      spectator.component.apps$ = of(apps);
      spectator.component.pods$ = of(pods);
      spectator.component.containers$ = of(containers);
      await form.fillForm({
        Apps: apps[0].value,
        Pods: pods[0].value,
        Containers: containers[0].value,
        'Tail Lines': '501',
      });
    };
    beforeEach(async () => {
      spectator = createComponent({
        providers: [
          {
            provide: MAT_DIALOG_DATA,
            useValue: objSpy,
          },
        ],
      });
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      form = await loader.getHarness(IxFormHarness);
    });

    it('callbacks should be called if they passed in the data object', fakeAsync(async () => {
      jest.spyOn(objSpy, 'afterDialogInit').mockImplementation(() => fillForm());
      spectator.component.ngOnInit();
      spectator.tick();
      expect(await form.getValues()).toEqual({
        Apps: 'nextcloud-app1',
        Pods: 'nextcloud-pod1',
        Containers: 'nextcloud-container1',
        'Tail Lines': '501',
      });

      const chooseButton = await loader.getHarness(MatButtonHarness.with({ text: 'Choose' }));
      await chooseButton.click();
      expect(mockCustomSubmit).toHaveBeenCalledWith(spectator.component);
    }));
  });
});
