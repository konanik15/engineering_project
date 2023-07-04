import {Component, OnInit} from '@angular/core';
import {WelcomeService} from "./welcome-service.component";

@Component({
  selector: 'app-welcome',
  templateUrl: './welcome.component.html',
  styleUrls: ['./welcome.component.css']
})
export class WelcomeComponent implements OnInit {
  constructor(private welcomeService: WelcomeService) {
  }

  private _message: string = "";

  get message(): string {
    return this._message;
  }

  set message(value: string) {
    this._message = value;
  }

  ngOnInit(): void {
    this._message = this.welcomeService.getMessage()
  }


}
