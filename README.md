<p align="center">
  <img src=".ameni/assets/ameni-logo.svg" alt="Ameni" width="130">
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Ameni_TG-Chat_Analyzer-blue?logo=telegram&labelColor=222" alt="Ameni TG">
  <img src="https://img.shields.io/badge/platform-web+cli-%234CAF50?labelColor=222" alt="Web+CLI">
  <img src="https://img.shields.io/badge/license-MIT-lightgrey?labelColor=222" alt="MIT">
</p>

<h1 align="center">Ameni TG — анализатор Telegram чатов</h1>

<p align="center">
  Веб-инструмент и CLI-агент для анализа экспортированных Telegram чатов.<br>
  Обрабатывает result.json целиком в браузере или консоли.
</p>

<p align="center">
  <a href="#статистики-веб-интерфейса">Веб-статистики</a> &middot;
  <a href="#cli-агент">CLI агент</a> &middot;
  <a href="#установка">Установка</a> &middot;
  <a href="#как-экспортировать-чат">Экспорт чата</a> &middot;
  <a href="#команды-агента">Команды</a>
</p>

<br>

---

## Статистики веб-интерфейса

Веб-версия доступна по адресу [amenoke.ru/index/tg-parser](https://amenoke.ru/index/tg-parser). Генерирует полный набор статистик в реальном времени.

<br>

### Панель обзора (Stats Grid)

12 ключевых метрик на главном экране:

| Метрика | Описание |
|---------|----------|
| **Total Messages** | Общее количество сообщений и продолжительность чата в днях |
| **Participants** | Число участников и процент двух самых активных |
| **Messages per Day** | Среднее число сообщений в день и пиковый день |
| **Total Characters** | Общее количество символов, слов, уникальных слов |
| **Avg. Message Length** | Средняя длина сообщения в символах, самое длинное сообщение |
| **Media Messages** | Доля медиа-сообщений (фото/видео/стикеры) и общее количество файлов |
| **Avg. Response Time** | Среднее время ответа между разными участниками |
| **Emojis Used** | Общее количество использованных эмодзи и самый популярный |
| **Replies** | Доля ответных сообщений и их количество |
| **Forwarded** | Доля пересланных сообщений |
| **Active Sender** | Самый активный участник и его доля от всех сообщений |
| **Night Activity** | Доля сообщений после 18:00 |


<br>

### Графики (Charts)

<details>
<summary>Messages Over Time — линейный график</summary>
Количество сообщений по дням за весь период чата. Позволяет визуально оценить динамику: спады, всплески, периоды затишья. Каждая точка — один день. График строится на основе perDay.

</details>

<details>
<summary>Activity by Hour — столбчатая диаграмма</summary>
Распределение сообщений по 24 часам суток. Показывает, в какое время участники наиболее активны. perHour[0..23] — абсолютные значения.

</details>

<details>
<summary>Activity by Day of Week — столбчатая диаграмма</summary>
Распределение по дням недели (Sun–Sat). Показывает, какие дни самые активные. perWeekday[0..6].

</details>

<details>
<summary>Monthly Activity — столбчатая диаграмма</summary>
Количество сообщений по месяцам (YYYY-MM). Позволяет увидеть долгосрочную динамику. perMonth.

</details>

<details>
<summary>Participants Activity — столбчатая диаграмма</summary>
Топ отправителей по количеству сообщений. Каждый столбец — участник, высота — число сообщений. topSenders[0..N].

</details>

<details>
<summary>Message Length Distribution — столбчатая диаграмма</summary>
Распределение длины сообщений по группам: 1–10, 11–50, 51–100, 101–500, 501+ символов. lenDist.

</details>

<details>
<summary>Response Time Distribution — столбчатая диаграмма</summary>
Распределение времени ответа между разными участниками. respTimes — массив секунд. Показывает, как быстро обычно отвечают в чате.


</details>

<details>
<summary>Top Emojis — столбчатая диаграмма</summary>
Топ-20 самых используемых эмодзи. topEmojis[0..19].


</details>

<details>
<summary>Media Type Breakdown — кольцевая диаграмма</summary>
Распределение типов медиа: photo, video, sticker, gif, document, voice. mediaTypes.


</details>

<details>
<summary>Most Replied To — столбчатая диаграмма</summary>
Участники, чьи сообщения чаще всего получают ответы. topRepliedTo[0..10] — косвенный показатель вовлечённости.


</details>

<details>
<summary>Cumulative Messages — линейный график</summary>
Накопленное количество сообщений от начала чата. Показывает общий рост чата во времени. sortedByTime.


</details>

<details>
<summary>Messages per Sender — кольцевая диаграмма</summary>
Доля каждого участника в общем количестве сообщений. topSenders.


</details>

<details>
<summary>Heatmap — тепловая карта активности</summary>
Тепловая карта «часы × дни». Цвет ячейки — интенсивность сообщений в указанный час указанного дня. Позволяет увидеть паттерны активности на больших периодах.


</details>

<details>
<summary>Top Words — облако тегов (Word Cloud)</summary>
50 самых частых слов после фильтрации стоп-слов. topWords[0..50]. Размер слова пропорционален частоте использования в чате.


</details>

<br>

### Полный список вычисляемых метрик

| Категория | Метрики |
|-----------|---------|
| **Общие** | total (сообщения), participants (участники), dateRange (диапазон дат), daysSpan (дней), avgPerDay (среднее в день) |
| **Текст** | totalChars, totalWords, uniqueWordsCount, avgLength, longest, lenDist (распределение длины) |
| **Активность** | perDay (по дням), perHour (по часам), perWeekday (по дням недели), perMonth (по месяцам), bestDay, bestMonth, bestHour |
| **Участники** | topSenders (топ), bySender (детально: count, chars, words, emojis, media, links) |
| **Медиа** | mediaTypes (photo, video, sticker, gif, document, voice), mediaPct |
| **Время ответа** | avgResp (среднее), respTimes (все значения), longestPause (самая долгая пауза) |
| **Реакции** | totalEmojis, topEmojis (топ-20), allEmojis (все), countedReactions, messagesWithReactions, topReactions |
| **Цепочки** | replies (ответы), replyPct, topRepliedTo (топ отвечаемых) |
| **Прочее** | totalForwards, forwardPct, totalEdits, totalLinks, totalEmojis, nightPct (ночная активность), weekendPct (выходные) |
| **Слова** | topWords (топ-50), wordFreq (частотный словарь), uniqueWordsCount |

---

## CLI агент

CLI-агент даёт те же статистики в консоли. Команды:

### ameni tg stats

**Полная статистика чата.** Выводит название, тип, период, количество участников, сообщений, среднюю длину, топ отправителей, распределение медиа.

```
$ ameni tg stats ./result.json
[INFO]  File: ./result.json

Chat:          Проектный чат
Type:          group
Period:        2024-03-10 — 2025-05-28
Participants:  14
Messages:      12,431
Total chars:   892,450
Avg length:    71.8 chars
Text msgs:     10,234
Media msgs:    2,197
Forwards:      342
Edits:         89

Top senders:
  Алексей         4,210 msgs  (33.9%)
  Мария           3,845 msgs  (30.9%)
  Дмитрий         2,100 msgs  (16.9%)
  Остальные       2,276 msgs  (18.3%)

Media:
  photo        1,234  (9.9%)
  video          456  (3.7%)
  sticker        345  (2.8%)
  gif            124  (1.0%)
  document        38  (0.3%)
```

### ameni tg top

**Топ отправителей с визуальной гистограммой.** Каждому участнику соответствует строка, ширина бара `█` пропорциональна его доле.

```
$ ameni tg top ./result.json
Top senders for Проектный чат:

  Алексей      4210  33.9%  ████████████████████
  Мария        3845  30.9%  ██████████████████
  Дмитрий      2100  16.9%  ██████████
  Иван         1245  10.0%  ██████
  Ольга         786   6.3%  ████
  Сергей        245   2.0%  █
```

### ameni tg activity

**Активность по часам суток и дням недели.** 

```
$ ameni tg activity ./result.json
Activity for Проектный чат:

Messages by hour:
   9:00    234  ██████
  10:00    567  ██████████████
  11:00    891  ██████████████████████
  12:00    612  ███████████████
  13:00    423  ██████████
  14:00    756  ██████████████████
  15:00    834  ████████████████████
  16:00    445  ███████████
  17:00    312  ████████
  18:00    267  ██████

Messages by weekday:
  Mon    1876  ████████████████
  Tue    2012  █████████████████
  Wed    1845  ████████████████
  Thu    2098  █████████████████
  Fri    2345  ████████████████████
  Sat    1245  ██████████
  Sun    1010  ████████
```

### ameni tg media

**Распределение типов медиа.** 

```
$ ameni tg media ./result.json
Media distribution for Проектный чат:

  photo      1234   9.9%  ████████████████████
  video       456   3.7%  ███████
  sticker     345   2.8%  ██████
  gif         124   1.0%  ██
  document     38   0.3%  █
```

---

## Установка

### Требования

- **Веб-интерфейс:** любой современный браузер
- **CLI-агент:** Node.js 14+

### Установка Node.js

**Arch Linux:**
```bash
sudo pacman -S nodejs npm
```

**Windows:**
```powershell
winget install OpenJS.NodeJS
# или https://nodejs.org (LTS)
```

**macOS:**
```bash
brew install node
```

### Настройка CLI

**Arch Linux / macOS (bash):**
```bash
git clone https://github.com/inzexg-coder/ameni-tg-parser.git
cd ameni-tg-parser
export PATH="$PATH:$(pwd)/.ameni/bin"
ameni tg about
```

**Windows (Git Bash / WSL):**
```bash
git clone https://github.com/inzexg-coder/ameni-tg-parser.git
cd ameni-tg-parser
export PATH="$PATH:$(pwd)/.ameni/bin"
ameni tg about
```

**Windows (PowerShell, без bash):**
```powershell
git clone https://github.com/inzexg-coder/ameni-tg-parser.git
cd ameni-tg-parser
.ameni/bin/ameni.ps1 about
```

### Постоянный доступ

```bash
sudo ln -s "$(pwd)/.ameni/bin/ameni" /usr/local/bin/ameni
```

### Arch Linux (PKGBUILD)

```bash
git clone https://github.com/inzexg-coder/ameni-tg-parser.git
cd ameni-tg-parser
makepkg -si
ameni tg about
```

---

## Как экспортировать чат

1. Откройте **Telegram Desktop**
2. Зайдите в нужный чат
3. **Три точки** (меню) → **Export chat history**
4. Настройки экспорта:
   - **Format:** JSON (обязательно)
   - **Export photos, videos, stickers** — по желанию
   - **Size limit:** без ограничений
5. Нажмите **Export**
6. После завершения найдите `result.json` в папке экспорта

---

## Команды агента


### ameni tg stats

**Полный отчёт.** Все метрики чата: сообщения, участники, период, длина, топ отправителей, медиа, пересылки, ответы, эмодзи, активность.

```
$ ameni tg stats ./result.json

Chat:          Проектный чат
Period:        2024-03-10 - 2025-05-28
Participants:  14
Messages:      12,431
Avg length:    71.8 chars
Avg per day:   34.2
Media msgs:    2,197 (17.7%)
Forwards:      342 (2.8%)
Replies:       1,890 (15.2%)
Avg response:  1h 23m 45s
Total emojis:  3,456
```

### ameni tg get

**Любая метрика отдельно.** Позволяет запросить конкретный показатель.

```bash
ameni tg get ./result.json total-messages
ameni tg get ./result.json avg-response-time
ameni tg get ./result.json top-senders
ameni tg get ./result.json emojis-used
ameni tg get ./result.json media-messages
ameni tg get ./result.json all
```

Доступные метрики:
| Метрика | Вывод |
|---------|-------|
| `total-messages` | Общее количество, даты, продолжительность |
| `participants` | Число участников, доля топ-2 |
| `top-senders` | Топ-20 отправителей с процентами |
| `messages-per-day` | Среднее в день, пиковый день |
| `total-chars` | Символы, слова, уникальные слова |
| `avg-message-length` | Средняя и максимальная длина |
| `media-messages` | Количество и доля медиа по типам |
| `avg-response-time` | Среднее время ответа |
| `emojis-used` | Всего эмодзи, топ-10 |
| `replies` | Количество и доля ответов |
| `forwarded` | Количество и доля пересланных |
| `active-sender` | Самый активный участник |
| `night-activity` | Сообщения после 18:00 |

### ameni tg chart

**ASCII-графики в терминале.** Визуализация любой метрики.

```bash
ameni tg chart ./result.json activity-by-hour
ameni tg chart ./result.json messages-over-time
ameni tg chart ./result.json top-senders
ameni tg chart ./result.json media-breakdown
```

**Пример вывода activity-by-hour:**
```
 0:00    123  ███████
 8:00     45  ██
 9:00    234  ████████████
10:00    567  ███████████████████████████
11:00    891  ████████████████████████████████████████████
12:00    612  ██████████████████████████
...
```

Доступные графики:
| График | Описание |
|--------|----------|
| `messages-over-time` | Сообщения по дням |
| `activity-by-hour` | Активность по часам (0-23) |
| `activity-by-weekday` | Активность по дням недели |
| `monthly-activity` | Активность по месяцам |
| `top-senders` | Топ отправителей |
| `message-length` | Распределение длины |
| `media-breakdown` | Типы медиа |
| `top-emojis` | Топ эмодзи |
| `most-replied-to` | Кому отвечают чаще |
| `heatmap-hours` | Тепловая карта часов |

### ameni tg top

**Топ-20 отправителей** с ASCII-гистограммой.

### ameni tg activity

**Распределение по часам** (0-23) **и дням недели** (Sun-Sat).

### ameni tg media

**Распределение типов медиа:** photo, video, sticker, gif, document.

### ameni tg json

**Полные данные в JSON.** Удобно для обработки через `jq`.

```bash
ameni tg json ./result.json | jq '.topSenders[:3]'
ameni tg json ./result.json | jq '.hours'
```

### ameni tg list

**Список всех доступных метрик и графиков** для переданного файла.

```
$ ameni tg list ./result.json

Available metrics (ameni tg get <metric>):
  total-messages            Total messages and chat duration in days
  participants              Number of participants
  ...

Available charts (ameni tg chart <name>):
  activity-by-hour          Messages by hour of day (0-23)
  top-senders               Top senders bar chart
  ...
```

### Соответствие команд

| Команда | Arch Linux | Windows (PowerShell) |
|---------|-----------|---------------------|
| stats | `ameni tg stats file` | `.ameni/bin/ameni.ps1 stats file` |
| get | `ameni tg get file metric` | `.ameni/bin/ameni.ps1 get file metric` |
| chart | `ameni tg chart file name` | `.ameni/bin/ameni.ps1 chart file name` |
| top | `ameni tg top file` | `.ameni/bin/ameni.ps1 top file` |
| activity | `ameni tg activity file` | `.ameni/bin/ameni.ps1 activity file` |
| media | `ameni tg media file` | `.ameni/bin/ameni.ps1 media file` |
| json | `ameni tg json file` | `.ameni/bin/ameni.ps1 json file` |
| list | `ameni tg list file` | `.ameni/bin/ameni.ps1 list file` |
| about | `ameni tg about` | `.ameni/bin/ameni.ps1 about` |
| help | `ameni tg help` | `.ameni/bin/ameni.ps1 help` |


---

<p align="center">
  <img src=".ameni/assets/ameni-logo.svg" alt="Ameni" width="32">
  <br>
  <a href="https://github.com/inzexg-coder">@inzexg-coder</a>
</p>

---

## Связанные скиллы

<p align="center">
  <a href="https://github.com/inzexg-coder/ameni-tg-parser">
    <img src=".ameni/assets/skill-tg.svg" width="64" alt="TG Parser">
  </a>
  &nbsp;&nbsp;&nbsp;
  <a href="https://github.com/inzexg-coder/ameni-vs-kernel">
    <img src=".ameni/assets/skill-vs.svg" width="64" alt="VS Kernel">
  </a>
  &nbsp;&nbsp;&nbsp;
  <a href="https://github.com/inzexg-coder/fide-rating-calc">
    <img src=".ameni/assets/skill-fide.svg" width="64" alt="FIDE Calc">
  </a>
</p>

<p align="center">

| Скилл | Описание |
|-------|----------|
| [**ameni-tg-parser**](https://github.com/inzexg-coder/ameni-tg-parser) | Telegram Message Parser — анализ и визуализация чатов |
| [**ameni-vs-kernel**](https://github.com/inzexg-coder/ameni-vs-kernel) | VS Kernel — диагностика Visual Studio, LNK-ошибки, .vcxproj |
| [**fide-rating-calc**](https://github.com/inzexg-coder/fide-rating-calc) | FIDE Rating Calculator — оценка FIDE-рейтинга по партиям |

</p>

