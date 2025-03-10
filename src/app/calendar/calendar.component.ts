import { Component, OnInit } from '@angular/core';
import { FullCalendarModule } from '@fullcalendar/angular';
import { CalendarOptions, EventInput } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { collection, onSnapshot, addDoc, deleteDoc, doc, getFirestore, query, where } from 'firebase/firestore';
import { db } from '../firebase-config';


export interface WorkdayEvent {
  id?: string;
  date: string; // ISO-String
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
  calendarOptions: CalendarOptions = {
    initialView: 'timeGridWeek',
    plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
    editable: true,
    selectable: true,
    events: [],
    select: this.handleDateSelect.bind(this),
    eventClick: this.handleEventClick.bind(this),
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
    datesSet: this.handleDatesSet.bind(this) // Neu: Reagiert auf sichtbaren Zeitraum
  };

  private unsubscribe: (() => void) | null = null; // Zum Abbestellen der vorherigen Abfrage

  constructor() {
    // Initiale Daten werden bei "datesSet" geladen
  }

  // Sichtbarer Zeitraum hat sich geändert (Monat gewechselt)
  handleDatesSet(dateInfo: any) {
    const start = new Date(dateInfo.startStr); // Anfang des sichtbaren Bereichs
    const end = new Date(dateInfo.endStr);    // Ende des sichtbaren Bereichs

    // Monatsgrenzen berechnen
    const monthStart = new Date(start.getFullYear(), start.getMonth(), 1);
    const monthEnd = new Date(end.getFullYear(), end.getMonth() + 1, 0, 23, 59, 59);

    // Vorherige Abfrage abbestellen, falls vorhanden
    if (this.unsubscribe) {
      this.unsubscribe();
    }

    // Firestore-Abfrage für den aktuellen Monat
    const eventsCollection = collection(db, 'events');
    const q = query(
      eventsCollection,
      where('start', '>=', monthStart.toISOString()),
      where('start', '<=', monthEnd.toISOString())
    );

    // Echtzeit-Listener für den Monat
    this.unsubscribe = onSnapshot(q, (snapshot) => {
      const events: EventInput[] = snapshot.docs.map(doc => ({
        id: doc.id,
        title: doc.data()['title'],
        start: doc.data()['start'],
        end: doc.data()['end'],
        allDay: doc.data()['allDay'],
        backgroundColor: doc.data()['backgroundColor']
      }));
      this.calendarOptions.events = events;
    });
  }

  // Neues Ereignis hinzufügen
  async handleDateSelect(selectInfo: any) {
    const title = prompt('Ereignisname (z. B. Arbeitszeit oder Freier Tag):');
    const calendarApi = selectInfo.view.calendar;
    calendarApi.unselect();

    if (title) {
      const newEvent = {
        title,
        start: selectInfo.startStr,
        end: selectInfo.endStr,
        allDay: selectInfo.allDay,
        backgroundColor: title === 'Freier Tag' ? '#ff4444' : '#3788d8'
      };
      await addDoc(collection(db, 'events'), newEvent);
      // Events werden automatisch über den Listener aktualisiert
    }
  }

  // Ereignis löschen
  async handleEventClick(clickInfo: any) {
    if (confirm(`Möchtest du "${clickInfo.event.title}" löschen?`)) {
      await deleteDoc(doc(db, 'events', clickInfo.event.id));
      // Events werden automatisch über den Listener aktualisiert
    }
  }
}

