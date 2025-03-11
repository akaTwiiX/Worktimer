import { Component, OnInit, ViewChild } from '@angular/core';
import { FullCalendarComponent, FullCalendarModule } from '@fullcalendar/angular';
import { CalendarOptions, EventInput } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { collection, onSnapshot, addDoc, deleteDoc, doc, getFirestore, query, where, updateDoc } from 'firebase/firestore';
import { db } from '../firebase-config';
import { MatDialog } from '@angular/material/dialog';
import { EventDialogComponent } from '../event-dialog/event-dialog.component';


export interface WorkdayEvent {
  id?: string;
  date: string;
  type: 'Arbeitszeit' | 'Freier Tag';
}

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [FullCalendarModule],
  templateUrl: './calendar.component.html',
  styleUrls: ['./calendar.component.scss']
})
export class CalendarComponent {
  @ViewChild('calendar') calendarRef!: FullCalendarComponent;

  calendarOptions: CalendarOptions = {
    initialView: 'dayGridMonth',
    plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
    editable: true,
    selectable: true,
    events: [],
    select: this.handleDateSelect.bind(this),
    eventClick: this.handleEventClick.bind(this),
    dateClick: this.handleDateClick.bind(this),
    locale: 'de',
    timeZone: 'Europe/Berlin',
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,timeGridWeek,timeGridDay'
    },
    eventStartEditable: true,
    eventDurationEditable: true,
    selectMirror: true,
    longPressDelay: 500,
    eventLongPressDelay: 500,
    firstDay: 1,
    slotLabelFormat: { hour: '2-digit', minute: '2-digit', hour12: false },
    eventTimeFormat: { hour: '2-digit', minute: '2-digit', hour12: false },
    datesSet: this.handleDatesSet.bind(this)
  };

  private unsubscribe: (() => void) | null = null;

  constructor(private dialog: MatDialog) {
  }

  handleDatesSet(dateInfo: any) {
    const start = new Date(dateInfo.startStr);
    const end = new Date(dateInfo.endStr);

    const monthStart = new Date(start.getFullYear(), start.getMonth(), 1);
    const monthEnd = new Date(end.getFullYear(), end.getMonth() + 1, 0, 23, 59, 59);

    if (this.unsubscribe) {
      this.unsubscribe();
    }

    const eventsCollection = collection(db, 'events');
    const q = query(
      eventsCollection,
      where('start', '>=', monthStart.toISOString()),
      where('start', '<=', monthEnd.toISOString())
    );

    this.unsubscribe = onSnapshot(q, (snapshot) => {
      const events: EventInput[] = snapshot.docs.map(doc => ({
        id: doc.id,
        title: doc.data()['title'],
        start: doc.data()['start'],
        end: doc.data()['end'],
        allDay: doc.data()['allDay'],
        backgroundColor: doc.data()['backgroundColor'],
        borderColor: doc.data()['backgroundColor'],
      }));
      this.calendarOptions.events = events;
    });
  }

  async handleDateSelect(selectInfo: any) {
    const dialogRef = this.dialog.open(EventDialogComponent, { width: '250px', data: { isNew: true } });

    dialogRef.afterClosed().subscribe(async result => {
      if (!result) return;

      const newEvent = {
        title: result.title,
        start: selectInfo.startStr,
        end: selectInfo.endStr,
        allDay: selectInfo.allDay,
        backgroundColor: result.backgroundColor
      };

      await addDoc(collection(db, 'events'), newEvent);
    });
  }

  async handleEventClick(clickInfo: any) {
    const event = clickInfo.event;
    const dialogRef = this.dialog.open(EventDialogComponent, {
      width: '250px',
      data: {
        isNew: false, // Kennzeichnet ein bestehendes Event
        id: event.id,
        title: event.title,
        start: event.startStr,
        end: event.endStr,
        allDay: event.allDay,
        backgroundColor: event.backgroundColor
      }
    });

    dialogRef.afterClosed().subscribe(async result => {
      if (!result) return;

      const eventDoc = doc(db, 'events', event.id);

      if (result.delete) {
        await deleteDoc(eventDoc);
      } else {
        const updatedEvent = {
          title: result.title,
          start: result.start || event.startStr,
          end: result.end || event.endStr,
          allDay: result.allDay ?? event.allDay,
          backgroundColor: result.backgroundColor
        };
        await updateDoc(eventDoc, updatedEvent);
      }
    });
  }

  handleDateClick(info: any) {
    this.calendarRef.getApi().changeView('timeGridDay', info.dateStr);
  }
}

