import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatDialogRef } from '@angular/material/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { mockCall, mockWebsocket } from 'app/core/testing/utils/mock-websocket.utils';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { IxFormHarness } from 'app/modules/ix-forms/testing/ix-form.harness';
import { AppLoaderModule } from 'app/modules/loader/app-loader.module';
import { AddSpnDialogComponent } from 'app/pages/services/components/service-nfs/add-spn-dialog/add-spn-dialog.component';
import { DialogService } from 'app/services/dialog.service';
import { WebSocketService } from 'app/services/ws.service';

describe('AddSpnDialogComponent', () => {
  let spectator: Spectator<AddSpnDialogComponent>;
  let loader: HarnessLoader;
  const createComponent = createComponentFactory({
    component: AddSpnDialogComponent,
    imports: [
      ReactiveFormsModule,
      IxFormsModule,
      AppLoaderModule,
    ],
    providers: [
      mockWebsocket([
        mockCall('nfs.add_principal'),
      ]),
      mockProvider(MatDialogRef),
      mockProvider(DialogService),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('sumbit credentials', async () => {
    const form = await loader.getHarness(IxFormHarness);

    await form.fillForm({
      Name: 'username',
      Password: 'password',
    });

    const save = await loader.getHarness(MatButtonHarness.with({ text: 'Submit' }));
    await save.click();

    expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith('nfs.add_principal', [{
      username: 'username',
      password: 'password',
    }]);
    expect(spectator.inject(DialogService).info).toHaveBeenCalledWith(
      'Success',
      'You have successfully added credentials.',
    );
    expect(spectator.inject(MatDialogRef).close).toHaveBeenCalled();
  });
});
