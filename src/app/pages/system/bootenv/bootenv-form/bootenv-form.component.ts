import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { IxFormRendererComponent } from 'app/modules/forms/ix-forms/components/ix-form-renderer/ix-form-renderer.component';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { ApiService } from 'app/modules/websocket/api.service';
import { getBootenvFormConfig } from 'app/pages/system/bootenv/bootenv-form/bootenv.form-config';

@Component({
  selector: 'ix-bootenv-form',
  template: '<ix-form-renderer [definition]="definition" />',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IxFormRendererComponent],
})
export class BootEnvironmentFormComponent {
  private api = inject(ApiService);
  private translate = inject(TranslateService);
  slideInRef = inject<SlideInRef<string, boolean>>(SlideInRef);

  private currentName = this.slideInRef.getData();

  protected definition = getBootenvFormConfig(this.api, this.translate, this.currentName);
}
