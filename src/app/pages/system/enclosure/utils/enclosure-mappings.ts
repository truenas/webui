import { ComponentType } from '@angular/cdk/portal';
import { M50EnclosureComponent } from 'app/pages/system/enclosure/components/enclosures/m50-enclosure/m50-enclosure.component';
import { EnclosureComponent } from 'app/pages/system/enclosure/interfaces/enclosure-component.interface';

export const enclosureComponentMap: Record<string, ComponentType<EnclosureComponent>> = {
  M50: M50EnclosureComponent,
};
