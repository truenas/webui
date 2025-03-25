import {
  ChangeDetectionStrategy, Component, input, output,
  signal, OnInit,
} from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatStepperPrevious, MatStepperNext } from '@angular/material/stepper';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import { map } from 'rxjs';
import { CreateVdevLayout, VdevType } from 'app/enums/v-dev-type.enum';
import { helptextManager } from 'app/helptext/storage/volumes/manager/manager';
import { DetailsDisk } from 'app/interfaces/disk.interface';
import { SelectOption } from 'app/interfaces/option.interface';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxSelectComponent } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.component';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { AddVdevsStore } from 'app/pages/storage/modules/pool-manager/components/add-vdevs/store/add-vdevs-store.service';
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
    IxSelectComponent,
    ReactiveFormsModule,
  ],
})
export class SpareWizardStepComponent implements OnInit {
  readonly isStepActive = input<boolean>(false);
  readonly stepWarning = input<string | null>();

  readonly goToLastStep = output();

  private disks = signal<DetailsDisk[]>([]);
  protected readonly spareVdevDisk = new FormControl<string>('', Validators.required);
  protected readonly spareVdevDiskOptions$ = this.store.getInventoryForStep(VdevType.Spare).pipe(
    map((disks) => {
      this.disks.set(disks);
      return disks.map((disk) => ({ label: disk.name, value: disk.name } as SelectOption));
    }),
  );

  protected readonly VdevType = VdevType;
  readonly helptext = helptextManager;

  constructor(
    private store: PoolManagerStore,
    private addVdevsStore: AddVdevsStore,
  ) {}

  ngOnInit(): void {
    this.updateSpareTopologyWhenChanged();
  }

  protected updateSpareTopologyWhenChanged(): void {
    this.store.setTopologyCategoryLayout(VdevType.Spare, CreateVdevLayout.Stripe);
    this.spareVdevDisk.valueChanges.pipe(
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
