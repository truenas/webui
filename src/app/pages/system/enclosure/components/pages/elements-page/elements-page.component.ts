import { ChangeDetectionStrategy, Component, computed } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatCardHeader, MatCardContent } from '@angular/material/card';
import { ActivatedRoute } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { map } from 'rxjs/operators';
import { EmptyType } from 'app/enums/empty-type.enum';
import { EnclosureElementType, enclosureElementTypeLabels } from 'app/enums/enclosure-slot-status.enum';
import { EmptyConfig } from 'app/interfaces/empty-config.interface';
import { EnclosureElement } from 'app/interfaces/enclosure.interface';
import { EmptyComponent } from 'app/modules/empty/empty.component';
import { ArrayDataProvider } from 'app/modules/ix-table/classes/array-data-provider/array-data-provider';
import { IxTableComponent } from 'app/modules/ix-table/components/ix-table/ix-table.component';
import { textColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-text/ix-cell-text.component';
import { IxTableBodyComponent } from 'app/modules/ix-table/components/ix-table-body/ix-table-body.component';
import { IxTableHeadComponent } from 'app/modules/ix-table/components/ix-table-head/ix-table-head.component';
import { createTable } from 'app/modules/ix-table/utils';
import { EnclosureHeaderComponent } from 'app/pages/system/enclosure/components/enclosure-header/enclosure-header.component';
import { EnclosureStore } from 'app/pages/system/enclosure/services/enclosure.store';

@Component({
  selector: 'ix-elements-page',
  templateUrl: './elements-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatCardHeader,
    EnclosureHeaderComponent,
    MatCardContent,
    EmptyComponent,
    IxTableComponent,
    IxTableHeadComponent,
    IxTableBodyComponent,
  ],
})
export class ElementsPageComponent {
  protected readonly currentView = toSignal(
    this.route.paramMap.pipe(map((params) => params.get('view') as EnclosureElementType)),
    { initialValue: undefined },
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
    return this.store.selectedEnclosure().elements[this.currentView()];
  });

  protected readonly columns = createTable<EnclosureElement>(
    [
      textColumn({
        title: this.translate.instant('Descriptor'),
        propertyName: 'descriptor',
      }),
      textColumn({
        title: this.translate.instant('Status'),
        propertyName: 'status',
      }),
      textColumn({
        title: this.translate.instant('Value'),
        propertyName: 'value',
      }),
    ],
    {
      uniqueRowTag: (element: EnclosureElement) => element.descriptor,
      ariaLabels: (row: EnclosureElement) => [row.descriptor, this.translate.instant('Element')],
    },
  );

  protected readonly dataProvider = computed(() => {
    const dataProvider = new ArrayDataProvider<EnclosureElement>();
    const elements = Object.values(this.viewElements()) as EnclosureElement[];
    dataProvider.setRows(elements);
    return dataProvider;
  });

  constructor(
    private route: ActivatedRoute,
    private translate: TranslateService,
    private store: EnclosureStore,
  ) {}
}
