import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { Store } from '@ngrx/store';
import { provideMockStore } from '@ngrx/store/testing';
import { BehaviorSubject, of } from 'rxjs';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { mockCall, mockWebSocket } from 'app/core/testing/utils/mock-websocket.utils';
import { mockWindow } from 'app/core/testing/utils/mock-window.utils';
import { Certificate } from 'app/interfaces/certificate.interface';
import { SystemGeneralConfig } from 'app/interfaces/system-config.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import {
  WithManageCertificatesLinkComponent,
} from 'app/modules/forms/ix-forms/components/with-manage-certificates-link/with-manage-certificates-link.component';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { GuiFormComponent } from 'app/pages/system/general-settings/gui/gui-form/gui-form.component';
import { SystemGeneralService } from 'app/services/system-general.service';
import { ThemeService } from 'app/services/theme/theme.service';
import { WebSocketConnectionService } from 'app/services/websocket-connection.service';
import { WebSocketService } from 'app/services/ws.service';
import { themeChangedInGuiForm } from 'app/store/preferences/preferences.actions';
import { selectPreferences, selectTheme } from 'app/store/preferences/preferences.selectors';
import { selectGeneralConfig } from 'app/store/system-config/system-config.selectors';

describe('GuiFormComponent', () => {
  let spectator: Spectator<GuiFormComponent>;
  let loader: HarnessLoader;
  let ws: WebSocketService;

  const mockSystemGeneralConfig = {
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
      ReactiveFormsModule,
      WithManageCertificatesLinkComponent,
    ],
    providers: [
      DialogService,
      mockWebSocket([
        mockCall('system.general.update', mockSystemGeneralConfig),
        mockCall('system.general.ui_restart'),
      ]),
      mockProvider(SlideInRef, {
        slideInClosed$: of(),
      }),
      mockProvider(WebSocketConnectionService),
      mockProvider(DialogService, {
        confirm: jest.fn(() => of(true)),
      }),
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
          {
            selector: selectGeneralConfig,
            value: mockSystemGeneralConfig,
          },
          {
            selector: selectPreferences,
            value: {
              userTheme: 'ix-dark',
            },
          },
          {
            selector: selectTheme,
            value: 'ix-dark',
          },
        ],
      }),
      ThemeService,
      mockWindow({
        location: {
          replace: jest.fn(),
        },
        localStorage: {
          setItem: jest.fn(),
        },
        sessionStorage: {
          getItem: () => 'ix-dark',
          setItem: () => {},
        },
      }),
      mockAuth(),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    ws = spectator.inject(WebSocketService);
  });

  it('shows current values when form is being edited', async () => {
    const form = await loader.getHarness(IxFormHarness);
    const values = await form.getValues();

    expect(values).toEqual(
      {
        'GUI SSL Certificate': 'freenas_default',
        'HTTPS Protocols': ['TLSv1.2', 'TLSv1.3'],
        'Show Console Messages': false,
        Theme: 'iX Dark',
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

  it('shows confirm dialog if HTTPS redirect is enabled', async () => {
    const websocketManager = spectator.inject(WebSocketConnectionService);
    Object.defineProperty(websocketManager, 'isConnected$', {
      get: jest.fn(() => new BehaviorSubject(true)),
    });

    const form = await loader.getHarness(IxFormHarness);
    await form.fillForm({
      'Web Interface HTTP -> HTTPS Redirect': true,
    });

    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    await saveButton.click();

    const dialog = spectator.inject(DialogService);
    expect(dialog.confirm).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Enable HTTPS Redirect',
    }));
  });

  it('shows confirm dialog if service restart is needed and restarts it', async () => {
    const websocketManager = spectator.inject(WebSocketConnectionService);
    Object.defineProperty(websocketManager, 'isConnected$', {
      get: jest.fn(() => new BehaviorSubject(true)),
    });

    const form = await loader.getHarness(IxFormHarness);
    await form.fillForm({
      'Web Interface HTTP -> HTTPS Redirect': true,
    });

    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    await saveButton.click();

    const dialog = spectator.inject(DialogService);
    expect(dialog.confirm).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Restart Web Service',
    }));
    expect(ws.call).toHaveBeenCalledWith('system.general.ui_restart');
  });

  it('dispatches themeChangedInGuiForm when theme is changed', async () => {
    const store$ = spectator.inject(Store);
    jest.spyOn(store$, 'dispatch');

    const form = await loader.getHarness(IxFormHarness);
    await form.fillForm({
      Theme: 'Dracula',
    });

    expect(store$.dispatch).toHaveBeenCalledWith(themeChangedInGuiForm({ theme: 'dracula' }));
  });
});
