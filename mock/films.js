const genres = {
  drama: "drama",
  comedy: "comedy",
  action: "action",
  fantasy: "fantasy",
  thriller: "thriller",
  horror: "horror",
  melodrama: "melodrama",
  adventure: "adventure",
  detective: "detective",
};

const status = {
  IN_PLANS: "in_plans",
  WATCHED: "watched",
};

export let films = [
  {
    id: 1,
    title: "Интерстеллар",
    director: "Кристофер Нолан",
    year: 2014,
    createdAt: "2024-01-15T10:30:00.000Z",
    genres: [genres.fantasy, genres.drama, genres.action],
    description:
      "Когда засуха, пыльные бури и вымирание растений приводят человечество к продовольственному кризису, коллектив исследователей и учёных отправляется сквозь червоточину (которая предположительно соединяет области пространства-времени через большое расстояние) в путешествие, чтобы превзойти прежние ограничения для космических путешествий человека и найти планету с подходящими для человечества условиями.",
    image:
      "https://avatars.mds.yandex.net/get-kinopoisk-image/1600647/430042eb-ee69-4818-aed0-a312400a26bf/600x900",
    rating: 8.6,
    status: status.IN_PLANS,
  },
  {
    id: 2,
    title: "Побег из Шоушенка",
    director: "Фрэнк Дарабонт",
    year: 1994,
    createdAt: "2024-01-10T09:15:00.000Z",
    genres: [genres.drama, genres.detective],
    description:
      "Бухгалтер Энди Дюфрейн обвинён в убийстве собственной жены и её любовника. Оказавшись в тюрьме под названием Шоушенк, он сталкивается с жестокостью и несправедливостью, но находит друзей и надежду на свободу.",
    image:
      "https://avatars.mds.yandex.net/get-kinopoisk-image/1599028/0b76b2a2-d1c7-4f04-a284-80ff7bb709a4/600x900",
    rating: 9.1,
    status: status.WATCHED,
  },
  {
    id: 3,
    title: "Тёмный рыцарь",
    director: "Кристофер Нолан",
    year: 2008,
    createdAt: "2024-01-05T14:20:00.000Z",
    genres: [genres.action, genres.drama, genres.thriller, genres.detective],
    description:
      "Бэтмен под руководством лейтенанта Джима Гордона и прокурора Харви Дента начинает войну с преступностью в Готэме. Но появляется новый враг — Джокер, который сеет хаос и проверяет героев на прочность.",
    image:
      "https://avatars.mds.yandex.net/get-kinopoisk-image/1599028/0fa5bf50-d5ad-446f-a599-b26d070c8b99/600x900",
    rating: 9.0,
    status: status.WATCHED,
  },
  {
    id: 4,
    title: "Криминальное чтиво",
    director: "Квентин Тарантино",
    year: 1994,
    createdAt: "2024-01-18T11:45:00.000Z",
    genres: [genres.drama, genres.comedy, genres.action, genres.thriller],
    description:
      "Два гангстера — Винсент Вега и Джулс Винфилд — проводят время в философских беседах и разборках с противниками. Их истории переплетаются с боксёром Бутчем и другими колоритными персонажами.",
    image:
      "https://avatars.mds.yandex.net/get-kinopoisk-image/4716873/0a07a903-9025-4aff-bf7c-46bbb175888c/600x900",
    rating: 8.9,
    status: status.WATCHED,
  },
  {
    id: 5,
    title: "Список Шиндлера",
    director: "Стивен Спилберг",
    year: 1993,
    createdAt: "2024-01-20T16:30:00.000Z",
    genres: [genres.drama, genres.horror],
    description:
      "История Оскара Шиндлера, немецкого бизнесмена, который спас более тысячи евреев во время Холокоста, используя свою фабрику как убежище.",
    image:
      "https://avatars.mds.yandex.net/get-kinopoisk-image/6201401/1e1ac6d9-c658-4f5f-937e-d080bca0d893/600x900",
    rating: 9.0,
    status: status.WATCHED,
  },
  {
    id: 6,
    title: "Зелёная книга",
    director: "Питер Фаррелли",
    year: 2018,
    createdAt: "2024-01-25T08:00:00.000Z",
    genres: [genres.drama, genres.comedy, genres.adventure],
    description:
      "Итальянский вышибала Тони Валлелонга нанимается водителем к гениальному пианисту Дону Ширли, который отправляется в турне по глубокому югу США в 1960-х годах.",
    image:
      "https://avatars.mds.yandex.net/get-kinopoisk-image/4483445/1e2ed281-b1e8-4083-b721-3ece7afc1031/600x900",
    rating: 8.7,
    status: status.WATCHED,
  },
  {
    id: 7,
    title: "Остров проклятых",
    director: "Мартин Скорсезе",
    year: 2010,
    createdAt: "2024-01-28T12:10:00.000Z",
    genres: [genres.thriller, genres.drama, genres.detective, genres.horror],
    description:
      "Два федеральных маршала прибывают на остров, где расположена психиатрическая клиника для опасных преступников, чтобы расследовать исчезновение пациентки.",
    image:
      "https://avatars.mds.yandex.net/get-kinopoisk-image/4303601/617303b7-cfa7-4273-bd1d-63974bf68927/600x900",
    rating: 8.5,
    status: status.WATCHED,
  },
  {
    id: 8,
    title: "Начало",
    director: "Кристофер Нолан",
    year: 2010,
    createdAt: "2024-02-01T17:20:00.000Z",
    genres: [genres.fantasy, genres.action, genres.thriller, genres.drama],
    description:
      "Профессиональный вор Дом Кобб обладает редким навыком — он проникает в сны людей и крадёт их секреты. Ему предлагают последнее задание: не украсть идею, а внедрить её.",
    image:
      "https://avatars.mds.yandex.net/get-kinopoisk-image/1629390/8ab9a119-dd74-44f0-baec-0629797483d7/600x900",
    rating: 8.9,
    status: status.IN_PLANS,
  },
  {
    id: 9,
    title: "Бойцовский клуб",
    director: "Дэвид Финчер",
    year: 1999,
    createdAt: "2024-02-05T09:40:00.000Z",
    genres: [genres.drama, genres.thriller, genres.action],
    description:
      "Страдающий бессонницей офисный работник встречает таинственного Тайлера Дёрдена, и они основывают подпольный бойцовский клуб, который перерастает во что-то гораздо большее.",
    image:
      "https://avatars.mds.yandex.net/get-kinopoisk-image/16490236/495fb59a-bff1-4626-baba-bb392fede945/600x900",
    rating: 8.8,
    status: status.IN_PLANS,
  },
  {
    id: 10,
    title: "Одержимость",
    director: "Дэмьен Шазелл",
    year: 2014,
    createdAt: "2024-02-08T13:55:00.000Z",
    genres: [genres.drama, genres.thriller],
    description:
      "Молодой барабанщик поступает в престижный музыкальный колледж, где его наставником становится жестокий и гениальный педагог, требующий абсолютного совершенства.",
    image:
      "https://avatars.mds.yandex.net/get-kinopoisk-image/6201401/16af46be-bcfe-461e-af54-ff17b905b82e/600x900",
    rating: 8.6,
    status: status.WATCHED,
  },
  {
    id: 11,
    title: "Ла-Ла Ленд",
    director: "Дэмьен Шазелл",
    year: 2016,
    createdAt: "2024-02-12T18:15:00.000Z",
    genres: [genres.drama, genres.melodrama, genres.comedy],
    description:
      "Джазовый пианист и начинающая актриса влюбляются друг в друга, пытаясь балансировать между мечтой о славе и отношениями в Лос-Анджелесе.",
    image:
      "https://avatars.mds.yandex.net/get-kinopoisk-image/10835644/7e786437-eada-4d23-baea-f3a5ebf57e06/600x900",
    rating: 8.3,
    status: status.IN_PLANS,
  },
  {
    id: 12,
    title: "Мстители: Финал",
    director: "Энтони Руссо, Джо Руссо",
    year: 2019,
    createdAt: "2024-02-15T10:05:00.000Z",
    genres: [genres.action, genres.fantasy, genres.adventure, genres.drama],
    description:
      "Оставшиеся в живых мстители собираются в последней битве, чтобы отменить действия Таноса и восстановить вселенную.",
    image:
      "https://avatars.mds.yandex.net/get-kinopoisk-image/1600647/ae22f153-9715-41bb-adb4-f648b3e16092/600x900",
    rating: 8.4,
    status: status.WATCHED,
  },
  {
    id: 13,
    title: "Джокер",
    director: "Тодд Филлипс",
    year: 2019,
    createdAt: "2024-02-18T14:30:00.000Z",
    genres: [genres.drama, genres.thriller, genres.horror],
    description:
      "Артур Флек, неудачливый комик, живёт в преступном и презираемом богатыми Готэме. Он пытается найти своё место в обществе, но постоянные унижения приводят его к безумию.",
    image:
      "https://avatars.mds.yandex.net/get-kinopoisk-image/1946459/84934543-5991-4c93-97eb-beb6186a3ad7/600x900",
    rating: 8.5,
    status: status.WATCHED,
  },
  {
    id: 14,
    title: "Оно",
    director: "Энди Мускетти",
    year: 2017,
    createdAt: "2024-02-20T11:25:00.000Z",
    genres: [genres.horror, genres.thriller, genres.adventure],
    description:
      "В городе Дерри начинают пропадать дети. Группа подростков сталкивается с древним злом, которое принимает форму танцующего клоуна Пеннивайза.",
    image:
      "https://avatars.mds.yandex.net/get-kinopoisk-image/6201401/c2554fb1-0c11-49b7-8c99-3a32e696b2ab/600x900",
    rating: 7.8,
    status: status.IN_PLANS,
  },
  {
    id: 15,
    title: "1+1",
    director: "Оливье Накаш, Эрик Толедано",
    year: 2011,
    createdAt: "2024-02-22T16:50:00.000Z",
    genres: [genres.drama, genres.comedy],
    description:
      "Парализованный аристократ Филипп нанимает для ухода за собой бывшего заключённого Дрисса из неблагополучного района. Неожиданная дружба меняет жизни обоих.",
    image:
      "https://avatars.mds.yandex.net/get-kinopoisk-image/10900341/caf9f155-1a19-42f1-a0f3-9c8773e9083e/600x900",
    rating: 8.8,
    status: status.WATCHED,
  },
  {
    id: 16,
    title: "Бесславные ублюдки",
    director: "Квентин Тарантино",
    year: 2009,
    createdAt: "2024-02-25T09:35:00.000Z",
    genres: [genres.drama, genres.action, genres.thriller],
    description:
      "Во время Второй мировой войны группа еврейских солдат, известная как 'Ублюдки', охотится на нацистов, одновременно планируя поджечь кинотеатр с верхушкой Третьего рейха.",
    image:
      "https://avatars.mds.yandex.net/get-kinopoisk-image/1946459/5e6dde98-74a8-4c02-b003-01d48e091025/600x900",
    rating: 8.6,
    status: status.IN_PLANS,
  },
  {
    id: 17,
    title: "Гладиатор",
    director: "Ридли Скотт",
    year: 2000,
    createdAt: "2024-02-27T13:40:00.000Z",
    genres: [genres.action, genres.drama, genres.adventure],
    description:
      "Римский генерал Максимус предан императором, его семья убита, а сам он становится рабом. Он поднимается по лестнице гладиаторских боёв, чтобы отомстить.",
    image:
      "https://avatars.mds.yandex.net/get-kinopoisk-image/1599028/7c3460dc-344d-433f-8220-f18d86c8397d/600x900",
    rating: 8.7,
    status: status.IN_PLANS,
  },
  {
    id: 18,
    title: "Отель Гранд Будапешт",
    director: "Уэс Андерсон",
    year: 2014,
    createdAt: "2024-03-01T15:20:00.000Z",
    genres: [genres.drama, genres.comedy, genres.adventure, genres.detective],
    description:
      "История легендарного консьержа Густава и его верного портье Зеро в вымышленной европейской стране между войнами. Смерть богатой гостьи втягивает их в аферу с украденной картиной.",
    image:
      "https://avatars.mds.yandex.net/get-kinopoisk-image/1629390/ea08a062-81a9-46e9-a475-e49388216eea/600x900",
    rating: 8.2,
    status: status.IN_PLANS,
  },
  {
    id: 19,
    title: "Паразиты",
    director: "Пон Джун Хо",
    year: 2019,
    createdAt: "2024-03-03T10:10:00.000Z",
    genres: [genres.drama, genres.thriller, genres.comedy],
    description:
      "Безработная семья Кимов постепенно внедряется в жизнь богатого семейства Паков под видом высококвалифицированных работников, что приводит к неожиданным последствиям.",
    image:
      "https://avatars.mds.yandex.net/get-kinopoisk-image/4303601/aae3a928-6465-4bed-9af4-16929a44fd79/600x900",
    rating: 8.6,
    status: status.WATCHED,
  },
  {
    id: 20,
    title: "Дюна",
    director: "Дени Вильнёв",
    year: 2021,
    createdAt: "2024-03-05T12:45:00.000Z",
    genres: [genres.fantasy, genres.action, genres.adventure, genres.drama],
    description:
      "Молодой Пол Атрейдес должен отправиться на опаснейшую планету Арракис, где добывают пряность — самый ценный ресурс во вселенной. Его ждёт битва за будущее человечества.",
    image:
      "https://avatars.mds.yandex.net/get-kinopoisk-image/4303601/9eb762d6-4cdd-464f-9937-aebf30067acc/600x900",
    rating: 8.4,
    status: status.IN_PLANS,
  },
];
