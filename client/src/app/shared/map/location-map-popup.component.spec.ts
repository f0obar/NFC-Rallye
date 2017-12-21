import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { UserLocationMapPopupComponent } from './location-map-popup.component';

describe('LocationMapPopupComponent', () => {
  let component: UserLocationMapPopupComponent;
  let fixture: ComponentFixture<UserLocationMapPopupComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ UserLocationMapPopupComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(UserLocationMapPopupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
