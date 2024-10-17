import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { createHostFactory, SpectatorHost } from '@ngneat/spectator/jest';
import { IxStarRatingComponent } from 'app/modules/forms/ix-forms/components/ix-star-rating/ix-star-rating.component';
import { IxStarRatingHarness } from 'app/modules/forms/ix-forms/components/ix-star-rating/ix-star-rating.harness';

describe('IxStarRatingComponent', () => {
  let spectator: SpectatorHost<IxStarRatingComponent>;
  let ratingHarness: IxStarRatingHarness;
  const formControl = new FormControl();
  const createHost = createHostFactory({
    component: IxStarRatingComponent,
    imports: [
      ReactiveFormsModule,
    ],
  });

  beforeEach(async () => {
    spectator = createHost(`<ix-star-rating
      [formControl]="formControl"
      [maxRating]="maxRating"
    ></ix-star-rating>`, {
      hostProps: {
        formControl,
        maxRating: 5,
      },
    });

    ratingHarness = await TestbedHarnessEnvironment.harnessForFixture(spectator.fixture, IxStarRatingHarness);
  });

  it('shows no stars selected by default', async () => {
    expect(await ratingHarness.getValue()).toBe(0);
  });

  it('changes form control value when user selects a star', async () => {
    await ratingHarness.setValue(5);

    expect(formControl.value).toBe(5);
  });

  it('shows value for current form control value', async () => {
    formControl.setValue(3);

    expect(await ratingHarness.getValue()).toBe(3);
  });

  it('disables control when form control is disabled', async () => {
    formControl.disable();

    expect(await ratingHarness.isDisabled()).toBe(true);
  });

  it('renders given number of stars based on maxRating input', async () => {
    spectator.setHostInput({ maxRating: 10 });

    expect(await ratingHarness.getButtons()).toHaveLength(10);
  });
});
