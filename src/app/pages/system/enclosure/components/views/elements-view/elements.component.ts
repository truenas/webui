import { ChangeDetectionStrategy, Component, computed } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { map } from 'rxjs/operators';
import { EnclosureElementType } from 'app/enums/enclosure-slot-status.enum';
import { EnclosureStore } from 'app/pages/system/enclosure/services/enclosure.store';

@Component({
  selector: 'ix-enclosure-elements',
  templateUrl: './elements.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ElementsComponent {
  // TODO: Error state for missing view.

  readonly currentView = toSignal(
    this.route.paramMap.pipe(map((params) => params.get('view') as EnclosureElementType)),
    { initialValue: undefined },
  );

  readonly title = computed(() => {
    return this.translate.instant('{view} on {enclosure}', {
      view: this.currentView(), // TODO: Translate
      enclosure: this.store.enclosureLabel(),
    });
  });

  constructor(
    private route: ActivatedRoute,
    private translate: TranslateService,
    private store: EnclosureStore,
  ) {}
}
