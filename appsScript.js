/*******************************************************
 * EGYPT MEDIA BUYING DASHBOARD
 *
 * Источники:
 * 1. Египет от байинга
 * 2. 1xSlots'25
 * 3. 1xSlots'26
 *
 * Регистрации:
 *   ID игрока
 *   Источник
 *   Дата регистрации
 *
 * Bets:
 *   UserId
 *   Dt
 *   ProductType
 *   Product
 *   Game
 *   CntOper
 *   Summin
 *   Summout
 *   Profit
 *   Percent
 *   AvgStavka
 *
 * Основные правила:
 * - ID игрока = UserId
 * - Dt = дата ставки
 * - D0 = дата регистрации конкретного игрока
 * - активность до регистрации не учитывается
 * - CntOper = количество ставок
 * - Summin = сумма ставок
 * - Profit = GGR
 * - ProductId / IdGame не используются
 * - Cashback Casino исключается
 *******************************************************/


/***********************
 * ОСНОВНАЯ ФУНКЦИЯ
 ***********************/
function buildEgyptMediaDashboard() {

  const ss = SpreadsheetApp.getActiveSpreadsheet();

  const REG_SHEET = 'Египет от байинга';
  const BET_SHEETS = [
    '1xSlots\'25',
    '1xSlots\'26'
  ];

  const DASHBOARD_NAME = 'Egypt Media Dashboard';
  const DATA_NAME = '_Dashboard_Data';

  const regSheet = ss.getSheetByName(REG_SHEET);

  if (!regSheet) {
    throw new Error('Не найден лист "' + REG_SHEET + '"');
  }

  /***********************
   * DASHBOARD
   ***********************/
  let dashboard = ss.getSheetByName(DASHBOARD_NAME);

  if (!dashboard) {
    dashboard = ss.insertSheet(DASHBOARD_NAME);
  }

  dashboard.clear();

  const oldCharts = dashboard.getCharts();

  oldCharts.forEach(function(chart) {
    dashboard.removeChart(chart);
  });


  /***********************
   * DATA SHEET
   ***********************/
  let dataSheet = ss.getSheetByName(DATA_NAME);

  if (!dataSheet) {
    dataSheet = ss.insertSheet(DATA_NAME);
  }

  dataSheet.clear();

  const oldDataCharts = dataSheet.getCharts();

  oldDataCharts.forEach(function(chart) {
    dataSheet.removeChart(chart);
  });


  /***********************
   * ЗАГРУЖАЕМ РЕГИСТРАЦИИ
   ***********************/
  const registrations = readRegistrations_(regSheet);

  if (registrations.players.size === 0) {
    throw new Error(
      'На листе "' +
      REG_SHEET +
      '" не найдено ни одного игрока.'
    );
  }


  /***********************
   * ИНИЦИАЛИЗИРУЕМ ИГРОКОВ
   ***********************/
  const players = new Map();

  registrations.players.forEach(function(regDate, userId) {

    players.set(userId, {
      userId: userId,
      source: registrations.sources.get(userId) || '',
      registrationDate: regDate,

      types: new Set(),

      totalBets: 0,
      totalSummin: 0,
      totalSummout: 0,
      totalGgr: 0,

      slotsBets: 0,
      slotsSummin: 0,
      slotsGgr: 0,

      gamesBets: 0,
      gamesSummin: 0,
      gamesGgr: 0,

      activeDates: new Set(),
      firstReturnDay: null,

      d0Types: new Set(),
      d0Bets: 0,
      d0Summin: 0,

      games: new Map()
    });

  });


  /***********************
   * ОБРАБАТЫВАЕМ BETS
   ***********************/
  BET_SHEETS.forEach(function(sheetName) {

    const sheet = ss.getSheetByName(sheetName);

    if (!sheet) {
      throw new Error(
        'Не найден лист "' +
        sheetName +
        '"'
      );
    }

    processBetSheet_(
      sheet,
      players
    );

  });


  /***********************
   * ФИНАЛИЗАЦИЯ
   ***********************/
  players.forEach(function(player) {

    player.segment = getPlayerSegment_(player);

    player.activeDays = player.activeDates.size;

    player.d0Segment = getD0Segment_(player);

  });


  /***********************
   * ОСНОВНЫЕ ДАТАСЕТЫ
   ***********************/
  const kpi = makeKpi_(players);

  const playerSegments =
    makePlayerSegments_(players);

  const betsSummary =
    makeBetsSummary_(players);

  const gamingDaysSummary =
    makeGamingDaysSummary_(players);

  const topGamesByPlayers =
    makeTopGamesByPlayers_(players);

  const topGamesByBets =
    makeTopGamesByBets_(players);

  const topGamesByDays =
    makeTopGamesByDays_(players);

  const transitions =
    makeTransitions_(players);

  const d0Games =
    makeD0Games_(players);

  const topGamesBySummin =
    makeTopGamesBySummin_(players);

  const d0Summin =
    makeD0Summin_(players);

  const ggrSummary =
    makeGgrSummary_(players);

  const quarterlyRetention =
    makeQuarterlyRetention_(players);


  /***********************
   * ЗАПИСЫВАЕМ DATA
   ***********************/
  const blocks =
    writeAllDataBlocks_(
      dataSheet,
      {
        kpi: kpi,
        playerSegments: playerSegments,
        bets: betsSummary,
        gamingDays: gamingDaysSummary,
        topPlayers: topGamesByPlayers,
        topBets: topGamesByBets,
        topDays: topGamesByDays,
        transitions: transitions,
        d0Games: d0Games,
        topSummin: topGamesBySummin,
        d0Summin: d0Summin,
        ggr: ggrSummary,
        retention: quarterlyRetention
      }
    );


  /***********************
   * DASHBOARD TITLE
   ***********************/
  dashboard
    .getRange('A1:Z1')
    .merge();

  dashboard
    .getRange('A1')
    .setValue('Egypt Media Buying — Player Activity Dashboard')
    .setFontSize(18)
    .setFontWeight('bold');


  dashboard
    .getRange('A2:Z2')
    .merge();

  dashboard
    .getRange('A2')
    .setValue(
      'Анализ поведения игроков, привлечённых media buying-командой'
    )
    .setFontSize(11);


  /***********************
   * KPI
   ***********************/
  writeKpiCards_(
    dashboard,
    kpi
  );


  /***********************
   * ГРАФИКИ
   ***********************/
  createDashboardCharts_(
    dashboard,
    dataSheet,
    blocks
  );


  /***********************
   * ФОРМАТИРОВАНИЕ
   ***********************/
  dashboard.setFrozenRows(2);

  dashboard.setColumnWidth(1, 150);
  dashboard.setColumnWidth(2, 120);
  dashboard.setColumnWidth(3, 120);
  dashboard.setColumnWidth(4, 120);
  dashboard.setColumnWidth(5, 120);
  dashboard.setColumnWidth(6, 120);
  dashboard.setColumnWidth(7, 120);
  dashboard.setColumnWidth(8, 120);
  dashboard.setColumnWidth(9, 120);
  dashboard.setColumnWidth(10, 120);
  dashboard.setColumnWidth(11, 150);
  dashboard.setColumnWidth(12, 120);
  dashboard.setColumnWidth(13, 120);
  dashboard.setColumnWidth(14, 120);
  dashboard.setColumnWidth(15, 120);
  dashboard.setColumnWidth(16, 120);
  dashboard.setColumnWidth(17, 120);
  dashboard.setColumnWidth(18, 120);

  dataSheet.hideSheet();

  SpreadsheetApp.flush();

  SpreadsheetApp.getUi().alert(
    'Dashboard построен.\n\n' +
    'Обработано игроков: ' +
    formatNumber_(kpi.players)
  );
}


/*******************************************************
 * РЕГИСТРАЦИИ
 *******************************************************/
function readRegistrations_(sheet) {

  const values = sheet.getDataRange().getValues();

  if (values.length < 2) {
    return {
      players: new Map(),
      sources: new Map()
    };
  }

  const headers = values[0].map(normalizeHeader_);

  const idCol = findHeader_(
    headers,
    [
      'id игрока',
      'player id',
      'userid',
      'user id',
      'id'
    ]
  );

  const sourceCol = findHeader_(
    headers,
    [
      'источник',
      'source'
    ]
  );

  const regCol = findHeader_(
    headers,
    [
      'дата регистрации',
      'registration date',
      'reg date',
      'date'
    ]
  );

  if (idCol === -1) {
    throw new Error(
      'На листе "' +
      sheet.getName() +
      '" не найден столбец ID игрока.'
    );
  }

  if (regCol === -1) {
    throw new Error(
      'На листе "' +
      sheet.getName() +
      '" не найден столбец Дата регистрации.'
    );
  }

  const players = new Map();
  const sources = new Map();

  for (let i = 1; i < values.length; i++) {

    const row = values[i];

    const userId = normalizeUserId_(
      row[idCol]
    );

    if (!userId) {
      continue;
    }

    const regDate = toDate_(
      row[regCol]
    );

    if (!regDate) {
      continue;
    }

    const normalizedDate =
      startOfDay_(regDate);

    players.set(
      userId,
      normalizedDate
    );

    if (sourceCol !== -1) {
      sources.set(
        userId,
        String(row[sourceCol] || '')
      );
    }
  }

  return {
    players: players,
    sources: sources
  };
}


/*******************************************************
 * BET SHEET
 *******************************************************/
function processBetSheet_(
  sheet,
  players
) {

  const values =
    sheet.getDataRange().getValues();

  const today =
    startOfDay_(new Date());

  if (values.length < 2) {
    return;
  }

  const headers =
    values[0].map(normalizeHeader_);

  const userCol = findHeader_(
    headers,
    [
      'userid',
      'user id',
      'id игрока',
      'player id'
    ]
  );

  const dtCol = findHeader_(
    headers,
    [
      'dt',
      'date',
      'дата'
    ]
  );

  const typeCol = findHeader_(
    headers,
    [
      'producttype',
      'product type',
      'type',
      'тип продукта'
    ]
  );

  const productCol = findHeader_(
    headers,
    [
      'product',
      'provider',
      'провайдер'
    ]
  );

  const gameCol = findHeader_(
    headers,
    [
      'game',
      'игра'
    ]
  );

  const betsCol = findHeader_(
    headers,
    [
      'cntoper',
      'cnt oper',
      'bets',
      'количество ставок'
    ]
  );

  const summinCol = findHeader_(
    headers,
    [
      'summin',
      'sum min',
      'ставки',
      'сумма ставок'
    ]
  );

  const summoutCol = findHeader_(
    headers,
    [
      'summout',
      'sum mout',
      'выигрыш',
      'win'
    ]
  );

  const profitCol = findHeader_(
    headers,
    [
      'profit',
      'ggr',
      'ggr amount'
    ]
  );

  if (
    userCol === -1 ||
    dtCol === -1 ||
    typeCol === -1
  ) {
    throw new Error(
      'На листе "' +
      sheet.getName() +
      '" не найдены обязательные столбцы UserId / Dt / ProductType.'
    );
  }


  for (let i = 1; i < values.length; i++) {

    const row = values[i];

    const userId =
      normalizeUserId_(row[userCol]);

    if (!userId) {
      continue;
    }

    const player =
      players.get(userId);

    if (!player) {
      continue;
    }


    /***********************
     * DATE
     ***********************/
    const betDate =
      toDate_(row[dtCol]);

    if (!betDate) {
      continue;
    }

    const date =
      startOfDay_(betDate);

    const registrationDate =
      player.registrationDate;


    /***********************
     * ДО РЕГИСТРАЦИИ НЕ СЧИТАЕМ
     ***********************/
    if (
      date.getTime() <
      registrationDate.getTime() ||
      date.getTime() >
      today.getTime()
    ) {
      continue;
    }


    /***********************
     * PRODUCT
     ***********************/
    const product =
      String(
        productCol === -1
          ? ''
          : row[productCol] || ''
      ).trim();


    /***********************
     * CASHBACK CASINO
     ***********************/
    if (
      product
        .toLowerCase()
        .indexOf('cashback casino') !== -1
    ) {
      continue;
    }


    /***********************
     * TYPE
     ***********************/
    const type =
      normalizeProductType_(
        row[typeCol]
      );

    if (!type) {
      continue;
    }


    /***********************
     * GAME
     ***********************/
    const game =
      String(
        gameCol === -1
          ? 'Unknown game'
          : row[gameCol] || 'Unknown game'
      ).trim() ||
      'Unknown game';


    /***********************
     * NUMBERS
     ***********************/
    const bets =
      toNumber_(
        betsCol === -1
          ? 0
          : row[betsCol]
      );

    const summin =
      toNumber_(
        summinCol === -1
          ? 0
          : row[summinCol]
      );

    const summout =
      toNumber_(
        summoutCol === -1
          ? 0
          : row[summoutCol]
      );

    const ggr =
      toNumber_(
        profitCol === -1
          ? 0
          : row[profitCol]
      );


    /***********************
     * GLOBAL PLAYER
     ***********************/
    player.types.add(type);

    player.totalBets += bets;
    player.totalSummin += summin;
    player.totalSummout += summout;
    player.totalGgr += ggr;

    player.activeDates.add(
      date.getTime()
    );


    /***********************
     * FIRST RETURN DAY
     ***********************/
    const dayDiff =
      daysBetween_(
        registrationDate,
        date
      );

    if (
      dayDiff > 0 &&
      (
        player.firstReturnDay === null ||
        dayDiff < player.firstReturnDay
      )
    ) {
      player.firstReturnDay =
        dayDiff;
    }


    /***********************
     * TYPE FINANCIALS
     ***********************/
    if (type === 'Slots') {

      player.slotsBets += bets;
      player.slotsSummin += summin;
      player.slotsGgr += ggr;

    }

    if (type === 'Games') {

      player.gamesBets += bets;
      player.gamesSummin += summin;
      player.gamesGgr += ggr;

    }


    /***********************
     * D0
     ***********************/
    if (dayDiff === 0) {

      player.d0Types.add(type);

      player.d0Bets += bets;
      player.d0Summin += summin;

    }


    /***********************
     * GAME
     ***********************/
    if (!player.games.has(game)) {

      player.games.set(
        game,
        {
          bets: 0,
          summin: 0,
          days: new Set(),
          players: new Set(),
          d0Bets: 0,
          d0Summin: 0,
          d0Players: new Set()
        }
      );

    }

    const gameStat =
      player.games.get(game);

    gameStat.bets += bets;
    gameStat.summin += summin;

    gameStat.days.add(
      date.getTime()
    );

    gameStat.players.add(
      userId
    );


    if (dayDiff === 0) {

      gameStat.d0Bets += bets;
      gameStat.d0Summin += summin;

      gameStat.d0Players.add(
        userId
      );

    }

  }
}


/*******************************************************
 * KPI
 *******************************************************/
function makeKpi_(players) {

  let slots = 0;
  let games = 0;
  let mixed = 0;

  let totalSummin = 0;
  let slotsSummin = 0;
  let gamesSummin = 0;

  let totalGgr = 0;
  let slotsGgr = 0;
  let gamesGgr = 0;

  let totalBets = 0;
  let slotsBets = 0;
  let gamesBets = 0;

  players.forEach(function(player) {

    if (player.segment === 'Slots') {
      slots++;
    }

    if (player.segment === 'Games') {
      games++;
    }

    if (player.segment === 'Mixed') {
      mixed++;
    }

    totalSummin += player.totalSummin;

    slotsSummin += player.slotsSummin;
    gamesSummin += player.gamesSummin;

    totalGgr += player.totalGgr;

    slotsGgr += player.slotsGgr;
    gamesGgr += player.gamesGgr;

    totalBets += player.totalBets;

    slotsBets += player.slotsBets;
    gamesBets += player.gamesBets;

  });

  return {
    players: players.size,

    slots: slots,
    games: games,
    mixed: mixed,

    totalSummin: totalSummin,
    slotsSummin: slotsSummin,
    gamesSummin: gamesSummin,

    totalGgr: totalGgr,
    slotsGgr: slotsGgr,
    gamesGgr: gamesGgr,

    totalBets: totalBets,
    slotsBets: slotsBets,
    gamesBets: gamesBets
  };
}


/*******************************************************
 * PLAYER SEGMENTS
 *******************************************************/
function makePlayerSegments_(players) {

  const slots =
    countSegment_(
      players,
      'Slots'
    );

  const games =
    countSegment_(
      players,
      'Games'
    );

  const mixed =
    countSegment_(
      players,
      'Mixed'
    );

  const total =
    slots +
    games +
    mixed;

  return [
    [
      'Segment',
      'Players',
      'Share'
    ],
    [
      'Slots',
      slots,
      safePercent_(
        slots,
        total
      )
    ],
    [
      'Games',
      games,
      safePercent_(
        games,
        total
      )
    ],
    [
      'Mixed',
      mixed,
      safePercent_(
        mixed,
        total
      )
    ]
  ];
}


/*******************************************************
 * BETS
 *******************************************************/
function makeBetsSummary_(players) {

  let slotsBets = 0;
  let gamesBets = 0;

  let slotsSummin = 0;
  let gamesSummin = 0;

  players.forEach(function(player) {

    slotsBets += player.slotsBets;
    gamesBets += player.gamesBets;

    slotsSummin += player.slotsSummin;
    gamesSummin += player.gamesSummin;

  });

  const totalBets =
    slotsBets +
    gamesBets;

  const totalSummin =
    slotsSummin +
    gamesSummin;

  return [
    [
      'Type',
      'Bets',
      'Bets Share',
      'Summin',
      'Summin Share'
    ],
    [
      'Slots',
      slotsBets,
      safePercent_(
        slotsBets,
        totalBets
      ),
      slotsSummin,
      safePercent_(
        slotsSummin,
        totalSummin
      )
    ],
    [
      'Games',
      gamesBets,
      safePercent_(
        gamesBets,
        totalBets
      ),
      gamesSummin,
      safePercent_(
        gamesSummin,
        totalSummin
      )
    ]
  ];
}


/*******************************************************
 * GAMING DAYS
 *******************************************************/
function makeGamingDaysSummary_(players) {

  const slots = [];
  const games = [];
  const mixed = [];

  players.forEach(function(player) {

    if (player.segment === 'Slots') {
      slots.push(player.activeDays);
    }

    if (player.segment === 'Games') {
      games.push(player.activeDays);
    }

    if (player.segment === 'Mixed') {
      mixed.push(player.activeDays);
    }

  });

  return [
    [
      'Segment',
      'Average',
      'Median',
      'Maximum',
      'Players'
    ],

    [
      'Slots',
      average_(slots),
      median_(slots),
      max_(slots),
      slots.length
    ],

    [
      'Games',
      average_(games),
      median_(games),
      max_(games),
      games.length
    ],

    [
      'Mixed',
      average_(mixed),
      median_(mixed),
      max_(mixed),
      mixed.length
    ]
  ];
}


/*******************************************************
 * TOP GAMES — PLAYERS
 *******************************************************/
function makeTopGamesByPlayers_(players) {

  const map = new Map();

  players.forEach(function(player) {

    player.games.forEach(function(stat, game) {

      if (!map.has(game)) {
        map.set(
          game,
          new Set()
        );
      }

      map.get(game).add(
        player.userId
      );

    });

  });

  const rows = [];

  map.forEach(function(userSet, game) {

    rows.push([
      game,
      userSet.size
    ]);

  });

  rows.sort(function(a, b) {
    return b[1] - a[1];
  });

  return topNWithShare_(
    rows,
    15,
    'Players'
  );
}


/*******************************************************
 * TOP GAMES — BETS
 *******************************************************/
function makeTopGamesByBets_(players) {

  const map = new Map();

  players.forEach(function(player) {

    player.games.forEach(function(stat, game) {

      if (!map.has(game)) {
        map.set(game, 0);
      }

      map.set(
        game,
        map.get(game) + stat.bets
      );

    });

  });

  const rows = [];

  map.forEach(function(value, game) {

    rows.push([
      game,
      value
    ]);

  });

  rows.sort(function(a, b) {
    return b[1] - a[1];
  });

  return topNWithShare_(
    rows,
    15,
    'Bets'
  );
}


/*******************************************************
 * TOP GAMES — DAYS
 *******************************************************/
function makeTopGamesByDays_(players) {

  const map = new Map();

  players.forEach(function(player) {

    player.games.forEach(function(stat, game) {

      if (!map.has(game)) {
        map.set(game, new Set());
      }

      const target =
        map.get(game);

      stat.days.forEach(function(day) {
        target.add(
          player.userId + '|' + day
        );
      });

    });

  });

  const rows = [];

  map.forEach(function(daySet, game) {

    rows.push([
      game,
      daySet.size
    ]);

  });

  rows.sort(function(a, b) {
    return b[1] - a[1];
  });

  return topNWithShare_(
    rows,
    15,
    'Gaming Days'
  );
}


/*******************************************************
 * TOP GAMES — SUMMIN
 *******************************************************/
function makeTopGamesBySummin_(players) {

  const map = new Map();

  players.forEach(function(player) {

    player.games.forEach(function(stat, game) {

      if (!map.has(game)) {
        map.set(game, 0);
      }

      map.set(
        game,
        map.get(game) + stat.summin
      );

    });

  });

  const rows = [];

  map.forEach(function(value, game) {

    rows.push([
      game,
      value
    ]);

  });

  rows.sort(function(a, b) {
    return b[1] - a[1];
  });

  return topNWithShare_(
    rows,
    15,
    'Summin'
  );
}


/*******************************************************
 * D0 GAMES
 *******************************************************/
function makeD0Games_(players) {

  const map = new Map();

  players.forEach(function(player) {

    player.games.forEach(function(stat, game) {

      if (stat.d0Bets <= 0) {
        return;
      }

      if (!map.has(game)) {
        map.set(
          game,
          new Set()
        );
      }

      map.get(game).add(
        player.userId
      );

    });

  });

  const rows = [];

  map.forEach(function(set, game) {

    rows.push([
      game,
      set.size
    ]);

  });

  rows.sort(function(a, b) {
    return b[1] - a[1];
  });

  return topNWithShare_(
    rows,
    15,
    'Players'
  );
}


/*******************************************************
 * D0 SUMMIN
 *******************************************************/
function makeD0Summin_(players) {

  const map = new Map();

  players.forEach(function(player) {

    player.games.forEach(function(stat, game) {

      if (stat.d0Summin <= 0) {
        return;
      }

      if (!map.has(game)) {
        map.set(game, 0);
      }

      map.set(
        game,
        map.get(game) + stat.d0Summin
      );

    });

  });

  const rows = [];

  map.forEach(function(value, game) {

    rows.push([
      game,
      value
    ]);

  });

  rows.sort(function(a, b) {
    return b[1] - a[1];
  });

  return topNWithShare_(
    rows,
    15,
    'Summin'
  );
}


/*******************************************************
 * TRANSITIONS
 *
 * D0 type -> Main player type
 *******************************************************/
function makeTransitions_(players) {

  const map = new Map();

  players.forEach(function(player) {

    const d0 =
      player.d0Segment || 'No D0';

    const main =
      player.segment;

    const transition =
      d0 + ' → ' + main;

    if (!map.has(transition)) {

      map.set(
        transition,
        {
          players: 0,
          summin: 0
        }
      );

    }

    const stat =
      map.get(transition);

    stat.players++;

    stat.summin +=
      player.totalSummin;

  });


  const rows = [];

  map.forEach(function(stat, transition) {

    rows.push([
      transition,
      stat.players,
      stat.summin
    ]);

  });

  rows.sort(function(a, b) {
    return b[1] - a[1];
  });


  const totalPlayers =
    rows.reduce(
      function(sum, row) {
        return sum + row[1];
      },
      0
    );

  return [
    [
      'Transition',
      'Players',
      'Share',
      'Summin'
    ]
  ].concat(
    rows.map(function(row) {

      return [
        row[0],
        row[1],
        safePercent_(
          row[1],
          totalPlayers
        ),
        row[2]
      ];

    })
  );
}


/*******************************************************
 * GGR
 *******************************************************/
function makeGgrSummary_(players) {

  let slotsGgr = 0;
  let gamesGgr = 0;

  let slotsSummin = 0;
  let gamesSummin = 0;

  players.forEach(function(player) {

    slotsGgr += player.slotsGgr;
    gamesGgr += player.gamesGgr;

    slotsSummin += player.slotsSummin;
    gamesSummin += player.gamesSummin;

  });

  const totalGgr =
    slotsGgr +
    gamesGgr;

  return [
    [
      'Type',
      'GGR',
      'GGR Share',
      'Summin',
      'GGR %'
    ],

    [
      'Slots',
      slotsGgr,
      safePercent_(
        slotsGgr,
        totalGgr
      ),
      slotsSummin,
      safePercent_(
        slotsGgr,
        slotsSummin
      )
    ],

    [
      'Games',
      gamesGgr,
      safePercent_(
        gamesGgr,
        totalGgr
      ),
      gamesSummin,
      safePercent_(
        gamesGgr,
        gamesSummin
      )
    ]
  ];
}


/*******************************************************
 * QUARTERLY FIRST RETURN
 *
 * Первый повторный активный день игрока:
 *
 * Не играл
 * Только D0
 * D1–7
 * D8–21
 * D22–30
 * D31–60
 * D61–90
 * 90+
 *******************************************************/
function makeQuarterlyRetention_(players) {

  const quarters = new Map();

  players.forEach(function(player) {

    const quarter =
      getQuarter_(player.registrationDate);

    if (!quarters.has(quarter)) {

      quarters.set(
        quarter,
        {
          'Не играл': 0,
          'Только D0': 0,
          'D1–7': 0,
          'D8–21': 0,
          'D22–30': 0,
          'D31–60': 0,
          'D61–90': 0,
          '90+': 0
        }
      );

    }

    const q =
      quarters.get(quarter);

    const firstReturnDay =
      player.firstReturnDay;

    if (player.activeDays === 0) {
      q['Не играл']++;
    }
    else if (firstReturnDay === null) {
      q['Только D0']++;
    }
    else if (firstReturnDay <= 7) {
      q['D1–7']++;
    }
    else if (firstReturnDay <= 21) {
      q['D8–21']++;
    }
    else if (firstReturnDay <= 30) {
      q['D22–30']++;
    }
    else if (firstReturnDay <= 60) {
      q['D31–60']++;
    }
    else if (firstReturnDay <= 90) {
      q['D61–90']++;
    }
    else {
      q['90+']++;
    }

  });


  const sortedQuarters =
    Array.from(
      quarters.keys()
    ).sort();


  const result = [
    [
      'Quarter',
      'Не играл',
      'Только D0',
      'D1–7',
      'D8–21',
      'D22–30',
      'D31–60',
      'D61–90',
      '90+'
    ]
  ];


  sortedQuarters.forEach(function(q) {

    const stat =
      quarters.get(q);

    result.push([
      q,
      stat['Не играл'],
      stat['Только D0'],
      stat['D1–7'],
      stat['D8–21'],
      stat['D22–30'],
      stat['D31–60'],
      stat['D61–90'],
      stat['90+']
    ]);

  });


  return result;
}


/*******************************************************
 * WRITE ALL DATA BLOCKS
 *******************************************************/
function writeAllDataBlocks_(
  sheet,
  data
) {

  const blocks = {};

  let row = 1;


  function write(name, values) {

    const rows = values.length;
    const cols =
      values.reduce(
        function(max, r) {
          return Math.max(
            max,
            r.length
          );
        },
        0
      );

    ensureSheetSize_(
      sheet,
      row + rows + 5,
      cols + 5
    );

    const range =
      sheet.getRange(
        row,
        1,
        rows,
        cols
      );

    range.setValues(
      padRows_(
        values,
        cols
      )
    );

    range
      .setVerticalAlignment('middle');

    blocks[name] = {
      row: row,
      col: 1,
      rows: rows,
      cols: cols
    };

    row += rows + 3;
  }


  write(
    'kpi',
    [
      [
        'Metric',
        'Value'
      ],
      [
        'Players',
        data.kpi.players
      ],
      [
        'Slots',
        data.kpi.slots
      ],
      [
        'Games',
        data.kpi.games
      ],
      [
        'Mixed',
        data.kpi.mixed
      ],
      [
        'Total Summin',
        data.kpi.totalSummin
      ],
      [
        'Slots Summin',
        data.kpi.slotsSummin
      ],
      [
        'Games Summin',
        data.kpi.gamesSummin
      ],
      [
        'Total GGR',
        data.kpi.totalGgr
      ],
      [
        'Slots GGR',
        data.kpi.slotsGgr
      ],
      [
        'Games GGR',
        data.kpi.gamesGgr
      ]
    ]
  );


  write(
    'playerSegments',
    data.playerSegments
  );


  /***********************
   * ОРИГИНАЛЬНЫЙ БЛОК BETS
   ***********************/
  write(
    'bets',
    data.bets
  );


  /***********************
   * СПЕЦИАЛЬНЫЙ БЛОК ДЛЯ ГРАФИКА 2
   *
   * Только:
   * Type / Bets / Summin
   *
   * Это важно, чтобы Share-колонки
   * не попали в график.
   ***********************/
  write(
    'betsChart',
    [
      [
        'Type',
        'Bets',
        'Summin'
      ],
      [
        'Slots',
        data.bets[1][1],
        data.bets[1][3]
      ],
      [
        'Games',
        data.bets[2][1],
        data.bets[2][3]
      ]
    ]
  );


  write(
    'gamingDays',
    data.gamingDays
  );


  write(
    'topPlayers',
    data.topPlayers
  );


  write(
    'topBets',
    data.topBets
  );


  write(
    'topDays',
    data.topDays
  );


  write(
    'transitions',
    data.transitions
  );


  /***********************
   * СПЕЦИАЛЬНЫЙ БЛОК TRANSITIONS
   *
   * Players + Summin
   ***********************/
  const transitionChart = [
    [
      'Transition',
      'Players',
      'Summin'
    ]
  ];

  for (
    let i = 1;
    i < data.transitions.length;
    i++
  ) {

    transitionChart.push([
      data.transitions[i][0],
      data.transitions[i][1],
      data.transitions[i][3]
    ]);

  }

  write(
    'transitionsChart',
    transitionChart
  );


  write(
    'd0Games',
    data.d0Games
  );


  write(
    'topSummin',
    data.topSummin
  );


  write(
    'd0Summin',
    data.d0Summin
  );


  write(
    'ggr',
    data.ggr
  );


  write(
    'retention',
    data.retention
  );


  /***********************
   * СПЕЦИАЛЬНЫЕ CHART DATA
   ***********************/

  /***************
   * GRAPH 1
   ***************/
  write(
    'playerChart',
    [
      [
        'Metric',
        'Slots',
        'Games',
        'Mixed'
      ],
      [
        'Players',
        data.kpi.slots,
        data.kpi.games,
        data.kpi.mixed
      ]
    ]
  );


  /***************
   * GRAPH 3
   ***************/
  write(
    'gamingDaysChart',
    [
      [
        'Segment',
        'Average',
        'Median',
        'Maximum'
      ],
      data.gamingDays[1].slice(0, 4),
      data.gamingDays[2].slice(0, 4),
      data.gamingDays[3].slice(0, 4)
    ]
  );


  /***************
   * GRAPH 12
   ***************/
  write(
    'ggrChart',
    [
      [
        'Metric',
        'Slots',
        'Games'
      ],
      [
        'GGR',
        data.kpi.slotsGgr,
        data.kpi.gamesGgr
      ]
    ]
  );


  return blocks;
}


/*******************************************************
 * CREATE DASHBOARD CHARTS
 *******************************************************/
function createDashboardCharts_(
  dashboard,
  dataSheet,
  blocks
) {

  /***************************************************
   * GRAPH 1
   * UNIQUE PLAYERS
   ***************************************************/
  addChart_(
    dashboard,
    dataSheet,
    blocks.playerChart,
    Charts.ChartType.COLUMN,
    5,
    1,
    700,
    390,
    '1. Уникальные игроки',
    {
      legend: {
        position: 'bottom'
      },

      series: {
        0: {
          color: '#4285F4'
        },
        1: {
          color: '#34A853'
        },
        2: {
          color: '#A142F4'
        }
      },

      vAxis: {
        title: 'Игроки',
        format: '#,##0',
        viewWindow: {
          min: 0
        }
      },

      bar: {
        groupWidth: '60%'
      }
    }
  );


  addLegend_(
    dashboard,
    5,
    9,
    [
      [
        '#4285F4',
        'Slots',
        'Игроки, которые использовали только Slots'
      ],
      [
        '#34A853',
        'Games',
        'Игроки, которые использовали только Games'
      ],
      [
        '#A142F4',
        'Mixed',
        'Игроки, которые использовали и Slots, и Games'
      ]
    ]
  );


  writeDescription_(
    dashboard,
    17,
    1,
    'График показывает уникальных игроков. Mixed является отдельной взаимоисключающей категорией и не добавляется одновременно в Slots или Games.'
  );


  /***************************************************
   * GRAPH 2
   * BETS + SUMMIN
   *
   * ЛЕВАЯ ШКАЛА:
   * Bets
   *
   * ПРАВАЯ ШКАЛА:
   * Summin
   ***************************************************/
  addChart_(
    dashboard,
    dataSheet,
    blocks.betsChart,
    Charts.ChartType.COMBO,
    5,
    11,
    850,
    410,
    '2. Количество ставок и сумма ставок',
    {
      legend: {
        position: 'bottom'
      },

      series: {
        0: {
          type: 'bars',
          targetAxisIndex: 0,
          color: '#4285F4'
        },

        1: {
          type: 'bars',
          targetAxisIndex: 1,
          color: '#FBBC04'
        }
      },

      vAxes: {
        0: {
          title: 'Количество ставок',
          format: '#,##0',
          viewWindow: {
            min: 0
          }
        },

        1: {
          title: 'Сумма ставок (Summin)',
          format: '#,##0',
          viewWindow: {
            min: 0
          }
        }
      },

      hAxis: {
        title: ''
      },

      bar: {
        groupWidth: '65%'
      }
    }
  );


  addLegend_(
    dashboard,
    5,
    22,
    [
      [
        '#4285F4',
        'Синие столбцы',
        'Количество сделанных ставок. Шкала слева.'
      ],
      [
        '#FBBC04',
        'Жёлтые столбцы',
        'Сумма сделанных ставок Summin. Шкала справа.'
      ]
    ]
  );


  writeDescription_(
    dashboard,
    17,
    11,
    'Для каждого типа трафика одновременно показываются количество ставок и денежный объём ставок. Каждая серия использует свою шкалу, поэтому маленькие значения Bets не теряются на фоне Summin.'
  );


  /***************************************************
   * GRAPH 3
   * GAMING DAYS
   ***************************************************/
  addChart_(
    dashboard,
    dataSheet,
    blocks.gamingDaysChart,
    Charts.ChartType.COLUMN,
    27,
    1,
    850,
    400,
    '3. Сколько дней игроки играют',
    {
      legend: {
        position: 'bottom'
      },

      series: {
        0: {
          color: '#4285F4'
        },
        1: {
          color: '#34A853'
        },
        2: {
          color: '#EA4335'
        }
      },

      vAxis: {
        title: 'Количество дней',
        format: '#,##0',
        viewWindow: {
          min: 0
        }
      },

      bar: {
        groupWidth: '65%'
      }
    }
  );


  addLegend_(
    dashboard,
    27,
    12,
    [
      [
        '#4285F4',
        'Average',
        'Среднее количество активных дней игрока'
      ],
      [
        '#34A853',
        'Median',
        'Медианное количество активных дней'
      ],
      [
        '#EA4335',
        'Maximum',
        'Максимальное количество активных дней среди игроков сегмента'
      ]
    ]
  );


  writeDescription_(
    dashboard,
    39,
    1,
    'Показатель отражает не количество ставок, а количество разных календарных дней, в которые игрок совершал ставки после регистрации.'
  );


  /***************************************************
   * GRAPH 4
   * TOP GAMES BY PLAYERS
   ***************************************************/
  addTopGameChart_(
    dashboard,
    dataSheet,
    blocks.topPlayers,
    39,
    11,
    '4. Top 15 игр по количеству игроков',
    '#4285F4'
  );


  /***************************************************
   * GRAPH 5
   * TOP GAMES BY BETS
   ***************************************************/
  addTopGameChart_(
    dashboard,
    dataSheet,
    blocks.topBets,
    58,
    1,
    '5. Top 15 игр по количеству ставок',
    '#34A853'
  );


  /***************************************************
   * GRAPH 6
   * TOP GAMES BY DAYS
   ***************************************************/
  addTopGameChart_(
    dashboard,
    dataSheet,
    blocks.topDays,
    58,
    11,
    '6. Top 15 игр по игровым дням',
    '#A142F4'
  );


  /***************************************************
   * GRAPH 8
   * TRANSITIONS
   ***************************************************/
  addChart_(
    dashboard,
    dataSheet,
    blocks.transitionsChart,
    Charts.ChartType.COMBO,
    77,
    1,
    900,
    450,
    '8. Переходы между Slots и Games',
    {
      legend: {
        position: 'bottom'
      },

      series: {
        0: {
          type: 'bars',
          targetAxisIndex: 0,
          color: '#4285F4'
        },

        1: {
          type: 'bars',
          targetAxisIndex: 1,
          color: '#FBBC04'
        }
      },

      vAxes: {
        0: {
          title: 'Игроки',
          format: '#,##0',
          viewWindow: {
            min: 0
          }
        },

        1: {
          title: 'Summin',
          format: '#,##0',
          viewWindow: {
            min: 0
          }
        }
      },

      bar: {
        groupWidth: '70%'
      }
    }
  );


  addLegend_(
    dashboard,
    77,
    13,
    [
      [
        '#4285F4',
        'Игроки',
        'Количество игроков в каждом сценарии перехода'
      ],
      [
        '#FBBC04',
        'Summin',
        'Сумма ставок игроков в соответствующем сценарии'
      ]
    ]
  );


  /***************************************************
   * GRAPH 9
   * D0 GAMES
   ***************************************************/
  addTopGameChart_(
    dashboard,
    dataSheet,
    blocks.d0Games,
    99,
    1,
    '9. Top 15 игр в D0',
    '#FBBC04'
  );


  /***************************************************
   * GRAPH 10
   * TOP SUMMIN
   ***************************************************/
  addTopGameChart_(
    dashboard,
    dataSheet,
    blocks.topSummin,
    99,
    11,
    '10. Top 15 игр по Summin',
    '#FB8C00'
  );


  /***************************************************
   * GRAPH 11
   * D0 SUMMIN
   ***************************************************/
  addTopGameChart_(
    dashboard,
    dataSheet,
    blocks.d0Summin,
    120,
    1,
    '11. Top 15 игр по Summin в D0',
    '#A142F4'
  );


  /***************************************************
   * GRAPH 12
   * GGR
   ***************************************************/
  addChart_(
    dashboard,
    dataSheet,
    blocks.ggrChart,
    Charts.ChartType.COLUMN,
    120,
    11,
    850,
    400,
    '12. GGR: Slots vs Games',
    {
      legend: {
        position: 'bottom'
      },

      series: {
        0: {
          color: '#4285F4'
        },

        1: {
          color: '#34A853'
        }
      },

      vAxis: {
        title: 'GGR',
        format: '#,##0'
      },

      bar: {
        groupWidth: '60%'
      }
    }
  );


  addLegend_(
    dashboard,
    120,
    22,
    [
      [
        '#4285F4',
        'Slots',
        'GGR от Slots'
      ],
      [
        '#34A853',
        'Games',
        'GGR от Games'
      ]
    ]
  );


  /***************************************************
   * GRAPH 13
   * FIRST RETURN BY REGISTRATION QUARTER
   *
   * ВАЖНО:
   * isStacked = false
   *
   * Каждый диапазон находится рядом,
   * а не внутри одного stacked bar.
   ***************************************************/
  addChart_(
    dashboard,
    dataSheet,
    blocks.retention,
    Charts.ChartType.COLUMN,
    143,
    1,
    1150,
    500,
    '13. Первый возврат после регистрации',
    {
      legend: {
        position: 'bottom'
      },

      /***********************************************
       * КЛЮЧЕВОЕ ИЗМЕНЕНИЕ:
       * НЕ STACKED
       ***********************************************/
      isStacked: false,

      series: {
        0: {
          color: '#9AA0A6'
        },

        1: {
          color: '#4285F4'
        },

        2: {
          color: '#34A853'
        },

        3: {
          color: '#FBBC04'
        },

        4: {
          color: '#FB8C00'
        },

        5: {
          color: '#EA4335'
        },

        6: {
          color: '#A142F4'
        },

        7: {
          color: '#00ACC1'
        }
      },

      vAxis: {
        title: 'Количество игроков',
        format: '#,##0',
        viewWindow: {
          min: 0
        }
      },

      hAxis: {
        title: 'Квартал регистрации'
      },

      bar: {
        groupWidth: '75%'
      }
    }
  );


  addLegend_(
    dashboard,
    143,
    16,
    [
      [
        '#9AA0A6',
        'Не играл',
        'После регистрации не было ни одного активного дня'
      ],
      [
        '#4285F4',
        'Только D0',
        'Игрок играл в день регистрации, но не вернулся позже'
      ],
      [
        '#34A853',
        'D1–7',
        'Первый возврат — с D1 по D7'
      ],
      [
        '#FBBC04',
        'D8–21',
        'Первый возврат — с D8 по D21'
      ],
      [
        '#FB8C00',
        'D22–30',
        'Первый возврат — с D22 по D30'
      ],
      [
        '#EA4335',
        'D31–60',
        'Первый возврат — с D31 по D60'
      ],
      [
        '#A142F4',
        'D61–90',
        'Первый возврат — с D61 по D90'
      ],
      [
        '#00ACC1',
        '90+',
        'Первый возврат произошёл после D90'
      ]
    ]
  );


  writeDescription_(
    dashboard,
    166,
    1,
    'Возврат определяется по первому активному дню после даты регистрации. Например, если игрок играл в D0, D14 и D40, он попадает в D8–21. «Не играл» и «Только D0» показаны отдельно.'
  );
}


/*******************************************************
 * TOP GAME CHART
 *******************************************************/
function addTopGameChart_(
  dashboard,
  dataSheet,
  block,
  row,
  col,
  title,
  color
) {

  addChart_(
    dashboard,
    dataSheet,
    block,
    Charts.ChartType.BAR,
    row,
    col,
    850,
    500,
    title,
    {
      legend: {
        position: 'none'
      },

      series: {
        0: {
          color: color
        }
      },

      hAxis: {
        title: 'Значение',
        format: '#,##0',
        viewWindow: {
          min: 0
        }
      },

      bar: {
        groupWidth: '70%'
      }
    }
  );
}


/*******************************************************
 * ADD CHART
 *******************************************************/
function addChart_(
  dashboard,
  dataSheet,
  block,
  chartType,
  row,
  col,
  width,
  height,
  title,
  options
) {

  const range =
    dataSheet.getRange(
      block.row,
      block.col,
      block.rows,
      block.cols
    );

  let builder =
    dashboard
      .newChart()
      .setChartType(chartType)
      .addRange(range)
      .setPosition(
        row,
        col,
        0,
        0
      )
      .setOption(
        'title',
        title
      )
      .setOption(
        'width',
        width
      )
      .setOption(
        'height',
        height
      );


  if (options) {

    Object.keys(options)
      .forEach(function(key) {

        builder =
          builder.setOption(
            key,
            options[key]
          );

      });

  }


  dashboard.insertChart(
    builder.build()
  );
}


/*******************************************************
 * LEGEND
 *******************************************************/
function addLegend_(
  sheet,
  row,
  col,
  items
) {

  const values = [
    [
      'Цвет',
      'Серия',
      'Что означает'
    ]
  ];

  items.forEach(function(item) {

    values.push([
      '',
      item[1],
      item[2]
    ]);

  });


  const range =
    sheet.getRange(
      row,
      col,
      values.length,
      3
    );

  range
    .setValues(values)
    .setVerticalAlignment('middle')
    .setWrap(true);


  range
    .setBorder(
      true,
      true,
      true,
      true,
      true,
      true
    );


  range
    .getCell(1, 1)
    .setFontWeight('bold');

  range
    .getCell(1, 2)
    .setFontWeight('bold');

  range
    .getCell(1, 3)
    .setFontWeight('bold');


  for (
    let i = 0;
    i < items.length;
    i++
  ) {

    const color =
      items[i][0];

    const cell =
      sheet.getRange(
        row + i + 1,
        col
      );

    cell
      .setBackground(color)
      .setValue('');
  }


  sheet.setColumnWidth(
    col,
    80
  );

  sheet.setColumnWidth(
    col + 1,
    140
  );

  sheet.setColumnWidth(
    col + 2,
    360
  );
}


/*******************************************************
 * DESCRIPTION
 *******************************************************/
function writeDescription_(
  sheet,
  row,
  col,
  text
) {

  const range =
    sheet.getRange(
      row,
      col,
      2,
      8
    );

  range.merge();

  range
    .setValue(text)
    .setWrap(true)
    .setVerticalAlignment('top')
    .setFontSize(10);

}


/*******************************************************
 * KPI CARDS
 *******************************************************/
function writeKpiCards_(
  dashboard,
  kpi
) {

  const headers = [
    'Игроки',
    'Slots',
    'Games',
    'Mixed',
    'Total Summin',
    'Slots Summin',
    'Games Summin',
    'Total GGR',
    'Slots GGR',
    'Games GGR'
  ];

  const values = [
    kpi.players,
    kpi.slots,
    kpi.games,
    kpi.mixed,
    kpi.totalSummin,
    kpi.slotsSummin,
    kpi.gamesSummin,
    kpi.totalGgr,
    kpi.slotsGgr,
    kpi.gamesGgr
  ];


  for (
    let i = 0;
    i < headers.length;
    i++
  ) {

    const col =
      1 + i * 2;

    dashboard
      .getRange(
        4,
        col,
        1,
        2
      )
      .merge();

    dashboard
      .getRange(
        4,
        col
      )
      .setValue(headers[i])
      .setFontWeight('bold')
      .setHorizontalAlignment('center');


    dashboard
      .getRange(
        5,
        col,
        1,
        2
      )
      .merge();

    dashboard
      .getRange(
        5,
        col
      )
      .setValue(values[i])
      .setFontSize(14)
      .setFontWeight('bold')
      .setHorizontalAlignment('center')
      .setNumberFormat(
        i < 4
          ? '#,##0'
          : '#,##0.00'
      );


    dashboard
      .getRange(
        4,
        col,
        2,
        2
      )
      .setBorder(
        true,
        true,
        true,
        true,
        true,
        true
      );

  }
}


/*******************************************************
 * PLAYER SEGMENT
 *******************************************************/
function getPlayerSegment_(
  player
) {

  const hasSlots =
    player.types.has('Slots');

  const hasGames =
    player.types.has('Games');

  if (
    hasSlots &&
    hasGames
  ) {
    return 'Mixed';
  }

  if (hasSlots) {
    return 'Slots';
  }

  if (hasGames) {
    return 'Games';
  }

  return 'Unknown';
}


/*******************************************************
 * D0 SEGMENT
 *******************************************************/
function getD0Segment_(
  player
) {

  const hasSlots =
    player.d0Types.has('Slots');

  const hasGames =
    player.d0Types.has('Games');

  if (
    hasSlots &&
    hasGames
  ) {
    return 'Mixed';
  }

  if (hasSlots) {
    return 'Slots';
  }

  if (hasGames) {
    return 'Games';
  }

  return 'No D0';
}


/*******************************************************
 * PRODUCT TYPE
 *******************************************************/
function normalizeProductType_(
  value
) {

  const text =
    String(
      value || ''
    )
      .trim()
      .toLowerCase();

  if (!text) {
    return '';
  }

  if (
    text === 'slots' ||
    text.indexOf('slot') !== -1
  ) {
    return 'Slots';
  }

  if (
    text === 'games' ||
    text.indexOf('game') !== -1
  ) {
    return 'Games';
  }

  return '';
}


/*******************************************************
 * COUNT SEGMENT
 *******************************************************/
function countSegment_(
  players,
  segment
) {

  let count = 0;

  players.forEach(function(player) {

    if (
      player.segment === segment
    ) {
      count++;
    }

  });

  return count;
}


/*******************************************************
 * TOP N + SHARE
 *******************************************************/
function topNWithShare_(
  rows,
  n,
  metricName
) {

  const total =
    rows.reduce(
      function(sum, row) {
        return sum + row[1];
      },
      0
    );

  const top =
    rows.slice(
      0,
      n
    );

  const result = [
    [
      'Game',
      metricName,
      'Share'
    ]
  ];


  top.forEach(function(row) {

    result.push([
      row[0],
      row[1],
      safePercent_(
        row[1],
        total
      )
    ]);

  });


  return result;
}


/*******************************************************
 * QUARTER
 *******************************************************/
function getQuarter_(
  date
) {

  const year =
    date.getFullYear();

  const month =
    date.getMonth();

  const quarter =
    Math.floor(
      month / 3
    ) + 1;

  return (
    year +
    ' Q' +
    quarter
  );
}


/*******************************************************
 * DATE
 *******************************************************/
function toDate_(
  value
) {

  if (
    Object.prototype.toString.call(value) ===
    '[object Date]'
  ) {

    if (
      isNaN(
        value.getTime()
      )
    ) {
      return null;
    }

    return value;
  }


  if (
    typeof value === 'number'
  ) {

    const date =
      new Date(
        Math.round(
          (value - 25569) *
          86400 *
          1000
        )
      );

    if (
      isNaN(
        date.getTime()
      )
    ) {
      return null;
    }

    return date;
  }


  if (
    typeof value === 'string'
  ) {

    const text =
      value.trim();

    if (!text) {
      return null;
    }

    const date =
      new Date(text);

    if (
      !isNaN(
        date.getTime()
      )
    ) {
      return date;
    }

  }

  return null;
}


/*******************************************************
 * START OF DAY
 *******************************************************/
function startOfDay_(
  date
) {

  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  );
}


/*******************************************************
 * DAYS BETWEEN
 *******************************************************/
function daysBetween_(
  start,
  end
) {

  const a = Date.UTC(
    start.getFullYear(),
    start.getMonth(),
    start.getDate()
  );

  const b = Date.UTC(
    end.getFullYear(),
    end.getMonth(),
    end.getDate()
  );

  return Math.floor(
    (
      b - a
    ) /
    (
      1000 *
      60 *
      60 *
      24
    )
  );
}


/*******************************************************
 * LOGIC SELF-CHECK
 *******************************************************/
function testDashboardLogic_() {

  if (
    daysBetween_(
      new Date(2025, 2, 29),
      new Date(2025, 2, 30)
    ) !== 1
  ) {
    throw new Error('Ошибка календарного расчёта дней.');
  }

  const players = new Map([
    ['no-play', {
      registrationDate: new Date(2025, 0, 1),
      activeDays: 0,
      firstReturnDay: null
    }],
    ['d0-only', {
      registrationDate: new Date(2025, 0, 1),
      activeDays: 1,
      firstReturnDay: null
    }],
    ['returned', {
      registrationDate: new Date(2025, 0, 1),
      activeDays: 2,
      firstReturnDay: 3
    }]
  ]);

  const retention =
    makeQuarterlyRetention_(players);

  if (
    retention.length !== 2 ||
    retention[1][1] !== 1 ||
    retention[1][2] !== 1 ||
    retention[1][3] !== 1
  ) {
    throw new Error('Ошибка классификации первого возврата.');
  }

  const top = topNWithShare_(
    [['A', 60], ['B', 30], ['C', 10]],
    2,
    'Value'
  );

  if (top[1][2] !== 60 || top[2][2] !== 30) {
    throw new Error('Ошибка расчёта доли Top-N.');
  }
}


/*******************************************************
 * NUMBER
 *******************************************************/
function toNumber_(
  value
) {

  if (
    typeof value === 'number'
  ) {

    return isFinite(value)
      ? value
      : 0;

  }

  if (
    value === null ||
    value === undefined ||
    value === ''
  ) {
    return 0;
  }


  let text =
    String(value)
      .trim()
      .replace(/\s/g, '');


  if (
    text.indexOf(',') !== -1 &&
    text.indexOf('.') !== -1
  ) {

    if (
      text.lastIndexOf(',') >
      text.lastIndexOf('.')
    ) {

      text =
        text
          .replace(/\./g, '')
          .replace(',', '.');

    }
    else {

      text =
        text.replace(/,/g, '');

    }

  }
  else if (
    text.indexOf(',') !== -1
  ) {

    text =
      text.replace(',', '.');

  }


  const number =
    Number(text);

  return isFinite(number)
    ? number
    : 0;
}


/*******************************************************
 * USER ID
 *******************************************************/
function normalizeUserId_(
  value
) {

  if (
    value === null ||
    value === undefined
  ) {
    return '';
  }

  if (
    typeof value === 'number'
  ) {

    return String(
      Math.trunc(value)
    );

  }

  return String(value)
    .trim();
}


/*******************************************************
 * HEADER
 *******************************************************/
function normalizeHeader_(
  value
) {

  return String(
    value || ''
  )
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}


/*******************************************************
 * FIND HEADER
 *******************************************************/
function findHeader_(
  headers,
  variants
) {

  const normalized =
    variants.map(function(v) {
      return normalizeHeader_(v);
    });


  for (
    let i = 0;
    i < headers.length;
    i++
  ) {

    if (
      normalized.indexOf(
        headers[i]
      ) !== -1
    ) {

      return i;

    }

  }

  return -1;
}


/*******************************************************
 * PERCENT
 *******************************************************/
function safePercent_(
  value,
  total
) {

  if (!total) {
    return 0;
  }

  return (
    value /
    total *
    100
  );
}


/*******************************************************
 * AVERAGE
 *******************************************************/
function average_(
  arr
) {

  if (
    !arr ||
    arr.length === 0
  ) {
    return 0;
  }

  return (
    arr.reduce(
      function(a, b) {
        return a + b;
      },
      0
    ) /
    arr.length
  );
}


/*******************************************************
 * MEDIAN
 *******************************************************/
function median_(
  arr
) {

  if (
    !arr ||
    arr.length === 0
  ) {
    return 0;
  }

  const sorted =
    arr.slice().sort(
      function(a, b) {
        return a - b;
      }
    );

  const middle =
    Math.floor(
      sorted.length / 2
    );

  if (
    sorted.length % 2
  ) {
    return sorted[middle];
  }

  return (
    sorted[middle - 1] +
    sorted[middle]
  ) / 2;
}


/*******************************************************
 * MAX
 *******************************************************/
function max_(
  arr
) {

  if (
    !arr ||
    arr.length === 0
  ) {
    return 0;
  }

  return Math.max.apply(
    null,
    arr
  );
}


/*******************************************************
 * FORMAT NUMBER
 *******************************************************/
function formatNumber_(
  value
) {

  return Number(
    value || 0
  ).toLocaleString(
    'ru-RU'
  );
}


/*******************************************************
 * PAD ROWS
 *******************************************************/
function padRows_(
  rows,
  cols
) {

  return rows.map(
    function(row) {

      const result =
        row.slice();

      while (
        result.length < cols
      ) {
        result.push('');
      }

      return result;
    }
  );
}


/*******************************************************
 * ENSURE SHEET SIZE
 *******************************************************/
function ensureSheetSize_(
  sheet,
  requiredRows,
  requiredCols
) {

  const currentRows =
    sheet.getMaxRows();

  const currentCols =
    sheet.getMaxColumns();


  if (
    requiredRows >
    currentRows
  ) {

    sheet.insertRowsAfter(
      currentRows,
      requiredRows -
      currentRows
    );

  }


  if (
    requiredCols >
    currentCols
  ) {

    sheet.insertColumnsAfter(
      currentCols,
      requiredCols -
      currentCols
    );

  }
}
