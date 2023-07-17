import {
  ChangeDetectionStrategy,
  Component,
  ChangeDetectorRef,
  Inject,
  OnInit,
} from '@angular/core';
import { FormBuilder, FormControl } from '@angular/forms';
import { ControlsOf } from '@ngneat/reactive-forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { Subject } from 'rxjs';
import { IxSlideInRef } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in-ref';
import { SLIDE_IN_DATA } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in.token';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { WidgetName } from 'app/pages/dashboard/components/dashboard/dashboard.component';
import { DashConfigItem } from 'app/pages/dashboard/components/widget-controller/widget-controller.component';
import { WebSocketService } from 'app/services/ws.service';

interface DashboardFormValue {
  [key: string]: boolean;
}

@UntilDestroy()
@Component({
  templateUrl: './dashboard-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardFormComponent implements OnInit {
  form = this.formBuilder.group<ControlsOf<DashboardFormValue>>({});
  isFormLoading = true;

  systemWidgets: DashConfigItem[] = [];
  storageWidgets: DashConfigItem[] = [];
  networkWidgets: DashConfigItem[] = [];

  onSubmit$ = new Subject<DashConfigItem[]>();

  constructor(
    private formBuilder: FormBuilder,
    private ws: WebSocketService,
    private translate: TranslateService,
    private snackbar: SnackbarService,
    private changeDetectorRef: ChangeDetectorRef,
    private slideInRef: IxSlideInRef<DashboardFormComponent>,
    @Inject(SLIDE_IN_DATA) private dashState: DashConfigItem[] = [],
  ) { }

  ngOnInit(): void {
    this.setupForm();
  }

  extractName(widget: DashConfigItem): string {
    const name = widget.name;
    if (widget.identifier) {
      return widget.identifier.split(',')[1];
    }
    return name;
  }

  setupForm(): void {
    this.dashState.forEach((widget) => {
      switch (widget.name) {
        case WidgetName.Storage:
        case WidgetName.Pool:
          this.storageWidgets.push(widget);
          break;
        case WidgetName.Network:
        case WidgetName.Interface:
          this.networkWidgets.push(widget);
          break;
        case WidgetName.SystemInformation:
        case WidgetName.Cpu:
        case WidgetName.Help:
        case WidgetName.Memory:
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
      let identifier: string = widget.name;
      if (widget.identifier) {
        identifier = widget.identifier.split(',')[1];
      }
      if (keys.includes(identifier)) {
        return { ...widget, rendered: this.form.value[identifier] as boolean };
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
        this.slideInRef.close(this.dashState);
      },
      error: (err) => {
        console.error(err);
      },
    });
  }
}
