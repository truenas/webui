import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { TrainInfoCardComponent } from 'app/pages/system/update/components/train-info-card/train-info-card.component';
import { TrainService } from 'app/pages/system/update/services/train.service';
import { UpdateService } from 'app/pages/system/update/services/update.service';
import { SystemGeneralService } from 'app/services/system-general.service';

describe('TrainInfoCardComponent', () => {
  let spectator: Spectator<TrainInfoCardComponent>;

  const defaultProviderValues = {
    isEnterprise: true,
    updatesAvailable: true,
    preReleaseTrain: true,
    releaseTrain: true,
    nightlyTrain: true,
  };

  const createComponent = createComponentFactory({
    component: TrainInfoCardComponent,
  });

  function setupTest(params: {
    isEnterprise?: boolean;
    updatesAvailable?: boolean;
    preReleaseTrain?: boolean;
    releaseTrain?: boolean;
    nightlyTrain?: boolean;
  } = defaultProviderValues): void {
    params = { ...defaultProviderValues, ...params };
    spectator = createComponent({
      providers: [
        mockProvider(SystemGeneralService, {
          isEnterprise$: of(params.isEnterprise),
        }),
        mockProvider(UpdateService, {
          updatesAvailable$: of(params.updatesAvailable),
        }),
        mockProvider(TrainService, {
          preReleaseTrain$: of(params.preReleaseTrain),
          releaseTrain$: of(params.releaseTrain),
          nightlyTrain$: of(params.nightlyTrain),
        }),
      ],
    });
  }

  it('shows a card with a message for enterprise', () => {
    setupTest({ nightlyTrain: false });
    expect(spectator.queryAll('mat-card')).toHaveLength(1);

    const cardText = spectator.query('.stable-warning');
    expect(cardText).toHaveText('Before updating, please read the release notes.');
  });

  it('shows a card with a message for testing', () => {
    setupTest({ isEnterprise: false });
    expect(spectator.queryAll('mat-card')).toHaveLength(1);

    const cardText = spectator.query('.stable-warning');
    expect(cardText).toHaveText('Selected train does not have production releases, and should only be used for testing.');
  });

  it('hides cards when updates are not available', () => {
    setupTest({ updatesAvailable: false });
    expect(spectator.queryAll('mat-card')).toHaveLength(0);
  });

  it('hides cards when train is not available', () => {
    setupTest({ preReleaseTrain: false, releaseTrain: false, nightlyTrain: false });
    expect(spectator.queryAll('mat-card')).toHaveLength(0);
  });
});
