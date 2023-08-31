import {Component, OnInit} from '@angular/core';
import {ActivatedRoute} from "@angular/router";
import {Subscription} from "rxjs";
import {ProfileService} from "./profile-service";
import {ProfileDTO} from "../utils/dto";

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {

  profileId: string = '';

  profile?: ProfileDTO;
  private routeSub!: Subscription;

  constructor(private route: ActivatedRoute,
              private profileServce: ProfileService) {
  }

  ngOnInit(): void {
    this.routeSub = this.route.params.subscribe(params => {
      this.profileId = params['username']
    });

    this.profileServce.getProfile(this.profileId).subscribe({
      next: (profile) => {
        console.log(profile)
        this.profile = profile
      },
      error: () => {
        console.log('Smth went wrong with getting profile by Id ', this.profileId)
      }
    })
  }


}
