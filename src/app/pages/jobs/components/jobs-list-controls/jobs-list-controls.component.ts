import {
  AfterViewInit, Component, ElementRef, Input, OnDestroy, ViewChild,
} from '@angular/core';
import { untilDestroyed, UntilDestroy } from '@ngneat/until-destroy';
import { fromEvent, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { GlobalAction } from '../../../../components/common/page-title/page-title.component';
import { JobsListComponent } from '../../jobs-list/jobs-list.component';

@UntilDestroy()
@Component({
  selector: 'app-jobs-list-controls',
  templateUrl: './jobs-list-controls.component.html',
  styleUrls: ['./jobs-list-controls.component.scss'],
})
export class JobsListControlsComponent implements OnDestroy, AfterViewInit, GlobalAction {
  filterValue = '';
  @ViewChild('filter', { static: false }) filter: ElementRef;
  @Input() entity: JobsListComponent;
  private filterSubscription: Subscription;

  resetJobFilter(): void {
    this.filterValue = '';
    this.filter.nativeElement.value = '';
    this.filterJobs('');
  }

  filterJobs(value: string): void {
    this.entity.dataSource.filter = value;
  }

  ngOnDestroy(): void {
    this.filterSubscription?.unsubscribe();
  }

  ngAfterViewInit(): void {
    if (!this.filter) {
      return;
    }

    this.filterSubscription = fromEvent(this.filter.nativeElement, 'keyup')
      .pipe(debounceTime(250), distinctUntilChanged(), untilDestroyed(this))
      .subscribe(() => {
        this.filterValue = this.filter.nativeElement.value || '';
        this.filterJobs(this.filterValue);
      });
  }

  applyConfig(config: JobsListComponent): void {
    if (config) {
      this.entity = config;
    } else {
      throw new Error('This component requires an entity class for a config');
    }
  }
}
