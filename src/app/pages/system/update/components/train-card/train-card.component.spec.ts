import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { BehaviorSubject, of } from 'rxjs';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { mockWebSocket } from 'app/core/testing/utils/mock-websocket.utils';
import { SystemUpdateTrains } from 'app/interfaces/system-update.interface';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { IxFormHarness } from 'app/modules/ix-forms/testing/ix-form.harness';
import { TrainCardComponent } from 'app/pages/system/update/components/train-card/train-card.component';
import { TrainService } from 'app/pages/system/update/services/train.service';
import { UpdateService } from 'app/pages/system/update/services/update.service';
import { SystemGeneralService } from 'app/services/system-general.service';

describe('TrainCardComponent', () => {
  let spectator: Spectator<TrainCardComponent>;
  let loader: HarnessLoader;

  const createComponent = createComponentFactory({
    component: TrainCardComponent,
    imports: [
      ReactiveFormsModule,
      IxFormsModule,
    ],
    providers: [
      mockAuth(),
      mockWebSocket([]),
      mockProvider(TrainService, {
        getAutoDownload: jest.fn(() => of(false)),
        getTrains: jest.fn(() => of({
          trains: { 'some train': { sequence: '', description: 'Some train description' } },
          current: 'some train',
          selected: 'some train',
        } as SystemUpdateTrains)),
        trainValue$: new BehaviorSubject('train1'),
        autoCheckValue$: new BehaviorSubject(false),
        fullTrainList$: new BehaviorSubject(undefined),
        selectedTrain$: new BehaviorSubject(undefined),
        currentTrainDescription$: new BehaviorSubject<string>(''),
        trainDescriptionOnPageLoad$: new BehaviorSubject<string>(''),
      }),
      mockProvider(UpdateService, {
      }),
      mockProvider(SystemGeneralService, {
        updateRunning: of('false'),
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('shows single train name', () => {
    expect(spectator.query('.single-train-name')).toHaveText('Current Train: some train - Some train description');
  });

  it('calls "check" when Refresh button is pressed', async () => {
    const refreshButton = await loader.getHarness(MatButtonHarness.with({ selector: '[ixTest="refresh"]' }));
    await refreshButton.click();

    expect(spectator.inject(TrainService).check).toHaveBeenCalled();
  });

  it('calls "toggleAutoCheck" when auto check is changed', async () => {
    const form = await loader.getHarness(IxFormHarness);
    await form.fillForm({
      'Check for Updates Daily and Download if Available': true,
    });

    expect(spectator.inject(TrainService).toggleAutoCheck).toHaveBeenCalled();
  });
});
