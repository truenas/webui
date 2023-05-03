import { Spectator } from '@ngneat/spectator';
import { createComponentFactory, mockProvider } from '@ngneat/spectator/jest';
import { BehaviorSubject } from 'rxjs';
import { AppResourcesCardComponent } from 'app/pages/apps/components/available-apps/app-resources-card/app-resources-card.component';
import { AvailableAppsStore } from 'app/pages/apps/store/available-apps-store.service';

describe('AppResourcesCardComponent', () => {
  let spectator: Spectator<AppResourcesCardComponent>;

  const isLoading$ = new BehaviorSubject(false);

  const createComponent = createComponentFactory({
    component: AppResourcesCardComponent,
    providers: [
      mockProvider(AvailableAppsStore),
    ],
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
