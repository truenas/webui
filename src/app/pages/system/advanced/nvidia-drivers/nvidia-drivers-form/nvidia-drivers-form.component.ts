import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { IxFormRendererComponent } from 'app/modules/forms/ix-forms/components/ix-form-renderer/ix-form-renderer.component';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { ApiService } from 'app/modules/websocket/api.service';
import { getNvidiaDriversFormConfig } from 'app/pages/system/advanced/nvidia-drivers/nvidia-drivers-form/nvidia-drivers.form-config';
import { AppState } from 'app/store';

@Component({
  selector: 'ix-nvidia-drivers-form',
  template: '<ix-form-renderer [definition]="definition" />',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IxFormRendererComponent],
})
export class NvidiaDriversFormComponent {
  private api = inject(ApiService);
  private translate = inject(TranslateService);
  private store$ = inject<Store<AppState>>(Store);
  slideInRef = inject<SlideInRef<boolean, boolean>>(SlideInRef);

  protected definition = getNvidiaDriversFormConfig(
    this.api,
    this.translate,
    this.store$,
    Boolean(this.slideInRef.getData()),
  );
}
