import {
  ChangeDetectionStrategy,
  Component,
  ChangeDetectorRef,
} from '@angular/core';
import { FormGroup } from '@angular/forms';
import { FormBuilder, FormControl } from '@ngneat/reactive-forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Subject } from 'rxjs';
import { DashConfigItem } from 'app/pages/dashboard/components/widget-controller/widget-controller.component';
import { WebSocketService } from 'app/services';
import { IxSlideInService } from 'app/services/ix-slide-in.service';

@UntilDestroy()
@Component({
  templateUrl: './dashboard-form.component.html',
  styleUrls: ['./dashboard-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardFormComponent {
  form: FormGroup = this.formBuilder.group({
    name: ['default', []],
  });
  isFormLoading = true;

  dashState: DashConfigItem[] = [];
  systemWidgets: DashConfigItem[] = [];
  storageWidgets: DashConfigItem[] = [];
  networkWidgets: DashConfigItem[] = [];

  onSubmit$ = new Subject<DashConfigItem[]>();

  constructor(
    private formBuilder: FormBuilder,
    private ws: WebSocketService,
    private slideInService: IxSlideInService,
    private changeDetectorRef: ChangeDetectorRef,
  ) {}

  extractName(widget: DashConfigItem): string {
    const name = widget.name;
    if (widget.identifier) {
      const identifier = widget.identifier.split(',')[1];
      return identifier;
    }
    return name;
  }

  setupForm(dashState: DashConfigItem[]): void {
    this.dashState = dashState;

    dashState.forEach((widget) => {
      switch (widget.name) {
        case 'Storage':
        case 'Pool':
          this.storageWidgets.push(widget);
          break;
        case 'Network':
        case 'Interface':
          this.networkWidgets.push(widget);
          break;
        case 'System Information':
        case 'CPU':
        case 'Help':
        case 'Memory':
          this.systemWidgets.push(widget);
          break;
      }

      this.form.addControl(
        this.extractName(widget),
        new FormControl({ value: widget.rendered, disabled: false }),
      );
    });

    this.isFormLoading = false;
    this.changeDetectorRef.detectChanges();
  }

  onSubmit(): void {
    const clone = Object.assign([], this.dashState);
    const keys = Object.keys(this.form.value);
    this.isFormLoading = true;

    // Apply
    keys.forEach((key) => {
      const value = this.form.value[key];
      const dashItem = clone.find((widget) => {
        if (widget.identifier) {
          const spl = widget.identifier.split(',');
          const name = spl[1];
          return key === name;
        }
        return key === widget.name;
      });

      if (dashItem) {
        dashItem.rendered = value;
      }
    });

    this.dashState = clone;

    // Save to backend
    this.ws.call('user.set_attribute', [1, 'dashState', clone]).pipe(
      untilDestroyed(this),
    ).subscribe((res) => {
      this.isFormLoading = false;
      if (!res) {
        throw new Error('Unable to save Dashboard State');
      }
    });

    this.onSubmit$.next(this.dashState);
    this.slideInService.close();
  }
}
