import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { mockCall, mockWebsocket } from 'app/core/testing/utils/mock-websocket.utils';
import { TicketCategory, TicketCriticality, TicketEnvironment } from 'app/enums/file-ticket.enum';
import { FileTicketLicensedFormComponent } from 'app/modules/ix-feedback/file-ticket-licensed-form/file-ticket-licensed-form.component';
import { IxChipsHarness } from 'app/modules/ix-forms/components/ix-chips/ix-chips.harness';
import { IxInputHarness } from 'app/modules/ix-forms/components/ix-input/ix-input.harness';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { FormErrorHandlerService } from 'app/modules/ix-forms/services/form-error-handler.service';
import { DialogService } from 'app/services/dialog.service';
import { WebsocketConnectionService } from 'app/services/websocket-connection.service';

describe('FileTicketLicensedFormComponent', () => {
  let spectator: Spectator<FileTicketLicensedFormComponent>;
  let loader: HarnessLoader;

  const createComponent = createComponentFactory({
    component: FileTicketLicensedFormComponent,
    imports: [
      IxFormsModule,
      ReactiveFormsModule,
    ],
    declarations: [],
    providers: [
      mockProvider(DialogService, {
        generalDialog: jest.fn(() => of()),
      }),
      mockWebsocket([
        mockCall('support.fetch_categories', {
          API: '11008',
          WebUI: '10004',
        }),
      ]),
      mockProvider(FormErrorHandlerService),
      mockProvider(WebsocketConnectionService, {
        isConnected$: of(true),
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('returns payload for new ticket when getPayload is called', async () => {
    const nameInput = await loader.getHarness(IxInputHarness.with({ label: 'Name' }));
    await nameInput.setValue('John Wick');

    const emailInput = await loader.getHarness(IxInputHarness.with({ label: 'Email' }));
    await emailInput.setValue('john.wick@gmail.com');

    const ccInput = await loader.getHarness(IxChipsHarness.with({ label: 'CC' }));
    await ccInput.setValue(['marcus@gmail.com']);

    const phoneInput = await loader.getHarness(IxInputHarness.with({ label: 'Phone' }));
    await phoneInput.setValue('310-564-8005');

    const titleInput = await loader.getHarness(IxInputHarness.with({ label: 'Subject' }));
    await titleInput.setValue('Assassination Request');

    expect(spectator.component.getPayload()).toEqual({
      name: 'John Wick',
      email: 'john.wick@gmail.com',
      cc: ['marcus@gmail.com'],
      phone: '310-564-8005',
      category: TicketCategory.Bug,
      environment: TicketEnvironment.Production,
      criticality: TicketCriticality.Inquiry,
      title: 'Assassination Request',
    });
  });
});
