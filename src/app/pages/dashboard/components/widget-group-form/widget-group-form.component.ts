import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { IxSlideInRef } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in-ref';
import { SLIDE_IN_DATA } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in.token';
import { WidgetGroup } from 'app/pages/dashboard/types/widget-group.interface';

@Component({
  selector: 'ix-widget-group-form',
  templateUrl: './widget-group-form.component.html',
  styleUrls: ['./widget-group-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WidgetGroupFormComponent {
  constructor(
    private slideInRef: IxSlideInRef<WidgetGroupFormComponent>,
    @Inject(SLIDE_IN_DATA) private editingGroup: WidgetGroup | null = null,
  ) {}

  onSubmit(): void {
    this.slideInRef.close({} as WidgetGroup);
  }
}
