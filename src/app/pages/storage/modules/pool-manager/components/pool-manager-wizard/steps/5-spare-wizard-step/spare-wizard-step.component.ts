import {
  ChangeDetectionStrategy, Component, input, output, OnInit,
  ChangeDetectorRef,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatStepperPrevious, MatStepperNext } from '@angular/material/stepper';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import { filter, merge } from 'rxjs';
import { CreateVdevLayout, VDevType } from 'app/enums/v-dev-type.enum';
import { helptextManager } from 'app/helptext/storage/volumes/manager/manager';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxComboboxComponent } from 'app/modules/forms/ix-forms/components/ix-combobox/ix-combobox.component';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { SpareDiskComboboxProvider } from 'app/pages/storage/modules/pool-manager/components/pool-manager-wizard/steps/5-spare-wizard-step/spare-disk-combobox.provider';
import { PoolManagerStore } from 'app/pages/storage/modules/pool-manager/store/pool-manager.store';

@UntilDestroy()
@Component({
  selector: 'ix-spare-wizard-step',
  templateUrl: './spare-wizard-step.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './spare-wizard-step.component.scss',
  imports: [
    FormActionsComponent,
    MatButton,
    MatStepperPrevious,
    TestDirective,
    MatStepperNext,
    TranslateModule,
    IxComboboxComponent,
    ReactiveFormsModule,
  ],
})
export class SpareWizardStepComponent implements OnInit {
  readonly isStepActive = input<boolean>(false);
  readonly stepWarning = input<string | null>();

  readonly goToLastStep = output();

  protected disks = toSignal(this.store.getInventoryForStep(VDevType.Spare));
  protected readonly spareVdevDisk = new FormControl<string>('');

  protected readonly diskComboboxProvider = new SpareDiskComboboxProvider(this.store);

  protected readonly vDevType = VDevType;
  readonly helptext = helptextManager;

  constructor(
    private store: PoolManagerStore,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.updateSpareTopologyWhenChanged();
    this.listenForResetEvents();
  }

  private listenForResetEvents(): void {
    merge(
      this.store.startOver$,
      this.store.resetStep$.pipe(filter((vdevType) => vdevType === VDevType.Spare)),
    )
      .pipe(
        untilDestroyed(this),
      )
      .subscribe(() => {
        this.spareVdevDisk.setValue('');
        this.cdr.markForCheck();
      });
  }

  private updateSpareTopologyWhenChanged(): void {
    this.store.setTopologyCategoryLayout(VDevType.Spare, CreateVdevLayout.Stripe);
    this.spareVdevDisk.valueChanges.pipe(
      filter(Boolean),
      untilDestroyed(this),
    ).subscribe({
      next: (diskName) => {
        const diskDetails = this.disks().find((disk) => disk.devname === diskName);
        this.store.setManualTopologyCategory(VDevType.Spare, [[diskDetails]]);
        this.store.setAutomaticTopologyCategory(VDevType.Spare, {
          diskSize: diskDetails.size,
          diskType: diskDetails.type,
          layout: CreateVdevLayout.Stripe,
          vdevsNumber: 1,
          width: 1,
        });
      },
    });
  }

  protected goToReviewStep(): void {
    this.goToLastStep.emit();
  }

  protected resetStep(): void {
    this.store.resetStep(VDevType.Spare);
  }
}
