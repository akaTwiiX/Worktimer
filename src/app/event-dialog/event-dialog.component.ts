import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatRadioModule } from '@angular/material/radio';
import { Colors } from '../color.themes';

@Component({
  selector: 'app-event-dialog',
  imports: [MatFormFieldModule, MatInputModule, FormsModule, MatButtonModule, MatRadioModule, MatSelectModule],
  templateUrl: './event-dialog.component.html',
  styleUrl: './event-dialog.component.scss'
})
export class EventDialogComponent {
  eventData = { title: '', backgroundColor: 0, selection: 0 };

  colors = Colors;

  constructor(public dialogRef: MatDialogRef<EventDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    if (!this.data.isNew) {
      const textData = this.data.title.split('<small>Kasse:</small>');
      this.eventData.title = textData[0].trim();
      this.eventData.selection = textData[1] ? Number(textData[1]) : 0;
      const foundColor = this.colors.find(color => color.value === this.data.backgroundColor);
      this.eventData.backgroundColor = foundColor ? foundColor.id : 0;
    }

  }

  onCancel(): void {
    this.dialogRef.close(null);
  }

  onDelete(): void {
    this.dialogRef.close({ ...this.data, delete: true });
  }

  onSave(): void {
    if (this.eventData.title == "" && this.eventData.backgroundColor == 0) return;

    this.dialogRef.close({
      title: this.eventData.selection == 0 ? this.eventData.title : `${this.eventData.title} <small>Kasse:</small> ${this.eventData.selection}`,
      backgroundColor: this.eventData.backgroundColor,
      start: this.data.start,
      end: this.data.end,
      allDay: this.data.allDay
    });
  }
}
