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
    const isReply = !!m.reply_to_message_id || !!m.reply_to;

    return {
      sender, text, date, dateStr: m.date,
      textLength: text.length,
      hasMedia: !!mediaType, mediaType,
      isForwarded: !!m.forwarded_from || m.forwarded === true,
      isEdited: !!m.edited, isReply,
      replyTo: m.reply_to_message_id || m.reply_to || null,
      id: m.id,
    };
  });

  return { messages, chatTitle, chatType };
}

function analyze(messages, chatTitle, chatType) {
  const total = messages.length;

  const senderCounts = {};
  messages.forEach(m => { senderCounts[m.sender] = (senderCounts[m.sender] || 0) + 1; });
  const topSenders = Object.entries(senderCounts)
    .sort((a, b) => b[1] - a[1]).slice(0, 20)
    .map(([name, count]) => ({ name, count, pct: (count / total * 100).toFixed(1) }));

  const participants = Object.keys(senderCounts).length;

  const dates = messages.filter(m => m.date && !isNaN(m.date)).map(m => m.date);
  const minDate = dates.length ? new Date(Math.min(...dates)).toISOString().split('T')[0] : '-';
  const maxDate = dates.length ? new Date(Math.max(...dates)).toISOString().split('T')[0] : '-';
  const daysDiff = dates.length ? Math.max(1, Math.ceil((Math.max(...dates) - Math.min(...dates)) / 86400000)) : 1;

  const perDay = {};
  messages.forEach(m => {
    if (m.date && !isNaN(m.date)) {
      const d = m.date.toISOString().split('T')[0];
      perDay[d] = (perDay[d] || 0) + 1;
    }
  });
  const avgPerDay = (total / daysDiff).toFixed(1);
  const peakDay = Object.entries(perDay).sort((a, b) => b[1] - a[1])[0] || ['-', 0];

  const totalChars = messages.reduce((s, m) => s + m.textLength, 0);
  const textMsgs = messages.filter(m => !m.hasMedia && m.textLength > 0);
  const allWords = textMsgs.flatMap(m => m.text.split(/\s+/).filter(w => w.length > 0));
  const totalWords = allWords.length;
  const uniqueWords = new Set(allWords.map(w => w.toLowerCase())).size;
  const avgLen = total ? (totalChars / total).toFixed(1) : 0;
  const longestMsg = messages.reduce((max, m) => m.textLength > max ? m.textLength : max, 0);

  const mediaMsgs = messages.filter(m => m.hasMedia);
  const mediaRatio = total ? (mediaMsgs.length / total * 100).toFixed(1) : 0;
  const mediaTypes = {};
  messages.forEach(m => { if (m.mediaType) mediaTypes[m.mediaType] = (mediaTypes[m.mediaType] || 0) + 1; });

  const hours = {}; for (let i = 0; i < 24; i++) hours[i] = 0;
  const weekdays = { 'Sun': 0, 'Mon': 0, 'Tue': 0, 'Wed': 0, 'Thu': 0, 'Fri': 0, 'Sat': 0 };
  const perMonth = {};
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  messages.forEach(m => {
    if (m.date && !isNaN(m.date)) {
      const h = m.date.getHours();
      if (hours[h] !== undefined) hours[h]++;
      const wd = m.date.getDay();
      weekdays[dayNames[wd]]++;
      const month = m.date.getFullYear() + '-' + String(m.date.getMonth() + 1).padStart(2, '0');
      perMonth[month] = (perMonth[month] || 0) + 1;
    }
  });

  const nightMsgs = messages.filter(m => m.date && !isNaN(m.date) && m.date.getHours() >= 18).length;
  const nightPct = total ? (nightMsgs / total * 100).toFixed(1) : 0;
  const totalForwards = messages.filter(m => m.isForwarded).length;
  const forwardPct = total ? (totalForwards / total * 100).toFixed(1) : 0;
  const totalReplies = messages.filter(m => m.isReply).length;
  const replyPct = total ? (totalReplies / total * 100).toFixed(1) : 0;
  const totalEdits = messages.filter(m => m.isEdited).length;

  const msgsBySender = {};
  messages.forEach(m => {
    if (!msgsBySender[m.sender]) msgsBySender[m.sender] = [];
    msgsBySender[m.sender].push(m.date);
  });
  const responseTimes = [];
  Object.values(msgsBySender).forEach(times => {
    times.sort((a, b) => a - b);
    for (let i = 1; i < times.length; i++) {
      const diff = (times[i] - times[i - 1]) / 1000;
      if (diff > 0 && diff < 86400) responseTimes.push(diff);
    }
  });
  const avgResponseTime = responseTimes.length ? Math.round(responseTimes.reduce((s, t) => s + t, 0) / responseTimes.length) : 0;

  const lenDist = { '1-10': 0, '11-50': 0, '51-100': 0, '101-500': 0, '501+': 0 };
  messages.forEach(m => {
    const l = m.textLength;
    if (l === 0) return;
    if (l <= 10) lenDist['1-10']++;
    else if (l <= 50) lenDist['11-50']++;
    else if (l <= 100) lenDist['51-100']++;
    else if (l <= 500) lenDist['101-500']++;
    else lenDist['501+']++;
  });

  const emojiRegex = /[\u{1F000}-\u{1FFFF}\u{2600}-\u{27BF}\u{FE00}-\u{FE0F}]/gu;
  const emojiCounts = {};
  messages.forEach(m => {
    if (m.text) {
      const emojis = m.text.match(emojiRegex);
      if (emojis) emojis.forEach(e => { emojiCounts[e] = (emojiCounts[e] || 0) + 1; });
    }
  });
  const totalEmojis = Object.values(emojiCounts).reduce((s, c) => s + c, 0);
  const topEmojis = Object.entries(emojiCounts).sort((a, b) => b[1] - a[1]).slice(0, 20).map(([e, c]) => ({ emoji: e, count: c }));

  const repliedToCounts = {};
  messages.forEach(m => {
    if (m.replyTo) {
      const replied = messages.find(x => x.id === m.replyTo);
      if (replied) repliedToCounts[replied.sender] = (repliedToCounts[replied.sender] || 0) + 1;
    }
  });
  const topRepliedTo = Object.entries(repliedToCounts).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([n, c]) => ({ name: n, count: c }));

  const cumulative = [];
  let cum = 0;
  Object.entries(perDay).sort((a, b) => a[0].localeCompare(b[0])).forEach(([d, c]) => {
    cum += c;
    cumulative.push({ date: d, total: cum });
  });

  const stopWords = new Set(['the','a','an','in','on','at','to','for','of','and','is','it','this','with','from','be','are','was','were','will','would','can','could','have','has','had','do','does','did','i','you','he','his','him','she','her','they','them','we','us','or','as','but','not','no','so','if','about','up','out','by','all','just','only','also','very','too','my','me','we','our','your','their','its','that','those','these','&nbsp;','br','gt','lt','amp','и','в','на','с','не','по','для','а','от','то','из','о','к','за','у','но','да','же','до','бы','ли','ни','об','че','во','со','чт','это','что','как','так','все','его','ее','их','мы','вы','ты','он','она','оно','они','меня','тебя','нас','вас','мне','тебе','вам','нам','этом']);
  const wordCounts = {};
  textMsgs.forEach(m => {
    const words = m.text.toLowerCase().split(/[\s,.;:!?()\[\]{}"''\u00AB\u00BB]+/).filter(w => w.length > 2 && !stopWords.has(w));
    words.forEach(w => { wordCounts[w] = (wordCounts[w] || 0) + 1; });
  });
  const topWords = Object.entries(wordCounts).sort((a, b) => b[1] - a[1]).slice(0, 50).map(([w, c]) => ({ word: w, count: c }));

  return {
    chatTitle, chatType, total, participants, minDate, maxDate, daysDiff,
    perDay, avgPerDay, peakDay: { date: peakDay[0], count: peakDay[1] },
    totalChars, totalWords, uniqueWords,
    avgLen, longestMsg,
    mediaMsgs: mediaMsgs.length, textMsgs: textMsgs.length,
    mediaRatio, mediaTypes,
    hours, weekdays, perMonth,
    nightMsgs, nightPct,
    totalForwards, forwardPct,
    totalReplies, replyPct,
    totalEdits,
    avgResponseTime,
    lenDist,
    totalEmojis, topEmojis,
    topSenders, senderCounts,
    topRepliedTo,
    cumulative,
    topWords,
  };
}

function bar(count, max, width) {
  if (max === 0) return '';
  return '\u2588'.repeat(Math.round(count / max * width));
}

function printMetric(label, value, suffix) {
  console.log(String(label).padEnd(24) + ' ' + String(value).padStart(12) + (suffix || ''));
}

if (require.main === module) {
  const filePath = process.argv[2];
  const command = process.argv[3] || 'stats';
  const arg = process.argv[4];

  if (!filePath) {
    console.error('Usage: node telegram.js <file.json> <command> [args]');
    console.error('Commands: stats, get <metric>, top, activity, chart <name>, media, json, list');
    process.exit(1);
  }

  const { messages, chatTitle, chatType } = loadMessages(filePath);
  const data = analyze(messages, chatTitle, chatType);

  if (command === 'list') {
    console.log('');
    console.log('Available metrics (ameni tg get <metric>):');
    console.log('');
    const metrics = [
      ['total-messages', 'Total messages and chat duration in days'],
      ['participants', 'Number of participants and top two share'],
      ['top-senders', 'Top 20 senders with percentages'],
      ['messages-per-day', 'Average messages per day, peak day'],
      ['total-chars', 'Total characters, words, unique words'],
      ['avg-message-length', 'Average and longest message length'],
      ['media-messages', 'Media count and ratio by type'],
      ['avg-response-time', 'Average response time between senders'],
      ['emojis-used', 'Total emojis and top 10 emojis'],
      ['replies', 'Reply count and percentage'],
      ['forwarded', 'Forward count and percentage'],
      ['active-sender', 'Most active sender and their share'],
      ['night-activity', 'Messages after 18:00 and their share'],
      ['all', 'Full statistics report'],
    ];
    metrics.forEach(([name, desc]) => console.log('  ' + String(name).padEnd(24) + ' ' + desc));
    console.log('');
    console.log('Available charts (ameni tg chart <name>):');
    console.log('');
    const charts = [
      ['messages-over-time', 'Messages per day (histogram)'],
      ['activity-by-hour', 'Messages by hour of day (0-23)'],
      ['activity-by-weekday', 'Messages by day of week (Sun-Sat)'],
      ['monthly-activity', 'Messages per month'],
      ['top-senders', 'Top senders bar chart'],
      ['message-length', 'Length distribution (1-10, 11-50, ...)'],
      ['media-breakdown', 'Media type distribution'],
      ['top-emojis', 'Top used emojis'],
      ['most-replied-to', 'Who gets most replies'],
      ['heatmap-hours', 'Heatmap hours x relative activity'],
    ];
    charts.forEach(([name, desc]) => console.log('  ' + String(name).padEnd(24) + ' ' + desc));
    console.log('');
    console.log('Other commands: stats, top, activity, media, json');
    return;
  }

  if (command === 'get') {
    const metric = arg || 'all';
    console.log('Chat: ' + data.chatTitle);
    console.log('');

    if (metric === 'all' || metric === 'total-messages') {
      printMetric('Total messages', data.total.toLocaleString());
      printMetric('From', data.minDate);
      printMetric('To', data.maxDate);
      printMetric('Days', data.daysDiff);
      console.log('');
    }
    if (metric === 'all' || metric === 'participants') {
      printMetric('Participants', data.participants);
      const topTwoShare = data.topSenders.slice(0, 2).reduce((s, x) => s + parseFloat(x.pct), 0).toFixed(1);
      printMetric('Top two share', topTwoShare + '%');
      console.log('');
    }
    if (metric === 'all' || metric === 'top-senders') {
      console.log('Top senders:');
      data.topSenders.forEach(s => console.log('  ' + String(s.name).padEnd(16) + ' ' + String(s.count).padStart(8) + '  ' + s.pct + '%'));
      console.log('');
    }
    if (metric === 'all' || metric === 'messages-per-day') {
      printMetric('Avg per day', data.avgPerDay);
      printMetric('Peak day', data.peakDay.date, ' (' + data.peakDay.count + ')');
      console.log('');
    }
    if (metric === 'all' || metric === 'total-chars') {
      printMetric('Total chars', data.totalChars.toLocaleString());
      printMetric('Total words', data.totalWords.toLocaleString());
      printMetric('Unique words', data.uniqueWords.toLocaleString());
      console.log('');
    }
    if (metric === 'all' || metric === 'avg-message-length') {
      printMetric('Avg length', data.avgLen, ' chars');
      printMetric('Longest msg', data.longestMsg, ' chars');
      console.log('');
    }
    if (metric === 'all' || metric === 'media-messages') {
      printMetric('Media messages', data.mediaMsgs.toLocaleString());
      printMetric('Media ratio', data.mediaRatio + '%');
      if (Object.keys(data.mediaTypes).length) {
        console.log('By type:');
        Object.entries(data.mediaTypes).forEach(([type, count]) => {
          console.log('  ' + String(type).padEnd(10) + ' ' + String(count).padStart(6) + '  (' + (count / data.total * 100).toFixed(1) + '%)');
        });
      }
      console.log('');
    }
    if (metric === 'all' || metric === 'avg-response-time') {
      const hrs = Math.floor(data.avgResponseTime / 3600);
      const mins = Math.floor((data.avgResponseTime % 3600) / 60);
      const secs = data.avgResponseTime % 60;
      const timeStr = hrs > 0 ? hrs + 'h ' + mins + 'm ' + secs + 's' : mins > 0 ? mins + 'm ' + secs + 's' : secs + 's';
      printMetric('Avg response time', timeStr);
      console.log('');
    }
    if (metric === 'all' || metric === 'emojis-used') {
      printMetric('Total emojis', data.totalEmojis.toLocaleString());
      if (data.topEmojis.length) {
        console.log('Top emojis:');
        data.topEmojis.slice(0, 10).forEach(e => console.log('  ' + e.emoji + '  ' + e.count));
      }
      console.log('');
    }
    if (metric === 'all' || metric === 'replies') {
      printMetric('Replies', data.totalReplies.toLocaleString());
      printMetric('Reply ratio', data.replyPct + '%');
      console.log('');
    }
    if (metric === 'all' || metric === 'forwarded') {
      printMetric('Forwards', data.totalForwards.toLocaleString());
      printMetric('Forward ratio', data.forwardPct + '%');
      console.log('');
    }
    if (metric === 'all' || metric === 'active-sender') {
      if (data.topSenders.length) {
        printMetric('Most active', data.topSenders[0].name);
        printMetric('Messages', data.topSenders[0].count.toLocaleString());
        printMetric('Share', data.topSenders[0].pct + '%');
      }
      console.log('');
    }
    if (metric === 'all' || metric === 'night-activity') {
      printMetric('Night msgs (18+)', data.nightMsgs.toLocaleString());
      printMetric('Night ratio', data.nightPct + '%');
      console.log('');
    }
    return;
  }

  if (command === 'chart') {
    const chart = arg || 'activity-by-hour';
    console.log('Chart: ' + chart + ' - ' + data.chatTitle);
    console.log('');

    if (chart === 'messages-over-time') {
      const sorted = Object.entries(data.perDay).sort((a, b) => a[0].localeCompare(b[0]));
      const maxVal = Math.max(...sorted.map(x => x[1]));
      sorted.forEach(([date, count]) => {
        if (count > 0) console.log('  ' + date + '  ' + String(count).padStart(5) + '  ' + bar(count, maxVal, 25));
      });
    }
    else if (chart === 'activity-by-hour') {
      const maxH = Math.max(...Object.values(data.hours));
      for (let h = 0; h < 24; h++) {
        const c = data.hours[h] || 0;
        console.log('  ' + String(h).padStart(2) + ':00  ' + String(c).padStart(6) + '  ' + bar(c, maxH, 25));
      }
    }
    else if (chart === 'activity-by-weekday') {
      const maxW = Math.max(...Object.values(data.weekdays));
      Object.entries(data.weekdays).forEach(([day, count]) => {
        console.log('  ' + String(day).padEnd(4) + '  ' + String(count).padStart(6) + '  ' + bar(count, maxW, 25));
      });
    }
    else if (chart === 'monthly-activity') {
      const sorted = Object.entries(data.perMonth).sort((a, b) => a[0].localeCompare(b[0]));
      const maxM = Math.max(...sorted.map(x => x[1]));
      sorted.forEach(([month, count]) => {
        console.log('  ' + month + '  ' + String(count).padStart(6) + '  ' + bar(count, maxM, 25));
      });
    }
    else if (chart === 'top-senders') {
      const maxS = data.topSenders[0] ? data.topSenders[0].count : 1;
      data.topSenders.forEach(s => {
        console.log('  ' + String(s.name).padEnd(16) + ' ' + String(s.count).padStart(6) + '  ' + s.pct + '%  ' + bar(s.count, maxS, 25));
      });
    }
    else if (chart === 'message-length') {
      const maxL = Math.max(...Object.values(data.lenDist));
      Object.entries(data.lenDist).forEach(([range, count]) => {
        console.log('  ' + String(range).padEnd(8) + '  ' + String(count).padStart(6) + '  ' + bar(count, maxL, 25));
      });
    }
    else if (chart === 'media-breakdown') {
      const vals = Object.entries(data.mediaTypes);
      const maxV = Math.max(...vals.map(x => x[1]));
      vals.forEach(([type, count]) => {
        console.log('  ' + String(type).padEnd(10) + '  ' + String(count).padStart(5) + '  ' + bar(count, maxV, 25));
      });
    }
    else if (chart === 'top-emojis') {
      const maxE = data.topEmojis.length ? data.topEmojis[0].count : 1;
      data.topEmojis.forEach(e => {
        console.log('  ' + String(e.emoji).padEnd(4) + '  ' + String(e.count).padStart(5) + '  ' + bar(e.count, maxE, 25));
      });
    }
    else if (chart === 'most-replied-to') {
      const maxR = data.topRepliedTo.length ? data.topRepliedTo[0].count : 1;
      data.topRepliedTo.forEach(r => {
        console.log('  ' + String(r.name).padEnd(16) + '  ' + String(r.count).padStart(5) + '  ' + bar(r.count, maxR, 25));
      });
    }
    else if (chart === 'heatmap-hours') {
      const maxSend = Math.max(...data.topSenders.slice(0, 8).map(s => s.count));
      console.log('Activity by hour (relative intensity):');
      for (let h = 0; h < 24; h++) {
        const intensity = (data.hours[h] || 0) / (Math.max(...Object.values(data.hours)) || 1);
        const dots = intensity > 0.7 ? '\u2588\u2588' : intensity > 0.4 ? '\u2593\u2593' : intensity > 0.15 ? '\u2592\u2592' : '\u2591\u2591';
        console.log('  ' + String(h).padStart(2) + ':00  ' + dots);
      }
    }
    else {
      console.log('Unknown chart: ' + chart);
      console.log('Run "ameni tg list" for available charts.');
    }
    return;
  }

  if (command === 'stats') {
    console.log('Chat:          ' + data.chatTitle);
    console.log('Type:          ' + data.chatType);
    console.log('Period:        ' + data.minDate + ' - ' + data.maxDate);
    console.log('Participants:  ' + data.participants);
    console.log('Messages:      ' + data.total.toLocaleString());
    console.log('Total chars:   ' + data.totalChars.toLocaleString());
    console.log('Total words:   ' + data.totalWords.toLocaleString());
    console.log('Unique words:  ' + data.uniqueWords.toLocaleString());
    console.log('Avg length:    ' + data.avgLen + ' chars');
    console.log('Longest msg:   ' + data.longestMsg + ' chars');
    console.log('Avg per day:   ' + data.avgPerDay);
    console.log('Peak day:      ' + data.peakDay.date + ' (' + data.peakDay.count + ')');
    console.log('Text msgs:     ' + data.textMsgs.toLocaleString());
    console.log('Media msgs:    ' + data.mediaMsgs.toLocaleString() + ' (' + data.mediaRatio + '%)');
    console.log('Forwards:      ' + data.totalForwards.toLocaleString() + ' (' + data.forwardPct + '%)');
    console.log('Replies:       ' + data.totalReplies.toLocaleString() + ' (' + data.replyPct + '%)');
    console.log('Edits:         ' + data.totalEdits.toLocaleString());
    console.log('Night msgs:    ' + data.nightMsgs.toLocaleString() + ' (' + data.nightPct + '%)');
    const hrs = Math.floor(data.avgResponseTime / 3600);
    const mins = Math.floor((data.avgResponseTime % 3600) / 60);
    const secs = data.avgResponseTime % 60;
    console.log('Avg response:  ' + (hrs > 0 ? hrs+'h '+mins+'m '+secs+'s' : mins > 0 ? mins+'m '+secs+'s' : secs+'s'));
    console.log('Total emojis:  ' + data.totalEmojis.toLocaleString());
    console.log('');
    console.log('Top senders:');
    data.topSenders.forEach(s => {
      console.log('  ' + String(s.name).padEnd(14) + ' ' + String(s.count).padStart(6) + ' msgs  (' + s.pct + '%)');
    });
    if (Object.keys(data.mediaTypes).length) {
      console.log('');
      console.log('Media:');
      Object.entries(data.mediaTypes).forEach(([type, count]) => {
        console.log('  ' + String(type).padEnd(10) + ' ' + String(count).padStart(5) + '  (' + (count / data.total * 100).toFixed(1) + '%)');
      });
    }
    return;
  }

  if (command === 'top') {
    console.log('Top senders for ' + data.chatTitle + ':');
    console.log('');
    const maxC = data.topSenders[0] ? data.topSenders[0].count : 1;
    data.topSenders.forEach(s => {
      console.log('  ' + String(s.name).padEnd(14) + ' ' + String(s.count).padStart(6) + '  ' + s.pct + '%  ' + bar(s.count, maxC, 20));
    });
    return;
  }

  if (command === 'activity') {
    console.log('Activity for ' + data.chatTitle + ':');
    console.log('');
    console.log('Messages by hour:');
    const maxH = Math.max(...Object.values(data.hours));
    for (let h = 0; h < 24; h++) {
      const count = data.hours[h] || 0;
      if (count > 0) console.log('  ' + String(h).padStart(2) + ':00  ' + String(count).padStart(5) + '  ' + bar(count, maxH, 20));
    }
    console.log('');
    console.log('Messages by weekday:');
    const maxW = Math.max(...Object.values(data.weekdays));
    Object.entries(data.weekdays).forEach(([day, count]) => {
      console.log('  ' + String(day).padEnd(4) + '  ' + String(count).padStart(5) + '  ' + bar(count, maxW, 20));
    });
    return;
  }

  if (command === 'media') {
    if (Object.keys(data.mediaTypes).length === 0) {
      console.log('No media messages found in ' + data.chatTitle);
    } else {
      console.log('Media distribution for ' + data.chatTitle + ':');
      console.log('');
      const maxM = Math.max(...Object.values(data.mediaTypes));
      Object.entries(data.mediaTypes).forEach(([type, count]) => {
        console.log('  ' + String(type).padEnd(10) + '  ' + String(count).padStart(5) + '  ' + (count / data.total * 100).toFixed(1) + '%  ' + bar(count, maxM, 20));
      });
    }
    return;
  }

  if (command === 'json') {
    console.log(JSON.stringify(data, null, 2));
    return;
  }

  console.log('Unknown command: ' + command);
  console.log('Run "ameni tg list" for available commands.');
}

module.exports = { loadMessages, analyze };
