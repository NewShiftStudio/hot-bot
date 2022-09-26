# Бот Est 1993

Бот программы лояльности заведения Est 1993

## Переменные окружения

Для начала нужно указать переменные окружения

`DB_PATH` - путь к базе данных sqlite3

`USER_BOT_TOKEN` - токен, генерируемый telegram

`IIKO_API_LOGIN` - apiLogin, генерируемы сервисом iiko

`REGISTER_ADMIN_PASSWORD` - пароль для команды регистрации администратора

`USER_SERVER_PORT` - порт сервера
`USER_SERVER_URL` - адрес сервера

`BAR_CODES_FOLDER` - название папки с бар-кодами (Прим. /bar-codes)

## Установка зависимостей

Установка пакетов

```bash
  npm install
```

## Запуск локально

Указать переменные окружения:
`DB_PATH`
`USER_BOT_TOKEN`
`IIKO_API_LOGIN`
`REGISTER_ADMIN_PASSWORD`
`PUBLIC_FOLDER`='store'
`BAR_CODES_FOLDER`='bar-codes

Запуск сервера

```bash
  npm run start:dev
```

## Настройка на сервере

Настройка базы данных

```
В DB_PATH указать путь к store.db
```

Настройка сервера

```
1. В конфиге http сервера (NGINX, Apache, ...) указываем путь к серверу бота (node js серверу).
2. Необходимо настроить ssl сертификат (для hhtp сервера)
3. В поле USER_SERVER_URL пишем ссылку на соответствующий сервер (указанную в конфиге http сервера)
```

Настройка бота

```
1. Указать USER_BOT_TOKEN (Генерируется телеграмом)
2. Указать PORT для сервера
```

Билд

```bash
npm run build
```

Запуск pm2 (Ввести команду предварительно убедившись, что pm2 установлен на сервере)

```
pm2 start ecosystem.config.js
```

Запуск ботов

```bash
npm run start:prod
```

## Запуск отдельных скриптов

Генерация баркодов из файла cards.json (Важно! Предварительно создайте файл cards.json в корне проекта)

```bash
  npm run generate
```

Запуск скрипта поздравления пользователей

```bash
  npm run birthNotification
```

Запуск скрипта рассылки о скидке при долго отсутствии заказа

```bash
  npm run orderNotification
```
