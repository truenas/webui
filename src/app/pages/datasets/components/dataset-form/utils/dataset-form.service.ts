import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import {
  Observable, of, OperatorFunction, pipe,
} from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { maxDatasetNesting, maxDatasetPath } from 'app/constants/dataset.constants';
import { inherit } from 'app/enums/with-inherit.enum';
import helptext from 'app/helptext/storage/volumes/datasets/dataset-form';
import { Dataset } from 'app/interfaces/dataset.interface';
import { Option } from 'app/interfaces/option.interface';
import { DialogService, WebSocketService } from 'app/services';
import { IxSlideInService } from 'app/services/ix-slide-in.service';

@Injectable({
  providedIn: 'root',
})
export class DatasetFormService {
  constructor(
    private dialog: DialogService,
    private ws: WebSocketService,
    private translate: TranslateService,
    private slideIn: IxSlideInService,
  ) {}

  ensurePathLimits(parentPath: string): Observable<unknown> {
    if (!parentPath) {
      return of(undefined);
    }

    if (parentPath.length >= maxDatasetPath) {
      return this.dialog.warn(
        this.translate.instant(helptext.pathWarningTitle),
        this.translate.instant(helptext.pathIsTooLongWarning),
      ).pipe(
        tap(() => this.slideIn.closeAll()),
      );
    }

    if (parentPath.split('/').length >= maxDatasetNesting) {
      return this.dialog.warn(
        this.translate.instant(helptext.pathWarningTitle),
        this.translate.instant(helptext.pathIsTooDeepWarning),
      ).pipe(
        tap(() => this.slideIn.closeAll()),
      );
    }

    return of(undefined);
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
