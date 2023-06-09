import {
  ChangeDetectorRef, Component, EventEmitter, OnInit, Output,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { VdevType } from 'app/enums/v-dev-type.enum';
import {
  InspectVdevsDialogComponent,
} from 'app/pages/storage/modules/pool-manager/components/inspect-vdevs-dialog/inspect-vdevs-dialog.component';
import { PoolManagerStore, PoolManagerTopology } from 'app/pages/storage/modules/pool-manager/store/pool-manager.store';

@UntilDestroy()
@Component({
  selector: 'ix-review-wizard-step',
  templateUrl: './review-wizard-step.component.html',
  styleUrls: ['./review-wizard-step.component.scss'],
})
export class ReviewWizardStepComponent implements OnInit {
  @Output() createPool = new EventEmitter<void>();

  topology: PoolManagerTopology;

  constructor(
    private matDialog: MatDialog,
    private store: PoolManagerStore,
    private cdr: ChangeDetectorRef,
  ) {}

  get hasVdevs(): boolean {
    return Object.keys(this.topology).some((type) => {
      return this.topology[type as VdevType].vdevs.length > 0;
    });
  }

  ngOnInit(): void {
    this.store.topology$.pipe(untilDestroyed(this)).subscribe((topology) => {
      this.topology = topology;
      this.cdr.markForCheck();
    });
  }

  onInspectVdevsPressed(): void {
    this.matDialog.open(InspectVdevsDialogComponent, {
      data: this.topology,
      panelClass: 'inspect-vdevs-dialog',
    });
  }
}
