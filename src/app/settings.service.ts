import { computed, Injectable, signal } from '@angular/core';
import type { User } from 'firebase/auth';
import { onAuthStateChanged } from 'firebase/auth';
import type { Unsubscribe } from 'firebase/firestore';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import type { ThemeColors } from './color.themes';
import { Colors } from './color.themes';
import { auth, db } from './firebase-config';

export interface UserSettings {
  themeColors: ThemeColors[];
}

@Injectable({
  providedIn: 'root',
})
export class SettingsService {
  private _settings = signal<UserSettings | null>(null);
  private _isAuthenticated = signal(false);
  private _isAuthResolved = signal(false);

  public readonly settings = this._settings.asReadonly();
  public readonly isAuthenticated = this._isAuthenticated.asReadonly();
  public readonly isAuthResolved = this._isAuthResolved.asReadonly();
  public readonly isLoading = computed(
    () => !this._isAuthResolved() || (this._isAuthenticated() && this._settings() === null),
  );

  public get settingsValue(): UserSettings {
    const s = this._settings();
    if (!s) throw new Error('Settings not loaded yet');
    return s;
  }

  private unsubscribe: Unsubscribe | null = null;

  constructor() {
    onAuthStateChanged(auth, user => {
      if (user) {
        this._isAuthenticated.set(true);
        this.startSync(user);
      } else {
        this._isAuthenticated.set(false);
        this.stopSync();
        this._settings.set(null);
      }

      this._isAuthResolved.set(true);
    });
  }

  private startSync(user: User) {
    this.stopSync();
    this._settings.set(null);
    const settingsDoc = doc(db, 'settings', user.uid);
    this.unsubscribe = onSnapshot(
      settingsDoc,
      snapshot => {
        if (snapshot.exists()) {
          this._settings.set(snapshot.data() as UserSettings);
        }
      },
      error => {
        console.error('Error syncing settings:', error);
      },
    );
  }

  private stopSync() {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
  }

  async saveSettings(settings: UserSettings) {
    const user = auth.currentUser;
    if (!user) return;

    try {
      await setDoc(doc(db, 'settings', user.uid), settings, { merge: true });
    } catch (error) {
      console.error('Error saving settings:', error);
      throw error;
    }
  }

  async setDefaultSettings(user?: User) {
    const target = user ?? auth.currentUser;
    if (!target) return;

    try {
      await setDoc(doc(db, 'settings', target.uid), { themeColors: Colors, created: new Date() });
    } catch (error) {
      console.error('Error setting default settings:', error);
      throw error;
    }
  }
}
