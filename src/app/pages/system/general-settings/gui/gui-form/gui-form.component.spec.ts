import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { TnCheckboxHarness, TnInputHarness, TnSelectHarness } from '@truenas/ui-components';
import { BehaviorSubject, of } from 'rxjs';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { mockWindow } from 'app/core/testing/utils/mock-window.utils';
import { SystemGeneralConfig } from 'app/interfaces/system-config.interface';
import { SystemSecurityConfig } from 'app/interfaces/system-security-config.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import {
  WithManageCertificatesLinkComponent,
} from 'app/modules/forms/ix-forms/components/with-manage-certificates-link/with-manage-certificates-link.component';
import { ixFormTestingProviders } from 'app/modules/forms/ix-forms/testing/ix-form-testing.helpers';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { ApiService } from 'app/modules/websocket/api.service';
import { WebSocketHandlerService } from 'app/modules/websocket/websocket-handler.service';
import { GuiFormComponent } from 'app/pages/system/general-settings/gui/gui-form/gui-form.component';
import { SystemGeneralService } from 'app/services/system-general.service';
import { WebSocketStatusService } from 'app/services/websocket-status.service';
import { selectGeneralConfig } from 'app/store/system-config/system-config.selectors';

describe('GuiFormComponent', () => {
  let spectator: Spectator<GuiFormComponent>;
  let loader: HarnessLoader;
  let api: ApiService;

  const getInput = (name: string): Promise<TnInputHarness> => loader.getHarness(
    TnInputHarness.with({ selector: `[formControlName="${name}"]` }),
  );
  const getSelect = (name: string): Promise<TnSelectHarness> => loader.getHarness(
    TnSelectHarness.with({ selector: `[formControlName="${name}"]` }),
  );
  const getCheckbox = (name: string): Promise<TnCheckboxHarness> => loader.getHarness(
    TnCheckboxHarness.with({ selector: `[formControlName="${name}"]` }),
  );

  const mockSystemGeneralConfig = {
    usage_collection: false,
    ui_address: ['0.0.0.0'],
    ui_v6address: ['::'],
    ui_port: 80,
    ui_httpsport: 443,
    ui_httpsredirect: false,
    ui_httpsprotocols: ['TLSv1.2', 'TLSv1.3'],
    ui_consolemsg: false,
    ui_certificate: 1,
  } as SystemGeneralConfig;

  const slideInRef: SlideInRef<undefined, unknown> = {
    close: jest.fn(),
    requireConfirmationWhen: jest.fn(),
    getData: jest.fn((): undefined => undefined),
  };

  const createComponent = createComponentFactory({
    component: GuiFormComponent,
    imports: [
      ReactiveFormsModule,
      WithManageCertificatesLinkComponent,
    ],
    providers: [
      DialogService,
      mockApi([
        mockCall('system.general.update', mockSystemGeneralConfig),
        mockCall('system.general.ui_restart'),
        mockCall('system.security.config', {
          enable_gpos_stig: false,
        } as SystemSecurityConfig),
      ]),
      mockProvider(SlideInRef, slideInRef),
      mockProvider(WebSocketHandlerService),
      mockProvider(WebSocketStatusService),
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
      ...ixFormTestingProviders(),
      provideMockStore({
        selectors: [
          {
            selector: selectGeneralConfig,
            value: mockSystemGeneralConfig,
          },
        ],
      }),
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

  describe('is STIG mode OFF', () => {
    beforeEach(() => {
      spectator = createComponent();
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      api = spectator.inject(ApiService);
    });

    it('shows current values when form is being edited', async () => {
      expect(await (await getSelect('ui_certificate')).getDisplayText()).toBe('freenas_default');
      expect(await (await getInput('ui_port')).getValue()).toBe('80');
      expect(await (await getInput('ui_httpsport')).getValue()).toBe('443');
      expect(await (await getCheckbox('ui_httpsredirect')).isChecked()).toBe(false);
      expect(await (await getCheckbox('usage_collection')).isChecked()).toBe(false);
      expect(await (await getCheckbox('ui_consolemsg')).isChecked()).toBe(false);
      expect(spectator.component.formGroup.value.ui_httpsprotocols).toEqual(['TLSv1.2', 'TLSv1.3']);
      expect(spectator.component.formGroup.value.ui_address).toEqual(['0.0.0.0']);
      expect(spectator.component.formGroup.value.ui_v6address).toEqual(['::']);
    });

    it('sends an update payload to websocket and closes modal when save is pressed', async () => {
      await (await getCheckbox('ui_consolemsg')).check();
      await (await getCheckbox('usage_collection')).check();

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      expect(api.call).toHaveBeenCalledWith('system.general.update', [
        {
          ...mockSystemGeneralConfig,
          ui_certificate: 1,
          ui_consolemsg: true,
          usage_collection: true,
        },
      ]);
    });

    it('shows confirm dialog if HTTPS redirect is enabled', async () => {
      const wsStatus = spectator.inject(WebSocketStatusService);
      Object.defineProperty(wsStatus, 'isConnected$', {
        get: jest.fn(() => new BehaviorSubject(true)),
      });

      await (await getCheckbox('ui_httpsredirect')).check();

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      const dialog = spectator.inject(DialogService);
      expect(dialog.confirm).toHaveBeenCalledWith(expect.objectContaining({
        title: 'Enable HTTPS Redirect',
      }));
    });

    it('shows confirm dialog if service restart is needed and restarts it', async () => {
      const wsStatus = spectator.inject(WebSocketStatusService);
      Object.defineProperty(wsStatus, 'isConnected$', {
        get: jest.fn(() => new BehaviorSubject(true)),
      });

      await (await getCheckbox('ui_httpsredirect')).check();

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      const dialog = spectator.inject(DialogService);
      expect(dialog.confirm).toHaveBeenCalledWith(expect.objectContaining({
        title: 'Restart Web Service',
      }));
      expect(api.call).toHaveBeenCalledWith('system.general.ui_restart');
    });
  });

  describe('is STIG mode ON', () => {
    beforeEach(() => {
      spectator = createComponent({
        providers: [
          mockProvider(ApiService, {
            call: jest.fn((method: string) => {
              if (method === 'system.security.config') {
                return of({ enable_gpos_stig: true });
              }
              return of(null);
            }),
          }),
        ],
      });
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      api = spectator.inject(ApiService);
    });

    it('disables usage_collection control when GPOS STIG is enabled', () => {
      const control = spectator.component.formGroup.controls.usage_collection;
      expect(control.disabled).toBe(true);
    });

    it('does not include usage_collection in update payload', async () => {
      await (await getCheckbox('ui_httpsredirect')).check();

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      const dialog = spectator.inject(DialogService);
      expect(dialog.confirm).toHaveBeenCalledWith(expect.not.objectContaining({
        title: 'Usage collection & UI error reporting',
      }));
    });
  });
});
