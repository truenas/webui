import {
  Component, Input,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { SimpleFailoverBtnDialogComponent } from 'app/pages/dashboard/components/widget-sys-info/simple-failover-btn-dialog.component';

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
    private dialog: MatDialog,
    protected matDialog: MatDialog,
    private router: Router,
    public translate: TranslateService,
  ) {}

  openDialog(): void {
    const dialogRef = this.dialog.open(SimpleFailoverBtnDialogComponent, {
      width: '330px',
      data: { agreed: true },
    });

    dialogRef.afterClosed().pipe(untilDestroyed(this)).subscribe((res) => {
      if (res) {
        this.router.navigate(['/others/reboot']);
      }
    });
  }
}
