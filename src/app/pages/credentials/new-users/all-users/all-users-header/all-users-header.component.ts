import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatAnchor } from '@angular/material/button';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import { filter } from 'rxjs';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { allUsersHeaderElements } from 'app/pages/credentials/new-users/all-users/all-users-header/all-users-header.elements';
import { UserFormComponent } from 'app/pages/credentials/new-users/user-form/user-form.component';

@UntilDestroy()
@Component({
  selector: 'ix-all-users-header',
  templateUrl: './all-users-header.component.html',
  styleUrls: ['./all-users-header.component.scss'],
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
    private router: Router,
  ) {}

  doAdd(): void {
    this.slideIn.open(UserFormComponent, { wide: false }).pipe(
      filter(({ response }) => !!response),
      untilDestroyed(this),
    ).subscribe({
      next: ({ response }) => {
        this.router.navigate(['/credentials', 'users-new', 'view', response.username]);
      },
    });
  }
}
