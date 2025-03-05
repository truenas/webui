import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatAnchor } from '@angular/material/button';
import { RouterLink } from '@angular/router';
import { UntilDestroy } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { allUsersHeaderElements } from 'app/pages/credentials/new-users/all-users/all-users-header/all-users-header.elements';

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
    RouterLink,
    UiSearchDirective,
  ],
})
export class AllUsersHeaderComponent {
  protected readonly searchableElements = allUsersHeaderElements;
}
