import {
  Component, Input, Output, EventEmitter,
} from '@angular/core';
import { UntilDestroy } from '@ngneat/until-destroy';
import { EmptyConfig } from 'app/interfaces/empty-config.interface';
import { WidgetName } from 'app/pages/dashboard/components/dashboard/dashboard.component';

export interface DashConfigItem {
  name: WidgetName;
  identifier?: string; // Comma separated 'key,value' eg. pool might have 'name,tank'
  rendered: boolean;
  position?: number;
  id?: string;
}

@UntilDestroy()
@Component({
  selector: 'ix-widget-controller',
  templateUrl: './widget-controller.component.html',
  styleUrls: [
    '../widget/widget.component.scss',
    './widget-controller.component.scss',
  ],
})
export class WidgetControllerComponent {
  @Input() dashState: DashConfigItem[] = [];
  @Input() renderedWidgets?: DashConfigItem[] = [];
  @Input() hiddenWidgets?: number[] = [];
  @Input() emptyConfig: EmptyConfig;

  @Output() launcher = new EventEmitter<DashConfigItem>();

  nameFromIdentifier(identifier: string, widgetName?: WidgetName): string {
    const [key, value] = identifier.split(',');

    if (widgetName === WidgetName.Pool) {
      return value.split(':')[1];
    }

    if (key === 'name') {
      return value;
    }
    return '';
  }

  launchWidget(widget: DashConfigItem): void {
    this.launcher.emit(widget);
  }
}
