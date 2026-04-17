import express from "express";
import cors from "cors";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import fs from "fs/promises";
import { existsSync } from "fs";
import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

const app = express();
const port = 3000;

const __dirname = dirname(fileURLToPath(import.meta.url));
app.use(express.static(join(__dirname, "public")));

app.use(express.json());
app.use(cors());

app.use((req, res, next) => {
  setTimeout(next, 1000);
});

// Путь к файлу с данными
const DATA_FILE = join(__dirname, "data", "films.json");

// Функция для чтения фильмов из файла
async function readFilms() {
  try {
    const dataDir = join(__dirname, "data");
    if (!existsSync(dataDir)) {
      await fs.mkdir(dataDir, { recursive: true });
    }

    if (!existsSync(DATA_FILE)) {
      await fs.writeFile(DATA_FILE, JSON.stringify([], null, 2));
      return [];
    }

    const data = await fs.readFile(DATA_FILE, "utf8");
    return JSON.parse(data);
  } catch (error) {
    console.error("Ошибка при чтении файла:", error);
    return [];
  }
}

// Функция для записи фильмов в файл
async function writeFilms(films) {
  try {
    await fs.writeFile(DATA_FILE, JSON.stringify(films, null, 2));
    return true;
  } catch (error) {
    console.error("Ошибка при записи в файл:", error);
    return false;
  }
}

// Функция для генерации нового ID
async function generateNewId() {
  const films = await readFilms();
  if (films.length === 0) return 1;
  const maxId = Math.max(...films.map((film) => film.id));
  return maxId + 1;
}

// ========== SWAGGER CONFIGURATION ==========
const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Film Library API",
      version: "1.0.0",
      description: "API для управления коллекцией фильмов",
      contact: {
        name: "API Support",
        email: "support@filmlibrary.com",
      },
    },
    servers: [
      {
        url: `http://localhost:${port}`,
        description: "Development server",
      },
    ],
    components: {
      schemas: {
        Film: {
          type: "object",
          properties: {
            id: {
              type: "integer",
              description: "Уникальный идентификатор фильма",
              example: 1,
            },
            title: {
              type: "string",
              description: "Название фильма",
              example: "Inception",
            },
            director: {
              type: "string",
              description: "Режиссер фильма",
              example: "Christopher Nolan",
            },
            year: {
              type: "integer",
              description: "Год выпуска",
              minimum: 1888,
              example: 2010,
            },
            genres: {
              type: "array",
              description: "Жанры фильма",
              items: {
                type: "string",
                enum: [
                  "drama",
                  "comedy",
                  "action",
                  "fantasy",
                  "thriller",
                  "horror",
                  "melodrama",
                  "adventure",
                  "detective",
                ],
              },
              example: ["drama", "fantasy"],
            },
            description: {
              type: "string",
              description: "Описание фильма",
              example:
                "A thief who steals corporate secrets through the use of dream-sharing technology...",
            },
            image: {
              type: "string",
              description: "URL постера фильма",
              format: "uri",
              example: "https://example.com/inception-poster.jpg",
            },
            rating: {
              type: "number",
              description: "Рейтинг фильма (0-10)",
              minimum: 0,
              maximum: 10,
              example: 8.8,
            },
            status: {
              type: "string",
              description: "Статус просмотра",
              enum: ["in_plans", "watched"],
              example: "watched",
            },
            createdAt: {
              type: "string",
              description: "Дата создания записи",
              format: "date-time",
              example: "2024-01-15T10:30:00.000Z",
            },
          },
          required: [
            "title",
            "director",
            "year",
            "genres",
            "description",
            "image",
            "rating",
            "status",
          ],
        },
        FilmInput: {
          type: "object",
          properties: {
            title: { type: "string", example: "The Matrix" },
            director: {
              type: "string",
              example: "Lana Wachowski, Lilly Wachowski",
            },
            year: { type: "integer", example: 1999 },
            genres: {
              type: "array",
              items: {
                type: "string",
                enum: [
                  "drama",
                  "comedy",
                  "action",
                  "fantasy",
                  "thriller",
                  "horror",
                  "melodrama",
                  "adventure",
                  "detective",
                ],
              },
              example: ["drama", "fantasy"],
            },
            description: {
              type: "string",
              example:
                "A computer hacker learns from mysterious rebels about the true nature of his reality...",
            },
            image: {
              type: "string",
              example: "https://example.com/matrix-poster.jpg",
            },
            rating: { type: "number", example: 8.7 },
            status: {
              type: "string",
              enum: ["in_plans", "watched"],
              example: "watched",
            },
          },
          required: [
            "title",
            "director",
            "year",
            "genres",
            "description",
            "image",
            "rating",
            "status",
          ],
        },
        Pagination: {
          type: "object",
          properties: {
            page: { type: "integer", minimum: 1, example: 1 },
            pageSize: {
              type: "integer",
              minimum: 1,
              maximum: 100,
              example: 10,
            },
          },
          required: ["page", "pageSize"],
        },
        Filters: {
          type: "object",
          properties: {
            genre: {
              type: "string",
              enum: [
                "drama",
                "comedy",
                "action",
                "fantasy",
                "thriller",
                "horror",
                "melodrama",
                "adventure",
                "detective",
              ],
              example: "drama",
            },
            status: {
              type: "string",
              enum: ["in_plans", "watched"],
              example: "watched",
            },
            minRating: {
              type: "number",
              minimum: 0,
              maximum: 10,
              example: 7,
            },
            yearRange: {
              type: "object",
              properties: {
                from: { type: "integer", minimum: 1888, example: 2000 },
                to: { type: "integer", example: 2020 },
              },
            },
          },
        },
        Sort: {
          type: "object",
          properties: {
            field: {
              type: "string",
              enum: ["year", "rating", "createdAt", "title"],
              example: "rating",
            },
            order: {
              type: "string",
              enum: ["asc", "desc"],
              example: "desc",
            },
          },
        },
        Statistics: {
          type: "object",
          properties: {
            total: { type: "integer", example: 150 },
            watched: { type: "integer", example: 85 },
            averageRating: { type: "number", example: 7.2 },
          },
        },
        SuccessResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            data: {
              type: "array",
              items: { $ref: "#/components/schemas/Film" },
            },
            statistic: { $ref: "#/components/schemas/Statistics" },
            pagination: {
              type: "object",
              properties: {
                currentPage: { type: "integer", example: 1 },
                pageSize: { type: "integer", example: 10 },
                totalPages: { type: "integer", example: 15 },
              },
            },
          },
        },
        SingleSuccessResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            data: { $ref: "#/components/schemas/Film" },
          },
        },
        ErrorResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: false },
            errorMessage: { type: "string", example: "Описание ошибки" },
          },
        },
      },
    },
  },
  apis: ["index.js"],
};

const specs = swaggerJsdoc(swaggerOptions);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs));

/**
 * @swagger
 * /getFilms:
 *   post:
 *     summary: Получить список фильмов с фильтрацией, сортировкой и пагинацией
 *     tags: [Films]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               filters:
 *                 $ref: '#/components/schemas/Filters'
 *               sort:
 *                 $ref: '#/components/schemas/Sort'
 *               pagination:
 *                 $ref: '#/components/schemas/Pagination'
 *               searchString:
 *                 type: string
 *                 example: "Тёмный рыцарь"
 *     responses:
 *       200:
 *         description: Успешное получение списка фильмов
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: Ошибка валидации
 *       500:
 *         description: Внутренняя ошибка сервера
 */
app.post("/getFilms", async (req, res) => {
  try {
    const films = await readFilms();
    const {
      filters = {},
      sort = {},
      pagination = {},
      searchString = "",
    } = req.body;

    if (!pagination || typeof pagination !== "object") {
      return res.status(400).json({
        success: false,
        errorMessage: "Поле 'pagination' обязательно",
      });
    }

    const page = parseInt(pagination.page);
    const pageSize = parseInt(pagination.pageSize);

    if (isNaN(page) || page < 1) {
      return res.status(400).json({
        success: false,
        errorMessage:
          "Поле 'pagination.page' должно быть числом больше или равно 1",
      });
    }

    if (isNaN(pageSize) || pageSize < 1 || pageSize > 100) {
      return res.status(400).json({
        success: false,
        errorMessage:
          "Поле 'pagination.pageSize' должно быть числом от 1 до 100",
      });
    }

    let result = [...films];

    if (searchString && typeof searchString !== "string") {
      return res.status(400).json({
        success: false,
        errorMessage: "Поле 'searchString' должно быть строкой",
      });
    }

    if (searchString) {
      result = result.filter((film) => {
        const lcSearchString = searchString.toLowerCase();
        return (
          film.title.toLowerCase().includes(lcSearchString) ||
          film.director.toLowerCase().includes(lcSearchString) ||
          film.description.toLowerCase().includes(lcSearchString)
        );
      });
    }

    // Фильтры
    if (filters.genre) {
      result = result.filter((film) => film.genre === filters.genre);
    }

    if (filters.status) {
      result = result.filter((film) => film.status === filters.status);
    }

    if (filters.minRating !== undefined) {
      const minRating = parseInt(filters.minRating);
      if (!isNaN(minRating)) {
        result = result.filter((film) => film.rating >= minRating);
      }
    }

    if (filters.yearRange) {
      if (filters.yearRange.from !== undefined) {
        const from = parseInt(filters.yearRange.from);
        if (!isNaN(from)) {
          result = result.filter((film) => film.year >= from);
        }
      }
      if (filters.yearRange.to !== undefined) {
        const to = parseInt(filters.yearRange.to);
        if (!isNaN(to)) {
          result = result.filter((film) => film.year <= to);
        }
      }
    }

    // Сортировка
    const sortField = sort.field || "rating";
    const sortOrder = sort.order === "asc" ? "asc" : "desc";

    result.sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];
      if (typeof aVal === "string") {
        return sortOrder === "asc"
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }
      return sortOrder === "asc" ? aVal - bVal : bVal - aVal;
    });

    // Пагинация
    const startIndex = (page - 1) * pageSize;
    const paginatedResult = result.slice(startIndex, startIndex + pageSize);

    res.json({
      success: true,
      data: paginatedResult,
      statistic: {
        total: result.length,
        watched: result.reduce(
          (acc, cur) => (cur.status === "watched" ? acc + 1 : acc),
          0
        ),
        averageRating: result.length
          ? result.reduce((acc, cur) => acc + cur.rating, 0) / result.length
          : 0,
      },
      pagination: {
        currentPage: page,
        pageSize: pageSize,
        totalPages: Math.ceil(result.length / pageSize),
      },
    });
  } catch (error) {
    console.error("Ошибка в POST /getFilms:", error);
    res.status(500).json({
      success: false,
      errorMessage: "Внутренняя ошибка сервера",
    });
  }
});

/**
 * @swagger
 * /createFilm:
 *   post:
 *     summary: Создать новый фильм
 *     tags: [Films]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/FilmInput'
 *     responses:
 *       200:
 *         description: Фильм успешно создан
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SingleSuccessResponse'
 *       400:
 *         description: Ошибка валидации данных
 *       500:
 *         description: Внутренняя ошибка сервера
 */
app.post("/createFilm", async (req, res) => {
  try {
    const {
      title,
      director,
      year,
      genres,
      description,
      image,
      rating,
      status,
    } = req.body;

    const allowedFields = [
      "title",
      "director",
      "year",
      "genres",
      "description",
      "image",
      "rating",
      "status",
    ];
    const receivedFields = Object.keys(req.body);

    // Проверка на лишние поля
    const hasExtraFields = receivedFields.some(
      (field) => !allowedFields.includes(field)
    );
    if (hasExtraFields) {
      return res.status(400).json({
        success: false,
        errorMessage: `Обнаружены лишние поля. Допустимые поля: ${allowedFields.join(
          ", "
        )}`,
      });
    }

    // Проверка наличия всех обязательных полей
    const missingFields = allowedFields.filter(
      (field) => !receivedFields.includes(field)
    );
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        errorMessage: `Отсутствуют обязательные поля: ${missingFields.join(
          ", "
        )}`,
      });
    }

    // Валидация строк
    if (typeof title !== "string" || title.trim() === "") {
      return res.status(400).json({
        success: false,
        errorMessage: "Поле 'title' должно быть непустой строкой",
      });
    }
    if (typeof director !== "string" || director.trim() === "") {
      return res.status(400).json({
        success: false,
        errorMessage: "Поле 'director' должно быть непустой строкой",
      });
    }
    if (typeof description !== "string" || description.trim() === "") {
      return res.status(400).json({
        success: false,
        errorMessage: "Поле 'description' должно быть непустой строкой",
      });
    }
    if (typeof image !== "string" || image.trim() === "") {
      return res.status(400).json({
        success: false,
        errorMessage: "Поле 'image' должно быть непустой строкой",
      });
    }

    // Валидация URL
    const urlPattern =
      /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
    if (!urlPattern.test(image)) {
      return res.status(400).json({
        success: false,
        errorMessage: "Поле 'image' должно содержать валидную ссылку (URL)",
      });
    }

    // Валидация чисел
    if (typeof year !== "number" || isNaN(year)) {
      return res.status(400).json({
        success: false,
        errorMessage: "Поле 'year' должно быть числом",
      });
    }
    if (
      typeof rating !== "number" ||
      isNaN(rating) ||
      rating < 0 ||
      rating > 10
    ) {
      return res.status(400).json({
        success: false,
        errorMessage: "Поле 'rating' должно быть числом от 0 до 10",
      });
    }

    // Валидация статуса
    const validStatuses = ["in_plans", "watched"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        errorMessage: `Поле 'status' должно быть одним из значений: ${validStatuses.join(
          ", "
        )}`,
      });
    }

    const validGenres = [
      "drama",
      "comedy",
      "action",
      "fantasy",
      "thriller",
      "horror",
      "melodrama",
      "adventure",
      "detective",
    ];
    const invalidGenres = genres.filter((el) => !validGenres.includes(el));
    if (invalidGenres.length > 0) {
      return res.status(400).json({
        success: false,
        errorMessage: `Недопустимые жанры: ${invalidGenres}`,
      });
    }

    const newId = await generateNewId();
    const newFilm = {
      id: newId,
      ...req.body,
      createdAt: new Date().toISOString(),
    };

    const films = await readFilms();
    films.push(newFilm);
    await writeFilms(films);

    return res.status(200).json({
      success: true,
      data: newFilm,
    });
  } catch (error) {
    console.error("Ошибка в POST /createFilm:", error);
    res.status(500).json({
      success: false,
      errorMessage: "Внутренняя ошибка сервера",
    });
  }
});

/**
 * @swagger
 * /updateFilm/{id}:
 *   put:
 *     summary: Обновить данные фильма
 *     tags: [Films]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID фильма для обновления
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/FilmInput'
 *     responses:
 *       200:
 *         description: Фильм успешно обновлен
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SingleSuccessResponse'
 *       400:
 *         description: Ошибка валидации данных
 *       404:
 *         description: Фильм не найден
 *       500:
 *         description: Внутренняя ошибка сервера
 */
app.put("/updateFilm/:id", async (req, res) => {
  try {
    const filmId = parseInt(req.params.id);
    if (isNaN(filmId)) {
      return res.status(400).json({
        success: false,
        errorMessage: "ID должен быть числом",
      });
    }

    const {
      title,
      director,
      year,
      genres,
      description,
      image,
      rating,
      status,
    } = req.body;

    const allowedFields = [
      "title",
      "director",
      "year",
      "genres",
      "description",
      "image",
      "rating",
      "status",
    ];
    const receivedFields = Object.keys(req.body);

    // Проверка на лишние поля
    const hasExtraFields = receivedFields.some(
      (field) => !allowedFields.includes(field)
    );
    if (hasExtraFields) {
      return res.status(400).json({
        success: false,
        errorMessage: `Обнаружены лишние поля. Допустимые поля: ${allowedFields.join(
          ", "
        )}`,
      });
    }

    // Проверка наличия всех обязательных полей
    const missingFields = allowedFields.filter(
      (field) => !receivedFields.includes(field)
    );
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        errorMessage: `Отсутствуют обязательные поля: ${missingFields.join(
          ", "
        )}`,
      });
    }

    // Валидация (такая же как в createFilm)
    if (typeof title !== "string" || title.trim() === "") {
      return res.status(400).json({
        success: false,
        errorMessage: "Поле 'title' должно быть непустой строкой",
      });
    }
    if (typeof director !== "string" || director.trim() === "") {
      return res.status(400).json({
        success: false,
        errorMessage: "Поле 'director' должно быть непустой строкой",
      });
    }
    if (typeof description !== "string" || description.trim() === "") {
      return res.status(400).json({
        success: false,
        errorMessage: "Поле 'description' должно быть непустой строкой",
      });
    }
    if (typeof image !== "string" || image.trim() === "") {
      return res.status(400).json({
        success: false,
        errorMessage: "Поле 'image' должно быть непустой строкой",
      });
    }

    const urlPattern =
      /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
    if (!urlPattern.test(image)) {
      return res.status(400).json({
        success: false,
        errorMessage: "Поле 'image' должно содержать валидную ссылку (URL)",
      });
    }

    if (typeof year !== "number" || isNaN(year)) {
      return res.status(400).json({
        success: false,
        errorMessage: "Поле 'year' должно быть числом",
      });
    }
    if (
      typeof rating !== "number" ||
      isNaN(rating) ||
      rating < 0 ||
      rating > 10
    ) {
      return res.status(400).json({
        success: false,
        errorMessage: "Поле 'rating' должно быть числом от 0 до 10",
      });
    }

    const validStatuses = ["in_plans", "watched"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        errorMessage: `Поле 'status' должно быть одним из значений: ${validStatuses.join(
          ", "
        )}`,
      });
    }
    const validGenres = [
      "drama",
      "comedy",
      "action",
      "fantasy",
      "thriller",
      "horror",
      "melodrama",
      "adventure",
      "detective",
    ];
    const invalidGenres = genres.filter((el) => !validGenres.includes(el));
    if (invalidGenres.length > 0) {
      return res.status(400).json({
        success: false,
        errorMessage: `Недопустимые жанры: ${invalidGenres}`,
      });
    }

    const films = await readFilms();
    const filmIndex = films.findIndex((film) => film.id === filmId);

    if (filmIndex === -1) {
      return res.status(404).json({
        success: false,
        errorMessage: `Фильм с ID ${filmId} не найден`,
      });
    }

    // Обновляем фильм, сохраняя createdAt
    const updatedFilm = {
      ...films[filmIndex],
      title,
      director,
      year,
      genres,
      description,
      image,
      rating,
      status,
    };

    films[filmIndex] = updatedFilm;
    await writeFilms(films);

    return res.status(200).json({
      success: true,
      data: updatedFilm,
    });
  } catch (error) {
    console.error("Ошибка в PUT /updateFilm:", error);
    res.status(500).json({
      success: false,
      errorMessage: "Внутренняя ошибка сервера",
    });
  }
});

/**
 * @swagger
 * /deleteFilm/{id}:
 *   delete:
 *     summary: Удалить фильм
 *     tags: [Films]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID фильма для удаления
 *     responses:
 *       200:
 *         description: Фильм успешно удален
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Фильм успешно удален
 *       400:
 *         description: Некорректный ID
 *       404:
 *         description: Фильм не найден
 *       500:
 *         description: Внутренняя ошибка сервера
 */
app.delete("/deleteFilm/:id", async (req, res) => {
  try {
    const filmId = parseInt(req.params.id);

    if (isNaN(filmId)) {
      return res.status(400).json({
        success: false,
        errorMessage: "ID должен быть числом",
      });
    }

    const films = await readFilms();
    const filmIndex = films.findIndex((film) => film.id === filmId);

    if (filmIndex === -1) {
      return res.status(404).json({
        success: false,
        errorMessage: `Фильм с ID ${filmId} не найден`,
      });
    }

    const deletedFilm = films[filmIndex];
    films.splice(filmIndex, 1);
    await writeFilms(films);

    return res.status(200).json({
      success: true,
      message: "Фильм успешно удален",
      data: deletedFilm,
    });
  } catch (error) {
    console.error("Ошибка в DELETE /deleteFilm:", error);
    res.status(500).json({
      success: false,
      errorMessage: "Внутренняя ошибка сервера",
    });
  }
});

app.listen(port, () => {
  console.log(`Сервер запущен на порту ${port}`);
  console.log(
    `Swagger документация доступна по адресу: http://localhost:${port}/api-docs`
  );
});
