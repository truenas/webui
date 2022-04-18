import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Observable } from 'rxjs';
import { ChartRelease, ChartSchema } from 'app/interfaces/chart-release.interface';
import { DynamicFormSchema } from 'app/interfaces/dynamic-form-schema.interface';
import { WebSocketService } from 'app/services';

@UntilDestroy()
@Component({
  templateUrl: './chart-form.component.html',
  styleUrls: ['./chart-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChartFormComponent {
  title: string;
  name: string;
  isLoading = false;

  constructor(
    private cdr: ChangeDetectorRef,
    private ws: WebSocketService,
  ) {}

  setTitle(title: string): void {
    this.title = title;
  }

  loadingSchema(name: string): void {
    this.name = name;
    const request$: Observable<ChartRelease[]> = this.ws.call('chart.release.query', [
      [['id', '=', name]],
      { extra: { include_chart_schema: true } },
    ]);

    request$.pipe(untilDestroyed(this)).subscribe((data: ChartRelease[]) => {
      if (!data.length) {
        return;
      }
      this.parseChartSchema(data[0].chart_schema);
    });
  }

  parseChartSchema(chartSchema: ChartSchema): DynamicFormSchema[] {
    // TODO: parse chartSchema.schema;
    return [];
  }
}
