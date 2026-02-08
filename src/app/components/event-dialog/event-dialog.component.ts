import { Component, Inject, inject, computed } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatRadioModule } from '@angular/material/radio';
import { MatSlideToggleChange, MatSlideToggleModule } from '@angular/material/slide-toggle';
import { ThemeColors } from '../../color.themes';
import { SettingsService } from '../../settings.service';
import { TimeFormatDirective } from '../../directives/time-format.directive';

@Component({
  selector: 'app-event-dialog',
  imports: [MatFormFieldModule, MatInputModule, FormsModule, MatButtonModule, MatRadioModule, MatSelectModule, MatSlideToggleModule, TimeFormatDirective],
  templateUrl: './event-dialog.component.html',
  styleUrl: './event-dialog.component.scss'
})
export class EventDialogComponent {
  private settingsService = inject(SettingsService);

  eventData = { title: '', backgroundColor: 0, selection: 0 };

  get colors(): ThemeColors[] {
    return this.settingsService.settings().themeColors;
  }

  sortedColors = computed(() => {
    const colors = [...this.colors];
    const isTime = (label: string) => /^\d/.test(label) && label.includes('-');
    const parseTime = (timeStr: string) => {
      const [hours, minutes] = timeStr.trim().split(':').map(Number);
      return (hours || 0) * 60 + (minutes || 0);
    };

    return colors.sort((a, b) => {
      const isTimeA = isTime(a.label);
      const isTimeB = isTime(b.label);

      if (!isTimeA && isTimeB) return -1;
      if (isTimeA && !isTimeB) return 1;

      if (!isTimeA && !isTimeB) {
        return a.label.localeCompare(b.label);
      }

      const startA = parseTime(a.label.split('-')[0]);
      const startB = parseTime(b.label.split('-')[0]);
      return startA - startB;
    });
  });

  isVisible = false;

  selectedTime: string = '';

  constructor(public dialogRef: MatDialogRef<EventDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    if (!this.data.isNew) {
      const textData = this.data.title.split('<small>Kasse:</small>');
      this.eventData.title = textData[0].trim();
      this.eventData.selection = textData[1] ? Number(textData[1].trim()) : 0;

      this.eventData.backgroundColor = this.data.colorId ?? 0;
      const foundColor = this.colors.find(color => color.id === this.eventData.backgroundColor);
      this.selectedTime = foundColor ? foundColor.label : '9-17';
    } else {
      this.selectedTime = '9-17';
    }

  }

  onCancel(): void {
    this.dialogRef.close(null);
  }

  onDelete(): void {
    this.dialogRef.close({ ...this.data, delete: true });
  }

  selectTime(time: string) {
    this.selectedTime = time;
  }

  toggleVisibility(event: MatSlideToggleChange) {
    this.isVisible = event.checked;
  }

  onSave(): void {
    if (this.isVisible && (this.eventData.title.trim().length === 0 && this.eventData.backgroundColor === 0)) return;

    this.dialogRef.close({
      title: this.setTitle(),
      backgroundColor: this.eventData.backgroundColor
    });
  }

  setTitle() {
    if (this.eventData.selection === 0 && this.isVisible) {
      return this.eventData.title;
    } else if (this.isVisible && this.eventData.selection !== 0) {
      return `${this.eventData.title} <small>Kasse:</small> ${this.eventData.selection}`;
    } else {
      return this.selectedTime;
    }
  }

}
