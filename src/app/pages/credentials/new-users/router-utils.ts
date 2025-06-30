import { Location } from '@angular/common';

export function setUsernameInUrl(location: Location, username: string): void {
  if (!username) {
    return;
  }
  const queryParams = new URLSearchParams();
  queryParams.set('username', username);
  const newUrl = `credentials/users-new?${queryParams.toString()}`;
  location.replaceState(newUrl);
}
