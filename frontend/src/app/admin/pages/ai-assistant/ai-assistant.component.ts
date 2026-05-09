import { Component, ElementRef, ViewChild, AfterViewChecked, inject, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

interface Message {
  role: 'user' | 'ai';
  text: string;
  pending?: boolean;
}

@Component({
  selector: 'app-ai-assistant',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="ai-shell">

      <div class="ai-header">
        <div class="ai-header-left">
          <span class="ai-title">> AI_ASSISTANT.EXE</span>
          <span class="ai-status">● ONLINE</span>
        </div>
        <button class="admin-btn admin-btn-sm" (click)="newSession()">NEW CHAT</button>
      </div>

      <div class="ai-messages" #messagesContainer>
        <div class="ai-welcome" *ngIf="messages.length === 0">
          <div class="welcome-line">Ready.</div>
          <div class="welcome-sub">Describe a project and I'll handle the rest.</div>
        </div>

        <div
          *ngFor="let msg of messages"
          class="ai-message"
          [class.ai-message--user]="msg.role === 'user'"
          [class.ai-message--ai]="msg.role === 'ai'"
          [class.ai-message--pending]="msg.pending">
          <div class="msg-label">{{ msg.role === 'user' ? 'YOU' : 'AI' }}</div>
          <div class="msg-body" [style.white-space]="'pre-wrap'">{{ msg.text }}</div>
        </div>

        <div class="ai-typing" *ngIf="loading">
          <span class="typing-dot">▋</span>
        </div>
      </div>

      <div class="ai-input-area">
        <textarea
          class="ai-input"
          [(ngModel)]="input"
          (keydown.enter)="onEnter($event)"
          [disabled]="loading"
          placeholder="Describe your project... (Enter to send, Shift+Enter for new line)"
          rows="3">
        </textarea>
        <button class="ai-send-btn" (click)="send()" [disabled]="loading || !input.trim()">
          {{ loading ? '...' : 'SEND' }}
        </button>
      </div>

    </div>
  `,
  styles: [`
    .ai-shell {
      display: flex;
      flex-direction: column;
      height: calc(100vh - 80px);
      background: var(--admin-bg);
    }

    .ai-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 0 12px 0;
      border-bottom: 1px solid var(--admin-border);
      margin-bottom: 0;
      flex-shrink: 0;
    }

    .ai-header-left {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .ai-title {
      font-size: 13px;
      letter-spacing: 2px;
      color: var(--admin-neon);
      text-transform: uppercase;
    }

    .ai-status {
      font-size: 11px;
      color: var(--admin-success);
      letter-spacing: 1px;
    }

    .ai-messages {
      flex: 1;
      overflow-y: auto;
      padding: 24px 0;
      display: flex;
      flex-direction: column;
      gap: 20px;
      scrollbar-width: thin;
      scrollbar-color: var(--admin-border) transparent;
    }

    .ai-welcome {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      gap: 8px;
      color: var(--admin-text-muted);
      font-family: var(--admin-font);
    }

    .welcome-line {
      font-size: 20px;
      color: var(--admin-neon);
      letter-spacing: 4px;
    }

    .welcome-sub {
      font-size: 12px;
      letter-spacing: 1px;
    }

    .ai-message {
      display: flex;
      flex-direction: column;
      gap: 6px;
      max-width: 80%;
    }

    .ai-message--user {
      align-self: flex-end;
      align-items: flex-end;
    }

    .ai-message--ai {
      align-self: flex-start;
      align-items: flex-start;
    }

    .msg-label {
      font-size: 10px;
      letter-spacing: 2px;
      color: var(--admin-text-muted);
      text-transform: uppercase;
    }

    .ai-message--user .msg-label { color: var(--admin-neon); }
    .ai-message--ai .msg-label { color: var(--admin-accent); }

    .msg-body {
      padding: 12px 16px;
      border-radius: var(--admin-radius);
      font-size: 13px;
      line-height: 1.6;
      font-family: var(--admin-font);
    }

    .ai-message--user .msg-body {
      background: var(--admin-neon-dim);
      border: 1px solid var(--admin-neon);
      color: var(--admin-text);
    }

    .ai-message--ai .msg-body {
      background: var(--admin-surface);
      border: 1px solid var(--admin-border);
      color: var(--admin-text);
    }

    .ai-typing {
      align-self: flex-start;
      padding: 8px 0;
    }

    .typing-dot {
      color: var(--admin-neon);
      font-size: 18px;
      animation: blink 1s step-start infinite;
    }

    @keyframes blink {
      50% { opacity: 0; }
    }

    .ai-input-area {
      display: flex;
      gap: 10px;
      align-items: flex-end;
      padding-top: 12px;
      border-top: 1px solid var(--admin-border);
      flex-shrink: 0;
    }

    .ai-input {
      flex: 1;
      background: var(--admin-surface);
      border: 1px solid var(--admin-border);
      color: var(--admin-text);
      font-family: var(--admin-font);
      font-size: 13px;
      padding: 10px 14px;
      border-radius: var(--admin-radius);
      outline: none;
      resize: none;
      line-height: 1.5;
      transition: border-color 0.15s ease, box-shadow 0.15s ease;

      &:focus {
        border-color: var(--admin-neon);
        box-shadow: 0 0 8px rgba(0, 255, 204, 0.2);
      }

      &::placeholder { color: var(--admin-text-muted); }
      &:disabled { opacity: 0.5; }
    }

    .ai-send-btn {
      font-family: var(--admin-font);
      font-size: 12px;
      font-weight: bold;
      letter-spacing: 2px;
      padding: 10px 20px;
      background: var(--admin-neon-dim);
      border: 1px solid var(--admin-neon);
      color: var(--admin-neon);
      border-radius: var(--admin-radius);
      cursor: pointer;
      transition: all 0.15s ease;
      height: 42px;

      &:hover:not(:disabled) {
        background: rgba(0, 255, 204, 0.2);
        box-shadow: 0 0 8px rgba(0, 255, 204, 0.4);
      }

      &:disabled { opacity: 0.4; cursor: not-allowed; }
    }
  `]
})
export class AiAssistantComponent implements AfterViewChecked {
  @ViewChild('messagesContainer') private messagesContainer!: ElementRef;

  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);
  private zone = inject(NgZone);

  messages: Message[] = [];
  input = '';
  loading = false;
  sessionId = this.generateSessionId();

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  onEnter(event: Event) {
    if (!(event as KeyboardEvent).shiftKey) {
      event.preventDefault();
      this.send();
    }
  }

  send() {
    const text = this.input.trim();
    if (!text || this.loading) return;

    this.messages.push({ role: 'user', text });
    this.input = '';
    this.loading = true;

    this.http.post<{ data: { reply: string } }>('/api/admin/ai-chat', {
      message: text,
      sessionId: this.sessionId,
    }).subscribe({
      next: (res) => {
        this.zone.run(() => {
          this.messages.push({ role: 'ai', text: res.data.reply });
          this.loading = false;
          this.cdr.detectChanges();
        });
      },
      error: () => {
        this.zone.run(() => {
          this.messages.push({ role: 'ai', text: 'Error connecting to AI service.' });
          this.loading = false;
          this.cdr.detectChanges();
        });
      },
    });
  }

  newSession() {
    this.messages = [];
    this.input = '';
    this.loading = false;
    this.sessionId = this.generateSessionId();
  }

  private scrollToBottom() {
    try {
      this.messagesContainer.nativeElement.scrollTop =
        this.messagesContainer.nativeElement.scrollHeight;
    } catch {}
  }

  private generateSessionId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }
}
