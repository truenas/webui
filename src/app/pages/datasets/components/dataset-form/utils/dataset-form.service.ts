import { Injectable, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import {
  Observable, of, OperatorFunction, pipe,
} from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { maxDatasetNesting, maxDatasetPath } from 'app/constants/dataset.constants';
import { DatasetSnapdir, DatasetSync } from 'app/enums/dataset.enum';
import { DeduplicationSetting } from 'app/enums/deduplication-setting.enum';
import { OnOff } from 'app/enums/on-off.enum';
import { inherit } from 'app/enums/with-inherit.enum';
import { helptextDatasetForm } from 'app/helptext/storage/volumes/datasets/dataset-form';
import { Dataset, toDataset } from 'app/interfaces/dataset.interface';
import { Option } from 'app/interfaces/option.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { ApiService } from 'app/modules/websocket/api.service';

@Injectable({
  providedIn: 'root',
})
export class DatasetFormService {
  private dialog = inject(DialogService);
  private api = inject(ApiService);
  private translate = inject(TranslateService);


  checkAndWarnForLengthAndDepth(path: string): Observable<boolean> {
    return of(!!path).pipe(
      switchMap((pathExists) => {
        if (!pathExists) {
          return of(true);
        }
        if (path.split('/').length >= maxDatasetNesting) {
          return this.dialog.warn(
            this.translate.instant(helptextDatasetForm.pathWarningTitle),
            this.translate.instant(helptextDatasetForm.pathIsTooDeepWarning),
          ).pipe(
            map(() => false),
          );
        }
        if (path.length >= maxDatasetPath) {
          return this.dialog.warn(
            this.translate.instant(helptextDatasetForm.pathWarningTitle),
            this.translate.instant(helptextDatasetForm.pathIsTooLongWarning),
          ).pipe(
            map(() => false),
          );
        }
        return of(true);
      }),
    );
  }

  loadDataset(datasetId: string): Observable<Dataset> {
    return this.api.query('pool.dataset.query', [['id', '=', datasetId]]).pipe(
      map((response) => toDataset(response[0])),
    );
  }

  addInheritOption(parentValue: string): OperatorFunction<Option[], Option[]> {
    return pipe(
      map((options) => {
        // Convert uppercase to title case, then translate
        const titleCaseValue = this.toTitleCase(parentValue);
        const translatedValue = this.translate.instant(titleCaseValue);

        return [
          {
            label: this.translate.instant('Inherit ({value})', { value: translatedValue }),
            value: inherit,
          },
          ...options,
        ];
      }),
    );
  }

  private toTitleCase(value: string): string {
    if (!value) return value;

    // Whitelist of known enum values that should be converted from uppercase to title case
    // These are common ZFS property values that appear in parentheses
    const enumValues = new Set<string>([
      OnOff.On, OnOff.Off,
      DatasetSync.Standard, DatasetSync.Always, DatasetSync.Disabled,
      DatasetSnapdir.Visible, DatasetSnapdir.Hidden,
      DeduplicationSetting.Verify,
    ]);

    // Only convert whitelisted uppercase enum values to title case
    if (enumValues.has(value)) {
      return value.charAt(0) + value.slice(1).toLowerCase();
    }

    return value;
  }
}
