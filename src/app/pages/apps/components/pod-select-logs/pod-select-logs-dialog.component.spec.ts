import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { MockWebsocketService } from 'app/core/testing/classes/mock-websocket.service';
import { mockCall, mockWebsocket } from 'app/core/testing/utils/mock-websocket.utils';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { IxFormHarness } from 'app/modules/ix-forms/testing/ix-form.harness';
import { AppLoaderModule } from 'app/modules/loader/app-loader.module';
import { PodSelectLogsDialogComponent } from 'app/pages/apps/components/pod-select-logs/pod-select-logs-dialog.component';
import { ApplicationsService } from 'app/pages/apps/services/applications.service';

describe('PodSelectLogsDialogComponent', () => {
  let mockCustomSubmit: jest.Mock;
  let loader: HarnessLoader;
  let form: IxFormHarness;
  let spectator: Spectator<PodSelectLogsDialogComponent>;
  const createComponent = createComponentFactory({
    component: PodSelectLogsDialogComponent,
    imports: [
      AppLoaderModule,
      ReactiveFormsModule,
      IxFormsModule,
    ],
    providers: [
      mockProvider(MatDialogRef),
      mockProvider(ApplicationsService, {
        getChartReleaseNames: () => of([{ name: 'chartRelease1' }, { name: 'chartRelease2' }, { name: 'chartRelease3' }]),
      }),
      mockWebsocket([
        mockCall('chart.release.pod_logs_choices', {
          pod1: ['container11', 'container12', 'container13'],
          pod2: ['container21', 'container22'],
        }),
      ]),
    ],
  });

  beforeEach(async () => {
    mockCustomSubmit = jest.fn();
    spectator = createComponent({
      providers: [
        {
          provide: MAT_DIALOG_DATA,
          useValue: {
            appName: 'chartRelease2',
            customSubmit: mockCustomSubmit,
          },
        },
      ],
    });
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    form = await loader.getHarness(IxFormHarness);
  });

  it('the form should be filled after loading', async () => {
    await form.fillForm({ Pods: 'pod2' });
    const valueLogsForm = await form.getValues();

    expect(valueLogsForm).toEqual({
      Apps: 'chartRelease2',
      Pods: 'pod2',
      Containers: 'container21',
      'Tail Lines': '500',
    });
  });

  it('the fields pod and containers should be filled in according to the selected application', async () => {
    const ws = spectator.inject(MockWebsocketService);
    ws.mockCall('chart.release.pod_logs_choices', {
      pod3: ['container31', 'container32', 'container33'],
      pod4: ['container41', 'container42', 'container43'],
    });
    await form.fillForm({ Apps: 'chartRelease3' });
    const valueLogsForm = await form.getValues();

    expect(valueLogsForm).toEqual({
      Apps: 'chartRelease3',
      Pods: 'pod3',
      Containers: 'container31',
      'Tail Lines': '500',
    });
  });

  it('customSubmit function should be called when Choose is pressed', async () => {
    await form.fillForm({ Pods: 'pod2' });
    const chooseButton = await loader.getHarness(MatButtonHarness.with({ text: 'Choose' }));
    await chooseButton.click();
    expect(mockCustomSubmit).toHaveBeenCalledWith({
      apps: 'chartRelease2',
      pods: 'pod2',
      containers: 'container21',
      tail_lines: 500,
    });
    expect(spectator.inject(MatDialogRef).close).toHaveBeenCalled();
  });

  it('warning dialog should be displayed if there are no pods', () => {
    const ws = spectator.inject(MockWebsocketService);
    ws.mockCall('chart.release.pod_logs_choices', {});
    spectator.component.ngOnInit();
    spectator.detectChanges();
    const dialogContent = spectator.query('.mat-mdc-dialog-content');
    expect(dialogContent).toHaveText('At least one pool must be available to use apps');
  });
});
