import express from "express";
import cors from "cors";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import fs from "fs/promises";
import { existsSync } from "fs";
import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import cookieParser from "cookie-parser";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import rateLimit from "express-rate-limit";
import { body, validationResult } from "express-validator";
import helmet from "helmet";

// Секретный ключ для JWT (в продакшене хранить в .env)
const JWT_SECRET = "your-super-secret-jwt-key-change-this";
const REFRESH_TOKEN_SECRET = "your-refresh-token-secret-key";
const ACCESS_TOKEN_EXPIRY = "15m"; // 15 минут
const REFRESH_TOKEN_EXPIRY = "7d"; // 7 дней

const app = express();
const port = 3000;

const __dirname = dirname(fileURLToPath(import.meta.url));
app.use(express.static(join(__dirname, "public")));

app.use(express.json());
app.use(cookieParser());

// Добавить helmet для безопасности
app.use(helmet());

// Ограничение количества запросов
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 100, // максимум 100 запросов с одного IP
  message: {
    success: false,
    errorMessage: "Слишком много запросов, попробуйте позже",
  },
});
app.use("/api/", limiter);

// Более строгий лимит для авторизации
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // 5 попыток входа
  skipSuccessfulRequests: true,
});

app.use(cors());

app.use((req, res, next) => {
  setTimeout(next, 1000);
});

// Путь к файлу с данными
const DATA_FILE = join(__dirname, "data", "films.json");

const USERS_FILE = join(__dirname, "data", "users.json");
const BLACKLIST_FILE = join(__dirname, "data", "token-blacklist.json");

// Функции для работы с пользователями
async function readUsers() {
  try {
    const dataDir = join(__dirname, "data");
    if (!existsSync(dataDir)) await fs.mkdir(dataDir, { recursive: true });
    if (!existsSync(USERS_FILE)) {
      // Создаем тестового пользователя
      const hashedPassword = await bcrypt.hash("admin123", 10);
      const defaultUser = {
        id: 1,
        username: "admin",
        email: "admin@example.com",
        password: hashedPassword,
        role: "admin",
        createdAt: new Date().toISOString(),
        isActive: true,
        loginAttempts: 0,
        lockUntil: null,
      };
      await fs.writeFile(USERS_FILE, JSON.stringify([defaultUser], null, 2));
      return [defaultUser];
    }
    const data = await fs.readFile(USERS_FILE, "utf8");
    return JSON.parse(data);
  } catch (error) {
    console.error("Ошибка при чтении пользователей:", error);
    return [];
  }
}

async function writeUsers(users) {
  try {
    await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2));
    return true;
  } catch (error) {
    console.error("Ошибка при записи пользователей:", error);
    return false;
  }
}

// Функции для blacklist токенов
async function readBlacklist() {
  try {
    if (!existsSync(BLACKLIST_FILE)) {
      await fs.writeFile(BLACKLIST_FILE, JSON.stringify([], null, 2));
      return [];
    }
    const data = await fs.readFile(BLACKLIST_FILE, "utf8");
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

async function addToBlacklist(token, expiresAt) {
  const blacklist = await readBlacklist();
  blacklist.push({ token, expiresAt, addedAt: new Date().toISOString() });
  await fs.writeFile(BLACKLIST_FILE, JSON.stringify(blacklist, null, 2));
}

async function isTokenBlacklisted(token) {
  const blacklist = await readBlacklist();
  return blacklist.some((item) => item.token === token);
}

// Middleware для проверки авторизации
async function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      errorMessage: "Требуется авторизация",
    });
  }

  // Проверяем не в blacklist ли токен
  if (await isTokenBlacklisted(token)) {
    return res.status(401).json({
      success: false,
      errorMessage: "Токен отозван",
    });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({
        success: false,
        errorMessage: "Недействительный или просроченный токен",
      });
    }
    req.user = user;
    next();
  });
}

// Middleware для проверки роли администратора
function requireAdmin(req, res, next) {
  if (req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      errorMessage: "Доступ запрещен. Требуются права администратора",
    });
  }
  next();
}

// Middleware для проверки владельца ресурса или админа
function requireOwnerOrAdmin(req, res, next) {
  const resourceUserId = parseInt(req.params.userId);
  if (req.user.role !== "admin" && req.user.id !== resourceUserId) {
    return res.status(403).json({
      success: false,
      errorMessage: "Доступ запрещен",
    });
  }
  next();
}

// Функция для генерации токенов
function generateTokens(user) {
  const accessToken = jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRY }
  );

  const refreshToken = jwt.sign(
    { id: user.id, type: "refresh" },
    REFRESH_TOKEN_SECRET,
    { expiresIn: REFRESH_TOKEN_EXPIRY }
  );

  return { accessToken, refreshToken };
}

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
          required: ["title", "director", "year", "genres", "rating", "status"],
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
          required: ["title", "director", "year", "genres", "rating", "status"],
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
                "all",
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
              enum: ["all", "in_plans", "watched"],
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
                total: { type: "integer", example: 15 },
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
        securitySchemes: {
          bearerAuth: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT",
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
app.post("/getFilms", authenticateToken, async (req, res) => {
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
    if (filters.genre && filters.genre !== "all") {
      result = result.filter((film) => film.genres.includes(filters.genre));
    }

    if (filters.status && filters.status !== "all") {
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
        total: films.length,
        watched: films.reduce(
          (acc, cur) => (cur.status === "watched" ? acc + 1 : acc),
          0
        ),
        averageRating: films.length
          ? films.reduce((acc, cur) => acc + cur.rating, 0) / films.length
          : 0,
      },
      pagination: {
        currentPage: page,
        pageSize: pageSize,
        total: result.length,
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
app.post("/createFilm", authenticateToken, async (req, res) => {
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

    const requiredFields = [
      "title",
      "director",
      "year",
      "genres",
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
    const missingFields = requiredFields.filter(
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
    if (
      description &&
      (typeof description !== "string" || description.trim() === "")
    ) {
      return res.status(400).json({
        success: false,
        errorMessage: "Поле 'description' должно быть непустой строкой",
      });
    }
    if (image && (typeof image !== "string" || image.trim() === "")) {
      return res.status(400).json({
        success: false,
        errorMessage: "Поле 'image' должно быть непустой строкой",
      });
    }

    // Валидация URL
    const urlPattern =
      /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
    if (image && !urlPattern.test(image)) {
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
app.put("/updateFilm/:id", authenticateToken, async (req, res) => {
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

    const requiredFields = [
      "title",
      "director",
      "year",
      "genres",
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
    const missingFields = requiredFields.filter(
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
    if (
      description &&
      (typeof description !== "string" || description.trim() === "")
    ) {
      return res.status(400).json({
        success: false,
        errorMessage: "Поле 'description' должно быть непустой строкой",
      });
    }
    if (image && (typeof image !== "string" || image.trim() === "")) {
      return res.status(400).json({
        success: false,
        errorMessage: "Поле 'image' должно быть непустой строкой",
      });
    }

    const urlPattern =
      /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
    if (image && !urlPattern.test(image)) {
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
 *                 data:
 *                   $ref: '#/components/schemas/Film'
 *       400:
 *         description: Некорректный ID
 *       404:
 *         description: Фильм не найден
 *       500:
 *         description: Внутренняя ошибка сервера
 */
app.delete("/deleteFilm/:id", authenticateToken, async (req, res) => {
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

/**
 * @swagger
 * /changeFilmStatus/{id}:
 *   patch:
 *     summary: Изменить статус фильма
 *     tags: [Films]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID фильма для изменения статуса
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum:
 *                  - in_plans
 *                  - watched
 *                 example: in_plans
 *
 *     responses:
 *       200:
 *         description: Статус фильма успешно изменен
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
 *                   example: Статус фильма успешно изменен
 *                 data:
 *                   $ref: '#/components/schemas/Film'
 *       400:
 *         description: Ошибка валидации данных
 *       404:
 *         description: Фильм не найден
 *       500:
 *         description: Внутренняя ошибка сервера
 */
app.patch("/changeFilmStatus/:id", authenticateToken, async (req, res) => {
  try {
    const filmId = parseInt(req.params.id);
    if (isNaN(filmId)) {
      return res.status(400).json({
        success: false,
        errorMessage: "ID должен быть числом",
      });
    }
    const { status } = req.body;

    const films = await readFilms();
    const filmIndex = films.findIndex((film) => film.id === filmId);

    if (filmIndex === -1) {
      return res.status(404).json({
        success: false,
        errorMessage: `Фильм с ID ${filmId} не найден`,
      });
    }

    if (!status) {
      return res.status(400).json({
        success: false,
        errorMessage: "Пропущено обязательное поле 'status'",
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
    films[filmIndex] = { ...films[filmIndex], status };
    await writeFilms(films);
    return res.status(200).json({
      success: true,
      message: `Статус фильма успешно изменен на ${status}`,
      data: films[filmIndex],
    });
  } catch (error) {
    console.error("Ошибка в PATCH /changeFilmStatus:", error);
    res.status(500).json({
      success: false,
      errorMessage: "Внутренняя ошибка сервера",
    });
  }
});

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Регистрация нового пользователя
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - email
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 30
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 6
 *               confirmPassword:
 *                 type: string
 *                 minLength: 6
 *     responses:
 *       201:
 *         description: Пользователь успешно зарегистрирован
 *       400:
 *         description: Ошибка валидации
 */
app.post(
  "/api/auth/register",
  [
    body("username")
      .isLength({ min: 3, max: 30 })
      .withMessage("Имя пользователя должно быть от 3 до 30 символов"),
    body("email").isEmail().withMessage("Неверный формат email"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Пароль должен быть минимум 6 символов"),
    body("confirmPassword").custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error("Пароли не совпадают");
      }
      return true;
    }),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errorMessage: errors.array()[0].msg,
        });
      }

      const { username, email, password } = req.body;
      const users = await readUsers();

      // Проверка существующего пользователя
      if (users.find((u) => u.username === username)) {
        return res.status(400).json({
          success: false,
          errorMessage: "Пользователь с таким именем уже существует",
        });
      }

      if (users.find((u) => u.email === email)) {
        return res.status(400).json({
          success: false,
          errorMessage: "Пользователь с таким email уже существует",
        });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = {
        id: users.length + 1,
        username,
        email,
        password: hashedPassword,
        role: "user",
        createdAt: new Date().toISOString(),
        isActive: true,
        loginAttempts: 0,
        lockUntil: null,
      };

      users.push(newUser);
      await writeUsers(users);

      // Не возвращаем пароль
      const { password: _, ...userWithoutPassword } = newUser;

      res.status(201).json({
        success: true,
        message: "Регистрация успешна",
        data: userWithoutPassword,
      });
    } catch (error) {
      console.error("Ошибка регистрации:", error);
      res
        .status(500)
        .json({ success: false, errorMessage: "Внутренняя ошибка сервера" });
    }
  }
);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Вход в систему
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Успешный вход
 *       401:
 *         description: Неверные учетные данные
 */
app.post("/api/auth/login", authLimiter, async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        errorMessage: "Имя пользователя и пароль обязательны",
      });
    }

    const users = await readUsers();
    const user = users.find((u) => u.username === username);

    if (!user) {
      return res.status(401).json({
        success: false,
        errorMessage: "Неверное имя пользователя или пароль",
      });
    }

    // Проверка блокировки
    if (user.lockUntil && new Date(user.lockUntil) > new Date()) {
      const minutesLeft = Math.ceil(
        (new Date(user.lockUntil) - new Date()) / 60000
      );
      return res.status(401).json({
        success: false,
        errorMessage: `Аккаунт заблокирован на ${minutesLeft} минут`,
      });
    }

    const isValid = await bcrypt.compare(password, user.password);

    if (!isValid) {
      // Увеличиваем счетчик попыток
      user.loginAttempts = (user.loginAttempts || 0) + 1;
      if (user.loginAttempts >= 5) {
        user.lockUntil = new Date(Date.now() + 15 * 60000).toISOString();
      }
      await writeUsers(users);

      return res.status(401).json({
        success: false,
        errorMessage: "Неверное имя пользователя или пароль",
      });
    }

    // Сброс счетчика попыток
    user.loginAttempts = 0;
    user.lockUntil = null;
    await writeUsers(users);

    const { accessToken, refreshToken } = generateTokens(user);

    // Устанавливаем refresh token в httpOnly cookie
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 дней
    });

    res.json({
      success: true,
      accessToken,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Ошибка входа:", error);
    res
      .status(500)
      .json({ success: false, errorMessage: "Внутренняя ошибка сервера" });
  }
});

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Обновление access токена
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Новый access токен
 *       401:
 *         description: Недействительный refresh токен
 */
app.post("/api/auth/refresh", async (req, res) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    return res.status(401).json({
      success: false,
      errorMessage: "Refresh токен не найден",
    });
  }

  try {
    const decoded = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET);
    const users = await readUsers();
    const user = users.find((u) => u.id === decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        errorMessage: "Пользователь не найден",
      });
    }

    const newAccessToken = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: ACCESS_TOKEN_EXPIRY }
    );

    res.json({ success: true, accessToken: newAccessToken });
  } catch (error) {
    res.status(401).json({
      success: false,
      errorMessage: "Недействительный refresh токен",
    });
  }
});

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Выход из системы
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Успешный выход
 */
app.post("/api/auth/logout", authenticateToken, async (req, res) => {
  const token = req.headers["authorization"].split(" ")[1];
  const decoded = jwt.decode(token);

  if (decoded && decoded.exp) {
    await addToBlacklist(token, new Date(decoded.exp * 1000).toISOString());
  }

  res.clearCookie("refreshToken");
  res.json({ success: true, message: "Выход выполнен успешно" });
});

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Получение информации о текущем пользователе
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Информация о пользователе
 */
app.get("/api/auth/me", authenticateToken, async (req, res) => {
  const users = await readUsers();
  const user = users.find((u) => u.id === req.user.id);

  if (!user) {
    return res.status(404).json({
      success: false,
      errorMessage: "Пользователь не найден",
    });
  }

  const { password, ...userWithoutPassword } = user;
  res.json({ success: true, data: userWithoutPassword });
});

/**
 * @swagger
 * /api/auth/change-password:
 *   post:
 *     summary: Смена пароля
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - oldPassword
 *               - newPassword
 *             properties:
 *               oldPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *                 minLength: 6
 *               confirmNewPassword:
 *                 type: string
 */
app.post(
  "/api/auth/change-password",
  authenticateToken,
  [
    body("newPassword")
      .isLength({ min: 6 })
      .withMessage("Новый пароль должен быть минимум 6 символов"),
    body("confirmNewPassword").custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error("Пароли не совпадают");
      }
      return true;
    }),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errorMessage: errors.array()[0].msg,
        });
      }

      const { oldPassword, newPassword } = req.body;
      const users = await readUsers();
      const userIndex = users.findIndex((u) => u.id === req.user.id);

      if (userIndex === -1) {
        return res.status(404).json({
          success: false,
          errorMessage: "Пользователь не найден",
        });
      }

      const isValid = await bcrypt.compare(
        oldPassword,
        users[userIndex].password
      );
      if (!isValid) {
        return res.status(401).json({
          success: false,
          errorMessage: "Неверный текущий пароль",
        });
      }

      users[userIndex].password = await bcrypt.hash(newPassword, 10);
      await writeUsers(users);

      res.json({ success: true, message: "Пароль успешно изменен" });
    } catch (error) {
      res
        .status(500)
        .json({ success: false, errorMessage: "Внутренняя ошибка сервера" });
    }
  }
);

setInterval(async () => {
  const blacklist = await readBlacklist();
  const now = new Date();
  const validTokens = blacklist.filter(
    (item) => new Date(item.expiresAt) > now
  );
  if (validTokens.length !== blacklist.length) {
    await fs.writeFile(BLACKLIST_FILE, JSON.stringify(validTokens, null, 2));
  }
}, 60 * 60 * 1000);

app.listen(port, () => {
  console.log(`Сервер запущен на порту ${port}`);
  console.log(
    `Swagger документация доступна по адресу: http://localhost:${port}/api-docs`
  );
});
