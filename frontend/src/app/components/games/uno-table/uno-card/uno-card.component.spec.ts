import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UnoCardComponent } from './uno-card.component';

describe('UnoCardComponent', () => {
  let component: UnoCardComponent;
  let fixture: ComponentFixture<UnoCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ UnoCardComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UnoCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
