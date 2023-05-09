import {
  ChangeDetectionStrategy,
  Component,
  ChangeDetectorRef,
} from '@angular/core';
import { FormBuilder, FormControl } from '@angular/forms';
import { ControlsOf } from '@ngneat/reactive-forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { Subject } from 'rxjs';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { DashConfigItem } from 'app/pages/dashboard/components/widget-controller/widget-controller.component';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { WebSocketService } from 'app/services/ws.service';

interface DashboardFormValue {
  [key: string]: boolean;
}

@UntilDestroy()
@Component({
  templateUrl: './dashboard-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardFormComponent {
  form = this.formBuilder.group<ControlsOf<DashboardFormValue>>({});
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
    private translate: TranslateService,
    private snackbar: SnackbarService,
    private changeDetectorRef: ChangeDetectorRef,
  ) {}

  extractName(widget: DashConfigItem): string {
    const name = widget.name;
    if (widget.identifier) {
      return widget.identifier.split(',')[1];
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
    const keys = Object.keys(this.form.value);
    this.isFormLoading = true;

    const clone: DashConfigItem[] = [...this.dashState].map((widget) => {
      let identifier = widget.name;
      if (widget.identifier) {
        identifier = widget.identifier.split(',')[1];
      }
      if (keys.includes(identifier)) {
        return { ...widget, rendered: this.form.value[identifier] };
      }
      return widget;
    });

    this.dashState = clone;

    // Save to backend
    this.ws.call('auth.set_attribute', ['dashState', clone]).pipe(
      untilDestroyed(this),
    ).subscribe({
      next: () => {
        this.isFormLoading = false;
        this.snackbar.success(this.translate.instant('Dashboard settings saved'));
        this.onSubmit$.next(this.dashState);
        this.slideInService.close();
      },
      error: (err) => {
        console.error(err);
      },
    });
  }
}
