import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { createRoutingFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import {
  TnButtonHarness, TnCheckboxHarness, TnDialog, TnInputHarness, TnSelectHarness,
} from '@truenas/ui-components';
import { catchError, EMPTY, Observable, of } from 'rxjs';
import { failApiCall, mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { DirectoryServiceStatus, DirectoryServiceType } from 'app/enums/directory-services.enum';
import { NfsProtocol } from 'app/enums/nfs-protocol.enum';
import { RdmaProtocolName } from 'app/enums/service-name.enum';
import { NfsConfig } from 'app/interfaces/nfs-config.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { ixFormTestingProviders } from 'app/modules/forms/ix-forms/testing/ix-form-testing.helpers';
import { ApiService } from 'app/modules/websocket/api.service';
import {
  AddSpnDialog,
} from 'app/pages/services/components/service-nfs/add-spn-dialog/add-spn-dialog.component';
import { ServiceNfsComponent } from 'app/pages/services/components/service-nfs/service-nfs.component';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';
import { selectIsEnterprise } from 'app/store/system-info/system-info.selectors';

describe('ServiceNfsComponent', () => {
  let spectator: Spectator<ServiceNfsComponent>;
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

  const createComponent = createRoutingFactory({
    component: ServiceNfsComponent,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      mockAuth(),
      mockApi([
        mockCall('nfs.config', {
          allow_nonroot: false,
          servers: 3,
          bindip: ['192.168.1.117', '192.168.1.118'],
          protocols: [NfsProtocol.V3, NfsProtocol.V4],
          v4_krb: true,
          v4_domain: 'nfs-domain.com',
          mountd_port: 123,
          rpcstatd_port: 124,
          rpclockd_port: 124,
          userd_manage_gids: false,
          rdma: false,
        } as NfsConfig),
        mockCall('nfs.bindip_choices', {
          '192.168.1.117': '192.168.1.117',
          '192.168.1.118': '192.168.1.118',
          '192.168.1.119': '192.168.1.119',
        }),
        mockCall('nfs.update'),
        mockCall('rdma.capable_protocols', [RdmaProtocolName.Nfs]),
        mockCall('directoryservices.status', {
          status: DirectoryServiceStatus.Healthy,
          type: DirectoryServiceType.ActiveDirectory,
          status_msg: null,
        }),
      ]),
      provideMockStore({
        selectors: [
          {
            selector: selectIsEnterprise,
            value: false,
          },
        ],
      }),
      ...ixFormTestingProviders(),
      mockProvider(DialogService, {
        confirm: jest.fn(() => of(true)),
      }),
      mockProvider(TnDialog, {
        open: jest.fn(() => ({
          closed: of(),
        })),
      }),
      mockAuth(),
      // `mockAuth()` stubs `withErrorHandler` as a pass-through, which would let an erroring
      // enrichment call leak as an unhandled RxJS error. Restore the real shape: report, swallow.
      mockProvider(ErrorHandlerService, {
        showErrorModal: jest.fn(() => of(true)),
        withErrorHandler: <T>() => (source$: Observable<T>) => source$.pipe(catchError(() => EMPTY)),
      }),
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    api = spectator.inject(ApiService);
    await spectator.fixture.whenStable();
  });

  it('blocks Save when the initial config load fails', () => {
    expect(spectator.component.canSubmit()).toBe(true);

    const showErrorModal = jest.spyOn(spectator.inject(ErrorHandlerService), 'showErrorModal')
      .mockReturnValue(of(true));
    // Only `nfs.config` gates the form; the RDMA / directory-services enrichments fail soft (see
    // the test below).
    failApiCall(api, 'nfs.config');

    // A fresh instance rather than a second `ngOnInit()` on the one from `beforeEach`:
    // re-initialising an already-initialised form re-registers its valueChanges subscriptions,
    // so the assertion would hinge on double-init being harmless.
    const failed = TestBed.createComponent(ServiceNfsComponent);
    failed.detectChanges();

    expect(showErrorModal).toHaveBeenCalled();
    // `hasLoadFailed` is what the panel reads (for its banner) and what `<ix-form>`'s
    // extraDisabled is bound to; that binding blocking Save is covered in the ix-form spec.
    expect(failed.componentInstance.hasLoadFailed()).toBe(true);
    expect(failed.componentInstance.canSubmit()).toBe(false);
  });

  it('keeps the form usable when only an enrichment call fails', () => {
    // `directoryservices.status` only decides whether Add SPN is offered. Failing it must not
    // block Save over a form that holds the real configuration `nfs.config` returned.
    failApiCall(api, 'directoryservices.status');

    const loaded = TestBed.createComponent(ServiceNfsComponent);
    loaded.detectChanges();

    expect(api.call).toHaveBeenCalledWith('directoryservices.status');
    expect(loaded.componentInstance.hasLoadFailed()).toBe(false);
    expect(loaded.componentInstance.canSubmit()).toBe(true);
  });

  it('keeps rendering when the bind IP choices fail to load', async () => {
    // The choices reach the template through a `toSignal`, which latches an error and re-throws it
    // on every read — so a failure that isn't caught takes down the whole form render rather than
    // emptying one select. The addresses the config binds to still come from `nfs.config`.
    failApiCall(api, 'nfs.bindip_choices');

    const loaded = TestBed.createComponent(ServiceNfsComponent);
    loaded.detectChanges();
    await loaded.whenStable();

    expect(loaded.componentInstance.hasLoadFailed()).toBe(false);
    expect(loaded.componentInstance.canSubmit()).toBe(true);

    const bindIp = await TestbedHarnessEnvironment.loader(loaded)
      .getHarness(TnSelectHarness.with({ selector: '[formControlName="bindip"]' }));
    expect(await bindIp.getDisplayText()).toBe('192.168.1.117, 192.168.1.118');
  });

  // The Bind IP option list needs the addresses the config already selects; it takes them from this
  // load rather than issuing a second `nfs.config` of its own.
  it('reads nfs.config once', () => {
    const calls = (api.call as unknown as jest.Mock).mock.calls as [string][];

    expect(calls.filter(([method]) => method === 'nfs.config')).toHaveLength(1);
  });

  it('shows current settings for NFS service when form is opened', async () => {
    expect(api.call).toHaveBeenCalledWith('nfs.config');

    expect(await (await getSelect('bindip')).getDisplayText()).toBe('192.168.1.117, 192.168.1.118');
    expect(await (await getCheckbox('servers_auto')).isChecked()).toBe(false);
    expect(await (await getInput('servers')).getValue()).toBe('3');
    expect(await (await getSelect('protocols')).getDisplayText()).toBe('NFSv3, NFSv4');
    expect(await (await getInput('v4_domain')).getValue()).toBe('nfs-domain.com');
    expect(await (await getCheckbox('v4_krb')).isChecked()).toBe(true);
    expect(await (await getInput('mountd_port')).getValue()).toBe('123');
    expect(await (await getInput('rpcstatd_port')).getValue()).toBe('124');
    expect(await (await getInput('rpclockd_port')).getValue()).toBe('124');
    expect(await (await getCheckbox('allow_nonroot')).isChecked()).toBe(false);
    expect(await (await getCheckbox('userd_manage_gids')).isChecked()).toBe(false);
  });

  it('sends an update payload to websocket when form is saved', async () => {
    await (await getSelect('bindip')).selectOption('192.168.1.117');
    await (await getSelect('bindip')).selectOption('192.168.1.118');
    await (await getSelect('bindip')).selectOption('192.168.1.119');
    await (await getCheckbox('servers_auto')).check();
    await (await getSelect('protocols')).selectOption('NFSv3');
    await (await getInput('v4_domain')).setValue('new-nfs-domain.com');
    await (await getCheckbox('allow_nonroot')).check();
    await (await getCheckbox('userd_manage_gids')).check();
    await (await getInput('mountd_port')).setValue('554');
    await (await getInput('rpcstatd_port')).setValue('562');
    await (await getInput('rpclockd_port')).setValue('510');

    spectator.component.submit();

    expect(api.call).toHaveBeenCalledWith('nfs.update', [{
      allow_nonroot: true,
      bindip: ['192.168.1.119'],
      protocols: [NfsProtocol.V4],
      v4_domain: 'new-nfs-domain.com',
      v4_krb: true,
      mountd_port: 554,
      rpclockd_port: 510,
      rpcstatd_port: 562,
      servers: null,
      userd_manage_gids: true,
      rdma: false,
    }]);
  });

  it('disables NFSv4 specific fields when NFSv4 is not enabled', async () => {
    await (await getSelect('protocols')).selectOption('NFSv4');

    expect(await (await getInput('v4_domain')).isDisabled()).toBe(true);
    expect(await (await getCheckbox('v4_krb')).isDisabled()).toBe(true);
  });

  it('should open dialog form when add SPN button is pressed', async () => {
    const addSpnButton = await loader.getHarness(TnButtonHarness.with({ label: 'Add SPN' }));
    await addSpnButton.click();
    expect(spectator.inject(DialogService).confirm).toHaveBeenCalled();
    expect(spectator.inject(TnDialog).open).toHaveBeenCalledWith(AddSpnDialog);
    // Add SPN sits inside `<ix-form>`'s content, i.e. inside the `<form>` that binds `ngSubmit`.
    // `tn-button` renders `type="button"` by default, so the click must not also save the form.
    expect(api.call).not.toHaveBeenCalledWith('nfs.update', expect.anything());
  });

  it('disables RDMA field unless it is an enterprise system with RDMA capable NIC', async () => {
    expect(await (await getCheckbox('rdma')).isDisabled()).toBe(true);

    const mockStore$ = spectator.inject(MockStore);
    mockStore$.overrideSelector(selectIsEnterprise, true);
    spectator.detectChanges();

    expect(await (await getCheckbox('rdma')).isDisabled()).toBe(true);
  });
});
