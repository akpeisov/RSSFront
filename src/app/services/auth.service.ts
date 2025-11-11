import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private adminSubject = new BehaviorSubject<boolean>(false);
  private userProfile = new BehaviorSubject<boolean>(false);

  setAdmin(value: boolean): void {
    this.adminSubject.next(!!value);
  }

  get isAdmin$(): Observable<boolean> {
    return this.adminSubject.asObservable();
  }

  get isAdmin(): boolean {
    return this.adminSubject.value;
  }

  setUserProfile(value: any): void {
    this.userProfile.next(value);
  }

  get getUserProfile$(): Observable<any> {
    return this.userProfile.asObservable();
  }
}