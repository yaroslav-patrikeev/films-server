# Films Server

## Запуск сервера

```bash
# Установка зависимостей
npm ci

# Запуск
npm run start
```

Сервер стартует на `http://localhost:3000`

## Swagger документация

```
http://localhost:3000/api-docs
```

## API Endpoints

| Method | Endpoint          | Description                               |
| ------ | ----------------- | ----------------------------------------- |
| POST   | `/getFilms`       | Получение списка с фильтрацией/пагинацией |
| POST   | `/createFilm`     | Создание фильма                           |
| PUT    | `/updateFilm/:id` | Обновление фильма                         |
| DELETE | `/deleteFilm/:id` | Удаление фильма                           |
