import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { of } from 'rxjs';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { mockCall, mockWebSocket } from 'app/core/testing/utils/mock-websocket.utils';
import { ChainedRef } from 'app/modules/forms/ix-forms/components/ix-slide-in/chained-component-ref';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import { KernelFormComponent } from 'app/pages/system/advanced/kernel/kernel-form/kernel-form.component';
import { WebSocketService } from 'app/services/api.service';
import { IxChainedSlideInService } from 'app/services/ix-chained-slide-in.service';

describe('KernelFormComponent', () => {
  let spectator: Spectator<KernelFormComponent>;
  let loader: HarnessLoader;
  let ws: WebSocketService;
  const createComponent = createComponentFactory({
    component: KernelFormComponent,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      mockWebSocket([
        mockCall('system.advanced.update'),
      ]),
      mockProvider(IxChainedSlideInService, {
        open: jest.fn(() => of({ response: true, error: null })),
        components$: of([]),
      }),
      mockProvider(ChainedRef, { close: jest.fn(), getData: jest.fn(() => undefined) }),
      provideMockStore(),
      mockAuth(),
    ],
  });

  beforeEach(() => {
    spectator = createComponent({
      providers: [
        mockProvider(ChainedRef, { close: jest.fn(), getData: jest.fn(() => true) }),
      ],
    });
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    ws = spectator.inject(WebSocketService);
  });

  it('shows current system advanced kernel values when form is being edited', async () => {
    const form = await loader.getHarness(IxFormHarness);
    const values = await form.getValues();

    expect(values).toEqual({
      'Enable Debug Kernel': true,
    });
  });

  it('sends an update payload to websocket and closes modal when save is pressed', async () => {
    const form = await loader.getHarness(IxFormHarness);
    await form.fillForm({
      'Enable Debug Kernel': false,
    });

    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    await saveButton.click();

    expect(ws.call).toHaveBeenCalledWith('system.advanced.update', [{ debugkernel: false }]);
  });
});
