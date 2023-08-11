import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DraidSelectionComponent } from 'app/pages/storage/modules/pool-manager/components/pool-manager-wizard/components/layout-step/automated-disk-selection/draid-selection/draid-selection.component';

describe('DraidSelectionComponent', () => {
  let component: DraidSelectionComponent;
  let fixture: ComponentFixture<DraidSelectionComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [DraidSelectionComponent],
    });
    fixture = TestBed.createComponent(DraidSelectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
