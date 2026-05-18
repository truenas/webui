import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, computed, inject, input,
} from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { TranslateModule } from '@ngx-translate/core';
import { filter, switchMap, tap } from 'rxjs';
import { WidgetResourcesService } from 'app/pages/dashboard/services/widget-resources.service';
import { WidgetComponent } from 'app/pages/dashboard/types/widget-component.interface';
import { SlotSize } from 'app/pages/dashboard/types/widget.interface';
import { WidgetDatapointComponent } from 'app/pages/dashboard/widgets/common/widget-datapoint/widget-datapoint.component';
import {
  datasetCompressionRatioWidget,
  WidgetDatasetCompressionRatioSettings,
} from 'app/pages/dashboard/widgets/storage/widget-dataset-compression-ratio/widget-dataset-compression-ratio.definition';

@Component({
  selector: 'ix-widget-dataset-compression-ratio',
  templateUrl: './widget-dataset-compression-ratio.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    WidgetDatapointComponent,
    TranslateModule,
  ],
})
export class WidgetDatasetCompressionRatioComponent implements WidgetComponent<WidgetDatasetCompressionRatioSettings> {
  private resources = inject(WidgetResourcesService);
  private cdr = inject(ChangeDetectorRef);

  size = input.required<SlotSize>();
  settings = input.required<WidgetDatasetCompressionRatioSettings>();
  protected datasetExists = true;

  protected datasetId = computed(() => this.settings()?.datasetId || '');

  protected dataset = toSignal(toObservable(this.datasetId).pipe(
    filter(Boolean),
    switchMap((datasetId) => this.resources.getDatasetById(datasetId)),
    tap((dataset) => {
      this.datasetExists = !!dataset;
      this.cdr.markForCheck();
    }),
  ));

  protected ratio = computed(() => this.dataset()?.compressratio?.value || '');
  protected datasetName = computed(() => {
    const id = this.datasetId();
    return id.split('/').pop() || id;
  });

  protected readonly subText = T('Compression Ratio');
  readonly name = datasetCompressionRatioWidget.name;
}
