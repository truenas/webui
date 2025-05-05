import { Injectable } from '@angular/core';
import {
  catchError, forkJoin, map, Observable, of, switchMap, throwError,
} from 'rxjs';
import { rootDatasetNode, rootZvolNode } from 'app/constants/basic-root-nodes.constant';
import { ExplorerNodeType } from 'app/enums/explorer-type.enum';
import { FileAttribute } from 'app/enums/file-attribute.enum';
import { FileType } from 'app/enums/file-type.enum';
import { extractApiErrorDetails } from 'app/helpers/api.helper';
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
  shouldDisableNode?: (node: ExplorerNodeData) => Observable<boolean>;
}

@Injectable({ providedIn: 'root' })
export class FilesystemService {
  constructor(
    private api: ApiService,
  ) {}

  getTopLevelDatasetsNodes(providerOptions: ProviderOptions): Observable<ExplorerNodeData[]> {
    const options: ProviderOptions = {
      directoriesOnly: false,
      showHiddenFiles: false,
      includeSnapshots: true,
      datasetsAndZvols: false,
      zvolsOnly: false,
      datasetsOnly: false,
      ...providerOptions,
    };
    return this.getTreeNodeProvider(options)({ data: rootDatasetNode } as TreeNode<ExplorerNodeData>);
  }

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
        return of([rootDatasetNode, rootZvolNode]);
      }
      if (options.zvolsOnly && node.data.path.trim() === '/') {
        return of([rootZvolNode]);
      }
      if (options.datasetsOnly && node.data.path.trim() === '/') {
        return of([rootDatasetNode]);
      }
      const typeFilter: [QueryFilter<FileRecord>?] = [];
      if (options.directoriesOnly) {
        typeFilter.push(['type', '=', FileType.Directory]);
      }

      if (!options.includeSnapshots) {
        typeFilter.push(['is_ctldir', '=', false]);
      }

      const queryOptions: QueryOptions<FileRecord> = {
        select: ['attributes', 'is_ctldir', 'name', 'path', 'type'],
        order_by: ['name'],
        limit: 1000,
      };

      return this.api.call('filesystem.listdir', [node.data.path, typeFilter, queryOptions]).pipe(
        map((files) => {
          const children: ExplorerNodeData[] = [];
          files.forEach((file) => {
            if ((!(options.datasetsAndZvols || options.zvolsOnly) && file.type === FileType.Symlink) || !file.hasOwnProperty('name')) {
              return;
            }

            if (!options.showHiddenFiles && file.name.startsWith('.')) {
              return;
            }

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
            const child: ExplorerNodeData = {
              path: file.path,
              name: file.name,
              isMountpoint: file.attributes.includes(FileAttribute.MountRoot),
              isLock: file.attributes.includes(FileAttribute.Immutable),
              type: fileType,
              hasChildren: file.type === FileType.Directory,
            };
            children.push(child);
          });

          return children;
        }),
        switchMap((children: ExplorerNodeData[]) => {
          const updatedObservables$ = children.map((child) => {
            const disabled$ = options.shouldDisableNode
              ? options.shouldDisableNode(child)
              : of(false);
            return disabled$.pipe(
              map((disabled) => ({ ...child, disabled } as ExplorerNodeData)),
            );
          });
          return updatedObservables$?.length ? forkJoin(updatedObservables$) : of(children);
        }),
        catchError((error: unknown) => {
          const apiError = extractApiErrorDetails(error);
          if (apiError?.reason === '[ENOENT] Directory /dev/zvol does not exist') {
            return of([]);
          }
          return throwError(() => (error));
        }),
      );
    };
  }
}
