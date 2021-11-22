import {
  Component, Input,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { filter } from 'rxjs/operators';
import { helptext_system_failover } from 'app/helptext/system/failover';
import { DialogService, WebSocketService } from 'app/services';

@UntilDestroy()
@Component({
  selector: 'simple-failover-button',
  templateUrl: './simple-failover-btn.component.html',
  styleUrls: ['./simple-failover-btn.component.scss'],
})
export class SimpleFailoverBtnComponent {
  @Input() color = 'default';
  @Input() disabled?: boolean = false;
  constructor(
    private dialog: DialogService,
    protected matDialog: MatDialog,
    public translate: TranslateService,
    private ws: WebSocketService,
    private router: Router,
  ) {}

  openDialog(): void {
    this.dialog.confirm({
      title: helptext_system_failover.dialog_initiate_failover_title,
      message: helptext_system_failover.dialog_initiate_failover_message,
      buttonMsg: helptext_system_failover.dialog_initiate_action,
    }).pipe(
      filter(Boolean),
      untilDestroyed(this),
    ).subscribe(() => {
      this.router.navigate(['/others/failover'], { skipLocationChange: true });
    });
  }
}
