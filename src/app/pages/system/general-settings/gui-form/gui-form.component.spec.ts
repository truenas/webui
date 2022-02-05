import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatDialog } from '@angular/material/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { of } from 'rxjs';
import { mockCall, mockWebsocket } from 'app/core/testing/utils/mock-websocket.utils';
import { Certificate } from 'app/interfaces/certificate.interface';
import { SystemGeneralConfig } from 'app/interfaces/system-config.interface';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { FormErrorHandlerService } from 'app/modules/ix-forms/services/form-error-handler.service';
import { IxFormHarness } from 'app/modules/ix-forms/testing/ix-form.harness';
import { ConfirmDialogComponent } from 'app/pages/common/confirm-dialog/confirm-dialog.component';
import { GuiFormComponent } from 'app/pages/system/general-settings/gui-form/gui-form.component';
import { WebSocketService, SystemGeneralService, DialogService } from 'app/services';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { selectGeneralConfig } from 'app/store/system-config/system-config.selectors';

describe('GuiFormComponent', () => {
  let spectator: Spectator<GuiFormComponent>;
  let loader: HarnessLoader;
  let ws: WebSocketService;
  let matDialog: MatDialog;

  const mockSystemGeneralConfig = {
    crash_reporting: true,
    usage_collection: false,
    ui_address: [
      '0.0.0.0',
    ],
    ui_v6address: [
      '::',
    ],
    ui_port: 80,
    ui_httpsport: 443,
    ui_httpsredirect: false,
    ui_httpsprotocols: [
      'TLSv1.2',
      'TLSv1.3',
    ],
    ui_consolemsg: false,
    ui_certificate: {
      id: 1,
    } as Certificate,
  } as SystemGeneralConfig;

  const createComponent = createComponentFactory({
    component: GuiFormComponent,
    imports: [
      IxFormsModule,
      ReactiveFormsModule,
    ],
    providers: [
      DialogService,
      mockWebsocket([
        mockCall('system.general.update', mockSystemGeneralConfig),
        mockCall('system.general.ui_restart'),
      ]),
      mockProvider(IxSlideInService),
      mockProvider(SystemGeneralService, {
        uiCertificateOptions: () => of({ 1: 'freenas_default' }),
        ipChoicesv4: () => of({ '0.0.0.0': '0.0.0.0' }),
        ipChoicesv6: () => of({ '::': '::' }),
        uiHttpsProtocolsOptions: () => of({
          TLSv1: 'TLSv1',
          'TLSv1.1': 'TLSv1.1',
          'TLSv1.2': 'TLSv1.2',
          'TLSv1.3': 'TLSv1.3',
        }),
      }),
      mockProvider(FormErrorHandlerService),
      provideMockStore({
        selectors: [
          { selector: selectGeneralConfig, value: mockSystemGeneralConfig },
        ],
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    ws = spectator.inject(WebSocketService);
    matDialog = spectator.inject(MatDialog);
    jest.spyOn(matDialog, 'open').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('shows current values when form is being edited', async () => {
    const form = await loader.getHarness(IxFormHarness);
    const values = await form.getValues();

    expect(values).toEqual(
      {
        'Crash reporting': true,
        'GUI SSL Certificate': 'freenas_default',
        'HTTPS Protocols': ['TLSv1.2', 'TLSv1.3'],
        'Show Console Messages': false,
        'Usage collection': false,
        'Web Interface HTTP -> HTTPS Redirect': false,
        'Web Interface HTTP Port': '80',
        'Web Interface HTTPS Port': '443',
        'Web Interface IPv4 Address': ['0.0.0.0'],
        'Web Interface IPv6 Address': ['::'],
      },
    );
  });

  it('sends an update payload to websocket and closes modal when save is pressed', async () => {
    const form = await loader.getHarness(IxFormHarness);
    await form.fillForm({
      'Show Console Messages': true,
      'Usage collection': true,
    });

    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    await saveButton.click();

    expect(ws.call).toHaveBeenCalledWith('system.general.update', [
      {
        ...mockSystemGeneralConfig,
        ui_certificate: 1,
        ui_consolemsg: true,
        usage_collection: true,
      },
    ]);
  });

  it('shows confirm dialog if service restart is needed', async () => {
    const form = await loader.getHarness(IxFormHarness);
    await form.fillForm({
      'Web Interface HTTP -> HTTPS Redirect': true,
    });

    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    await saveButton.click();

    expect(matDialog.open).toHaveBeenCalledWith(
      ConfirmDialogComponent,
      {
        disableClose: false,
      },
    );
  });
});
