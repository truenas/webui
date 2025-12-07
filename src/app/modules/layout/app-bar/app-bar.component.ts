import { AsyncPipe, NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { AppBarItem } from 'app/interfaces/app-bar.interface';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { appBarOpened } from 'app/store/app-bar/app-bar.actions';
import { selectAppBarState } from 'app/store/app-bar/app-bar.selectors';

@Component({
  selector: 'ix-app-bar',
  templateUrl: './app-bar.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IxIconComponent, RouterLink, AsyncPipe, NgClass],
})
export class AppBarComponent {
  private store = inject(Store);

  readonly appBarState$ = this.store.select(selectAppBarState);
  private router = inject(Router);

  getRouterLink(url: string): string[] {
    return ['/', ...url.split('/')];
  }

  onItemClick(item: AppBarItem): void {
    this.store.dispatch(appBarOpened({
      item: {
        name: item.name,
        icon: item.icon,
        iconActive: item.iconActive,
        state: item.state,
        status: 'open',
      },
    }));

    this.router.navigate(this.getRouterLink(item.state));
  }
}
