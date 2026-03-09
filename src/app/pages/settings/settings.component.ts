import type { OnInit } from '@angular/core';
import type { ThemeColors } from '../../color.themes';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { collection, doc, getDocs, query, where, writeBatch } from 'firebase/firestore';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DialogService, DynamicDialogModule } from 'primeng/dynamicdialog';
import { ToastModule } from 'primeng/toast';
import { ColorPickerComponent } from '../../components/color-picker/color-picker.component';
import { ConfirmDialogComponent } from '../../components/confirm-dialog/confirm-dialog.component';
import { LabelEditDialogComponent } from '../../components/label-edit-dialog/label-edit-dialog.component';
import { ReplacementColorDialogComponent } from '../../components/replacement-color-dialog/replacement-color-dialog.component';
import { ThemeToggleComponent } from '../../components/theme-toggle/theme-toggle.component';
import { auth, db } from '../../firebase-config';
import { SettingsService } from '../../settings.service';

@Component({
  selector: 'app-settings',
  imports: [ButtonModule, ThemeToggleComponent, ColorPickerComponent, FormsModule, ToastModule, DynamicDialogModule],
  providers: [MessageService, DialogService],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss',
})
export class SettingsComponent implements OnInit {
  themeColors = signal<ThemeColors[]>([]);
  originalColors = signal<ThemeColors[]>([]);
  isSaving = signal(false);

  hasChanges = computed(() => {
    return (JSON.stringify(this.themeColors()) !== JSON.stringify(this.originalColors()));
  });

  private settingsService = inject(SettingsService);
  private dialogService = inject(DialogService);
  private messageService = inject(MessageService);
  private router = inject(Router);

  constructor() {
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
    // Initialization is handled by the effect
  }

  async saveSettings() {
    const user = auth.currentUser;
    if (!user)
      return;

    this.isSaving.set(true);
    try {
      if (!this.hasChanges())
        return;

      await this.settingsService.saveSettings({
        themeColors: this.themeColors(),
      });

      this.messageService.add({ severity: 'success', summary: 'Erfolg', detail: 'Einstellungen gespeichert' });
    } catch (error) {
      console.error('Error saving settings:', error);
      this.messageService.add({ severity: 'error', summary: 'Fehler', detail: 'Fehler beim Speichern' });
    } finally {
      this.isSaving.set(false);
    }
  }

  async addColor() {
    if (this.themeColors().length >= 10) {
      this.messageService.add({ severity: 'warn', summary: 'Limit erreicht', detail: 'Maximal 10 Farben erlaubt' });
      return;
    }

    const ref = this.dialogService.open(LabelEditDialogComponent, {
      header: 'Neue Farbe hinzufügen',
      width: '350px',
      data: { label: '', title: 'Neue Farbe hinzufügen' },
      dismissableMask: true,
      closable: true,
    });

    ref?.onClose.subscribe((result) => {
      if (result) {
        const existingIds = this.themeColors().map(c => c.id);
        const newId = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].find(id => !existingIds.includes(id)) ?? 0;

        const newColor: ThemeColors = {
          id: newId,
          value: '#613DA2', // Default color
          label: result.label,
          isActive: result.isActive,
        };

        this.themeColors.set([...this.themeColors(), newColor]);
      }
    });
  }

  async deleteColor(color: ThemeColors) {
    if (this.themeColors().length <= 1) {
      this.messageService.add({ severity: 'info', detail: 'Mindestens eine Farbe muss erhalten bleiben' });
      return;
    }

    const user = auth.currentUser;
    if (!user)
      return;

    const confirmed = await this.confirmDialog('Farbe löschen', `Möchtest du die Farbe "${color.label}" wirklich löschen?`, 'Löschen');
    if (!confirmed)
      return;

    this.replaceColorId(color);
    this.themeColors.set(this.themeColors().filter(c => c.id !== color.id));
    this.markDirty();
  }

  async replaceColorId(themeColor: ThemeColors) {
    const user = auth.currentUser;
    if (!user)
      return;
    const eventsRef = collection(db, user.uid);
    const q = query(eventsRef, where('backgroundColor', '==', themeColor.id));
    const querySnapshot = await getDocs(q);

    let replacementId: number | undefined;

    if (!querySnapshot.empty) {
      const otherColors = this.themeColors().filter(c => c.id !== themeColor.id);
      const ref = this.dialogService.open(ReplacementColorDialogComponent, {
        header: 'Farbe ersetzen',
        width: '400px',
        dismissableMask: true,
        data: { colors: otherColors, originalColor: themeColor },
      });

      replacementId = await new Promise<number | undefined>((resolve) => {
        ref?.onClose.subscribe(res => resolve(res));
      });

      if (replacementId === undefined) {
        this.themeColors.set([...this.themeColors(), themeColor]);
        this.messageService.add({ severity: 'info', detail: `Farbe ${themeColor.label} nicht gelöscht` });
        return;
      }

      const batch = writeBatch(db);
      querySnapshot.forEach((eventDoc) => {
        batch.update(doc(db, user.uid, eventDoc.id), { backgroundColor: replacementId });
      });
      await batch.commit();
      this.messageService.add({ severity: 'success', detail: `${querySnapshot.size} Zeiten wurden auf die neue Farbe umgestellt` });
    }
  }

  markDirty() {
    this.themeColors.set([...this.themeColors()]);
  }

  async logout() {
    const confirmed = await this.confirmDialog('Ausloggen', 'Möchtest du dich wirklich ausloggen?', 'Ausloggen');
    if (!confirmed)
      return;

    await auth.signOut();
    this.router.navigate(['/login']);
  }

  async back() {
    if (this.hasChanges()) {
      const confirmed = await this.confirmDialog('Änderungen verwerfen', 'Möchtest du die Änderungen wirklich verwerfen?', 'Verwerfen');
      if (!confirmed)
        return;
    }

    this.router.navigate(['/calendar']);
  }

  async confirmDialog(title: string, message: string, confirmText: string) {
    const ref = this.dialogService.open(ConfirmDialogComponent, {
      header: title,
      width: '350px',
      dismissableMask: true,
      data: {
        title,
        message,
        confirmText,
      },
    });

    const confirmed = await new Promise<boolean>((resolve) => {
      ref?.onClose.subscribe(res => resolve(!!res));
    });

    return confirmed;
  }
}
