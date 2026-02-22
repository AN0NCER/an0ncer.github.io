# Cloudflare Workers — настройка Kodik API прокси

Этот документ описывает шаги для настройки Cloudflare Worker, который будет проксировать запросы к Kodik API, скрывая API-ключ от клиентов.

**Никаких дополнительных инструментов не требуется** — всё настраивается через веб-интерфейс.

---

## Шаг 1: Регистрация на Cloudflare

1. Перейдите на [https://dash.cloudflare.com/sign-up](https://dash.cloudflare.com/sign-up)
2. Зарегистрируйтесь (бесплатно)
3. Подтвердите email

---

## Шаг 2: Создание Worker

1. Перейдите в [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. В меню слева выберите **Compute** ─► **Workers & Pages**
3. Нажмите **Create application**
4. Нажмите **Start with Hello World!**
5. Введите имя: `kodik-proxy`
6. Нажмите **Deploy**

---

## Шаг 3: Добавление переменной KODIK_TOKEN

1. В окне Worker перейдите во вкладку **Settings**
2. Найдите раздел **Variables and Secrets**
3. Нажмите **Add**
4. Заполните поля:
   - **Key**: `KODIK_TOKEN`
   - **Value**: ваш API-ключ от Kodik
5. Нажмите **Save**

---

## Шаг 4: Загрузка кода Worker

1. Откройте созданный Worker (`kodik-proxy`)
2. Нажмите **Edit code**
3. Удалите весь код в редакторе
4. Откройте файл `worker.js` из этой папки и скопируйте всё содержимое
5. Вставьте код в редактор на Cloudflare
6. Нажмите **Deploy**

---

## Шаг 5: Обновление URL в api.kodik.js

1. Узнайте URL вашего Worker (указан вверху страницы Worker или в браузере):
   ```
   https://kodik-proxy.ВАШ_СУБДОМЕН.workers.dev
   ```

2. Откройте файл `javascript/modules/api.kodik.js`

3. Замените строку:
   ```javascript
   const kurl = 'https://YOUR_WORKER_URL';
   ```

4. На ваш URL, например:
   ```javascript
   const kurl = 'https://kodik-proxy.an0ncer.workers.dev';
   ```

---

## Тарифы

Cloudflare Workers **бесплатный тариф** включает:
- ✅ 100,000 запросов в день
- ✅ 10ms CPU time на запрос
- ✅ 1 Worker

Для большинства проектов этого достаточно.

---

## Структура файлов

```
worker/
├── worker.js        # Код прокси-сервера (загрузить в Cloudflare)
└── README.md        # Эта инструкция
```

---

## Troubleshooting

### Ошибка "KODIK_TOKEN not configured"
- Убедитесь, что переменная добавлена в Settings → Variables
- Вернитесь в Code и нажмите **Deploy** ещё раз

### Ошибка CORS
- Worker уже добавляет CORS заголовки
- Убедитесь, что `api.kodik.js` указывает на URL Worker, а не на Kodik напрямую

### Worker не отвечает
- Проверьте, что код сохранён (вкладка Code → Deploy)
- Проверьте логи в Dashboard (Workers → kodik-proxy → Logs)

### Запросы идут напрямую к Kodik (ключ виден в сети)
- Проверьте, что в `api.kodik.js` указан URL Worker:
  ```javascript
  const kurl = 'https://kodik-proxy.an0ncer.workers.dev';
  ```

---

## Как это работает

```
┌─────────────┐      ┌──────────────────┐      ┌──────────────┐
│  Браузер    │ ───► │  Cloudflare      │ ───► │  Kodik API   │
│  (GitHub    │      │  Workers         │      │  (kodikapi.  │
│   Pages)    │      │  (прокси)        │      │   com)       │
└─────────────┘      └──────────────────┘      └──────────────┘
     │                       │                        │
     ▼                       ▼                        ▼
  Видит только          Ключ хранится           Ключ не виден
  URL Worker'а          в Cloudflare            пользователю
```
