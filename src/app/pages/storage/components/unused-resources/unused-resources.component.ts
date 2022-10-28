import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnInit,
} from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Pool } from 'app/interfaces/pool.interface';
import { UnusedDisk } from 'app/interfaces/storage.interface';
import { DialogService, WebSocketService } from 'app/services';

@UntilDestroy()
@Component({
  selector: 'ix-unused-resources',
  templateUrl: './unused-resources.component.html',
  styleUrls: ['./unused-resources.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UnusedResourcesComponent implements OnInit {
  @Input() pools: Pool[];
  unusedDisks: UnusedDisk[] = [];

  constructor(
    private ws: WebSocketService,
    private cdr: ChangeDetectorRef,
    private dialogService: DialogService,
  ) {}

  ngOnInit(): void {
    this.ws.call('disk.get_unused').pipe(untilDestroyed(this)).subscribe({
      next: (disks) => {
        this.unusedDisks = disks;
        this.cdr.markForCheck();
      },
      error: (error) => {
        this.dialogService.errorReportMiddleware(error);
      },
    });
  }
}
