import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { WINDOW } from 'app/helpers/window.helper';
import { GlobalTwoFactorConfig } from 'app/interfaces/two-factor-config.interface';
import { AuthService } from 'app/modules/auth/auth.service';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxFormRendererComponent } from 'app/modules/forms/ix-forms/components/ix-form-renderer/ix-form-renderer.component';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { ApiService } from 'app/modules/websocket/api.service';
import {
  getGlobalTwoFactorFormConfig,
  GlobalTwoFactorFormValues,
} from 'app/pages/system/advanced/global-two-factor-auth/global-two-factor-form/global-two-factor.form-config';

@Component({
  selector: 'ix-global-two-factor-auth-form',
  template: '<ix-form-renderer [definition]="definition" [editData]="editData" [isEditMode]="true" />',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IxFormRendererComponent],
})
export class GlobalTwoFactorAuthFormComponent {
  private api = inject(ApiService);
  private translate = inject(TranslateService);
  private dialogService = inject(DialogService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private window = inject<Window>(WINDOW);
  slideInRef = inject<SlideInRef<GlobalTwoFactorConfig, boolean>>(SlideInRef);

  private twoFactorConfig = this.slideInRef.getData();

  protected editData: GlobalTwoFactorFormValues = {
    enabled: this.twoFactorConfig.enabled,
    window: this.twoFactorConfig.window,
    ssh: this.twoFactorConfig.services.ssh,
  };

  protected definition = getGlobalTwoFactorFormConfig(
    this.api,
    this.translate,
    this.dialogService,
    this.authService,
    this.router,
    this.window,
    this.twoFactorConfig,
  );
}
