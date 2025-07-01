import { Location } from '@angular/common';

export function setUsernameInUrl(location: Location, username: string): void {
  let newUrl = 'credentials/users-new';
  if (username) {
    const queryParams = new URLSearchParams();
    queryParams.set('username', username);
    newUrl = `${newUrl}?${queryParams.toString()}`;
  }

  location.replaceState(newUrl);
}
