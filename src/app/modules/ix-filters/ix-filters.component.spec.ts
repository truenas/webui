import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IxFiltersComponent } from './ix-filters.component';

describe('IxFiltersComponent', () => {
  let component: IxFiltersComponent;
  let fixture: ComponentFixture<IxFiltersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [IxFiltersComponent],
    })
      .compileComponents();

    fixture = TestBed.createComponent(IxFiltersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
