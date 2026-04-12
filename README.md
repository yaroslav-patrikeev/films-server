# API Фильмов

## Эндпоинт: POST /film

Получение списка фильмов с поддержкой фильтрации, сортировки и пагинации.

### 📋 Параметры запроса (Request Body)

```json
{
  "filters": {
    "genres": ["drama", "action"],
    "status": "watched",
    "minRating": 7.5,
    "yearRange": {
      "from": 2010,
      "to": 2024
    }
  },
  "sort": {
    "field": "rating",
    "order": "desc"
  },
  "pagination": {
    "page": 1,
    "pageSize": 10
  }
}
```

### 🔧 Параметры

#### `pagination` (обязательный)

| Поле       | Тип    | Описание                         | Ограничения |
| ---------- | ------ | -------------------------------- | ----------- |
| `page`     | number | Номер страницы                   | ≥ 1         |
| `pageSize` | number | Количество элементов на странице | 1-100       |

#### `filters` (опциональный)

| Поле        | Тип      | Описание            | Допустимые значения                                                                                 |
| ----------- | -------- | ------------------- | --------------------------------------------------------------------------------------------------- |
| `genres`    | string[] | Массив жанров       | `drama`, `comedy`, `action`, `fantasy`, `thriller`, `horror`, `melodrama`, `adventure`, `detective` |
| `status`    | string   | Статус просмотра    | `in_plans`, `watched`                                                                               |
| `minRating` | number   | Минимальный рейтинг | 0-10                                                                                                |
| `yearRange` | object   | Диапазон годов      | Объект с полями `from` и/или `to`                                                                   |

##### `yearRange` (объект)

| Поле   | Тип    | Описание       | Ограничения        |
| ------ | ------ | -------------- | ------------------ |
| `from` | number | Год выпуска ОТ | 1888 - текущий год |
| `to`   | number | Год выпуска ДО | 1888 - текущий год |

> **Важно:** `yearRange` должен содержать хотя бы одно из полей (`from` или `to`)

#### `sort` (опциональный)

| Поле    | Тип    | Описание            | Допустимые значения                          |
| ------- | ------ | ------------------- | -------------------------------------------- |
| `field` | string | Поле для сортировки | `year`, `rating`, `createdAt`, `title`       |
| `order` | string | Порядок сортировки  | `asc` (по возрастанию), `desc` (по убыванию) |

**Значения по умолчанию:**

- `sort.field = "rating"`
- `sort.order = "desc"`

### ✅ Успешный ответ (200 OK)

```json
{
  "success": true,
  "data": [
    {
      "id": 2,
      "title": "Побег из Шоушенка",
      "director": "Фрэнк Дарабонт",
      "year": 1994,
      "createdAt": "2024-01-10T09:15:00.000Z",
      "genres": ["drama", "detective"],
      "description": "...",
      "image": "https://...",
      "rating": 9.1,
      "status": "watched"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "pageSize": 10,
    "totalPages": 5
  },
  "statistic": {
    "total": 1,
    "watched": 1,
    "averageRating": 9.1
  }
}
```

#### Поля ответа

| Поле                      | Описание                  |
| ------------------------- | ------------------------- |
| `success`                 | Статус выполнения запроса |
| `data`                    | Массив фильмов            |
| `pagination.currentPage`  | Текущая страница          |
| `pagination.pageSize`     | Размер страницы           |
| `pagination.totalPages`   | Общее количество страниц  |
| `statistic.total`         | Всего фильмов             |
| `statistic.watched`       | Просмотрено               |
| `statistic.averageRating` | Средний рейтинг           |

### ❌ Ошибки (400 Bad Request)

#### 1. Отсутствует обязательное поле `pagination`

```json
{
  "success": false,
  "message": "Поле 'pagination' обязательно"
}
```

#### 2. Отсутствует `page` или `pageSize`

```json
{
  "success": false,
  "message": "Поле 'pagination.page' обязательно"
}
```

#### 3. Недопустимый параметр фильтра

```json
{
  "success": false,
  "message": "Недопустимый параметр фильтра: 'invalidField'. Допустимые: genres, status, minRating, yearRange"
}
```

#### 4. Недопустимый жанр

```json
{
  "success": false,
  "message": "Недопустимый жанр: 'western'. Допустимые: drama, comedy, action, fantasy, thriller, horror, melodrama, adventure, detective"
}
```

#### 5. Недопустимый статус

```json
{
  "success": false,
  "message": "Недопустимый статус: 'viewing'. Допустимые: in_plans, watched"
}
```

#### 6. Некорректный `minRating`

```json
{
  "success": false,
  "message": "Поле 'filters.minRating' должно быть числом от 0 до 10"
}
```

#### 7. `yearRange` без полей `from` и `to`

```json
{
  "success": false,
  "message": "Поле 'filters.yearRange' должно содержать хотя бы одно из полей: 'from' или 'to'"
}
```

#### 8. Некорректный год в `yearRange`

```json
{
  "success": false,
  "message": "Поле 'filters.yearRange.from' должно быть корректным годом (1888-2026)"
}
```

#### 9. `from` больше `to`

```json
{
  "success": false,
  "message": "Поле 'filters.yearRange.from' не может быть больше 'to'"
}
```

#### 10. Недопустимое поле сортировки

```json
{
  "success": false,
  "message": "Недопустимое поле сортировки: 'director'. Допустимые: year, rating, createdAt, title"
}
```

#### 11. Недопустимый порядок сортировки

```json
{
  "success": false,
  "message": "Недопустимый порядок сортировки: 'up'. Допустимые: asc, desc"
}
```

#### 12. Некорректный `pageSize` (больше 100)

```json
{
  "success": false,
  "message": "Поле 'pagination.pageSize' должно быть числом от 1 до 100"
}
```

### 📝 Примеры запросов

#### Пример 1: Получить первые 10 фильмов с самым высоким рейтингом

```json
{
  "pagination": {
    "page": 1,
    "pageSize": 10
  }
}
```

#### Пример 2: Фильмы в планах, жанры драма или фантастика, после 2010 года

```json
{
  "filters": {
    "genres": ["drama", "fantasy"],
    "status": "in_plans",
    "yearRange": {
      "from": 2010
    }
  },
  "sort": {
    "field": "year",
    "order": "desc"
  },
  "pagination": {
    "page": 1,
    "pageSize": 10
  }
}
```

#### Пример 3: Просмотренные фильмы с рейтингом выше 8.5, сортировка по дате добавления

```json
{
  "filters": {
    "status": "watched",
    "minRating": 8.5
  },
  "sort": {
    "field": "createdAt",
    "order": "desc"
  },
  "pagination": {
    "page": 2,
    "pageSize": 20
  }
}
```

#### Пример 4: Фильмы 2000-2010 годов

```json
{
  "filters": {
    "yearRange": {
      "from": 2000,
      "to": 2010
    }
  },
  "sort": {
    "field": "title",
    "order": "asc"
  },
  "pagination": {
    "page": 1,
    "pageSize": 15
  }
}
```

### 🔄 Коды ответов

| Код | Описание                        |
| --- | ------------------------------- |
| 200 | Успешный запрос                 |
| 400 | Ошибка валидации входных данных |
| 500 | Внутренняя ошибка сервера       |

### 📌 Примечания

- Все числовые поля автоматически парсятся из строк
- При указании нескольких жанров используется логика `OR` (фильм подходит, если содержит хотя бы один из указанных жанров)
- Максимальный `pageSize` ограничен 100 элементами
- Поле `createdAt` используется для сортировки по дате добавления фильма
- Поле `title` поддерживает строковую сортировку с учётом локали
