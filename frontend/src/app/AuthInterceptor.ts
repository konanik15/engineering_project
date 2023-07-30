import {Injectable} from "@angular/core";
import {HttpEvent, HttpHandler, HttpInterceptor, HttpRequest} from "@angular/common/http";
import {Observable} from "rxjs";
import {OAuthService} from "angular-oauth2-oidc";

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  constructor(private oAuthService: OAuthService) {
  }


  intercept(req: HttpRequest<any>,
            next: HttpHandler): Observable<HttpEvent<any>> {

    //Retrieve accesstoken from local storage
    const accessToken = this.oAuthService.getIdToken();

    //Check if accesToken exists, else send request without bearer token
    if (accessToken) {
      const cloned = req.clone({
        headers: req.headers.set(
          "Authorization", "Bearer " + accessToken)
      });

      console.log('Token added to HTTP request');

      return next.handle(cloned);
    } else {
      //No token; proceed request without bearer token
      console.log('No token added to HTTP request');
      return next.handle(req);
    }
  }
}
