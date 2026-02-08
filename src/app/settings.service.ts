import { Injectable, signal, effect } from '@angular/core';
import { auth, db } from './firebase-config';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, onSnapshot, setDoc, Unsubscribe } from 'firebase/firestore';
import { Colors, ThemeColors } from './color.themes';

export type UserSettings = {
    themeColors: ThemeColors[];
}

@Injectable({
    providedIn: 'root'
})
export class SettingsService {
    private _settings = signal<UserSettings>({ themeColors: Colors });
    public readonly settings = this._settings.asReadonly();

    private unsubscribe: Unsubscribe | null = null;

    constructor() {
        onAuthStateChanged(auth, (user) => {
            if (user) {
                this.startSync(user);
            } else {
                this.stopSync();
            }
        });
    }

    private startSync(user: User) {
        this.stopSync();
        const settingsDoc = doc(db, 'settings', user.uid);
        this.unsubscribe = onSnapshot(settingsDoc, (snapshot) => {
            if (snapshot.exists()) {
                this._settings.set(snapshot.data() as UserSettings);
            } else {
                // Initialize with defaults if no settings exist
                this.saveSettings({ themeColors: Colors });
            }
        }, (error) => {
            console.error('Error syncing settings:', error);
        });
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
}
