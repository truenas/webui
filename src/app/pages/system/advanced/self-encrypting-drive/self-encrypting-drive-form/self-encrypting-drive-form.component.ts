import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { IxFormRendererComponent } from 'app/modules/forms/ix-forms/components/ix-form-renderer/ix-form-renderer.component';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { ApiService } from 'app/modules/websocket/api.service';
import {
  getSelfEncryptingDriveFormConfig, SedConfig,
} from 'app/pages/system/advanced/self-encrypting-drive/self-encrypting-drive-form/self-encrypting-drive.form-config';
import { AppState } from 'app/store';

@Component({
  selector: 'ix-self-encrypting-drive-form',
  template: '<ix-form-renderer [definition]="definition" />',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IxFormRendererComponent],
})
export class SelfEncryptingDriveFormComponent {
  // Required so SlideIn.open() can type this component as a ComponentInSlideIn.
  slideInRef = inject<SlideInRef<SedConfig, boolean>>(SlideInRef);

  private api = inject(ApiService);
  private translate = inject(TranslateService);
  private store$ = inject<Store<AppState>>(Store);

  protected definition = getSelfEncryptingDriveFormConfig(this.api, this.translate, this.store$);
}
