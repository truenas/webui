import {
  ChangeDetectionStrategy, Component, input, output,
  signal, OnInit,
} from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatStepperPrevious, MatStepperNext } from '@angular/material/stepper';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import { filter } from 'rxjs';
import { CreateVdevLayout, VdevType } from 'app/enums/v-dev-type.enum';
import { helptextManager } from 'app/helptext/storage/volumes/manager/manager';
import { DetailsDisk } from 'app/interfaces/disk.interface';
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
  standalone: true,
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

  protected disks = signal<DetailsDisk[]>([]);
  protected readonly spareVdevDisk = new FormControl<string>('');

  protected readonly diskComboboxProvider = new SpareDiskComboboxProvider(this.store);

  protected readonly VdevType = VdevType;
  readonly helptext = helptextManager;

  constructor(
    private store: PoolManagerStore,
  ) {}

  ngOnInit(): void {
    this.updateSpareTopologyWhenChanged();
  }

  protected updateSpareTopologyWhenChanged(): void {
    this.store.setTopologyCategoryLayout(VdevType.Spare, CreateVdevLayout.Stripe);
    this.spareVdevDisk.valueChanges.pipe(
      filter(Boolean),
      untilDestroyed(this),
    ).subscribe({
      next: (diskName) => {
        this.store.setManualTopologyCategory(
          VdevType.Spare,
          [[this.disks().find((disk) => disk.name === diskName)]],
        );
      },
    });
  }

  goToReviewStep(): void {
    this.goToLastStep.emit();
  }

  resetStep(): void {
    this.store.resetStep(VdevType.Spare);
  }
}
