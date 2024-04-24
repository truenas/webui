import {
  Component, ChangeDetectionStrategy, OnInit, input,
} from '@angular/core';
import { UntilDestroy } from '@ngneat/until-destroy';
import { ChartData, ChartOptions } from 'chart.js';
import { map } from 'rxjs';
import { LinkState } from 'app/enums/network-interface.enum';
import { buildNormalizedFileSize } from 'app/helpers/file-size.utils';
import { WidgetResourcesService } from 'app/pages/dashboard/services/widget-resources.service';
import { WidgetComponent } from 'app/pages/dashboard/types/widget-component.interface';
import { SlotSize } from 'app/pages/dashboard/types/widget.interface';
import { LocaleService } from 'app/services/locale.service';

@UntilDestroy()
@Component({
  selector: 'ix-widget-network',
  templateUrl: './widget-network.component.html',
  styleUrls: ['./widget-network.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WidgetNetworkComponent implements WidgetComponent, OnInit {
  size = input.required<SlotSize>();
  readonly LinkState = LinkState;
  interface$ = this.resources.networkInterfaces$.pipe(
    map((state) => state?.value?.filter((nic) => nic.state.link_state !== LinkState.Down)[0]),
  );
  chartData: ChartData<'line'> = {
    datasets: [],
  };
  chartOptions: ChartOptions<'line'> = {
    responsive: true,
    aspectRatio: 16 / 9,
    maintainAspectRatio: true,
    animation: {
      duration: 0,
    },
    layout: {
      padding: 0,
    },
    plugins: {
      legend: {
        align: 'end',
        labels: {
          boxWidth: 8,
          usePointStyle: true,
        },
      },
      tooltip: {
        callbacks: {
          label: (tooltipItem) => {
            let label = tooltipItem.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (tooltipItem.parsed.y === 0) {
              label += 0;
            } else {
              label = buildNormalizedFileSize(Math.abs(Number(tooltipItem.parsed.y)), 'b', 10);
            }
            return label + '/s';
          },
        },
      },
    },
    scales: {
      x: {
        type: 'time',
        time: {
          unit: 'minute',
          displayFormats: {
            minute: 'HH:mm',
          },
          tooltipFormat: `${this.localeService.dateFormat} ${this.localeService.timeFormat}`,
        },
        ticks: {
          maxTicksLimit: 3,
          maxRotation: 0,
        },
      },
      y: {
        position: 'right',
        ticks: {
          maxTicksLimit: 8,
          callback: (value) => {
            if (value === 0) {
              return 0;
            }
            return buildNormalizedFileSize(Math.abs(Number(value)), 'b', 10) + '/s';
          },
        },
      },
    },
  };

  constructor(
    private resources: WidgetResourcesService,
    private localeService: LocaleService,
  ) {}

  ngOnInit(): void {
    console.info('WidgetNetworkComponent initialized');
  }
}
