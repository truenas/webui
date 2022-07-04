import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { Subject } from 'rxjs';
import { mockCall, mockWebsocket } from 'app/core/testing/utils/mock-websocket.utils';
import { DatasetType } from 'app/enums/dataset.enum';
import { Dataset } from 'app/interfaces/dataset.interface';
import { DatasetIconComponent } from 'app/pages/datasets/components/dataset-icon/dataset-icon.component';
import {
  DatasetEncryptionCellComponent,
} from 'app/pages/datasets/components/dataset-node/dataset-encryption-cell/dataset-encryption-cell.component';
import { DatasetNodeComponent } from 'app/pages/datasets/components/dataset-node/dataset-node.component';
import { DatasetStore } from 'app/pages/datasets/store/dataset-store.service';
import { WebSocketService } from 'app/services';

describe('DatasetNodeComponent', () => {
  let spectator: Spectator<DatasetNodeComponent>;
  const dataset = {
    id: 'root/dataset/child',
    name: 'root/dataset/child',
    type: DatasetType.Filesystem,
    available: {
      parsed: 1222333,
    },
    used: {
      parsed: 12344848,
    },
    locked: false,
  } as Dataset;
  const createComponent = createComponentFactory({
    component: DatasetNodeComponent,
    declarations: [
      DatasetIconComponent,
      DatasetEncryptionCellComponent,
    ],
    providers: [
      mockWebsocket([
        mockCall('pool.dataset.query', [{
          ...dataset,
          locked: true,
        }] as Dataset[]),
      ]),
      mockProvider(DatasetStore, {
        onReloadList: new Subject<void>(),
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent({
      props: { dataset },
    });
  });

  it('shows an icon for current dataset', () => {
    const icon = spectator.query(DatasetIconComponent);
    expect(icon).toBeTruthy();
    expect(icon.dataset).toBe(dataset);
  });

  it('shows dataset name', () => {
    expect(spectator.query('.name')).toHaveText('child');
  });

  it('shows a dataset encryption cell', () => {
    const cell = spectator.query(DatasetEncryptionCellComponent);
    expect(cell).toBeTruthy();
    expect(cell.dataset).toBe(dataset);
  });

  it('reloads a dataset if DataStore reloadList is triggered', () => {
    const cell = spectator.query(DatasetEncryptionCellComponent);
    spectator.inject(DatasetStore).onReloadList.next();
    expect(spectator.inject(WebSocketService).call)
      .toHaveBeenCalledWith('pool.dataset.query', [[['id', '=', 'root/dataset/child']]]);
    spectator.detectChanges();
    expect(cell.dataset).toHaveProperty('locked', true);
  });

  describe('roles', () => {
    it('says "Root Dataset" for a root dataset', () => {
      spectator.setInput('dataset', {
        ...dataset,
        name: 'root',
      });
      expect(spectator.query('.cell-roles')).toHaveText('Root Dataset');
    });
  });
});
