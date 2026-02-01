import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatRadioModule } from '@angular/material/radio';
import { MatSlideToggleChange, MatSlideToggleModule } from '@angular/material/slide-toggle';
import { Colors } from '../color.themes';

@Component({
  selector: 'app-event-dialog',
  imports: [MatFormFieldModule, MatInputModule, FormsModule, MatButtonModule, MatRadioModule, MatSelectModule, MatSlideToggleModule],
  templateUrl: './event-dialog.component.html',
  styleUrl: './event-dialog.component.scss'
})
export class EventDialogComponent {
  eventData = { title: '', backgroundColor: 0, selection: 0 };

  colors = Colors;

  isVisible = false;

  selectedTime: string = this.getTimeByColorId(this.eventData.backgroundColor);

  constructor(public dialogRef: MatDialogRef<EventDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    console.log(data)
    if (!this.data.isNew) {
      const textData = this.data.title.split('<small>Kasse:</small>');
      this.eventData.title = textData[0].trim();
      this.eventData.selection = textData[1] ? Number(textData[1].trim()) : 0;
      const foundColor = this.colors.find(color => color.value === this.data.backgroundColor);
      this.eventData.backgroundColor = foundColor ? foundColor.id : 0;
      this.selectTime(this.getTimeByColorId(this.eventData.backgroundColor));
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
    if (this.isVisible && (this.eventData.title.trim().length === 0 || this.eventData.backgroundColor === 0)) return;

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

  getTimeByColorId(id: number): string {
    switch (id) {
      case this.colors[2].id:
        return 'Frei';
      case this.colors[0].id:
        return '9-17';
      case this.colors[3].id:
        return '11-19';
      case this.colors[5].id:
        return '10-15';
      default:
        return '9-17';
    }
  }

}
