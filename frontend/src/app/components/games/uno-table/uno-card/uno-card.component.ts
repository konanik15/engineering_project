import {Component, Input} from '@angular/core';

@Component({
  selector: 'app-uno-card',
  templateUrl: './uno-card.component.html',
  styleUrls: ['./uno-card.component.css']
})
export class UnoCardComponent {
  @Input() cardType: string | null = null;
  @Input() cardColor: string | null = null;
  @Input() facing: string = 'down';
}
