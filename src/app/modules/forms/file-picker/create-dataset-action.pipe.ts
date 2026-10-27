import { inject, Pipe, PipeTransform } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslateService } from '@ngx-translate/core';
import { v28_0_0 } from '@truenas/api-client';
import { FilePickerCreateAction, FileSystemItem } from '@truenas/ui-components';
import { firstValueFrom, MonoTypeOperatorFunction } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { maxDatasetPath } from 'app/constants/dataset.constants';
import { nameValidatorRegex } from 'app/constants/name-validator.constant';
import { DatasetCaseSensitivity, DatasetPreset } from 'app/enums/dataset.enum';
import { Role } from 'app/enums/role.enum';
import { AuthService } from 'app/modules/auth/auth.service';
import { TreeNodeSource } from 'app/modules/forms/file-picker/tree-node-source';
import { ApiService } from 'app/modules/websocket/api.service';
import { WebUiQueryEntity } from 'app/modules/websocket/typed-api/typed-api-client.token';
import { ErrorParserService } from 'app/services/errors/error-parser.service';

/** What a host presets on the datasets the picker creates. The name comes from the inline row. */
export type ExplorerDatasetProperties = Omit<v28_0_0.PoolDatasetCreateFilesystem, 'name'>;

type DatasetEntry = WebUiQueryEntity<'pool.dataset.query'>;

export const genericCreateDatasetProps: ExplorerDatasetProperties = {
  share_type: DatasetPreset.Generic,
};

/**
 * A "Create Dataset" action for a `tn-file-picker` browsing a {@link TreeNodeSource}: it opens the
 * picker's inline name row in any dataset the user may write to.
 *
 * ```html
 * @let pathSource = treeNodeProvider | filePickerSource;
 * <tn-file-picker formControlName="path" [source]="pathSource" [createActions]="[pathSource | createDatasetAction]" />
 * ```
 */
@Pipe({
  name: 'createDatasetAction',
})
export class CreateDatasetActionPipe implements PipeTransform {
  private api = inject(ApiService);
  private translate = inject(TranslateService);
  private authService = inject(AuthService);
  private errorParser = inject(ErrorParserService);

  // Read inside the picker's `canCreateAt` evaluation, so a role that arrives later re-runs it.
  private canCreate = toSignal(this.authService.hasRole([Role.DatasetWrite]), { initialValue: false });

  transform(
    source: TreeNodeSource,
    datasetProperties: ExplorerDatasetProperties = genericCreateDatasetProps,
  ): FilePickerCreateAction {
    return {
      id: 'create-dataset',
      label: this.translate.instant('Create Dataset'),
      // Same icon the picker uses for dataset rows; the library marks it for
      // sprite inclusion itself.
      icon: 'tn-dataset',
      canCreateAt: (parentPath, directory) => this.canCreateAt(source, parentPath, directory),
      create: async (parentPath, name) => {
        const mountpoint = await this.createDataset(source.fromPickerPath(parentPath), name, datasetProperties);
        return source.mountpointToPickerPath(mountpoint);
      },
    };
  }

  private canCreateAt(source: TreeNodeSource, parentPath: string, directory: FileSystemItem | null): boolean {
    if (!this.canCreate()) {
      return false;
    }
    const parent = this.toParentDatasetId(source.fromPickerPath(parentPath));
    // After stripping the /mnt/ prefix, a real dataset path is either bare ("tank") or
    // nested ("tank/foo"). A leading slash means the browsed directory isn't under /mnt/
    // (e.g. /dev/zvol/<pool>) and pool.dataset.create would reject it.
    if (!parent || parent.startsWith('/')) {
      return false;
    }
    // Datasets can only be created under another dataset, not a plain directory.
    // Remote trees (replication) never mark mountpoints, which also hides the
    // action there — creating through a local flow would be wrong.
    return directory?.type === 'dataset';
  }

  /** `parentPath` is in provider space; resolves with the new dataset's mountpoint. */
  private async createDataset(
    parentPath: string,
    name: string,
    datasetProperties: ExplorerDatasetProperties,
  ): Promise<string> {
    const parentId = this.toParentDatasetId(parentPath).replace(/\/$/, '');
    const datasetName = name.trim();

    const parents = await firstValueFrom(
      this.api.query('pool.dataset.query', [['id', '=', parentId]]).pipe(this.toInlineError()),
    );
    if (!parents.length) {
      throw new Error(this.translate.instant('Parent dataset {name} not found.', { name: parentId }));
    }
    const parent = parents[0];
    this.validateName(parentId, parent, datasetName);

    const fullName = `${parentId}/${datasetName}`;
    const dataset = await firstValueFrom(
      this.api.call('pool.dataset.create', [{
        ...datasetProperties,
        name: fullName,
      }]).pipe(this.toInlineError()),
    );
    // Optional in the generated entry; a new filesystem is always mounted under /mnt.
    return dataset.mountpoint ?? `/mnt/${fullName}`;
  }

  /** `parentName` is the parent's id, which for a dataset is its name. */
  private validateName(parentName: string, parent: DatasetEntry, name: string): void {
    if (!nameValidatorRegex.test(name)) {
      throw new Error(this.translate.instant('Name is invalid.'));
    }

    if (parentName.length + 1 + name.length >= maxDatasetPath) {
      throw new Error(this.translate.instant('Dataset name is too long.'));
    }

    // Middleware types the property value as an open string; it is one of the enum's values.
    const caseSensitivity = parent.casesensitivity?.value as DatasetCaseSensitivity | undefined;
    const isNameCaseInsensitive = caseSensitivity !== DatasetCaseSensitivity.Sensitive;
    // Middleware types nested children as `unknown[]`; they are dataset entries like the parent.
    const children = (parent.children ?? []) as DatasetEntry[];
    const namesInUse = children
      .map((child) => /[^/]*$/.exec(child.name ?? '')?.[0])
      .filter((childName): childName is string => childName !== undefined);
    const isInUse = isNameCaseInsensitive
      ? namesInUse.some((usedName) => usedName.toLowerCase() === name.toLowerCase())
      : namesInUse.includes(name);
    if (isInUse) {
      throw new Error(this.translate.instant('The name "{name}" is already in use.', { name }));
    }
  }

  /** Maps api failures to Errors whose message the inline row can display. */
  private toInlineError<T>(): MonoTypeOperatorFunction<T> {
    return catchError((error: unknown) => {
      throw new Error(this.errorParser.getFirstErrorMessage(error));
    });
  }

  private toParentDatasetId(parentPath: string): string {
    return parentPath.replace(/^(\/mnt\/?)/, '');
  }
}
