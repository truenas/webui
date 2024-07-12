import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import * as _ from 'lodash';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { ExplorerNodeType } from 'app/enums/explorer-type.enum';
import { mntPath } from 'app/enums/mnt-path.enum';
import { ExplorerNodeData } from 'app/interfaces/tree-node.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { TreeNodeProvider } from 'app/modules/forms/ix-forms/components/ix-explorer/tree-node-provider.interface';
import { isRootDataset } from 'app/pages/datasets/utils/dataset.utils';
import { WebSocketService } from 'app/services/ws.service';

@Injectable({ providedIn: 'root' })
export class DatasetService {
  constructor(
    private ws: WebSocketService,
    private dialog: DialogService,
    private translate: TranslateService,
  ) {}

  getDatasetNodeProvider(): TreeNodeProvider {
    return () => {
      return this.ws.call('pool.filesystem_choices').pipe(
        map((filesystems) => {
          const nodes: ExplorerNodeData[] = [];
          filesystems.forEach((filesystem) => {
            const pathSegments = filesystem.split('/');
            if (pathSegments.length === 1) {
              nodes.push({
                name: filesystem,
                hasChildren: false,
                path: filesystem,
                type: ExplorerNodeType.Directory,
                children: [],
              });
              return;
            }

            let parent = _.find(nodes, { name: pathSegments[0] });
            let i = 1;
            while (_.find(parent.children, { name: pathSegments[i] })) {
              parent = _.find(parent.children, { name: pathSegments[i++] });
            }

            parent.children.push({
              name: pathSegments[pathSegments.length - 1],
              children: [],
              hasChildren: false,
              type: ExplorerNodeType.Directory,
              path: filesystem,
            });
            parent.hasChildren = true;
          });

          return nodes;
        }),
      );
    };
  }

  rootLevelDatasetWarning(path: string, skip = false): Observable<boolean> {
    return isRootDataset({ name: path.replace(`${mntPath}/`, '') }) && !skip ? this.dialog.confirm({
      title: this.translate.instant('Warning'),
      message: this.translate.instant('You configure the root-level dataset. Are you sure you want to continue?'),
    }) : of(true);
  }
}
