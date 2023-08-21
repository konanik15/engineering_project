import {Component, OnInit} from '@angular/core';
import {MdbModalRef} from "mdb-angular-ui-kit/modal";
import {FormBuilder, FormGroup, Validators} from "@angular/forms";
import {Router} from "@angular/router";
import {LobbiesService} from "../../utils/lobbies-service";

@Component({
  selector: 'app-join-lobby-modal',
  templateUrl: './join-lobby-modal.component.html',
  styleUrls: ['./join-lobby-modal.component.css']
})
export class JoinLobbyModalComponent implements OnInit {


  joinLobbyForm!: FormGroup;

  wrongPassword: boolean = false;

  lobbyId: string = '';

  socket: any

  constructor(public modalRef: MdbModalRef<JoinLobbyModalComponent>,
              private formBuilder: FormBuilder,
              private router: Router,
              private lobbiesService: LobbiesService) {
  }

  ngOnInit(): void {
    this.joinLobbyForm = this.formBuilder.group({
      password: [null, Validators.required],
    });
  }

  validatePassword() {
    let password: string = this.joinLobbyForm.get('password')?.value
    localStorage.setItem('password', password)

    this.lobbiesService.mainMenuSocket.next({
      "type": 'validatePassword',
      "data": {
        "lobbyId": this.lobbyId,
        "password": password
      }
    })
  }
}
