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
import { of } from 'rxjs';
import { User } from 'app/interfaces/user.interface';
import { EmptyService } from 'app/modules/empty/empty.service';
import { UiSearchDirectivesService } from 'app/modules/global-search/services/ui-search-directives.service';
import { IxTableComponent } from 'app/modules/ix-table/components/ix-table/ix-table.component';
import { templateColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-template/ix-cell-template.component';
import { textColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-text/ix-cell-text.component';
import { yesNoColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-yes-no/ix-cell-yes-no.component';
import { IxTableBodyComponent } from 'app/modules/ix-table/components/ix-table-body/ix-table-body.component';
import { IxTableHeadComponent } from 'app/modules/ix-table/components/ix-table-head/ix-table-head.component';
import { IxTablePagerComponent } from 'app/modules/ix-table/components/ix-table-pager/ix-table-pager.component';
import { IxTableCellDirective } from 'app/modules/ix-table/directives/ix-table-cell.directive';
import { IxTableEmptyDirective } from 'app/modules/ix-table/directives/ix-table-empty.directive';
import { createTable } from 'app/modules/ix-table/utils';
import { UsersDataProvider } from 'app/pages/credentials/new-users/all-users/users-data-provider';
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
  readonly isMobileView = input<boolean>(); // Used across components
  readonly toggleShowMobileDetails = output<boolean>(); // Output - public by convention
  readonly userSelected = output<User>(); // Output - public by convention
  private readonly currentBatch = signal<User[]>([]); // Only used in TS
  // TODO: NAS-135333 - Handle case after url linking is implemented to decide when no to show selected user
  readonly isSelectedUserVisible$ = of(true); // Used across components
  readonly dataProvider = input.required<UsersDataProvider>(); // Used across components

  protected columns = createTable<User>([ // Used in template
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
          if (users.length > 0) {
            this.userSelected.emit(users[0]);
          }
        },
      });
    });
    setTimeout(() => {
      this.handlePendingGlobalSearchElement();
    });
  }

  private navigateToDetails(user: User): void { // Only used in TS
    if (user) {
      this.userSelected.emit(user);
    }

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

  protected expanded(row: User): void { // Used in template
    this.navigateToDetails(row);
    if (!row || !this.isMobileView()) return;
    this.toggleShowMobileDetails.emit(true);
  }
}
