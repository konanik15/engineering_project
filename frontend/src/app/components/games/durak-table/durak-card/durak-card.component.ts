import {Component, Input} from '@angular/core';

@Component({
    selector: 'app-durak-card',
    templateUrl: './durak-card.component.html',
    styleUrls: ['./durak-card.component.css']
})
export class DurakCardComponent {
    @Input() suit: string | undefined = "";
    @Input() rank: string | undefined = "";
    @Input() facing: string = 'down';
}
