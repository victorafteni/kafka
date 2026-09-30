import { Injectable, inject, signal, computed } from '@angular/core';
import { User, AuthState } from '../../shared/models/user.model';
import { EventBusService } from '../event-bus/event-bus.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private eventBus = inject(EventBusService);

  private state = signal<AuthState>({
    user: {
      id: 'usr-001',
      firstName: 'Alex',
      lastName: 'Ionescu',
      email: 'alex.ionescu@example.com',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
      roles: ['customer', 'admin'],
      token: 'jwt-mock-session-alex'
    },
    isAuthenticated: true,
    loading: false,
    error: null
  });

  readonly currentUser = computed(() => this.state().user);
  readonly isAuthenticated = computed(() => this.state().isAuthenticated);
  readonly isAdmin = computed(() => this.state().user?.roles.includes('admin') ?? false);
  readonly userFullName = computed(() => {
    const u = this.state().user;
    return u ? `${u.firstName} ${u.lastName}` : '';
  });

  login(email: string, _password: string): Promise<boolean> {
    this.state.update(s => ({ ...s, loading: true, error: null }));

    return new Promise(resolve => {
      setTimeout(() => {
        const loggedUser: User = {
          id: 'usr-001',
          firstName: 'Alex',
          lastName: 'Ionescu',
          email,
          avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
          roles: ['customer', 'admin'],
          token: 'jwt-mock-session-' + Date.now()
        };

        this.state.set({
          user: loggedUser,
          isAuthenticated: true,
          loading: false,
          error: null
        });

        this.eventBus.emit('USER_LOGGED_IN', {
          userId: loggedUser.id,
          email: loggedUser.email
        }, loggedUser.id);

        resolve(true);
      }, 300);
    });
  }

  logout(): void {
    const user = this.state().user;
    this.state.set({
      user: null,
      isAuthenticated: false,
      loading: false,
      error: null
    });

    if (user) {
      this.eventBus.emit('USER_LOGGED_OUT', {
        userId: user.id
      }, user.id);
    }
  }
}

