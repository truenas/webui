import {
  ChangeDetectionStrategy,
  Component,
  ChangeDetectorRef,
} from '@angular/core';
import { FormGroup } from '@angular/forms';
import { FormBuilder, FormControl } from '@ngneat/reactive-forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { Subject } from 'rxjs';
import { CoreEvent } from 'app/interfaces/events';
import { FormErrorHandlerService } from 'app/pages/common/ix-forms/services/form-error-handler.service';
import { DashConfigItem } from 'app/pages/dashboard/components/widget-controller/widget-controller.component';
import { WebSocketService } from 'app/services';
import { IxSlideInService } from 'app/services/ix-slide-in.service';

@UntilDestroy()
@Component({
  selector: 'app-dashboard-form',
  templateUrl: './dashboard-form.component.html',
  styleUrls: ['./dashboard-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardFormComponent {
  title = 'Dashboard Configuration';

  formGroup: FormGroup = this.formBuilder.group({
    name: ['default', []],
  });

  dashState: DashConfigItem[] = [];
  systemWidgets: DashConfigItem[] = [];
  storageWidgets: DashConfigItem[] = [];
  networkWidgets: DashConfigItem[] = [];

  isFormLoading = false;
  formEvents$: Subject<CoreEvent>;

  /* tooltips: BootenvTooltip = {
    name: helptextSystemBootenv.create_name_tooltip,
  }; */

  constructor(
    private translate: TranslateService,
    private formBuilder: FormBuilder,
    private ws: WebSocketService,
    private slideInService: IxSlideInService,
    private errorHandler: FormErrorHandlerService,
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

  setupForm(dashState: DashConfigItem[], formEvents$: Subject<CoreEvent>): void {
    this.formEvents$ = formEvents$;
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
        case 'Memory':
          this.systemWidgets.push(widget);
          break;
      }

      this.formGroup.addControl(
        this.extractName(widget),
        new FormControl({ value: widget.rendered, disabled: false }),
      );
    });

    this.changeDetectorRef.detectChanges();
  }

  onSubmit(): void {
    const clone = Object.assign([], this.dashState);
    const keys = Object.keys(this.formGroup.value);

    // Apply
    keys.forEach((key) => {
      const value = this.formGroup.value[key];
      const dashItem = clone.find((widget) => {
        if (widget.identifier) {
          const spl = widget.identifier.split(',');
          const name = spl[1];
          return key == name;
        }
        return key == widget.name;
      });

      if (dashItem) {
        dashItem.rendered = value;
      }
    });

    this.dashState = clone;

    // Save to backend
    this.ws.call('user.set_attribute', [1, 'dashState', clone]).pipe(untilDestroyed(this)).subscribe((res) => {
      if (!res) {
        throw new Error('Unable to save Dashboard State');
      }
    });

    this.formEvents$.next({
      name: 'FormSubmit',
      data: this.dashState,
    });
    this.slideInService.close();
  }
}
