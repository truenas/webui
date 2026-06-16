import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Tunable } from 'app/interfaces/tunable.interface';
import { IxFormRendererComponent } from 'app/modules/forms/ix-forms/components/ix-form-renderer/ix-form-renderer.component';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { ApiService } from 'app/modules/websocket/api.service';
import { getTunableFormConfig } from 'app/pages/system/advanced/tunable/tunable-form/tunable.form-config';

@Component({
  selector: 'ix-tunable-form',
  template: '<ix-form-renderer [definition]="definition" [editData]="editingTunable" />',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IxFormRendererComponent],
})
export class TunableFormComponent {
  private api = inject(ApiService);
  private translate = inject(TranslateService);
  slideInRef = inject<SlideInRef<Tunable | undefined, boolean>>(SlideInRef);

  protected editingTunable = this.slideInRef.getData();

  protected definition = getTunableFormConfig(this.api, this.translate, this.editingTunable);
}
