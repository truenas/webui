import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { FormsModule } from '@angular/forms';
import {
  createComponentFactory, mockProvider, Spectator,
} from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import {
  TnSlideToggleHarness, TnTableHarness,
} from '@truenas/ui-components';
import { MockComponent } from 'ng-mocks';
import { of } from 'rxjs';
import { fakeSuccessfulJob } from 'app/core/testing/utils/fake-job.utils';
import { mockCall, mockApi, mockJob } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { NavigateAndHighlightService } from 'app/directives/navigate-and-interact/navigate-and-highlight.service';
import { serviceNames } from 'app/enums/service-name.enum';
import { ServiceStatus } from 'app/enums/service-status.enum';
import { FtpConfig } from 'app/interfaces/ftp-config.interface';
import { Service } from 'app/interfaces/service.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { BasicSearchComponent } from 'app/modules/forms/search-input/components/basic-search/basic-search.component';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';
import { FormSidePanelService } from 'app/modules/slide-ins/form-side-panel/form-side-panel.service';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { SlideInResult } from 'app/modules/slide-ins/slide-in-result';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { ServiceFtpComponent } from 'app/pages/services/components/service-ftp/service-ftp.component';
import { ServicesComponent } from 'app/pages/services/services.component';
import {
  GlobalTargetConfigurationComponent,
} from 'app/pages/sharing/iscsi/global-target-configuration/global-target-configuration.component';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';
import { FilesystemService } from 'app/services/filesystem.service';
import { IscsiService } from 'app/services/iscsi.service';
import { SystemGeneralService } from 'app/services/system-general.service';
import { initialState } from 'app/store/services/services.reducer';
import { selectServices } from 'app/store/services/services.selectors';

const fakeDataSource: Service[] = [...serviceNames.entries()]
  .map(([service], id) => {
    return {
      id,
      service,
      state: ServiceStatus.Stopped,
      enable: false,
    } as Service;
  });

describe('ServicesComponent', () => {
  let spectator: Spectator<ServicesComponent>;
  let loader: HarnessLoader;
  let api: ApiService;
  let table: TnTableHarness;

  const createComponent = createComponentFactory({
    component: ServicesComponent,
    imports: [
      FormsModule,
      MockComponent(PageHeaderComponent),
      BasicSearchComponent,
    ],
    providers: [
      mockAuth(),
      mockApi([
        mockCall('service.update', 1),
        mockJob('service.control', fakeSuccessfulJob()),
        // Loaded when the FTP config form is opened in the side panel.
        mockCall('ftp.config', {} as FtpConfig),
      ]),
      mockProvider(DialogService),
      mockProvider(SlideIn, {
        open: jest.fn(() => SlideInResult.empty()),
      }),
      mockProvider(FormSidePanelService, {
        open: jest.fn(() => SlideInResult.empty()),
      }),
      mockProvider(IscsiService),
      mockProvider(NavigateAndHighlightService),
      // Dependencies of the FTP config form (the form opened by the panel test).
      mockProvider(SystemGeneralService, {
        getCertificates: () => of([]),
      }),
      mockProvider(FilesystemService),
      mockProvider(FormErrorHandlerService),
      mockProvider(SnackbarService),
      mockProvider(ErrorHandlerService),
      provideMockStore({
        initialState,
        selectors: [{
          selector: selectServices,
          value: fakeDataSource,
        }],
      }),
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    api = spectator.inject(ApiService);
    table = await loader.getHarness(TnTableHarness);
  });

  it('shows a row per service with the expected columns', async () => {
    expect(await table.getHeaderTexts()).toEqual(['Name', 'Status', 'Start Automatically', '']);
    expect(await table.getRowCount()).toBe(fakeDataSource.length);
  });

  it('changes service autostart state when the toggle is switched on', async () => {
    const toggle = await loader.getHarness(TnSlideToggleHarness);

    expect(await toggle.isChecked()).toBe(false);

    await toggle.check();

    expect(api.call).toHaveBeenCalledWith('service.update', [0, { enable: true }]);
  });

  it('opens the iSCSI global configuration form via SlideIn', () => {
    spectator.click('[data-test="button-service-iscsitarget-edit-service"]');

    expect(spectator.inject(SlideIn).open).toHaveBeenCalledWith(GlobalTargetConfigurationComponent);
  });

  it('opens the matching config form in a side panel when a service is edited', () => {
    spectator.click('[data-test="button-service-ftp-edit-service"]');

    expect(spectator.inject(FormSidePanelService).open).toHaveBeenCalledWith(
      ServiceFtpComponent,
      { title: 'FTP', wide: true },
    );
    expect(spectator.inject(SlideIn).open).not.toHaveBeenCalled();
  });
});
