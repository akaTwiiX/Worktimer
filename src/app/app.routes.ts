import { Routes } from '@angular/router';
import { authGuard } from './auth.guard';

export const routes: Routes = [
    {
        path: '',
        loadComponent: () => import('./calendar/calendar.component').then(m => m.CalendarComponent),
        canActivate: [authGuard]
    },
    {
        path: 'login',
        loadComponent: () => import('./login/login.component').then(m => m.LoginComponent)
    },
    {
        path: 'register',
        loadComponent: () => import('./register/register.component').then(m => m.RegisterComponent)
    },
    {
        path: '**',
        redirectTo: 'login'
    }
];
