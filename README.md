1. Запустить все сервисы – в корне проекта запустить команду:
$ docker compose up --build

2. После запуска для проверки работоспособности открыть Swagger Producer API:
http://localhost:3000/api/docs

3. Найти и запустить Telegram-бота:
@RabbitNotificationsTestBot


ПРИМЕЧАНИЕ!
Для корректной работы Telegram Bot API может потребоваться стабильный доступ к внешним сервисам Telegram. В некоторых сетях и регионах могут понадобиться дополнительные сетевые настройки. Например, прокси/***.


Telegram-бот используется для демонстрации работы микросервисной архитектуры

Схема потока сообщений:

Telegram Chat -> Producer Service -> RabbitMQ -> Consumer Service -> Telegram Chat

- Пользователь отправляет сообщение боту
- Бот присылает ссылку для отправки сообщения в Producer Service по HTTP
- Producer Service обрабатывает HTTP-запрос и публикует событие в RabbitMQ
- Consumer Service получает сообщение из очереди
- Consumer Service отправляет уведомление обратно в Telegram-чат


Дополнительно реализовано:
- Retry-механизм при временных ошибках подключения к RabbitMQ
- Retry обработки сообщений при ошибках отправки в Telegram
- Dead Letter Queue (DLQ) для сообщений с превышенным лимитом повторных попыток
- Идемпотентность обработки сообщений через уникальный eventId
- Логирование обработанных событий в PostgreSQL
- JSON-сериализация сообщений
- Publisher Confirms для подтверждения доставки сообщений в RabbitMQ
- Swagger API Docs


Используемые технологии:
- NestJS
- RabbitMQ
- PostgreSQL
- Docker Compose
- Telegram Bot API