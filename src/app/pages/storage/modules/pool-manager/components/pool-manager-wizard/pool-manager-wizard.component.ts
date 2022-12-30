import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MatLegacyDialog as MatDialog } from '@angular/material/legacy-dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { combineLatest } from 'rxjs';
import { ManualDiskSelectionComponent } from 'app/pages/storage/modules/pool-manager/components/manual-disk-selection/manual-disk-selection.component';
import { SystemProfiler } from 'app/pages/system/view-enclosure/classes/system-profiler';
import { AppLoaderService, WebSocketService } from 'app/services';
import { AppState } from 'app/store';
import { waitForSystemInfo } from 'app/store/system-info/system-info.selectors';

@UntilDestroy()
@Component({
  selector: 'ix-pool-manager-wizard',
  templateUrl: './pool-manager-wizard.component.html',
  styleUrls: ['./pool-manager-wizard.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PoolManagerWizardComponent implements OnInit {
  system: SystemProfiler;
  form = this.fb.group({
    general: this.fb.group({
      name: ['', Validators.required],
      encryption: [false, Validators.required],
    }),
    data: this.fb.group({}),
    log: this.fb.group({}),
    spare: this.fb.group({}),
    cache: this.fb.group({}),
    metadata: this.fb.group({}),
    review: this.fb.group({}),
  });

  constructor(
    private fb: FormBuilder,
    private dialog: MatDialog,
    private ws: WebSocketService,
    private store$: Store<AppState>,
    private appLoader: AppLoaderService,
  ) {}

  ngOnInit(): void {
    this.appLoader.open();
    combineLatest([
      this.ws.call('enclosure.query'),
      this.ws.call('disk.query'),
      this.store$.pipe(waitForSystemInfo),
    ])
      .pipe(untilDestroyed(this))
      .subscribe(([enclosures, disks, sysInfo]) => {
        this.appLoader.close();
        const systemProduct = sysInfo.system_product;
        this.system = new SystemProfiler(systemProduct, enclosures);
        this.system.diskData = disks;
      });
  }

  openManualDiskSelection(): void {
    this.dialog.open(ManualDiskSelectionComponent, { data: this.system });
  }
}
