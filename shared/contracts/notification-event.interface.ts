export interface NotificationEvent {
  eventId: string;
  type: 'TELEGRAM_NOTIFICATION';
  payload: {
    chatId: number;
    message: string;
  };
  metadata: {
    createdAt: string;
    retryCount: number;
    source: string;
    lastError?: string;
  };
}