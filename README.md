<p align="center">
  <img src=".ameni/assets/ameni-logo.svg" alt="Ameni" width="130">
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Telegram_Chat_Analyzer-blue?logo=telegram&labelColor=222" alt="Telegram">
  <img src="https://img.shields.io/badge/platform-web-%234CAF50?labelColor=222" alt="Web">
  <img src="https://img.shields.io/badge/CLI-enabled-%234CAF50?labelColor=222" alt="CLI">
</p>

<h1 align="center">Ameni TG — анализатор Telegram чатов</h1>

<p align="center">
  Веб-инструмент и CLI-агент для анализа экспортированных Telegram чатов.<br>
  Загрузите result.json — получите полную статистику сообщений,<br>
  активность участников, распределение медиа и временные паттерны.
</p>

<p align="center">
  <a href="#веб-интерфейс">Веб-интерфейс</a> &middot;
  <a href="#cli-агент">CLI агент</a> &middot;
  <a href="#установка">Установка</a> &middot;
  <a href="#как-использовать">Использование</a> &middot;
  <a href="#команды-агента">Команды</a>
</p>

> **Описание.** Ameni TG — клиентский агент для анализа экспортированных Telegram чатов. Работает в двух режимах: веб-интерфейс с графиками и диаграммами (запускается в браузере) и CLI-агент с выводом статистики в консоль. Все данные обрабатываются локально — ничего не уходит на сервер.

---

## Веб-интерфейс

**Ссылка:** [amenoke.ru/index/tg-parser](https://amenoke.ru/index/tg-parser/)

**Возможности:**
- Полная статистика чата: сообщения, участники, период, средняя длина
- Топ отправителей по количеству сообщений
- Графики активности: по дням, часам, дням недели
- Распределение типов медиа (фото, видео, стикеры, гифки, файлы)
- Время реакции между сообщениями
- Адаптивный дизайн — работает на мобильных и десктопе

**Как открыть локально:**
```bash
git clone https://github.com/inzexg-coder/tg-parser.git
cd tg-parser
# Открыть index.html в браузере
```

---

## CLI агент

**Установка:**
```bash
cd tg-parser
export PATH="$PATH:$(pwd)/.ameni/bin"
ameni tg about
```

**Примеры:**
```bash
# Полная статистика чата
ameni tg stats ./result.json
```

Вывод:
```
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

```bash
# Топ отправителей (гистограмма)
ameni tg top ./result.json
```

```
Top senders for Проектный чат:

  Алексей      4210  33.9%  ████████████████████
  Мария        3845  30.9%  ██████████████████
  Дмитрий      2100  16.9%  ██████████
  Иван         1245  10.0%  ██████
  Ольга         786   6.3%  ████
  Сергей        245   2.0%  █
```

```bash
# Активность по часам
ameni tg activity ./result.json
```

```
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

---

## Команды агента

```
ameni tg stats <result.json>
    Полная статистика чата: количество сообщений, участники,
    период, средняя длина, топ отправителей, распределение медиа.

ameni tg top <result.json>
    Топ-10 отправителей с процентной гистограммой.

ameni tg activity <result.json>
    Распределение сообщений по часам суток и дням недели.

ameni tg media <result.json>
    Распределение типов медиа: фото, видео, стикеры, гифки, документы.

ameni tg about
    Информация об агенте: версия, репозиторий, команды.

ameni tg help
    Подробная документация по каждой команде.
```

---

## Как использовать

1. **Экспорт чата** в Telegram Desktop:
   - Три точки → Export chat history
   - Формат: JSON
   - Остальные настройки по желанию

2. **Веб-интерфейс:** открыть [amenoke.ru/index/tg-parser](https://amenoke.ru/index/tg-parser/) и загрузить `result.json`

3. **CLI:** установить агента и запустить:
   ```bash
   ameni tg stats ./result.json
   ```

---

<p align="center">
  <img src=".ameni/assets/ameni-logo.svg" alt="Ameni" width="32">
  <br>
  <a href="https://github.com/inzexg-coder">@inzexg-coder</a>
</p>
