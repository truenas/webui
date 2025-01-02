import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { MockDirective } from 'ng-mocks';
import { BaseChartDirective } from 'ng2-charts';
import { Theme } from 'app/interfaces/theme.interface';
import { GaugeChartComponent } from 'app/modules/charts/gauge-chart/gauge-chart.component';
import { ThemeService } from 'app/modules/theme/theme.service';

describe('GaugeChartComponent', () => {
  let spectator: Spectator<GaugeChartComponent>;
  const createComponent = createComponentFactory({
    component: GaugeChartComponent,
    declarations: [
      MockDirective(BaseChartDirective),
    ],
    providers: [
      mockProvider(ThemeService, {
        currentTheme: () => ({
          bg2: '#fff',
          'alt-bg2': '#fff',
        }) as Theme,
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent({
      props: {
        value: 0,
        colorFill: '#000',
        colorBlank: 'var(--bg2)',
      },
    });
  });

  it('shows supplied label', () => {
    spectator.setInput('label', 'Test Label');
    expect(spectator.query('.label')).toHaveText('Test Label');
  });

  it('renders donut chart', () => {
    spectator.setInput('value', 50);
    const chart = spectator.query(BaseChartDirective)!;

    expect(chart).toExist();
    expect(chart.datasets).toMatchObject([
      {
        type: 'roundedDoughnut',
        data: [50, 50, 34],
      },
    ]);
  });
});
