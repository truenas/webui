import { ChangeDetectionStrategy, Component, forwardRef, inject, input } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslateService } from '@ngx-translate/core';
import { firstValueFrom, MonoTypeOperatorFunction } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { maxDatasetPath } from 'app/constants/dataset.constants';
import { nameValidatorRegex } from 'app/constants/name-validator.constant';
import { DatasetCaseSensitivity, DatasetPreset } from 'app/enums/dataset.enum';
import { Role } from 'app/enums/role.enum';
import { Dataset, DatasetCreate } from 'app/interfaces/dataset.interface';
import { AuthService } from 'app/modules/auth/auth.service';
import { ExplorerCreateAction } from 'app/modules/forms/ix-forms/components/ix-explorer/explorer-create-action';
import { IxExplorerComponent } from 'app/modules/forms/ix-forms/components/ix-explorer/ix-explorer.component';
import { ApiService } from 'app/modules/websocket/api.service';
import { ErrorParserService } from 'app/services/errors/error-parser.service';

export const genericCreateDatasetProps: Omit<DatasetCreate, 'name'> = {
  share_type: DatasetPreset.Generic,
};

/**
 * Renderless component: projected into `ix-explorer`, where it surfaces as a
 * "Create Dataset" button in the file-picker popup footer that opens the
 * picker's inline name row.
 */
@Component({
  selector: 'ix-explorer-create-dataset',
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  providers: [
    { provide: ExplorerCreateAction, useExisting: forwardRef(() => ExplorerCreateDatasetComponent) },
  ],
})
export class ExplorerCreateDatasetComponent implements ExplorerCreateAction {
  private explorer = inject(IxExplorerComponent);
  private api = inject(ApiService);
  private translate = inject(TranslateService);
  private authService = inject(AuthService);
  private errorParser = inject(ErrorParserService);

  readonly datasetProperties = input<Omit<DatasetCreate, 'name'>>(genericCreateDatasetProps);

  readonly id = 'create-dataset';
  readonly label = this.translate.instant('Create Dataset');
  // Same icon the picker uses for dataset rows; the library marks it for
  // sprite inclusion itself.
  readonly icon = 'tn-dataset';

  readonly canCreate = toSignal(this.authService.hasRole([Role.DatasetWrite]), { initialValue: false });

  canCreateAt(parentPath: string): boolean {
    const parent = this.toParentDatasetId(parentPath);
    // After stripping the /mnt/ prefix, a real dataset path is either bare ("tank") or
    // nested ("tank/foo"). A leading slash means the browsed directory isn't under /mnt/
    // (e.g. /dev/zvol/<pool>) and pool.dataset.create would reject it.
    if (!parent || parent.startsWith('/')) {
      return false;
    }
    // Datasets can only be created under another dataset, not a plain directory.
    // Remote trees (replication) never mark mountpoints, which also hides the
    // action there — creating through a local flow would be wrong.
    return this.explorer.nodeAt(parentPath)?.isMountpoint === true;
  }

  async createInline(parentPath: string, name: string): Promise<string> {
    const parentId = this.toParentDatasetId(parentPath).replace(/\/$/, '');
    const datasetName = name.trim();

    const parents = await firstValueFrom(
      this.api.call('pool.dataset.query', [[['id', '=', parentId]]]).pipe(this.toInlineError()),
    );
    if (!parents.length) {
      throw new Error(this.translate.instant('Parent dataset {name} not found.', { name: parentId }));
    }
    const parent = parents[0];
    this.validateName(parent, datasetName);

    const dataset = await firstValueFrom(
      this.api.call('pool.dataset.create', [{
        ...this.datasetProperties(),
        name: `${parent.name}/${datasetName}`,
      }]).pipe(this.toInlineError()),
    );
    return dataset.mountpoint;
  }

  private validateName(parent: Dataset, name: string): void {
    if (!nameValidatorRegex.test(name)) {
      throw new Error(this.translate.instant('Name is invalid.'));
    }

    if (parent.name.length + 1 + name.length >= maxDatasetPath) {
      throw new Error(this.translate.instant('Dataset name is too long.'));
    }

    const isNameCaseInsensitive = parent.casesensitivity.value !== DatasetCaseSensitivity.Sensitive;
    const namesInUse = (parent.children || [])
      .map((child) => /[^/]*$/.exec(child.name)?.[0])
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
