import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {HomeComponent} from "./components/home/home.component";
import {WelcomeComponent} from "./components/welcome/welcome.component";
import {AuthGuard} from "./auth.guard";

const routes: Routes = [
    {path: "home", component: HomeComponent, canActivate: [AuthGuard]},
    {path: "welcome", component: WelcomeComponent},
    {path: "", component: WelcomeComponent},
    {path: "**", redirectTo: "welcome", pathMatch: "full"}
];

@NgModule({
    imports: [RouterModule.forRoot(routes)],
    exports: [RouterModule]
})
export class AppRoutingModule {
}
