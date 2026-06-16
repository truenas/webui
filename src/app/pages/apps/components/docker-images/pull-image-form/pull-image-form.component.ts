import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxFormRendererComponent } from 'app/modules/forms/ix-forms/components/ix-form-renderer/ix-form-renderer.component';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { ApiService } from 'app/modules/websocket/api.service';
import { getPullImageFormConfig } from 'app/pages/apps/components/docker-images/pull-image-form/pull-image.form-config';

@Component({
  selector: 'ix-pull-image-form',
  template: '<ix-form-renderer [definition]="definition" />',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IxFormRendererComponent],
})
export class PullImageFormComponent {
  private api = inject(ApiService);
  private translate = inject(TranslateService);
  private dialogService = inject(DialogService);
  slideInRef = inject<SlideInRef<undefined, boolean>>(SlideInRef);

  protected definition = getPullImageFormConfig(this.api, this.translate, this.dialogService);
}
