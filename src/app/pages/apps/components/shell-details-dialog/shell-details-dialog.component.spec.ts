import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { MockWebSocketService } from 'app/core/testing/classes/mock-websocket.service';
import { mockCall, mockWebSocket } from 'app/core/testing/utils/mock-websocket.utils';
import { PodSelectDialogType } from 'app/enums/pod-select-dialog.enum';
import { IxFormsModule } from 'app/modules/forms/ix-forms/ix-forms.module';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import { AppLoaderModule } from 'app/modules/loader/app-loader.module';
import { ShellDetailsDialogComponent } from 'app/pages/apps/components/shell-details-dialog/shell-details-dialog.component';

// TODO:
describe.skip('ShellDetailsDialogComponent', () => {
  let spectator: Spectator<ShellDetailsDialogComponent>;
  let loader: HarnessLoader;
  let form: IxFormHarness;
  let mockCustomSubmit: jest.Mock;
  const createComponent = createComponentFactory({
    component: ShellDetailsDialogComponent,
    imports: [
      AppLoaderModule,
      ReactiveFormsModule,
      IxFormsModule,
    ],
    providers: [
      mockProvider(MatDialogRef),
      mockWebSocket([
        mockCall('chart.release.pod_console_choices', {
          pod1: ['container11', 'container12', 'container13'],
          pod2: ['container21', 'container22'],
        }),
      ]),
    ],
  });

  describe('dialog type is Shell', () => {
    beforeEach(async () => {
      mockCustomSubmit = jest.fn();
      spectator = createComponent({
        providers: [
          {
            provide: MAT_DIALOG_DATA,
            useValue: {
              appName: 'app_name',
              type: PodSelectDialogType.Shell,
              containerImageKey: 'test.shell/pod1:7.0.11',
              customSubmit: mockCustomSubmit,
            },
          },
        ],
      });
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      form = await loader.getHarness(IxFormHarness);
    });

    it('finds best match pod key and preselects pod and container automatically', async () => {
      expect(await form.getValues()).toEqual({
        Pods: 'pod1',
        Containers: 'container11',
        Commands: '/bin/sh',
      });
    });

    it('the function should pass the value of the shell form to the relevant component when Choose is pressed', async () => {
      await form.fillForm({ Pods: 'pod2' });
      expect(await form.getValues()).toEqual({
        Pods: 'pod2',
        Containers: 'container21',
        Commands: '/bin/sh',
      });

      const chooseButton = await loader.getHarness(MatButtonHarness.with({ text: 'Choose' }));
      await chooseButton.click();
      expect(mockCustomSubmit).toHaveBeenCalledWith({
        command: '/bin/sh',
        containers: 'container21',
        pods: 'pod2',
      }, 'app_name');
      expect(spectator.inject(MatDialogRef).close).toHaveBeenCalled();
    });
  });

  describe('dialog type is Logs', () => {
    beforeEach(async () => {
      mockCustomSubmit = jest.fn();
      spectator = createComponent({
        providers: [
          {
            provide: MAT_DIALOG_DATA,
            useValue: {
              appName: 'app_name',
              containerImageKey: 'test.logs/pod1:7.0.11',
              type: PodSelectDialogType.Logs,
              customSubmit: mockCustomSubmit,
            },
          },
        ],
      });
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      form = await loader.getHarness(IxFormHarness);
    });

    it('finds best match pod key and preselects pod and container automatically', async () => {
      expect(await form.getValues()).toEqual({
        Pods: 'pod1',
        Containers: 'container11',
        'Tail Lines': '500',
      });
    });

    it('the function should pass the value of the logs form to the relevant component when Choose is pressed', async () => {
      await form.fillForm({ Pods: 'pod2' });
      expect(await form.getValues()).toEqual({
        Pods: 'pod2',
        Containers: 'container21',
        'Tail Lines': '500',
      });

      const chooseButton = await loader.getHarness(MatButtonHarness.with({ text: 'Choose' }));
      await chooseButton.click();
      expect(mockCustomSubmit).toHaveBeenCalledWith({
        tail_lines: 500,
        containers: 'container21',
        pods: 'pod2',
      }, 'app_name');
      expect(spectator.inject(MatDialogRef).close).toHaveBeenCalled();
    });

    it('warning dialog should be displayed if there are no pods', () => {
      const ws = spectator.inject(MockWebSocketService);
      ws.mockCall('chart.release.pod_console_choices', {});
      spectator.detectChanges();
      const dialogContent = spectator.query('.mat-mdc-dialog-content');
      expect(dialogContent).toHaveText('At least one pool must be available to use apps');
    });
  });
});
