import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  QueryList,
  ViewChild,
  ViewChildren,
  AfterViewInit,
  TemplateRef,
} from '@angular/core';
import { MatSort, Sort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { select, Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { Observable, combineLatest, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { Group } from 'app/interfaces/group.interface';
import { EmptyConfig, EmptyType } from 'app/modules/entity/entity-empty/entity-empty.component';
import { IxDetailRowDirective } from 'app/modules/ix-tables/directives/ix-detail-row.directive';
import { GroupFormComponent } from 'app/pages/account/groups/group-form/group-form.component';
import { groupPageEntered } from 'app/pages/account/groups/store/group.actions';
import { selectGroupState, selectGroupsTotal, selectGroups } from 'app/pages/account/groups/store/group.selectors';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { LayoutService } from 'app/services/layout.service';
import { AppState } from 'app/store';
import { builtinGroupsToggled } from 'app/store/preferences/preferences.actions';
import { waitForPreferences } from 'app/store/preferences/preferences.selectors';

@UntilDestroy()
@Component({
  templateUrl: './group-list.component.html',
  styleUrls: ['./group-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GroupListComponent implements OnInit, AfterViewInit {
  @ViewChild(MatSort, { static: false }) sort: MatSort;
  @ViewChild('pageHeader') pageHeader: TemplateRef<unknown>;

  displayedColumns: string[] = ['group', 'gid', 'builtin', 'sudo', 'smb', 'actions'];
  dataSource: MatTableDataSource<Group> = new MatTableDataSource([]);
  defaultSort: Sort = { active: 'gid', direction: 'asc' };
  emptyConfig: EmptyConfig = {
    type: EmptyType.NoPageData,
    title: this.translate.instant('No Groups'),
    large: true,
  };
  loadingConfig: EmptyConfig = {
    type: EmptyType.Loading,
    large: false,
    title: this.translate.instant('Loading...'),
  };
  errorConfig: EmptyConfig = {
    type: EmptyType.Errors,
    large: true,
    title: this.translate.instant('Can not retrieve response'),
  };
  expandedRow: Group;
  @ViewChildren(IxDetailRowDirective) private detailRows: QueryList<IxDetailRowDirective>;
  isLoading$ = this.store$.select(selectGroupState).pipe(map((state) => state.isLoading));
  emptyOrErrorConfig$: Observable<EmptyConfig> = combineLatest([
    this.store$.select(selectGroupsTotal).pipe(map((total) => total === 0)),
    this.store$.select(selectGroupState).pipe(map((state) => state.error)),
  ]).pipe(
    switchMap(([, isError]) => {
      if (isError) {
        return of(this.errorConfig);
      }

      return of(this.emptyConfig);
    }),
  );
  hideBuiltinGroups = true;

  constructor(
    private translate: TranslateService,
    private slideIn: IxSlideInService,
    private cdr: ChangeDetectorRef,
    private store$: Store<AppState>,
    private layoutService: LayoutService,
  ) { }

  ngOnInit(): void {
    this.store$.dispatch(groupPageEntered());
    this.getPreferences();
    this.getGroups();
  }

  ngAfterViewInit(): void {
    this.layoutService.pageHeaderUpdater$.next(this.pageHeader);
  }

  getPreferences(): void {
    this.store$.pipe(
      waitForPreferences,
      untilDestroyed(this),
    ).subscribe((preferences) => {
      this.hideBuiltinGroups = preferences.hideBuiltinGroups;
      this.cdr.markForCheck();
    });
  }

  getGroups(): void {
    this.store$.pipe(
      select(selectGroups),
      untilDestroyed(this),
    ).subscribe({
      next: (groups) => {
        this.createDataSource(groups);
        this.cdr.markForCheck();
      },
      error: () => {
        this.createDataSource();
        this.cdr.markForCheck();
      },
    });
  }

  createDataSource(groups: Group[] = []): void {
    this.dataSource = new MatTableDataSource(groups);
    setTimeout(() => {
      // TODO: Figure out how to avoid setTimeout to make it work on first loading
      this.dataSource.sort = this.sort;
      this.cdr.markForCheck();
    }, 0);
  }

  toggleBuiltins(): void {
    this.store$.dispatch(builtinGroupsToggled());
  }

  doAdd(): void {
    this.slideIn.open(GroupFormComponent).setupForm();
  }

  onToggle(row: Group): void {
    this.expandedRow = this.expandedRow === row ? null : row;
    this.toggleDetailRows();
    this.cdr.markForCheck();
  }

  toggleDetailRows(): void {
    this.detailRows.forEach((row) => {
      if (row.expanded && row.ixDetailRow !== this.expandedRow) {
        row.close();
      } else if (!row.expanded && row.ixDetailRow === this.expandedRow) {
        row.open();
      }
    });
  }

  onSearch(query: string): void {
    this.dataSource.filter = query;
  }
}
