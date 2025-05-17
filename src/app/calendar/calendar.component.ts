import { Component, OnDestroy, ViewChild } from '@angular/core';
import { FullCalendarComponent, FullCalendarModule } from '@fullcalendar/angular';
import { CalendarOptions, EventInput } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { collection, onSnapshot, addDoc, deleteDoc, doc, updateDoc, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase-config';
import { MatDialog } from '@angular/material/dialog';
import { EventDialogComponent } from '../event-dialog/event-dialog.component';
import { Colors } from '../color.themes';

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
export class CalendarComponent implements OnDestroy {
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
    selectMirror: false,
    unselectAuto: true,
    longPressDelay: 500,
    eventLongPressDelay: 500,
    firstDay: 1,
    slotLabelFormat: { hour: '2-digit', minute: '2-digit', hour12: false },
    eventTimeFormat: { hour: '2-digit', minute: '2-digit', hour12: false },
    datesSet: this.handleDatesSet.bind(this),
    eventContent: (arg) => {
      return { html: arg.event.title }; // Rendert den title-String als HTML
    }
  };

  private unsubscribe: (() => void) | null = null;
  private isSelecting = false; // Flag, um select-Prozess zu markieren

  totalTime = 0;
  totalPause = 0;

  constructor(private dialog: MatDialog) { }

  handleDatesSet(dateInfo: any) {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Ersten und letzten Tag des aktuellen Monats berechnen
    const currentMonthStart = new Date(currentYear, currentMonth, 1);
    const currentMonthEnd = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59);

    const start = new Date(dateInfo.startStr);
    const end = new Date(dateInfo.endStr);

    const monthStart = new Date(start.getFullYear(), start.getMonth(), 1);
    const monthEnd = new Date(end.getFullYear(), end.getMonth() + 1, 0, 23, 59, 59);

    let sum = 0;
    let pause = 0;

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
      const events: EventInput[] = snapshot.docs.map(doc => {
        const colorId = doc.data()['backgroundColor'];
        const color = Colors.find(c => c.id === colorId)?.value || '#FFFFFF';
        const eventStart = new Date(doc.data()['start']);

        const isStartInMonth = eventStart >= currentMonthStart && eventStart <= currentMonthEnd;

        if (isStartInMonth) {

          let title = doc.data()['title'];

          if (title.includes('<small>Kasse:</small>')) {
            let numbers = title.split('<small>Kasse:</small>');
            numbers = numbers[0].trim();

            let numStart = parseInt(numbers.split('-')[0].trim(), 10);
            let numEnd = parseInt(numbers.split('-')[1].trim(), 10);

            if (!isNaN(numStart) && !isNaN(numEnd)) {
              let daySum = numEnd - numStart;
              if (daySum >= 6 && daySum < 8) {
                pause += 0.25;
              } else if (daySum >= 8) {
                pause += 0.5;
              }
              sum += daySum;
            } else {
              console.warn(`Invalid start or end values in the title: ${title}`);
            }
          }
        }


        return {
          id: doc.id,
          title: doc.data()['title'],
          start: doc.data()['start'],
          end: doc.data()['end'],
          allDay: doc.data()['allDay'],
          backgroundColor: color,
          borderColor: color,
          textColor: '#000000'
        };
      });
      this.totalTime = sum;
      this.totalPause = pause;
      this.calendarOptions.events = events;
    }, (error) => {
      console.error('Fehler beim Laden der Events:', error);
    });
  }

  async handleDateSelect(selectInfo: any) {
    const calendarApi = this.calendarRef.getApi();
    this.isSelecting = true;

    const dialogRef = this.dialog.open(EventDialogComponent, {
      width: '250px',
      data: { isNew: true },
      autoFocus: false
    });

    dialogRef.afterClosed().subscribe(async result => {
      if (!result) {
        calendarApi.unselect();
        this.isSelecting = false;
        return;
      }

      const newEvent = {
        title: result.title,
        start: selectInfo.startStr,
        end: selectInfo.endStr,
        allDay: selectInfo.allDay,
        backgroundColor: result.backgroundColor,
        borderColor: result.backgroundColor,
        textColor: '#000000'
      };

      try {
        await addDoc(collection(db, 'events'), newEvent);
        calendarApi.unselect();
      } catch (error) {
        console.error('Fehler beim Erstellen des Events:', error);
        calendarApi.unselect();
      }
      this.isSelecting = false;
    });
  }


  async handleEventClick(clickInfo: any) {
    const event = clickInfo.event;
    const dialogRef = this.dialog.open(EventDialogComponent, {
      width: '250px',
      data: {
        isNew: false,
        id: event.id,
        title: event.title,
        start: event.startStr,
        end: event.endStr,
        allDay: event.allDay,
        backgroundColor: event.backgroundColor
      },
      autoFocus: false
    });

    dialogRef.afterClosed().subscribe(async result => {
      if (!result) return;

      const eventDoc = doc(db, 'events', event.id);

      try {
        if (result.delete) {
          await deleteDoc(eventDoc);
        } else {
          const updatedEvent = {
            title: result.title,
            start: result.start || event.startStr,
            end: result.end || event.endStr,
            allDay: result.allDay ?? event.allDay,
            backgroundColor: result.backgroundColor,
            borderColor: result.backgroundColor,
            textColor: '#000000'
          };
          await updateDoc(eventDoc, updatedEvent);
        }
      } catch (error) {
        console.error('Fehler beim Bearbeiten/Löschen des Events:', error);
      }
    });
  }

  handleDateClick(info: any) {
    const calendarApi = this.calendarRef.getApi();

    if (!this.isSelecting) {
      calendarApi.changeView('timeGridDay', info.dateStr);
    }
  }

  ngOnDestroy() {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
  }
}