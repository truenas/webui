import { Spectator } from '@ngneat/spectator';
import { createComponentFactory } from '@ngneat/spectator/jest';
import { BehaviorSubject } from 'rxjs';
import { AppHelmChartCardComponent } from 'app/pages/apps/components/app-detail-view/app-helm-chart-card/app-helm-chart-card.component';

describe('AppHelmChartCardComponent', () => {
  let spectator: Spectator<AppHelmChartCardComponent>;

  const isLoading$ = new BehaviorSubject(false);

  const createComponent = createComponentFactory({
    component: AppHelmChartCardComponent,
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
    expect(spectator.query('h3')).toHaveText('Helm Chart Info');
  });
});
