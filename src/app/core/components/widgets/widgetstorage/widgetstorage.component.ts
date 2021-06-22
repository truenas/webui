import {
  Component, AfterViewInit, OnDestroy, Input, ChangeDetectorRef, OnChanges,
} from '@angular/core';
import { Router } from '@angular/router';
import { UntilDestroy } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { WidgetComponent } from 'app/core/components/widgets/widget/widget.component';
import { Pool } from 'app/interfaces/pool.interface';
import { T } from 'app/translate-marker';

@UntilDestroy()
@Component({
  selector: 'widget-storage',
  templateUrl: './widgetstorage.component.html',
  styleUrls: ['./widgetstorage.component.scss'],
})
export class WidgetStorageComponent extends WidgetComponent implements AfterViewInit, OnDestroy, OnChanges {
  @Input() pools: Pool[];
  @Input() volumeData: any;
  title: string = T('Pool');

  constructor(public router: Router, public translate: TranslateService, private cdr: ChangeDetectorRef) {
    super(translate);
    this.configurable = false;
  }
  ngAfterViewInit(): void {
    throw new Error('Method not implemented.');
  }
  ngOnChanges(): void {
    throw new Error('Method not implemented.');
  }

  ngOnDestroy(): void {
    this.core.unregister({ observerClass: this });
  }
}
