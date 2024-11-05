import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import {
  Observable, of, OperatorFunction, pipe,
} from 'rxjs';
import { map, switchMap, tap } from 'rxjs/operators';
import { maxDatasetNesting, maxDatasetPath } from 'app/constants/dataset.constants';
import { inherit } from 'app/enums/with-inherit.enum';
import { helptextDatasetForm } from 'app/helptext/storage/volumes/datasets/dataset-form';
import { Dataset } from 'app/interfaces/dataset.interface';
import { Option } from 'app/interfaces/option.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { SlideInService } from 'app/services/slide-in.service';
import { WebSocketService } from 'app/services/ws.service';

@Injectable({
  providedIn: 'root',
})
export class DatasetFormService {
  constructor(
    private dialog: DialogService,
    private ws: WebSocketService,
    private translate: TranslateService,
    private slideInService: SlideInService,
  ) {}

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
            tap(() => this.slideInService.closeLast()),
            map(() => false),
          );
        }
        if (path.length >= maxDatasetPath) {
          return this.dialog.warn(
            this.translate.instant(helptextDatasetForm.pathWarningTitle),
            this.translate.instant(helptextDatasetForm.pathIsTooLongWarning),
          ).pipe(
            tap(() => this.slideInService.closeLast()),
            map(() => false),
          );
        }
        return of(true);
      }),
    );
  }

  loadDataset(datasetId: string): Observable<Dataset> {
    return this.ws.call('pool.dataset.query', [[['id', '=', datasetId]]]).pipe(
      map((response) => response[0]),
    );
  }

  addInheritOption(parentValue: string): OperatorFunction<Option[], Option[]> {
    return pipe(
      map((options) => [
        {
          label: this.translate.instant('Inherit ({value})', { value: parentValue }),
          value: inherit,
        },
        ...options,
      ]),
    );
  }
}
