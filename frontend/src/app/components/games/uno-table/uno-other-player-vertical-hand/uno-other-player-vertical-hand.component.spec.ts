import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UnoOtherPlayerVerticalHandComponent } from './uno-other-player-vertical-hand.component';

describe('UnoOtherPlayerVerticalHandComponent', () => {
  let component: UnoOtherPlayerVerticalHandComponent;
  let fixture: ComponentFixture<UnoOtherPlayerVerticalHandComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ UnoOtherPlayerVerticalHandComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UnoOtherPlayerVerticalHandComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
