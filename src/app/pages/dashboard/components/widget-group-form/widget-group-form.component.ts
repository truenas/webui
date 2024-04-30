import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { of } from 'rxjs';
import { ChainedRef } from 'app/modules/ix-forms/components/ix-slide-in/chained-component-ref';
import { WidgetGroup, WidgetGroupLayout, widgetGroupIcons } from 'app/pages/dashboard/types/widget-group.interface';

@UntilDestroy()
@Component({
  selector: 'ix-widget-group-form',
  templateUrl: './widget-group-form.component.html',
  styleUrls: ['./widget-group-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WidgetGroupFormComponent {
  protected group: WidgetGroup;
  protected selectedSlot = 0;
  protected form = this.formBuilder.group({
    template: [''],
    layout: [WidgetGroupLayout.Full],
  });
  readonly layoutsMap = widgetGroupIcons;

  // TODO: Implement template options
  templateOptions$ = of([]);

  constructor(
    private formBuilder: FormBuilder,
    private chainedRef: ChainedRef<WidgetGroup>,
    private cdr: ChangeDetectorRef,
  ) {
    this.group = chainedRef.getData();
    this.form.controls.layout.setValue(this.group.layout);
    this.form.controls.layout.valueChanges
      .pipe(untilDestroyed(this))
      .subscribe((layout) => {
        this.group.layout = layout;
        this.cdr.markForCheck();
      });
  }

  onSubmit(): void {
    this.chainedRef.close({
      response: null,
      error: false,
    });
  }
}
