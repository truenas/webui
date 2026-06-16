import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Jbof } from 'app/interfaces/jbof.interface';
import { IxFormRendererComponent } from 'app/modules/forms/ix-forms/components/ix-form-renderer/ix-form-renderer.component';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { ApiService } from 'app/modules/websocket/api.service';
import { getJbofFormConfig } from 'app/pages/system/enclosure/components/jbof-list/jbof-form/jbof.form-config';

@Component({
  selector: 'ix-jbof-form',
  template: '<ix-form-renderer [definition]="definition" [editData]="editingJbof" />',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IxFormRendererComponent],
})
export class JbofFormComponent {
  private api = inject(ApiService);
  private translate = inject(TranslateService);
  slideInRef = inject<SlideInRef<Jbof | undefined, boolean>>(SlideInRef);

  protected editingJbof = this.slideInRef.getData();

  protected definition = getJbofFormConfig(this.api, this.translate, this.editingJbof);
}
