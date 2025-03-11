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
  eventData = { title: '', backgroundColor: '', selection: 0 };

  colors = Colors;

  constructor(public dialogRef: MatDialogRef<EventDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    if (!this.data.isNew) {
      const textData = this.data.title.split('\n Kasse:');
      this.eventData.title = textData[0].trim();
      this.eventData.selection = Number(textData[1]);
      this.eventData.backgroundColor = this.data.backgroundColor;
    }

  }

  onCancel(): void {
    this.dialogRef.close(null);
  }

  onDelete(): void {
    this.dialogRef.close({ ...this.data, delete: true });
  }

  onSave(): void {
    if (this.eventData.title == "" && this.eventData.backgroundColor == "") return;

    this.dialogRef.close({
      title: this.eventData.selection == 0 ? this.eventData.title : `${this.eventData.title} \n Kasse: ${this.eventData.selection}`,
      backgroundColor: this.eventData.backgroundColor,
      start: this.data.start,
      end: this.data.end,
      allDay: this.data.allDay
    });
  }
}
