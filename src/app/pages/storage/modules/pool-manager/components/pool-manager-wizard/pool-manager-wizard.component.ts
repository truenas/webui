import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { combineLatest } from 'rxjs';
import { DiskType } from 'app/enums/disk-type.enum';
import { CreateVdevLayout } from 'app/enums/v-dev-type.enum';
import { ManualDiskSelectionComponent } from 'app/pages/storage/modules/pool-manager/components/manual-disk-selection/manual-disk-selection.component';
import { PoolManagerStore } from 'app/pages/storage/modules/pool-manager/store/pools-manager-store.service';
import { SystemProfiler } from 'app/pages/system/view-enclosure/classes/system-profiler';
import { AppLoaderService, WebSocketService2 } from 'app/services';
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
      encryption: [false],
      encryption_standard: [null as string, Validators.required],
    }),
    data: this.fb.group({
      type: [CreateVdevLayout.Stripe, Validators.required],
      size_and_type: [[null, null] as (string | DiskType)[], Validators.required],
      width: [null as number, Validators.required],
      number: [null as number, Validators.required],
    }),
    log: this.fb.group({}),
    spare: this.fb.group({}),
    cache: this.fb.group({}),
    metadata: this.fb.group({}),
    review: this.fb.group({}),
  });

  constructor(
    private fb: FormBuilder,
    private dialog: MatDialog,
    private ws: WebSocketService2,
    private store$: Store<AppState>,
    private appLoader: AppLoaderService,
    private poolManagerStore: PoolManagerStore,
  ) {}

  ngOnInit(): void {
    this.appLoader.open();
    this.poolManagerStore.loadPoolsData();

    this.form.valueChanges.pipe(untilDestroyed(this)).subscribe((formValue) => {
      this.poolManagerStore.updateFormValue(formValue);
    });
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
    this.dialog.open(ManualDiskSelectionComponent, { data: this.system, panelClass: 'manual-selection-dialog' });
  }
}
