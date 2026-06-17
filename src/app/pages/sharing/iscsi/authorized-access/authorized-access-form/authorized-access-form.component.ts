import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { IscsiAuthAccess } from 'app/interfaces/iscsi.interface';
import { IxFormRendererComponent } from 'app/modules/forms/ix-forms/components/ix-form-renderer/ix-form-renderer.component';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { ApiService } from 'app/modules/websocket/api.service';
import {
  AuthorizedAccessFormValues,
  getAuthorizedAccessFormConfig,
} from 'app/pages/sharing/iscsi/authorized-access/authorized-access-form/authorized-access.form-config';

@Component({
  selector: 'ix-authorized-access-form',
  template: '<ix-form-renderer [definition]="definition" [editData]="editData" />',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IxFormRendererComponent],
})
export class AuthorizedAccessFormComponent {
  private api = inject(ApiService);
  private translate = inject(TranslateService);
  slideInRef = inject<SlideInRef<IscsiAuthAccess | undefined, boolean>>(SlideInRef);

  private editingAccess = this.slideInRef.getData();

  // Confirm fields aren't persisted, so seed them from the saved secrets.
  protected editData: Partial<AuthorizedAccessFormValues> | null = this.editingAccess
    ? {
        ...this.editingAccess,
        secret_confirm: this.editingAccess.secret,
        peersecret_confirm: this.editingAccess.peersecret,
      }
    : null;

  protected definition = getAuthorizedAccessFormConfig(this.api, this.translate, this.editingAccess);
}
