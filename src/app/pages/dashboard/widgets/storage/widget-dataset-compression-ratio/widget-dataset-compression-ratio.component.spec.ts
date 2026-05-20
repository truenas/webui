import { Spectator } from '@ngneat/spectator';
import { createComponentFactory, mockProvider } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { Dataset } from 'app/interfaces/dataset.interface';
import { WidgetResourcesService } from 'app/pages/dashboard/services/widget-resources.service';
import { SlotSize } from 'app/pages/dashboard/types/widget.interface';
import { WidgetDatapointComponent } from 'app/pages/dashboard/widgets/common/widget-datapoint/widget-datapoint.component';
import {
  WidgetDatasetCompressionRatioComponent,
} from 'app/pages/dashboard/widgets/storage/widget-dataset-compression-ratio/widget-dataset-compression-ratio.component';

describe('WidgetDatasetCompressionRatioComponent', () => {
  let spectator: Spectator<WidgetDatasetCompressionRatioComponent>;
  const createComponent = createComponentFactory({
    component: WidgetDatasetCompressionRatioComponent,
  });

  describe('dataset exists', () => {
    beforeEach(() => {
      spectator = createComponent({
        props: {
          size: SlotSize.Quarter,
          settings: {
            datasetId: 'tank/data/photos',
          },
        },
        providers: [
          mockProvider(WidgetResourcesService, {
            getDatasetById: jest.fn().mockReturnValue(of({
              id: 'tank/data/photos',
              compressratio: { value: '1.42x' },
            } as Dataset)),
          }),
        ],
      });
      spectator.detectChanges();
    });

    it('renders the compression ratio, just the dataset name, and a "Compression Ratio" subtext', () => {
      const datapoint = spectator.query(WidgetDatapointComponent)!;
      expect(datapoint.label()).toBe('photos');
      expect(datapoint.text()).toBe('1.42x');
      expect(datapoint.subText()).toBe('Compression Ratio');
    });
  });

  describe('dataset does not exist', () => {
    beforeEach(() => {
      spectator = createComponent({
        props: {
          size: SlotSize.Quarter,
          settings: {
            datasetId: 'tank/missing',
          },
        },
        providers: [
          mockProvider(WidgetResourcesService, {
            getDatasetById: jest.fn().mockReturnValue(of(undefined)),
          }),
        ],
      });
      spectator.detectChanges();
    });

    it('renders the "Dataset does not exist" fallback', () => {
      const datapoint = spectator.query(WidgetDatapointComponent)!;
      expect(datapoint.label()).toBe('Dataset Compression Ratio');
      expect(datapoint.text()).toBe('Dataset does not exist');
    });
  });
});
