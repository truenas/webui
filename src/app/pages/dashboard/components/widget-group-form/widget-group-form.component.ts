import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ChainedRef } from 'app/modules/ix-forms/components/ix-slide-in/chained-component-ref';
import { WidgetGroup } from 'app/pages/dashboard/types/widget-group.interface';

@Component({
  selector: 'ix-widget-group-form',
  templateUrl: './widget-group-form.component.html',
  styleUrls: ['./widget-group-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WidgetGroupFormComponent {
  protected group: WidgetGroup;
  protected selectedSlot = 0;

  constructor(
    private chainedRef: ChainedRef<WidgetGroup>,
  ) {
    this.group = chainedRef.getData();
  }

  onSubmit(): void {
    this.chainedRef.close({
      response: null,
      error: false,
    });
  }
}
