import {
  AfterViewInit, ChangeDetectionStrategy, Component, EventEmitter, Output,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { ApplicationsService } from 'app/pages/apps-old/applications.service';
import { SelectPoolDialogComponent } from 'app/pages/apps/components/select-pool-dialog/select-pool-dialog.component';

@UntilDestroy()
@Component({
  selector: 'ix-pool-configuration-checker',
  templateUrl: './pool-configuration-checker.component.html',
  styleUrls: ['./pool-configuration-checker.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PoolConfigurationCheckerComponent implements AfterViewInit {
  @Output() choosePoolModalClosed = new EventEmitter();

  constructor(
    private appService: ApplicationsService,
    private matDialog: MatDialog,
  ) { }

  ngAfterViewInit(): void {
    this.appService.getKubernetesConfig().pipe(untilDestroyed(this)).subscribe((config) => {
      if (!config.pool) {
        this.onChoosePool();
      }
    });
  }

  onChoosePool(): void {
    const dialog = this.matDialog.open(SelectPoolDialogComponent);
    dialog.afterClosed().pipe(untilDestroyed(this)).subscribe(() => {
      this.choosePoolModalClosed.emit();
    });
  }
}
