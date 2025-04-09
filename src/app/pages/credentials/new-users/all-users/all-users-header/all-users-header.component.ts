import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatAnchor } from '@angular/material/button';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateModule } from '@ngx-translate/core';
import { filter } from 'rxjs';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { allUsersHeaderElements } from 'app/pages/credentials/new-users/all-users/all-users-header/all-users-header.elements';
import { UserFormComponent } from 'app/pages/credentials/new-users/user-form/user-form.component';
import { AppState } from 'app/store';

@UntilDestroy()
@Component({
  selector: 'ix-all-users-header',
  templateUrl: './all-users-header.component.html',
  styleUrls: ['./all-users-header.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TranslateModule,
    TestDirective,
    MatAnchor,
    UiSearchDirective,
  ],
})
export class AllUsersHeaderComponent {
  protected readonly searchableElements = allUsersHeaderElements;

  constructor(
    private slideIn: SlideIn,
    private store$: Store<AppState>,
  ) {}

  doAdd(): void {
    this.slideIn.open(UserFormComponent, { wide: false }).pipe(
      filter(({ response }) => response),
      untilDestroyed(this),
    ).subscribe({
      next: () => {
        // TODO: Refresh user list
      },
    });
  }
}
