import {
  ChangeDetectionStrategy, Component, computed, DestroyRef, effect, input, OnInit, output, inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import {
  TnButtonComponent,
  TnCheckboxComponent,
  TnDialog,
  TnFormFieldComponent,
  TnStepperPreviousDirective,
  TnTestIdDirective,
} from '@truenas/ui-components';
import { filter } from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { EntitlementFeature } from 'app/enums/entitlement-feature.enum';
import { Role } from 'app/enums/role.enum';
import { VDevType, vdevTypeLabels } from 'app/enums/v-dev-type.enum';
import { isTopologyLimitedToOneLayout } from 'app/helpers/storage.helper';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { FileSizePipe } from 'app/modules/pipes/file-size/file-size.pipe';
import { MapValuePipe } from 'app/modules/pipes/map-value/map-value.pipe';
import {
  InspectVdevsDialog,
} from 'app/pages/storage/modules/pool-manager/components/inspect-vdevs-dialog/inspect-vdevs-dialog.component';
import { EncryptionType } from 'app/pages/storage/modules/pool-manager/enums/encryption-type.enum';
import { PoolCreationSeverity } from 'app/pages/storage/modules/pool-manager/enums/pool-creation-severity';
import { TopologyCategoryDescriptionPipe } from 'app/pages/storage/modules/pool-manager/pipes/topology-category-description.pipe';
import { PoolManagerValidationService } from 'app/pages/storage/modules/pool-manager/store/pool-manager-validation.service';
import {
  PoolManagerStore,
  PoolManagerTopologyCategory,
} from 'app/pages/storage/modules/pool-manager/store/pool-manager.store';
import { EntitlementsService } from 'app/services/entitlements.service';

@Component({
  selector: 'ix-review-wizard-step',
  templateUrl: './review-wizard-step.component.html',
  styleUrls: ['./review-wizard-step.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TnTestIdDirective,
    TnButtonComponent,
    TnStepperPreviousDirective,
    RequiresRolesDirective,
    ReactiveFormsModule,
    TnFormFieldComponent,
    TnCheckboxComponent,
    TranslateModule,
    FileSizePipe,
    MapValuePipe,
    TopologyCategoryDescriptionPipe,
    FormActionsComponent,
  ],
})
export class ReviewWizardStepComponent implements OnInit {
  private tnDialog = inject(TnDialog);
  private store = inject(PoolManagerStore);
  private entitlements = inject(EntitlementsService);
  private dialogService = inject(DialogService);
  private translate = inject(TranslateService);
  private poolManagerValidation = inject(PoolManagerValidationService);
  private destroyRef = inject(DestroyRef);

  readonly isAddingVdevs = input<boolean>();

  readonly vDevType = VDevType;
  readonly createPool = output();

  // Middleware rejects force_topology on systems with a support entitlement.
  protected readonly hasSupport = this.entitlements.entitled(EntitlementFeature.Support);
  protected readonly forceTopologyControl = new FormControl(false, { nonNullable: true });

  protected readonly name = this.store.name;
  protected readonly encryptionType = this.store.encryptionType;
  protected readonly enclosureSettings = this.store.enclosureSettings;
  protected readonly nonEmptyTopologyCategories = computed(() => {
    return Object.entries(this.store.topology())
      .filter(([, category]) => category.vdevs.length > 0) as [VDevType, PoolManagerTopologyCategory][];
  });

  protected readonly poolCreationErrors = this.poolManagerValidation.poolCreationErrors;
  protected readonly isCreateDisabled = computed(() => {
    return this.poolCreationErrors().some((error) => error.severity === PoolCreationSeverity.Error);
  });

  protected totalCapacity = this.store.totalUsableCapacity;
  protected readonly vdevTypeLabels = vdevTypeLabels;
  protected isLimitedToOneLayout = isTopologyLimitedToOneLayout;

  protected readonly Role = Role;
  protected readonly EncryptionType = EncryptionType;

  protected readonly showStartOver = computed(() => {
    return Boolean(
      this.name()
      || this.encryptionType() !== EncryptionType.None
      || this.nonEmptyTopologyCategories().length,
    );
  });

  protected readonly hasVdevs = computed(() => this.nonEmptyTopologyCategories().length > 0);

  protected readonly limitToEnclosureName = computed(() => {
    const limitToSingleEnclosure = this.enclosureSettings().limitToSingleEnclosure;
    if (limitToSingleEnclosure === null) {
      return undefined;
    }

    return this.store.enclosures().find((enclosure) => enclosure.id === limitToSingleEnclosure)?.name;
  });

  constructor() {
    // Keep the checkbox in sync with the store so a reset/Start Over (which sets
    // forceTopology back to false) unchecks it, instead of leaving a checked box
    // whose value is no longer reflected in the payload. emitEvent: false avoids
    // looping back through the valueChanges subscription below.
    effect(() => {
      this.forceTopologyControl.setValue(this.store.forceTopology(), { emitEvent: false });
    });
  }

  ngOnInit(): void {
    this.forceTopologyControl.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((forceTopology) => {
      this.store.setForceTopology(forceTopology);
    });
  }

  onInspectVdevsPressed(): void {
    this.tnDialog.open(InspectVdevsDialog, {
      data: {
        topology: this.store.topology(),
        enclosures: this.store.enclosures(),
      },
      panelClass: 'inspect-vdevs-dialog',
    });
  }

  startOver(): void {
    this.dialogService
      .confirm({
        title: this.translate.instant('Start Over'),
        message: this.translate.instant('Are you sure you want to start over?'),
        hideCheckbox: false,
        buttonText: this.translate.instant('Start Over'),
      })
      .pipe(
        filter(Boolean),
        takeUntilDestroyed(this.destroyRef),
      ).subscribe(() => {
        this.store.startOver();
      });
  }
}
