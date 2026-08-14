import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatCardHeader, MatCardContent } from '@angular/material/card';
import { ActivatedRoute } from '@angular/router';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import {
  TnCellDefDirective,
  TnHeaderCellDefDirective,
  TnSortEvent,
  TnTableColumnDirective,
  TnTableComponent,
  TnTestIdDirective,
} from '@truenas/ui-components';
import { map } from 'rxjs';
import { EmptyType } from 'app/enums/empty-type.enum';
import { enclosureElementTypeLabels, EnclosureElementType } from 'app/enums/enclosure-slot-status.enum';
import { EmptyConfig } from 'app/interfaces/empty-config.interface';
import { EnclosureElement } from 'app/interfaces/enclosure.interface';
import { EmptyComponent } from 'app/modules/empty/empty.component';
import { ArrayDataProvider } from 'app/modules/tn-table/classes/array-data-provider/array-data-provider';
import { mapTnSortToTableSort, toUniqueRowTag } from 'app/modules/tn-table/utils';
import { EnclosureHeaderComponent } from 'app/pages/system/enclosure/components/enclosure-header/enclosure-header.component';
import { EnclosureStore } from 'app/pages/system/enclosure/services/enclosure.store';

@Component({
  selector: 'ix-elements-page',
  templateUrl: './elements-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatCardHeader,
    EnclosureHeaderComponent,
    MatCardContent,
    EmptyComponent,
    TnTableComponent,
    TnTableColumnDirective,
    TnHeaderCellDefDirective,
    TnCellDefDirective,
    TnTestIdDirective,
    TranslateModule,
    AsyncPipe,
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

  protected readonly noView: EmptyConfig = {
    title: this.translate.instant('N/A'),
    message: this.translate.instant('This view is not available for this enclosure.'),
    large: true,
    type: EmptyType.Errors,
  };

  protected readonly viewElements = computed(() => {
    return this.store.selectedEnclosure()?.elements?.[this.currentView()];
  });

  protected readonly displayedColumns = ['descriptor', 'status', 'value'];

  protected readonly trackByDescriptor = (_: number, row: EnclosureElement): string => row.descriptor;

  protected uniqueRowTag(row: EnclosureElement): string {
    return toUniqueRowTag(row.descriptor);
  }

  protected onSortChange(event: TnSortEvent): void {
    this.dataProvider().setSorting(mapTnSortToTableSort<EnclosureElement>(event, this.displayedColumns));
  }

  protected readonly dataProvider = computed(() => {
    const dataProvider = new ArrayDataProvider<EnclosureElement>();
    const elements = Object.values(this.viewElements() || {}) as EnclosureElement[];
    dataProvider.setRows(elements);
    return dataProvider;
  });
}
