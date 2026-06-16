import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ReplicationConfig } from 'app/interfaces/replication-config.interface';
import { IxFormRendererComponent } from 'app/modules/forms/ix-forms/components/ix-form-renderer/ix-form-renderer.component';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { ApiService } from 'app/modules/websocket/api.service';
import { getReplicationSettingsFormConfig } from 'app/pages/system/advanced/replication/replication-settings-form/replication-settings.form-config';

@Component({
  selector: 'ix-replication-settings-form',
  template: '<ix-form-renderer [definition]="definition" [editData]="editData" />',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IxFormRendererComponent],
})
export class ReplicationSettingsFormComponent {
  private api = inject(ApiService);
  private translate = inject(TranslateService);
  slideInRef = inject<SlideInRef<ReplicationConfig, boolean>>(SlideInRef);

  protected editData = this.slideInRef.getData();

  protected definition = getReplicationSettingsFormConfig(this.api, this.translate);
}
