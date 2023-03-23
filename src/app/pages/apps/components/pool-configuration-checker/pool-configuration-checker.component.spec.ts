import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { KubernetesConfig } from 'app/interfaces/kubernetes-config.interface';
import { ApplicationsService } from 'app/pages/apps-old/applications.service';
import { PoolConfigurationCheckerComponent } from 'app/pages/apps/components/pool-configuration-checker/pool-configuration-checker.component';
import { SelectPoolDialogComponent } from 'app/pages/apps/components/select-pool-dialog/select-pool-dialog.component';

describe('PoolConfigurationCheckerComponent', () => {
  let spectator: Spectator<PoolConfigurationCheckerComponent>;
  const createComponent = createComponentFactory({
    component: PoolConfigurationCheckerComponent,
    imports: [
      MatDialogModule,
    ],
    providers: [],
  });

  beforeEach(() => {
    spectator = createComponent();
  });

  it('shows "Select pool" modal if no pool configured after checking kubernetes config', () => {
    const appService = spectator.inject(ApplicationsService);
    jest.spyOn(appService, 'getKubernetesConfig').mockReturnValue(of({} as KubernetesConfig));
    jest.spyOn(spectator.inject(MatDialog), 'open');

    spectator.detectChanges();
    spectator.component.ngAfterViewInit();

    expect(appService.getKubernetesConfig).toHaveBeenCalled();
    expect(spectator.inject(MatDialog).open).toHaveBeenCalledWith(SelectPoolDialogComponent);
  });
});
