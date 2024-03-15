import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { mockProvider, Spectator, createComponentFactory } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { of } from 'rxjs';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { mockCall, mockWebSocket } from 'app/core/testing/utils/mock-websocket.utils';
import { Preferences } from 'app/interfaces/preferences.interface';
import { IxDynamicFormModule } from 'app/modules/ix-dynamic-form/ix-dynamic-form.module';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { FormErrorHandlerService } from 'app/modules/ix-forms/services/form-error-handler.service';
import { ReportsGlobalControlsComponent } from 'app/pages/reports-dashboard/components/reports-global-controls/reports-global-controls.component';
import { ReportTab, ReportType } from 'app/pages/reports-dashboard/interfaces/report-tab.interface';
import { ReportsService } from 'app/pages/reports-dashboard/reports.service';
import { WebSocketService } from 'app/services/ws.service';
import { selectPreferences } from 'app/store/preferences/preferences.selectors';

describe('ReportsGlobalControlsComponent', () => {
  let spectator: Spectator<ReportsGlobalControlsComponent>;
  let loader: HarnessLoader;

  const createComponent = createComponentFactory({
    component: ReportsGlobalControlsComponent,
    imports: [
      IxFormsModule,
      IxDynamicFormModule,
      ReactiveFormsModule,
    ],
    providers: [
      mockWebSocket([
        mockCall('disk.query', []),
        mockCall('disk.temperatures'),
        mockCall('reporting.netdataweb_generate_password'),
        mockCall('reporting.netdata_graphs', []),
      ]),
      mockAuth(),
      mockProvider(FormErrorHandlerService),
      mockProvider(ReportsService, {
        getReportTabs: () => ([({ value: ReportType.System, label: 'system' } as ReportTab)] as ReportTab[]),
        getReportGraphs: () => of([]),
      }),
      provideMockStore({
        selectors: [
          {
            selector: selectPreferences,
            value: {
              autoRefreshReports: false,
            } as Preferences,
          },
        ],
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('click netdata button', async () => {
    const netdataButton = await loader.getHarness(MatButtonHarness.with({ text: 'Netdata' }));

    await netdataButton.click();

    expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith('reporting.netdataweb_generate_password', []);
  });
});
