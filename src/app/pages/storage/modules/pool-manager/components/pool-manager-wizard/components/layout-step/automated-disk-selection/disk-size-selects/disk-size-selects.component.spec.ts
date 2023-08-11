import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DiskSizeSelectsComponent } from 'app/pages/storage/modules/pool-manager/components/pool-manager-wizard/components/layout-step/automated-disk-selection/disk-size-selects/disk-size-selects.component';

describe('DiskSizeDropdownsComponent', () => {
  let component: DiskSizeSelectsComponent;
  let fixture: ComponentFixture<DiskSizeSelectsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [DiskSizeSelectsComponent],
    });
    fixture = TestBed.createComponent(DiskSizeSelectsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
