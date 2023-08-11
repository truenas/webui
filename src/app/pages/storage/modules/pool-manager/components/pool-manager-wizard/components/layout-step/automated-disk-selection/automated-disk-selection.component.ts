import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
} from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import _ from 'lodash';
import { of, take } from 'rxjs';
import { CreateVdevLayout, vdevLayoutOptions, VdevType } from 'app/enums/v-dev-type.enum';
import { SelectOption } from 'app/interfaces/option.interface';
import { IxSimpleChanges } from 'app/interfaces/simple-changes.interface';
import { UnusedDisk } from 'app/interfaces/storage.interface';
import { PoolManagerStore } from 'app/pages/storage/modules/pool-manager/store/pool-manager.store';
import { minDisksPerLayout } from 'app/pages/storage/modules/pool-manager/utils/min-disks-per-layout.constant';

// TODO: Is this component useless?
@UntilDestroy()
@Component({
  selector: 'ix-automated-disk-selection',
  templateUrl: './automated-disk-selection.component.html',
  styleUrls: ['./automated-disk-selection.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AutomatedDiskSelectionComponent implements OnInit, OnChanges {
  @Input() isStepActive: boolean;
  @Input() type: VdevType;
  @Input() inventory: UnusedDisk[] = [];
  @Input() canChangeLayout = false;
  @Input() limitLayouts: CreateVdevLayout[] = [];

  @Output() manualSelectionClicked = new EventEmitter<void>();

  readonly layoutControl = new FormControl(CreateVdevLayout.Stripe, Validators.required);

  protected vdevLayoutOptions$ = of<SelectOption<CreateVdevLayout>[]>([]);

  private minDisks = minDisksPerLayout;

  constructor(
    private translate: TranslateService,
    protected store: PoolManagerStore,
  ) {}

  protected get minDisksMessage(): string {
    const layout = vdevLayoutOptions.find((option) => option.value === this.layoutControl.value)?.label;
    return this.translate.instant('Minimum number of disks required for {layout} layout is {n}.', {
      layout,
      n: this.minDisks[this.layoutControl.value],
    });
  }

  protected get usesDraidLayout(): boolean {
    return [
      CreateVdevLayout.Draid1,
      CreateVdevLayout.Draid2,
      CreateVdevLayout.Draid3,
    ].includes(this.layoutControl.value);
  }

  // get isSizeSelected(): boolean {
  //   return !!this.form.value.sizeAndType?.length
  //     && !!this.form.value.sizeAndType[0]
  //     && !!this.form.value.sizeAndType[1];
  // }

  get isLayoutSelected(): boolean {
    return Boolean(this.layoutControl.value);
  }

  // get isWidthSelected(): boolean {
  //   return !!this.form.value.width;
  // }

  protected get isSpareVdev(): boolean {
    return this.type === VdevType.Spare;
  }

  ngOnInit(): void {
    // this.initControls();
    // TODO: Move to a separate method.
    this.layoutControl.valueChanges.pipe(untilDestroyed(this)).subscribe((layout) => {
      this.store.setAutomaticTopologyCategory(this.type, { layout });
    });

    this.store.startOver$.pipe(untilDestroyed(this)).subscribe(() => {
      this.resetToDefaults();
    });

    this.store.resetStep$.pipe(untilDestroyed(this)).subscribe((vdevType: VdevType) => {
      if (vdevType === this.type) {
        this.resetToDefaults();
      }
    });

    if (this.isSpareVdev) {
      this.form.controls.vdevsNumber.disable();
    }
  }

  private resetToDefaults(): void {
    // this.form.reset({
    //   sizeAndType: [null, null],
    //   width: null,
    //   treatDiskSizeAsMinimum: false,
    //   vdevsNumber: null,
    // });
  }

  ngOnChanges(changes: IxSimpleChanges<this>): void {
    if (
      changes.limitLayouts?.currentValue
      && !_.isEqual(changes.limitLayouts.currentValue, changes.limitLayouts.previousValue)
    ) {
      this.updateLayoutOptionsFromLimitedLayouts(changes.limitLayouts.currentValue);
    }
  }

  private updateLayoutOptionsFromLimitedLayouts(limitLayouts: CreateVdevLayout[]): void {
    const allowedLayouts = vdevLayoutOptions.filter((option) => limitLayouts.includes(option.value));
    this.vdevLayoutOptions$ = of(allowedLayouts);
    const isChangeLayoutFalse = this.canChangeLayout !== null
      && this.canChangeLayout !== undefined
      && !this.canChangeLayout;
    const isValueSame = limitLayouts[0] === this.layoutControl.value;
    if (isChangeLayoutFalse && limitLayouts.length && !isValueSame) {
      this.layoutControl.setValue(limitLayouts[0]);
    }
    // this.updateWidthOptions();
  }

  private updateLayoutOptions(): void {
    // TODO: Nuke
    const layoutOptions = vdevLayoutOptions.filter((option) => {
      return this.inventory.length >= this.minDisks[option.value];
    });

    const isValueNull = this.layoutControl.value === null;
    if (!isValueNull && !layoutOptions.some((option) => option.value === this.layoutControl.value)) {
      this.layoutControl.setValue(null, { emitEvent: false });
    }
    this.store.getLayoutsForVdevType(this.type)
      .pipe(
        take(1),
        untilDestroyed(this),
      )
      .subscribe({
        next: (allowedVdevTypes) => {
          this.vdevLayoutOptions$ = of(layoutOptions.filter(
            (layout) => !!allowedVdevTypes.includes(layout.value),
          ));
          // this.updateWidthOptions();
        },
      });
  }
}
