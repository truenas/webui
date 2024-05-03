import { Directive, OnInit, input } from '@angular/core';
import { ValidationErrors } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Observable } from 'rxjs';
import { WidgetGroupFormStore } from 'app/pages/dashboard/components/widget-group-form/widget-group-form.store';
import { SomeWidgetSettings } from 'app/pages/dashboard/types/widget.interface';

@UntilDestroy()
@Directive()
export abstract class WidgetSettingsDirective<Settings extends SomeWidgetSettings = null> implements OnInit {
  protected slotIndex = input.required<number>();
  abstract updateSettingsInStore(): void;
  abstract getFormValidationErrors(): ValidationErrors;
  /**
   * Returns an observable that emits when validation updates for any part of the form.
   * Ensure it only emits if the value actually changes with distinctUntilChanged() pipe to avoid
   * infinite recursion
   */
  abstract getFormUpdater(): Observable<Settings>;

  constructor(protected widgetGroupFormStore: WidgetGroupFormStore) { }

  ngOnInit(): void {
    this.getFormUpdater().pipe(untilDestroyed(this)).subscribe({
      next: () => {
        this.updateSettingsInStore();
        this.widgetGroupFormStore.setValidationErrors({
          slotIndex: this.slotIndex(),
          errors: this.getFormValidationErrors(),
        });
      },
    });
  }
}
