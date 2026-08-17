import { ChangeDetectionStrategy, Component, computed, effect, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  TnCardComponent,
  TnCardHeaderDirective,
  TnCellDefDirective,
  TnEmptyComponent,
  TnHeaderCellDefDirective,
  TnTableColumnDirective,
  TnTableComponent,
} from '@truenas/ui-components';
import { map } from 'rxjs';
import { EmptyType } from 'app/enums/empty-type.enum';
import { enclosureElementTypeLabels, EnclosureElementType } from 'app/enums/enclosure-slot-status.enum';
import { EnclosureElement } from 'app/interfaces/enclosure.interface';
import { ArrayDataProvider } from 'app/modules/ix-table/classes/array-data-provider/array-data-provider';
import { tnTableListHost } from 'app/modules/ix-table/utils';
import { TableTextCellComponent } from 'app/modules/tn-table-cells/text-cell/table-text-cell.component';
import { EnclosureHeaderComponent } from 'app/pages/system/enclosure/components/enclosure-header/enclosure-header.component';
import { EnclosureStore } from 'app/pages/system/enclosure/services/enclosure.store';

@Component({
  selector: 'ix-elements-page',
  templateUrl: './elements-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TnCardComponent,
    TnCardHeaderDirective,
    EnclosureHeaderComponent,
    TnEmptyComponent,
    TnTableComponent,
    TnTableColumnDirective,
    TnHeaderCellDefDirective,
    TnCellDefDirective,
    TableTextCellComponent,
    TranslateModule,
  ],
})
export class ElementsPageComponent {
  private translate = inject(TranslateService);
  private activatedRoute = inject(ActivatedRoute);
  private store = inject(EnclosureStore);

  protected readonly currentView = toSignal(
    this.activatedRoute.params.pipe(map((params) => params['view'] as EnclosureElementType)),
  );

  protected readonly title = computed(() => {
    const view = enclosureElementTypeLabels.has(this.currentView())
      ? enclosureElementTypeLabels.get(this.currentView())
      : this.currentView();

    return this.translate.instant('{view} on {enclosure}', {
      view,
      enclosure: this.store.enclosureLabel(),
    });
  });

  protected readonly viewElements = computed(() => {
    return this.store.selectedEnclosure()?.elements?.[this.currentView()];
  });

  // One provider for the life of the page, refilled per view. Rebuilding it per view would
  // desync the sort: the `tn-table` instance survives a route change, so its header would keep
  // showing an arrow for a sort the replacement provider never had. `setRows` re-applies the
  // provider's current sorting, so the arrow and the rows stay in agreement.
  protected readonly dataProvider = new ArrayDataProvider<EnclosureElement>();

  // Every column renders a plain property, so each column name is its own sort key.
  protected readonly list = tnTableListHost<EnclosureElement>(this.dataProvider, {
    displayedColumns: ['descriptor', 'status', 'value'],
  });

  // No `[trackBy]` here: descriptors come straight off the hardware and aren't guaranteed distinct
  // within a view (blank or repeated ones on cooling and PSU elements are a thing in the wild), and
  // duplicate track keys throw NG0955. tn-table falls back to tracking by index, which is what
  // `viewElements()` keys the elements by anyway.
  protected readonly uniqueRowTag = this.list.rowTag((row) => row.descriptor);

  constructor() {
    effect(() => {
      this.dataProvider.setRows(Object.values(this.viewElements() || {}) as EnclosureElement[]);
      // `emptyType$` starts as `Loading` and only an async provider ever moves it on, so
      // without this an element type with no elements renders "Loading..." forever.
      this.dataProvider.setEmptyType(EmptyType.NoPageData);
    });
  }
}
