import { Injectable } from '@angular/core';
import uniqBy from 'lodash-es/uniqBy';
import {
  catchError, forkJoin, map, Observable, of, throwError,
} from 'rxjs';
import { datasetsRootNode, zvolsRootNode } from 'app/constants/basic-root-nodes.constant';
import { ExplorerNodeType } from 'app/enums/explorer-type.enum';
import { FileAttribute } from 'app/enums/file-attribute.enum';
import { FileType } from 'app/enums/file-type.enum';
import { extractApiErrorDetails } from 'app/helpers/api.helper';
import { zvolPath } from 'app/helpers/storage.helper';
import { FileRecord } from 'app/interfaces/file-record.interface';
import { QueryFilter, QueryOptions } from 'app/interfaces/query-api.interface';
import { ExplorerNodeData, TreeNode } from 'app/interfaces/tree-node.interface';
import { TreeNodeProvider } from 'app/modules/forms/ix-forms/components/ix-explorer/tree-node-provider.interface';
import { ApiService } from 'app/modules/websocket/api.service';

export interface ProviderOptions {
  directoriesOnly?: boolean;
  showHiddenFiles?: boolean;
  includeSnapshots?: boolean;
  datasetsAndZvols?: boolean;
  zvolsOnly?: boolean;
  datasetsOnly?: boolean;
}

@Injectable({ providedIn: 'root' })
export class FilesystemService {
  constructor(
    private api: ApiService,
  ) {}

  getTopLevelDatasetsNodes(): Observable<ExplorerNodeData[]> {
    return this.getTreeNodeProvider({
      directoriesOnly: true,
    })({
      data: datasetsRootNode,
    } as TreeNode<ExplorerNodeData>);
  }

  private readonly queryOptions: QueryOptions<FileRecord> = {
    select: ['attributes', 'is_ctldir', 'name', 'path', 'type'],
    order_by: ['name'],
    limit: 1000,
  };

  /**
   * Returns a pre-configured node provider for files and directories.
   */
  getFilesystemNodeProvider(providerOptions?: ProviderOptions): TreeNodeProvider {
    const options: ProviderOptions = {
      directoriesOnly: false,
      showHiddenFiles: false,
      includeSnapshots: true,
      datasetsAndZvols: false,
      zvolsOnly: false,
      datasetsOnly: false,
      ...providerOptions,
    };

    return this.getTreeNodeProvider(options);
  }

  private getTreeNodeProvider(options: ProviderOptions): TreeNodeProvider {
    return (node: TreeNode<ExplorerNodeData>) => {
      if (options.datasetsAndZvols && node.data.path.trim() === '/') {
        return of([datasetsRootNode, zvolsRootNode]);
      }
      if (options.zvolsOnly && node.data.path.trim() === '/') {
        return of([zvolsRootNode]);
      }
      if (options.datasetsOnly && node.data.path.trim() === '/') {
        return of([datasetsRootNode]);
      }
      const typeFilter: [QueryFilter<FileRecord>?] = [];
      if (options.directoriesOnly) {
        typeFilter.push(['type', '=', FileType.Directory]);
      }

      if (!options.includeSnapshots) {
        typeFilter.push(['is_ctldir', '=', false]);
      }

      if (node.data.path.startsWith(zvolPath)) {
        return this.getZvolNodes(node);
      }

      return this.api.call('filesystem.listdir', [node.data.path, typeFilter, this.queryOptions]).pipe(
        map((files) => {
          return files
            .filter((file) => {
              if (!options.showHiddenFiles && file.name.startsWith('.')) {
                return false;
              }
              return true;
            })
            .map(this.fileToNode);
        }),
      );
    };
  }

  /**
   * Special handling for zvols, because when a zvol doesn't exist, it's parent directory would not exist
   * as well in /dev/zvol.
   * In this case we use values from dataset structure to build the tree.
   *
   * TODO: Figure out a better way to do this. Consider getting MW to build an endpoint for this or use dataset.details?
   * TODO: Rework to hide /dev/zvol as a concept from the user.
   */
  private getZvolNodes(searchNode: TreeNode<ExplorerNodeData>): Observable<ExplorerNodeData[]> {
    const wouldBeDatasetPath = searchNode.data.path.replace(zvolPath, '/mnt/');

    return forkJoin([
      // Attempt to load zvols from /dev/zvol
      this.api.call('filesystem.listdir', [searchNode.data.path, [], this.queryOptions]).pipe(
        catchError((error: unknown) => {
          const apiError = extractApiErrorDetails(error);
          if (apiError?.reason.match(/\[ENOENT] Directory \/dev\/zvol.* does not exist/)) {
            return of([]);
          }

          return throwError(() => error);
        }),
      ),

      // And load dataset structure to build the tree if no zvols exist at all.
      this.api.call('filesystem.listdir', [wouldBeDatasetPath, [['type', '=', FileType.Directory]], this.queryOptions]),
    ])
      .pipe(
        map(([zvolTree, datasetTree]) => {
          const datasetNodes = datasetTree
            .filter((directory) => directory.attributes.includes(FileAttribute.MountRoot))
            .map((file) => {
              const node = this.fileToNode(file);
              return {
                ...node,
                path: node.path.replace(/^\/mnt/, zvolPath),
                name: file.name.replace(/^\/mnt/, zvolPath),
              };
            });

          const zvolNodes = zvolTree.map(this.fileToNode);

          // Merge nodes
          return uniqBy([...datasetNodes, ...zvolNodes], (node) => node.path);
        }),
      );
  }

  private fileToNode(file: FileRecord): ExplorerNodeData {
    let fileType: ExplorerNodeType;
    switch (file.type) {
      case FileType.Directory:
        fileType = ExplorerNodeType.Directory;
        break;
      case FileType.Symlink:
        fileType = ExplorerNodeType.Symlink;
        break;
      default:
        fileType = ExplorerNodeType.File;
        break;
    }

    return {
      path: file.path,
      name: file.name,
      isMountpoint: file.attributes.includes(FileAttribute.MountRoot),
      isLock: file.attributes.includes(FileAttribute.Immutable),
      type: fileType,
      hasChildren: file.type === FileType.Directory,
    };
  }
}
