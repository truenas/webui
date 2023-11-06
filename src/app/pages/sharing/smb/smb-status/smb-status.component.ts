import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { WebSocketService } from 'app/services/ws.service';

@Component({
  selector: 'ix-smb-status',
  templateUrl: './smb-status.component.html',
  styleUrls: ['./smb-status.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SmbStatusComponent {
  @Input() activeTab = 'sessions';
  navLinks = [{
    label: this.translate.instant('Sessions'),
    path: '/sharing/smb/status/sessions',
  }];

  constructor(
    protected router: Router,
    protected aroute: ActivatedRoute,
    protected ws: WebSocketService,
    protected translate: TranslateService,
  ) {}
}
