import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { IxFormRendererComponent } from 'app/modules/forms/ix-forms/components/ix-form-renderer/ix-form-renderer.component';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { ApiService } from 'app/modules/websocket/api.service';
import { getAccessFormConfig } from 'app/pages/system/advanced/access/access-form/access.form-config';
import { AppState } from 'app/store';
import { selectIsEnterprise } from 'app/store/system-info/system-info.selectors';

@Component({
  selector: 'ix-access-form',
  template: '<ix-form-renderer [definition]="definition" />',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IxFormRendererComponent],
})
export class AccessFormComponent {
  // Required so SlideIn.open() can type this component as a ComponentInSlideIn,
  // even though loadData (not slide-in data) drives the form.
  slideInRef = inject<SlideInRef<undefined, boolean>>(SlideInRef);

  private api = inject(ApiService);
  private translate = inject(TranslateService);
  private store$ = inject<Store<AppState>>(Store);

  private isEnterprise = toSignal(this.store$.select(selectIsEnterprise));

  protected definition = getAccessFormConfig(
    this.api,
    this.translate,
    this.store$,
    () => Boolean(this.isEnterprise()),
  );
}
