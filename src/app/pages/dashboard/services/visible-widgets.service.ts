import { Injectable } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Store } from '@ngrx/store';
import { map } from 'rxjs';
import { WidgetType } from 'app/pages/dashboard/types/widget.interface';
import { AppState } from 'app/store';
import { selectIsHaLicensed } from 'app/store/ha-info/ha-info.selectors';

@Injectable({
  providedIn: 'root',
})
export class VisibleWidgetsService {
  readonly hiddenWidgets = toSignal(this.store$.select(selectIsHaLicensed).pipe(
    map((isHaLicensed) => {
      const widgets: WidgetType[] = [];
      if (!isHaLicensed) {
        widgets.push(WidgetType.SystemInfoPassive);
      }
      return widgets;
    }),
  ));

  constructor(
    private store$: Store<AppState>,
  ) {}

  isVisible(type: WidgetType): boolean {
    return !this.hiddenWidgets().includes(type);
  }
}
