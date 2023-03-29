import { Spectator } from '@ngneat/spectator';
import { createComponentFactory } from '@ngneat/spectator/jest';
import { BehaviorSubject } from 'rxjs';
import { AppAvailableInfoCardComponent } from 'app/pages/apps/components/available-apps/app-available-info-card/app-available-info-card.component';

describe('AppAvailableInfoCardComponent', () => {
  let spectator: Spectator<AppAvailableInfoCardComponent>;

  const isLoading$ = new BehaviorSubject(false);

  const createComponent = createComponentFactory({
    component: AppAvailableInfoCardComponent,
    declarations: [],
    providers: [],
  });

  beforeEach(() => {
    spectator = createComponent({
      props: {
        isLoading$,
      },
    });
  });

  it('shows header', () => {
    expect(spectator.query('h3')).toHaveText('Application Info');
  });
});
