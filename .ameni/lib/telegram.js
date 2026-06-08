const fs = require('fs');

function loadMessages(filePath) {
  const raw = fs.readFileSync(filePath, 'utf-8');
  const data = JSON.parse(raw);

  let messages = [], chatTitle = 'Unknown Chat', chatType = 'personal';

  if (data.chats && Array.isArray(data.chats.list)) {
    const c = data.chats.list[0];
    chatTitle = c.label || c.title || 'Unknown Chat';
    chatType = c.type || 'personal';
    messages = c.messages || [];
  } else if (Array.isArray(data.messages)) {
    messages = data.messages;
    chatTitle = data.name || data.title || 'Unknown Chat';
    chatType = data.type || 'personal';
  } else if (data.chat && Array.isArray(data.chat.messages)) {
    messages = data.chat.messages;
    chatTitle = data.chat.label || data.chat.title || 'Unknown Chat';
    chatType = data.chat.type || 'personal';
  }

  messages = messages.filter(m => m.type !== 'service')
    .filter(m => m.text !== undefined || m.photo || m.video || m.sticker || m.animation);

  messages = messages.map(m => {
    let text = '';
    if (typeof m.text === 'string') text = m.text;
    else if (Array.isArray(m.text)) text = m.text.map(t => typeof t === 'string' ? t : t.text || '').join('');
    else if (m.message) text = m.message;

    let sender = 'Unknown';
    if (typeof m.from === 'string') sender = m.from;
    else if (m.from && m.from.first_name) sender = m.from.first_name + (m.from.last_name ? ' ' + m.from.last_name : '');
    else if (m.from && m.from.username) sender = '@' + m.from.username;
    else if (m.sender) sender = m.sender;
    else if (m.author) sender = m.author;

    const date = new Date(m.date);
    const mediaType = m.photo ? 'photo' : m.video ? 'video' : m.sticker ? 'sticker' : m.animation ? 'gif' : m.file ? 'document' : null;

    return {
      sender,
      text,
      date,
      dateStr: m.date,
      textLength: text.length,
      hasMedia: !!mediaType,
      mediaType,
      isForwarded: !!m.forwarded_from || m.forwarded === true,
      isEdited: !!m.edited,
    };
  });

  return { messages, chatTitle, chatType };
}

function stats(messages, chatTitle, chatType) {
  const total = messages.length;
  const senders = new Set(messages.map(m => m.sender));
  const participants = senders.size;
  const dates = messages.filter(m => m.date).map(m => m.date);
  const minDate = dates.length ? new Date(Math.min(...dates)).toISOString().split('T')[0] : '-';
  const maxDate = dates.length ? new Date(Math.max(...dates)).toISOString().split('T')[0] : '-';
  const totalChars = messages.reduce((s, m) => s + m.textLength, 0);
  const avgLen = total ? (totalChars / total).toFixed(1) : 0;
  const mediaMsgs = messages.filter(m => m.hasMedia);
  const textMsgs = messages.filter(m => !m.hasMedia && m.textLength > 0);
  const totalForwards = messages.filter(m => m.isForwarded).length;
  const totalEdits = messages.filter(m => m.isEdited).length;

  const senderCounts = {};
  messages.forEach(m => {
    senderCounts[m.sender] = (senderCounts[m.sender] || 0) + 1;
  });

  const topSenders = Object.entries(senderCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, count]) => ({ name, count, pct: (count / total * 100).toFixed(1) }));

  const mediaTypes = {};
  messages.forEach(m => {
    if (m.mediaType) {
      mediaTypes[m.mediaType] = (mediaTypes[m.mediaType] || 0) + 1;
    }
  });
  if (messages.filter(m => m.hasMedia && !m.mediaType).length) {
    mediaTypes.other = messages.filter(m => m.hasMedia && !m.mediaType).length;
  }

  const hours = {};
  const days = {};
  const weekdays = {};
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  messages.forEach(m => {
    if (m.date && m.date instanceof Date && !isNaN(m.date)) {
      const h = m.date.getHours();
      hours[h] = (hours[h] || 0) + 1;
      const d = m.date.toISOString().split('T')[0];
      days[d] = (days[d] || 0) + 1;
      const wd = m.date.getDay();
      weekdays[dayNames[wd]] = (weekdays[dayNames[wd]] || 0) + 1;
    }
  });

  return {
    chatTitle,
    chatType,
    total,
    participants,
    period: `${minDate} — ${maxDate}`,
    totalChars,
    avgLen,
    textMsgs: textMsgs.length,
    mediaMsgs: mediaMsgs.length,
    totalForwards,
    totalEdits,
    topSenders,
    mediaTypes,
    hours: Object.fromEntries(Object.entries(hours).sort((a, b) => a[0] - b[0])),
    days,
    weekdays,
    senderCounts,
  };
}

if (require.main === module) {
  const filePath = process.argv[2];
  const command = process.argv[3] || 'stats';

  if (!filePath) {
    console.error('Usage: node telegram.js <file.json> [command]');
    process.exit(1);
  }

  const { messages, chatTitle, chatType } = loadMessages(filePath);
  const data = stats(messages, chatTitle, chatType);

  if (command === 'stats') {
    console.log(`Chat:          ${data.chatTitle}`);
    console.log(`Type:          ${data.chatType}`);
    console.log(`Period:        ${data.period}`);
    console.log(`Participants:  ${data.participants}`);
    console.log(`Messages:      ${data.total.toLocaleString()}`);
    console.log(`Total chars:   ${data.totalChars.toLocaleString()}`);
    console.log(`Avg length:    ${data.avgLen} chars`);
    console.log(`Text msgs:     ${data.textMsgs.toLocaleString()}`);
    console.log(`Media msgs:    ${data.mediaMsgs.toLocaleString()}`);
    console.log(`Forwards:      ${data.totalForwards.toLocaleString()}`);
    console.log(`Edits:         ${data.totalEdits.toLocaleString()}`);
    console.log(``);
    console.log(`Top senders:`);
    data.topSenders.forEach(s => {
      console.log(`  ${s.name.padEnd(14)} ${String(s.count).padStart(6)} msgs  (${s.pct}%)`);
    });
    if (Object.keys(data.mediaTypes).length) {
      console.log(``);
      console.log(`Media:`);
      Object.entries(data.mediaTypes).forEach(([type, count]) => {
        const pct = (count / data.total * 100).toFixed(1);
        console.log(`  ${type.padEnd(10)} ${String(count).padStart(5)}  (${pct}%)`);
      });
    }
  } else if (command === 'top') {
    console.log(`Top senders for ${data.chatTitle}:`);
    console.log(``);
    const maxName = Math.max(...data.topSenders.map(s => s.name.length));
    data.topSenders.forEach(s => {
      const barLen = Math.round(s.count / data.topSenders[0].count * 20);
      const bar = '█'.repeat(barLen);
      console.log(`  ${s.name.padEnd(maxName)}  ${String(s.count).padStart(6)}  ${s.pct}%  ${bar}`);
    });
  } else if (command === 'activity') {
    console.log(`Activity for ${data.chatTitle}:`);
    console.log(``);
    console.log(`Messages by hour:`);
    for (let h = 0; h < 24; h++) {
      const count = data.hours[h] || 0;
      if (count > 0) {
        const bar = '█'.repeat(Math.round(count / Math.max(...Object.values(data.hours)) * 20));
        console.log(`  ${String(h).padStart(2)}:00  ${String(count).padStart(5)}  ${bar}`);
      }
    }
    console.log(``);
    console.log(`Messages by weekday:`);
    const maxWd = Math.max(...Object.values(data.weekdays));
    Object.entries(data.weekdays).forEach(([day, count]) => {
      const bar = '█'.repeat(Math.round(count / maxWd * 20));
      console.log(`  ${day.padEnd(4)}  ${String(count).padStart(5)}  ${bar}`);
    });
  } else if (command === 'media') {
    if (Object.keys(data.mediaTypes).length === 0) {
      console.log(`No media messages found in ${data.chatTitle}`);
    } else {
      console.log(`Media distribution for ${data.chatTitle}:`);
      console.log(``);
      const maxM = Math.max(...Object.values(data.mediaTypes));
      Object.entries(data.mediaTypes).forEach(([type, count]) => {
        const pct = (count / data.total * 100).toFixed(1);
        const bar = '█'.repeat(Math.round(count / maxM * 20));
        console.log(`  ${type.padEnd(10)}  ${String(count).padStart(5)}  ${pct}%  ${bar}`);
      });
    }
  } else if (command === 'json') {
    console.log(JSON.stringify(data, null, 2));
  }
}

module.exports = { loadMessages, stats };
