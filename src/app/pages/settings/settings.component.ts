import { Component, OnInit, signal, computed, inject, effect } from '@angular/core';
import { Router } from '@angular/router';
import { auth, db } from '../../firebase-config';
import { MatButtonModule } from '@angular/material/button';
import { ThemeToggleComponent } from '../../components/theme-toggle/theme-toggle.component';
import { MatIconModule } from '@angular/material/icon';
import { ColorPickerComponent } from '../../components/color-picker/color-picker.component';
import { FormsModule } from '@angular/forms';
import { Colors, ThemeColors } from '../../color.themes';
import { query, where, collection, getDocs, writeBatch, doc } from 'firebase/firestore';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { LabelEditDialogComponent } from '../../components/label-edit-dialog/label-edit-dialog.component';
import { ReplacementColorDialogComponent } from '../../components/replacement-color-dialog/replacement-color-dialog.component';
import { ConfirmDialogComponent } from '../../components/confirm-dialog/confirm-dialog.component';
import { SettingsService } from '../../settings.service';

@Component({
  selector: 'app-settings',
  imports: [MatButtonModule, ThemeToggleComponent, MatIconModule, ColorPickerComponent, FormsModule, MatSnackBarModule, MatDialogModule],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss'
})
export class SettingsComponent implements OnInit {
  themeColors = signal<ThemeColors[]>([]);
  originalColors = signal<ThemeColors[]>([]);
  isSaving = signal(false);
  deleteColorIds = signal<ThemeColors[]>([]);

  hasChanges = computed(() => {
    return (JSON.stringify(this.themeColors()) !== JSON.stringify(this.originalColors())) || (this.deleteColorIds().length > 0);
  });

  private settingsService = inject(SettingsService);
  private dialog = inject(MatDialog);

  constructor(private router: Router, private snackBar: MatSnackBar) {
    effect(() => {
      const settings = this.settingsService.settings();
      if (settings) {
        if (!this.hasChanges()) {
          this.themeColors.set(JSON.parse(JSON.stringify(settings.themeColors)));
        }
        this.originalColors.set(JSON.parse(JSON.stringify(settings.themeColors)));
      }
    });
  }

  async ngOnInit() {
    // Initialization is handled by the effect and SettingsService's auto-sync
  }

  async saveSettings() {
    const user = auth.currentUser;
    if (!user) return;

    this.isSaving.set(true);
    try {
      if (this.deleteColorIds().length > 0) {
        for (const color of this.deleteColorIds()) {
          await this.replaceColorId(color);
        }
        this.deleteColorIds.set([]);
      }

      if (!this.hasChanges()) return;

      await this.settingsService.saveSettings({
        themeColors: this.themeColors()
      });

      this.snackBar.open('Einstellungen gespeichert', 'OK', { duration: 3000 });
    } catch (error) {
      console.error('Error saving settings:', error);
      this.snackBar.open('Fehler beim Speichern', 'OK', { duration: 3000 });
    } finally {
      this.isSaving.set(false);
    }
  }

  async addColor() {
    if (this.themeColors().length >= 10) {
      this.snackBar.open('Maximal 10 Farben erlaubt', 'OK', { duration: 3000 });
      return;
    }

    const dialogRef = this.dialog.open(LabelEditDialogComponent, {
      data: { label: '', title: 'Neue Farbe hinzufügen' }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        const existingIds = this.themeColors().map(c => c.id);
        const newId = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].find(id => !existingIds.includes(id)) ?? 0;

        const newColor: ThemeColors = {
          id: newId,
          value: '#613DA2', // Default color
          label: result.label,
          isActive: result.isActive
        };

        this.themeColors.set([...this.themeColors(), newColor]);
      }
    });
  }

  async deleteColor(color: ThemeColors) {
    if (this.themeColors().length <= 1) {
      this.snackBar.open('Mindestens eine Farbe muss erhalten bleiben', 'OK', { duration: 3000 });
      return;
    }

    const user = auth.currentUser;
    if (!user) return;

    // Ask for confirmation first
    const confirmed = await this.confirmDialog('Farbe löschen', `Möchtest du die Farbe "${color.label}" wirklich löschen?`, 'Löschen');
    if (!confirmed) return;

    this.deleteColorIds.set([...this.deleteColorIds(), color]);
    this.themeColors.set(this.themeColors().filter(c => c.id !== color.id));


    this.markDirty();
  }

  async replaceColorId(themeColor: ThemeColors) {
    const user = auth.currentUser;
    if (!user) return;
    // Check if color is used in events
    const eventsRef = collection(db, user.uid);
    const q = query(eventsRef, where('backgroundColor', '==', themeColor.id));
    const querySnapshot = await getDocs(q);

    let replacementId: number | undefined;

    if (!querySnapshot.empty) {
      const otherColors = this.themeColors().filter(c => c.id !== themeColor.id);
      const dialogRef = this.dialog.open(ReplacementColorDialogComponent, {
        data: { colors: otherColors, originalColor: themeColor }
      });

      replacementId = await new Promise<number | undefined>(resolve => {
        dialogRef.afterClosed().subscribe(res => resolve(res));
      });

      if (replacementId === undefined) {
        this.themeColors.set([...this.themeColors(), themeColor]);
        this.deleteColorIds.set(this.deleteColorIds().filter(color => color.id !== themeColor.id));
        this.snackBar.open(`Farbe ${themeColor.label} nicht gelöscht`, 'OK', { duration: 3000 });
        return;
      }

      // Migrate events
      const batch = writeBatch(db);
      querySnapshot.forEach(eventDoc => {
        batch.update(doc(db, user.uid, eventDoc.id), { backgroundColor: replacementId });
      });
      await batch.commit();
      this.snackBar.open(`${querySnapshot.size} Zeiten wurden auf die neue Farbe umgestellt`, 'OK', { duration: 3000 });
    }
  }

  markDirty() {
    this.themeColors.set([...this.themeColors()]);
  }


  async logout() {
    const confirmed = await this.confirmDialog('Ausloggen', 'Möchtest du dich wirklich ausloggen?', 'Ausloggen');
    if (!confirmed) return;

    await auth.signOut();
    this.router.navigate(['/login']);
  }

  async back() {
    if (this.hasChanges()) {
      const confirmed = await this.confirmDialog('Änderungen verwerfen', 'Möchtest du die Änderungen wirklich verwerfen?', 'Verwerfen');
      if (!confirmed) return;
    }

    this.router.navigate(['/calendar']);
  }

  async confirmDialog(title: string, message: string, confirmText: string) {
    const confirmRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: title,
        message: message,
        confirmText: confirmText
      }
    });

    const confirmed = await new Promise<boolean>(resolve => {
      confirmRef.afterClosed().subscribe(res => resolve(!!res));
    });

    return confirmed;
  }

}
