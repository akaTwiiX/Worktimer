import { Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';
import { FullCalendarComponent, FullCalendarModule } from '@fullcalendar/angular';
import { CalendarOptions, EventInput } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { collection, onSnapshot, addDoc, deleteDoc, doc, updateDoc, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../firebase-config';
import { MatDialog } from '@angular/material/dialog';
import { EventDialogComponent } from '../event-dialog/event-dialog.component';
import { Colors } from '../color.themes';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [FullCalendarModule, MatButtonModule],
  templateUrl: './calendar.component.html',
  styleUrls: ['./calendar.component.scss']
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

  constructor(private dialog: MatDialog, private router: Router) { }

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
        let sum = 0;
        let pause = 0;
        const events: EventInput[] = snapshot.docs.map((doc) => {
          const colorId = doc.data()['backgroundColor'];
          const color = Colors.find((c) => c.id === colorId)?.value || '#FFFFFF';
          const eventStart = new Date(doc.data()['start']);

          const isStartInMonth =
            eventStart >= currentMonthStart && eventStart <= currentMonthEnd;

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
            allDay: true,
            backgroundColor: color,
            borderColor: color,
            textColor: '#000000'
          };
        });

        this.totalTime = sum;
        this.totalPause = pause;

        const sorted = events.sort(
          (a, b) =>
            new Date(a.start as string).getTime() -
            new Date(b.start as string).getTime()
        );

        this.originalEvents = sorted;
        this.calendarOptions.events = this.mergeEvents(sorted);
      },
      (error) => {
        console.error('Error loading events:', error);
      }
    );
  }

  private mergeEvents(events: EventInput[]): EventInput[] {
    if (!events.length) return [];

    const merged: EventInput[] = [];
    let blockStart = events[0].start as string;
    let blockEnd = events[0].start as string;
    let currentTitle = events[0].title;
    let currentColor = events[0].backgroundColor;

    function pushBlock() {
      const endDate = new Date(blockEnd);
      endDate.setDate(endDate.getDate() + 1);

      merged.push({
        title: currentTitle,
        start: blockStart,
        end: endDate.toISOString().split('T')[0],
        allDay: true,
        backgroundColor: currentColor,
        borderColor: currentColor,
        textColor: '#000000'
      });
    }

    for (let i = 1; i < events.length; i++) {
      const prev = new Date(blockEnd);
      const next = new Date(events[i].start as string);
      const diff = (next.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);

      if (events[i].title === currentTitle && diff === 1) {
        blockEnd = events[i].start as string;
      } else {
        pushBlock();
        blockStart = events[i].start as string;
        blockEnd = events[i].start as string;
        currentTitle = events[i].title;
        currentColor = events[i].backgroundColor as string;
      }
    }

    pushBlock();
    return merged;
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
