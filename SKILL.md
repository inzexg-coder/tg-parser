---
name: ameni-tg-parser
description: "Telegram chat analyzer that processes exported result.json files. Use when the task involves analyzing Telegram chat exports, computing chat statistics (messages, participants, activity patterns, response times, emoji usage, top words, media distribution), generating visual charts (activity heatmaps, time series, participant breakdowns), running the web-based analyzer UI, or using the CLI agent for console-based chat analysis."
---

# Ameni TG — Telegram Chat Analyzer

Этот инструмент анализирует экспортированные Telegram-чаты (`result.json`). Работает полностью в браузере (веб-версия) или через CLI (Node.js).

## Структура

```
ameni-tg-parser/
├── index.html           # Веб-интерфейс анализатора
├── parser.js            # Ядро анализа (статистики, графики)
├── style.css            # Стили
├── .ameni/              # CLI агент
│   ├── bin/ameni        # Bash-диспетчер
│   └── lib/telegram.js  # CLI логика
└── README.md            # Документация
```

## Workflows

### Веб-интерфейс

Откройте `index.html` в браузере и загрузите `result.json` (экспорт Telegram). Все статистики и графики строятся автоматически.

### CLI агент

```bash
./.ameni/bin/ameni tg stats ./result.json     # Полная статистика
./.ameni/bin/ameni tg summary ./result.json    # Краткая сводка
./.ameni/bin/ameni tg top ./result.json 10     # Топ-10 участников
./.ameni/bin/ameni tg words ./result.json      # Топ-50 слов
./.ameni/bin/ameni tg activity ./result.json   # Активность по часам/дням
./.ameni/bin/ameni tg media ./result.json      # Распределение медиа
./.ameni/bin/ameni tg emoji ./result.json      # Топ эмодзи
./.ameni/bin/ameni tg help                     # Справка
```

### Как экспортировать чат из Telegram

1. Telegram Desktop → чат → три точки → Export Chat History
2. Выбрать формат JSON, отметить "Machine-readable"
3. После экспорта — `result.json` в папке чата

## Метрики

| Категория | Ключевые метрики |
|---|---|
| **Общие** | total messages, participants, date range, days span, avg/day |
| **Текст** | chars, words, unique words, avg/max length, length distribution |
| **Активность** | perDay, perHour, perWeekday, perMonth, best day/hour, heatmap |
| **Участники** | topSenders, bySender (count, chars, words, emojis, media, links) |
| **Медиа** | photo, video, sticker, gif, doc, voice — counts and percentages |
| **Время ответа** | avg response time, respTimes, longest pause |
| **Реакции** | total emojis, top emojis, reactions per message |
| **Цепочки** | reply count/percentage, top replied-to participants |
| **Слова** | top 50 words, word frequency dictionary |

## When to Use

- При работе с экспортированными Telegram-чатами
- Для анализа активности в групповых чатах
- При необходимости визуализации статистики чата
- Для извлечения метрик общения (кто, когда, как часто, с каких устройств)
