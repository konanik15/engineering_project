import {Component, OnInit} from '@angular/core';
import {MdbModalRef} from "mdb-angular-ui-kit/modal";
import {LobbyDTO} from "../../utils/dto";
import {FormBuilder, FormGroup, Validators} from "@angular/forms";
import {Router} from "@angular/router";

@Component({
  selector: 'app-join-lobby-modal',
  templateUrl: './join-lobby-modal.component.html',
  styleUrls: ['./join-lobby-modal.component.css']
})
export class JoinLobbyModalComponent implements OnInit {


  joinLobbyForm!: FormGroup;

  wrongPassword: boolean = false;

  lobby: LobbyDTO | undefined;

  password: string = '';

  name: string | null = null;

  constructor(public modalRef: MdbModalRef<JoinLobbyModalComponent>,
              private formBuilder: FormBuilder,
              private router: Router) {
  }

  ngOnInit(): void {
    console.log('Innit JoinLobbyModalComponent')
    this.joinLobbyForm = this.formBuilder.group({
      password: [null, Validators.required],
    });
  }

  validatePassword() {
    let password: string = this.joinLobbyForm.get('password')?.value
    if (password === this.lobby?.password) {
      console.log('password ', password, 'lobbyPass ', this.lobby?.password)
      this.wrongPassword = false
      this.modalRef.close()
      const url = this.router.serializeUrl(
        this.router.createUrlTree([`/lobby/${this.lobby.id}`])
      );
      window.open(url, '_blank');
    } else {
      console.log('password ', password, 'lobbyPass ', this.lobby?.password)
      this.wrongPassword = true
    }
  }
}
