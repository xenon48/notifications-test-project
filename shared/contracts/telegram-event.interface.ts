export interface TelegramEvent {
  eventId: string;
  payload: {
    chatId: string;
    message: string;
  };
  metadata: {
    createdAt: string;
    retryCount: number;
    source: string;
    lastError?: string;
  };
}