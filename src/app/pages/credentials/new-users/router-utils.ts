import { Router } from '@angular/router';

export function setUsernameInUrl(router: Router, username: string): void {
  if (!username) {
    return;
  }
  router.navigate(['credentials', 'users-new'], {
    queryParams: { username },
    queryParamsHandling: 'merge',
    replaceUrl: true,
  });
}
