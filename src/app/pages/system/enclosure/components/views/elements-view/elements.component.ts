import { ChangeDetectionStrategy, Component, computed } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { map } from 'rxjs/operators';
import { EmptyType } from 'app/enums/empty-type.enum';
import { EnclosureElementType, enclosureElementTypeLabels } from 'app/enums/enclosure-slot-status.enum';
import { EmptyConfig } from 'app/interfaces/empty-config.interface';
import { EnclosureElement } from 'app/interfaces/enclosure.interface';
import { ArrayDataProvider } from 'app/modules/ix-table/classes/array-data-provider/array-data-provider';
import { textColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-text/ix-cell-text.component';
import { createTable } from 'app/modules/ix-table/utils';
import { EnclosureStore } from 'app/pages/system/enclosure/services/enclosure.store';

@Component({
  selector: 'ix-enclosure-elements',
  templateUrl: './elements.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ElementsComponent {
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
      rowTestId: (element) => element.descriptor,
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
