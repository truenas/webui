import { Injectable } from '@angular/core';
import { forkJoin, map } from 'rxjs';
import { ExplorerNodeType } from 'app/enums/explorer-type.enum';
import { FileType } from 'app/enums/file-type.enum';
import { FileRecord } from 'app/interfaces/file-record.interface';
import { QueryFilter } from 'app/interfaces/query-api.interface';
import { ExplorerNodeData, TreeNode } from 'app/interfaces/tree-node.interface';
import { TreeNodeProvider } from 'app/modules/ix-forms/components/ix-explorer/tree-node-provider.interface';
import { WebSocketService } from 'app/services/ws.service';

@Injectable({ providedIn: 'root' })
export class FilesystemService {
  constructor(
    private ws: WebSocketService,
  ) {}

  /**
   * Returns a pre-configured node provider for files and directories.
   */
  getFilesystemNodeProvider(providerOptions?: {
    directoriesOnly?: boolean;
    showHiddenFiles?: boolean;
    hideZfs?: boolean;
  }): TreeNodeProvider {
    const options = {
      directoriesOnly: false,
      showHiddenFiles: false,
      hideZfs: false,
      ...providerOptions,
    };

    return (node: TreeNode<ExplorerNodeData>) => {
      const typeFilter: [QueryFilter<FileRecord>?] = [];
      if (options.directoriesOnly) {
        typeFilter.push(['type', '=', FileType.Directory]);
      }

      if (options.hideZfs) {
        typeFilter.push(['is_ctldir', '=', false]);
      }

      return forkJoin([
        this.ws.call('filesystem.listdir', [node.data.path, typeFilter, { order_by: ['name'], limit: 1000 }]),
        this.ws.call('pool.dataset.query', [[], { select: ['mountpoint'] }]),
      ]).pipe(
        map(([files, datasets]) => {
          const children: ExplorerNodeData[] = [];
          files.forEach((file) => {
            if (file.type === FileType.Symlink || !file.hasOwnProperty('name')) {
              return;
            }

            if (!options.showHiddenFiles && file.name.startsWith('.')) {
              return;
            }

            children.push({
              path: file.path,
              name: file.name,
              isMountpoint: !!datasets.find((dataset) => dataset.mountpoint === file.path),
              type: file.type === FileType.Directory ? ExplorerNodeType.Directory : ExplorerNodeType.File,
              hasChildren: file.type === FileType.Directory,
            });
          });

          return children;
        }),
      );
    };
  }
}
