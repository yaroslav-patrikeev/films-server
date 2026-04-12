import express from "express";
import cors from "cors";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { films } from "./mock/films.js";

const app = express();
const port = 3000;

const __dirname = dirname(fileURLToPath(import.meta.url));
app.use(express.static(join(__dirname, "public")));

app.use(express.json());
app.use(cors());

app.post("/getFilms", (req, res) => {
  try {
    const { filters = {}, sort = {}, pagination = {} } = req.body;

    // ========== ВАЛИДАЦИЯ ОБЯЗАТЕЛЬНЫХ ПОЛЕЙ ==========
    if (!pagination || typeof pagination !== "object") {
      return res.status(400).json({
        success: false,
        errorMessage: "Поле 'pagination' обязательно",
      });
    }

    if (pagination.page === undefined || pagination.page === null) {
      return res.status(400).json({
        success: false,
        errorMessage: "Поле 'pagination.page' обязательно",
      });
    }

    if (pagination.pageSize === undefined || pagination.pageSize === null) {
      return res.status(400).json({
        success: false,
        errorMessage: "Поле 'pagination.pageSize' обязательно",
      });
    }

    // ========== ВАЛИДАЦИЯ ДОПУСТИМЫХ ПОЛЕЙ ФИЛЬТРОВ ==========
    const allowedFilterKeys = ["genres", "status", "minRating", "yearRange"];
    const filterKeys = Object.keys(filters);

    for (const key of filterKeys) {
      if (!allowedFilterKeys.includes(key)) {
        return res.status(400).json({
          success: false,
          errorMessage: `Недопустимый параметр фильтра: '${key}'. Допустимые: ${allowedFilterKeys.join(
            ", "
          )}`,
        });
      }
    }

    // ========== ВАЛИДАЦИЯ genres ==========
    if (filters.genres !== undefined) {
      if (!Array.isArray(filters.genres)) {
        return res.status(400).json({
          success: false,
          errorMessage: "Поле 'filters.genres' должно быть массивом",
        });
      }

      const allowedGenres = [
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

      for (const genre of filters.genres) {
        if (!allowedGenres.includes(genre)) {
          return res.status(400).json({
            success: false,
            errorMessage: `Недопустимый жанр: '${genre}'. Допустимые: ${allowedGenres.join(
              ", "
            )}`,
          });
        }
      }
    }

    // ========== ВАЛИДАЦИЯ status ==========
    if (filters.status !== undefined) {
      const allowedStatuses = ["in_plans", "watched"];
      if (!allowedStatuses.includes(filters.status)) {
        return res.status(400).json({
          success: false,
          errorMessage: `Недопустимый статус: '${
            filters.status
          }'. Допустимые: ${allowedStatuses.join(", ")}`,
        });
      }
    }

    // ========== ВАЛИДАЦИЯ minRating ==========
    if (filters.minRating !== undefined) {
      const minRating = parseFloat(filters.minRating);
      if (isNaN(minRating) || minRating < 0 || minRating > 10) {
        return res.status(400).json({
          success: false,
          errorMessage:
            "Поле 'filters.minRating' должно быть числом от 0 до 10",
        });
      }
    }

    // ========== ВАЛИДАЦИЯ yearRange ==========
    if (filters.yearRange !== undefined) {
      if (typeof filters.yearRange !== "object" || filters.yearRange === null) {
        return res.status(400).json({
          success: false,
          errorMessage: "Поле 'filters.yearRange' должно быть объектом",
        });
      }

      const allowedYearRangeKeys = ["from", "to"];
      const yearRangeKeys = Object.keys(filters.yearRange);

      for (const key of yearRangeKeys) {
        if (!allowedYearRangeKeys.includes(key)) {
          return res.status(400).json({
            success: false,
            errorMessage: `Недопустимое поле в 'yearRange': '${key}'. Допустимые: ${allowedYearRangeKeys.join(
              ", "
            )}`,
          });
        }
      }

      const hasFrom = filters.yearRange.from !== undefined;
      const hasTo = filters.yearRange.to !== undefined;

      if (!hasFrom && !hasTo) {
        return res.status(400).json({
          success: false,
          errorMessage:
            "Поле 'filters.yearRange' должно содержать хотя бы одно из полей: 'from' или 'to'",
        });
      }

      if (hasFrom) {
        const from = parseInt(filters.yearRange.from);
        if (isNaN(from) || from < 1888 || from > new Date().getFullYear()) {
          return res.status(400).json({
            success: false,
            errorMessage: `Поле 'filters.yearRange.from' должно быть корректным годом (1888-${new Date().getFullYear()})`,
          });
        }
      }

      if (hasTo) {
        const to = parseInt(filters.yearRange.to);
        if (isNaN(to) || to < 1888 || to > new Date().getFullYear()) {
          return res.status(400).json({
            success: false,
            errorMessage: `Поле 'filters.yearRange.to' должно быть корректным годом (1888-${new Date().getFullYear()})`,
          });
        }
      }

      if (hasFrom && hasTo) {
        const from = parseInt(filters.yearRange.from);
        const to = parseInt(filters.yearRange.to);
        if (from > to) {
          return res.status(400).json({
            success: false,
            errorMessage:
              "Поле 'filters.yearRange.from' не может быть больше 'to'",
          });
        }
      }
    }

    // ========== ВАЛИДАЦИЯ СОРТИРОВКИ ==========
    const allowedSortFields = ["year", "rating", "createdAt", "title"];
    const allowedSortOrders = ["asc", "desc"];

    if (sort.field !== undefined && !allowedSortFields.includes(sort.field)) {
      return res.status(400).json({
        success: false,
        errorMessage: `Недопустимое поле сортировки: '${
          sort.field
        }'. Допустимые: ${allowedSortFields.join(", ")}`,
      });
    }

    if (sort.order !== undefined && !allowedSortOrders.includes(sort.order)) {
      return res.status(400).json({
        success: false,
        errorMessage: `Недопустимый порядок сортировки: '${
          sort.order
        }'. Допустимые: ${allowedSortOrders.join(", ")}`,
      });
    }

    // ========== ВАЛИДАЦИЯ ПАГИНАЦИИ ==========
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

    // ========== ПРИМЕНЯЕМ ПАРАМЕТРЫ (с значениями по умолчанию) ==========
    const sortField =
      sort.field && allowedSortFields.includes(sort.field)
        ? sort.field
        : "rating";
    const sortOrder = sort.order === "asc" ? "asc" : "desc";

    let result = [...films];

    // ФИЛЬТРЫ
    if (filters.genres?.length) {
      result = result.filter((film) =>
        film.genres.some((genre) => filters.genres.includes(genre))
      );
    }

    if (filters.status) {
      result = result.filter((film) => film.status === filters.status);
    }

    if (filters.minRating !== undefined) {
      const minRating = parseFloat(filters.minRating);
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

    // СОРТИРОВКА
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

    // ПАГИНАЦИЯ
    const startIndex = (page - 1) * pageSize;
    const paginatedResult = result.slice(startIndex, startIndex + pageSize);

    res.json({
      success: true,
      data: paginatedResult,
      statistic: {
        total: result.length,
        watched: result.reduce((acc, cur) => {
          return cur.status === "watched" ? acc + 1 : acc;
        }, 0),
        averageRating: result.length
          ? result.reduce((acc, cur) => {
              return acc + cur.rating;
            }, 0) / result.length
          : 0,
      },
      pagination: {
        currentPage: page,
        pageSize: pageSize,
        totalPages: Math.ceil(result.length / pageSize),
      },
    });
  } catch (error) {
    console.error("Ошибка в POST /film:", error);
    res.status(500).json({
      success: false,
      errorMessage: "Внутренняя ошибка сервера",
    });
  }
});

app.listen(port, () => {
  console.log(`Сервер запущен на порту ${port}`);
});
