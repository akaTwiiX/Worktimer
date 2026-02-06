import { Component, OnDestroy, ViewChild, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { FullCalendarComponent, FullCalendarModule } from '@fullcalendar/angular';
import { CalendarOptions, EventInput } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { collection, onSnapshot, addDoc, deleteDoc, doc, updateDoc, query, where } from 'firebase/firestore';
import { auth, db } from '../../firebase-config';
import { MatDialog } from '@angular/material/dialog';
import { Colors } from '../../color.themes';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';
import { ThemeToggleComponent } from '../../components/theme-toggle/theme-toggle.component';
import { EventDialogComponent } from '../../components/event-dialog/event-dialog.component';

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [FullCalendarModule, MatButtonModule, ThemeToggleComponent],
  templateUrl: './calendar.component.html',
  styleUrls: ['./calendar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CalendarComponent implements OnDestroy {
  @ViewChild('calendar') calendarRef!: FullCalendarComponent;

  calendarOptions: CalendarOptions = {
    initialView: 'dayGridMonth',
    plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
    editable: true,
    selectable: false,
    events: [],
    dateClick: this.handleDateClick.bind(this),
    locale: 'de',
    timeZone: 'Europe/Berlin',
    headerToolbar: {
      left: 'prev,next',
      center: 'title',
      right: 'today'
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
      return { html: arg.event.title };
    }
  };

  private unsubscribe: (() => void) | null = null;
  private touchStartX = 0;
  private touchEndX = 0;
  private originalEvents: EventInput[] = [];

  totalTime = 0;
  totalPause = 0;

  constructor(private dialog: MatDialog, private router: Router, private cdr: ChangeDetectorRef) { }

  onTouchStart(e: TouchEvent) {
    this.touchStartX = e.changedTouches[0].screenX;
  }

  onTouchEnd(e: TouchEvent) {
    this.touchEndX = e.changedTouches[0].screenX;
    this.handleSwipe();
  }

  private handleSwipe() {
    const diff = this.touchEndX - this.touchStartX;
    const calendarApi = this.calendarRef.getApi();

    if (Math.abs(diff) > 50) {
      if (diff < 0) {
        calendarApi.next();
      } else {
        calendarApi.prev();
      }
    }
  }

  handleDatesSet(dateInfo: any) {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const currentMonthStart = new Date(currentYear, currentMonth, 1);
    const currentMonthEnd = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59);

    const start = new Date(dateInfo.startStr);
    const end = new Date(dateInfo.endStr);

    const monthStart = new Date(start.getFullYear(), start.getMonth(), 1);
    const monthEnd = new Date(end.getFullYear(), end.getMonth() + 1, 0, 23, 59, 59);

    if (this.unsubscribe) {
      this.unsubscribe();
    }
    const eventsCollection = collection(db, auth.currentUser!.uid);
    const q = query(
      eventsCollection,
      where('start', '>=', monthStart.toISOString()),
      where('start', '<=', monthEnd.toISOString())
    );

    this.unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const worker = new Worker(new URL('../../worker/event-processor.worker', import.meta.url));
        worker.onmessage = ({ data }) => {
          this.totalTime = data.totalTime;
          this.totalPause = data.totalPause;
          this.originalEvents = data.originalEvents;
          this.calendarOptions.events = data.mergedEvents;
          this.cdr.markForCheck();
          worker.terminate();
        };

        worker.postMessage({
          docs: snapshot.docs.map(d => ({ id: d.id, ...d.data() })),
          colors: Colors,
          currentMonthStart: currentMonthStart.toISOString(),
          currentMonthEnd: currentMonthEnd.toISOString()
        });
      },
      (error) => {
        console.error('Error loading events:', error);
      }
    );
  }

  async handleDateClick(info: any) {
    const clickedDate = info.dateStr.split('T')[0];
    const eventForDay = this.originalEvents.find((e) => {
      const eventDate = (e.start as string).split('T')[0];
      return eventDate === clickedDate;
    });

    if (!eventForDay) {
      const dialogRef = this.dialog.open(EventDialogComponent, {
        width: '250px',
        data: { isNew: true },
        autoFocus: false
      });

      dialogRef.afterClosed().subscribe(async (result) => {
        if (!result) return;

        const newEvent = {
          title: result.title,
          start: clickedDate,
          end: clickedDate,
          allDay: true,
          backgroundColor: result.backgroundColor,
          borderColor: result.backgroundColor,
          textColor: '#000000'
        };

        try {
          await addDoc(collection(db, auth.currentUser!.uid), newEvent);
        } catch (error) {
          console.error('Error creating events:', error);
        }
      });

      return;
    }

    const dialogRef = this.dialog.open(EventDialogComponent, {
      width: '250px',
      data: {
        isNew: false,
        id: eventForDay.id,
        title: eventForDay.title,
        backgroundColor: eventForDay.backgroundColor
      },
      autoFocus: false
    });

    dialogRef.afterClosed().subscribe(async (result) => {
      if (!result) return;

      const eventDoc = doc(db, auth.currentUser!.uid, eventForDay.id!);

      try {
        if (result.delete) {
          await deleteDoc(eventDoc);
        } else {
          const updatedEvent = {
            title: result.title,
            start: eventForDay.start,
            end: eventForDay.end,
            allDay: true,
            backgroundColor: result.backgroundColor,
            borderColor: result.backgroundColor,
            textColor: '#000000'
          };
          await updateDoc(eventDoc, updatedEvent);
        }
      } catch (error) {
        console.error('Error update/deleting events:', error);
      }
    });
  }

  async logout() {
    await auth.signOut();
    this.router.navigate(['/login']);
  }

  ngOnDestroy() {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
  }
}
