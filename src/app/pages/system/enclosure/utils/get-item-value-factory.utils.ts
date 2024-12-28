import { byText } from '@ngneat/spectator';
import { Spectator } from '@ngneat/spectator/jest';

export function getItemValueFactory(spectator: Spectator<unknown>): (name: string) => string {
  return (name: string): string => {
    const item = spectator.query(byText(name, { selector: '.label' }));
    return item?.nextElementSibling?.textContent || '';
  };
}
