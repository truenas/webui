import { AsyncPipe, NgTemplateOutlet } from '@angular/common';
import {
  Component, ChangeDetectionStrategy,
  output,
  input,
  effect,
  signal,
} from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { injectParams } from 'ngxtension/inject-params';
import { of } from 'rxjs';
import { User } from 'app/interfaces/user.interface';
import { EmptyService } from 'app/modules/empty/empty.service';
import { UiSearchDirectivesService } from 'app/modules/global-search/services/ui-search-directives.service';
import { ApiDataProvider } from 'app/modules/ix-table/classes/api-data-provider/api-data-provider';
import { IxTableComponent } from 'app/modules/ix-table/components/ix-table/ix-table.component';
import { templateColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-template/ix-cell-template.component';
import { textColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-text/ix-cell-text.component';
import { yesNoColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-yes-no/ix-cell-yes-no.component';
import { IxTableBodyComponent } from 'app/modules/ix-table/components/ix-table-body/ix-table-body.component';
import { IxTableHeadComponent } from 'app/modules/ix-table/components/ix-table-head/ix-table-head.component';
import { IxTablePagerComponent } from 'app/modules/ix-table/components/ix-table-pager/ix-table-pager.component';
import { IxTableCellDirective } from 'app/modules/ix-table/directives/ix-table-cell.directive';
import { IxTableEmptyDirective } from 'app/modules/ix-table/directives/ix-table-empty.directive';
import { TablePagination } from 'app/modules/ix-table/interfaces/table-pagination.interface';
import { createTable } from 'app/modules/ix-table/utils';
import { UsersSearchComponent } from 'app/pages/credentials/new-users/all-users/users-search/users-search.component';
import { UserAccessCellComponent } from './user-access-cell/user-access-cell.component';

@UntilDestroy()
@Component({
  selector: 'ix-user-list',
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TranslateModule,
    AsyncPipe,
    IxTableBodyComponent,
    IxTableComponent,
    IxTableEmptyDirective,
    IxTableHeadComponent,
    IxTablePagerComponent,
    IxTableCellDirective,
    NgTemplateOutlet,
    UsersSearchComponent,
    UserAccessCellComponent,
  ],
})
export class UserListComponent {
  readonly userName = injectParams('id');

  readonly isMobileView = input<boolean>();
  readonly toggleShowMobileDetails = output<boolean>();
  readonly userSelected = output<User>();
  protected readonly currentBatch = signal<User[]>([]);
  // TODO: NAS-135333 - Handle case after url linking is implemented to decide when no to show selected user
  readonly isSelectedUserVisible$ = of(true);
  readonly dataProvider = input.required<ApiDataProvider<'user.query'>>();

  protected readonly pagination: TablePagination = {
    pageSize: 50,
    pageNumber: 1,
  };

  protected columns = createTable<User>([
    textColumn({
      title: this.translate.instant('Username'),
      propertyName: 'username',
    }),
    textColumn({
      title: this.translate.instant('UID'),
      propertyName: 'uid',
    }),
    yesNoColumn({
      title: this.translate.instant('Built in'),
      propertyName: 'builtin',
    }),
    textColumn({
      title: this.translate.instant('Full Name'),
      propertyName: 'full_name',
    }),
    templateColumn({
      title: this.translate.instant('Access'),
      propertyName: 'roles',
    }),
  ], {
    uniqueRowTag: (row) => 'user-' + row.username,
    ariaLabels: (row) => [row.username, this.translate.instant('User')],
  });

  constructor(
    protected emptyService: EmptyService,
    private translate: TranslateService,
    private searchDirectives: UiSearchDirectivesService,
  ) {
    effect(() => {
      const dataProvider = this.dataProvider();
      if (!dataProvider) {
        return;
      }

      dataProvider.currentPage$.pipe(
        untilDestroyed(this),
      ).subscribe({
        next: (users) => {
          this.currentBatch.set(users);
          this.userSelected.emit(users[0]);
        },
      });
    });
    setTimeout(() => {
      this.handlePendingGlobalSearchElement();
    });
  }

  navigateToDetails(user: User): void {
    this.userSelected.emit(user);

    if (this.isMobileView()) {
      this.toggleShowMobileDetails.emit(true);
    }
  }

  private handlePendingGlobalSearchElement(): void {
    const pendingHighlightElement = this.searchDirectives.pendingUiHighlightElement;

    if (pendingHighlightElement) {
      this.searchDirectives.get(pendingHighlightElement)?.highlight(pendingHighlightElement);
    }
  }

  expanded(row: User): void {
    this.navigateToDetails(row);
    if (!row || !this.isMobileView()) return;
    this.toggleShowMobileDetails.emit(true);
  }
}
