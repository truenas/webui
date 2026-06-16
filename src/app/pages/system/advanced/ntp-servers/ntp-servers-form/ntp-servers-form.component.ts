import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { NtpServer } from 'app/interfaces/ntp-server.interface';
import { IxFormRendererComponent } from 'app/modules/forms/ix-forms/components/ix-form-renderer/ix-form-renderer.component';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { ApiService } from 'app/modules/websocket/api.service';
import { getNtpServersFormConfig } from 'app/pages/system/advanced/ntp-servers/ntp-servers-form/ntp-servers.form-config';

@Component({
  selector: 'ix-ntp-servers-form',
  template: '<ix-form-renderer [definition]="definition" [editData]="editingServer" />',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IxFormRendererComponent],
})
export class NtpServersFormComponent {
  private api = inject(ApiService);
  private translate = inject(TranslateService);
  slideInRef = inject<SlideInRef<NtpServer | undefined, boolean>>(SlideInRef);

  protected editingServer = this.slideInRef.getData();

  protected definition = getNtpServersFormConfig(this.api, this.translate, this.editingServer);
}
