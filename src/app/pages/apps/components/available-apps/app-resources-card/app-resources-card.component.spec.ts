import { Spectator } from '@ngneat/spectator';
import { createComponentFactory } from '@ngneat/spectator/jest';
import { BehaviorSubject } from 'rxjs';
import { AppResourcesCardComponent } from 'app/pages/apps/components/available-apps/app-resources-card/app-resources-card.component';

describe('AppResourcesCardComponent', () => {
  let spectator: Spectator<AppResourcesCardComponent>;

  const isLoading$ = new BehaviorSubject(false);

  const createComponent = createComponentFactory({
    component: AppResourcesCardComponent,
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
    expect(spectator.query('h3')).toHaveText('Available Resources');
  });
});
