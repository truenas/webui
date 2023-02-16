import { Injectable } from '@angular/core';
import * as _ from 'lodash';
import { map } from 'rxjs/operators';
import { ExplorerNodeType } from 'app/enums/explorer-type.enum';
import { ExplorerNodeData } from 'app/interfaces/tree-node.interface';
import { TreeNodeProvider } from 'app/modules/ix-forms/components/ix-explorer/tree-node-provider.interface';
import { WebSocketService } from 'app/services/index';

@Injectable({ providedIn: 'root' })
export class DatasetService {
  constructor(
    private ws: WebSocketService,
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
}
