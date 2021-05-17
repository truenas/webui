import {
  Component, AfterViewInit, Input, ViewChild, OnChanges, SimpleChanges, OnDestroy, Output, EventEmitter,
} from '@angular/core';
import { CoreServiceInjector } from 'app/core/services/coreserviceinjector';
import { MaterialModule } from 'app/appMaterial.module';
import { NgForm } from '@angular/forms';
import { ChartData } from 'app/core/components/viewchart/viewchart.component';
import { CoreEvent } from 'app/interfaces/events';
import { Subject } from 'rxjs';
import { FlexLayoutModule, MediaObserver } from '@angular/flex-layout';

import { Router } from '@angular/router';
import { UUID } from 'angular2-uuid';
import * as d3 from 'd3';

import filesize from 'filesize';
import { WidgetComponent } from 'app/core/components/widgets/widget/widget.component';

import { ViewChartGaugeComponent } from 'app/core/components/viewchartgauge/viewchartgauge.component';
import { ViewChartBarComponent } from 'app/core/components/viewchartbar/viewchartbar.component';
import { TranslateService } from '@ngx-translate/core';

import { EmptyType, EmptyConfig, EntityEmptyComponent } from 'app/pages/common/entity/entity-empty/entity-empty.component';
import { EntityToolbarComponent } from 'app/pages/common/entity/entity-toolbar/entity-toolbar.component';
import { ToolbarConfig } from 'app/pages/common/entity/entity-toolbar/models/control-config.interface';

import { T } from '../../../../translate-marker';

export interface DashConfigItem {
  name: string; // Shown in UI fields
  identifier?: string; // Comma separated 'key,value' eg. pool might have 'name,tank'
  rendered: boolean;
  position?: number;
  id?: string;
}

@Component({
  selector: 'widget-controller',
  templateUrl: './widgetcontroller.component.html',
  styleUrls: ['./widgetcontroller.component.css'],
})
export class WidgetControllerComponent extends WidgetComponent implements AfterViewInit {
  @Input() dashState: DashConfigItem[] = [];
  @Input() renderedWidgets?: number[] = [];
  @Input() hiddenWidgets?: number[] = [];
  @Input() emptyConfig: EmptyConfig;
  @Input() actionsConfig: ToolbarConfig;

  @Output() launcher = new EventEmitter<DashConfigItem>();

  title: string = T('Dashboard');
  subtitle: string = T('Navigation');
  widgetColorCssVar = 'var(--accent)';
  configurable = false;
  screenType = 'Desktop'; // Desktop || Mobile

  constructor(public router: Router, public translate: TranslateService, public mediaObserver: MediaObserver) {
    super(translate);

    mediaObserver.media$.subscribe((evt) => {
      const st = evt.mqAlias == 'xs' ? 'Mobile' : 'Desktop';
      this.screenType = st;
    });
  }

  ngOnDestroy(): void {
    this.core.unregister({ observerClass: this });
  }

  ngAfterViewInit(): void {
    this.core.register({ observerClass: this, eventName: 'ThemeChanged' }).subscribe((evt: CoreEvent) => {
    });
  }

  nameFromIdentifier(identifier: string): string {
    const spl = identifier.split(',');
    const key = spl[0];
    const value = spl[1];

    if (key == 'name') {
      return value;
    }
    return '';
  }

  launchWidget(widget: DashConfigItem): void {
    this.launcher.emit(widget);
  }

  triggerConfigure(): void {
    this.actionsConfig.target.next({ name: 'ToolbarChanged' });
  }
}
