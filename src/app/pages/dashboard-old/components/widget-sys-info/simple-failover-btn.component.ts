import {
  ChangeDetectionStrategy,
  Component, Input,
} from '@angular/core';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { filter } from 'rxjs/operators';
import { Role } from 'app/enums/role.enum';
import { helptextSystemFailover } from 'app/helptext/system/failover';
import { DialogService } from 'app/modules/dialog/dialog.service';

@UntilDestroy()
@Component({
  selector: 'ix-simple-failover-button',
  templateUrl: './simple-failover-btn.component.html',
  styleUrls: ['./simple-failover-btn.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SimpleFailoverBtnComponent {
  @Input() color = 'default';
  @Input() disabled?: boolean = false;

  protected requiredRoles = [Role.FailoverWrite];

  constructor(
    private dialog: DialogService,
    private router: Router,
  ) {}

  openDialog(): void {
    this.dialog.confirm({
      title: helptextSystemFailover.dialog_initiate_failover_title,
      message: helptextSystemFailover.dialog_initiate_failover_message,
      buttonText: helptextSystemFailover.dialog_initiate_action,
    }).pipe(
      filter(Boolean),
      untilDestroyed(this),
    ).subscribe(() => {
      this.router.navigate(['/others/failover'], { skipLocationChange: true });
    });
  }
}
