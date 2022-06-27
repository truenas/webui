import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DashboardPoolComponent } from './dashboard-pool.component';

describe('DashboardPoolComponent', () => {
  let component: DashboardPoolComponent;
  let fixture: ComponentFixture<DashboardPoolComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [DashboardPoolComponent],
    })
      .compileComponents();

    fixture = TestBed.createComponent(DashboardPoolComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
