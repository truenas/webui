import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UiSearchResultsComponent } from './ui-search-results.component';

describe('UiSearchResultsComponent', () => {
  let component: UiSearchResultsComponent;
  let fixture: ComponentFixture<UiSearchResultsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [UiSearchResultsComponent],
    });
    fixture = TestBed.createComponent(UiSearchResultsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
