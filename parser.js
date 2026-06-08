(function() {

const CONFIG = {
  EMOJI_PATTERN: /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{200D}\u{20E3}\u{231A}-\u{231B}\u{23E9}-\u{23F3}\u{23F8}-\u{23FA}\u{25AA}-\u{25AB}\u{25B6}\u{25C0}\u{25FB}-\u{25FE}\u{2934}\u{2935}\u{2B05}-\u{2B07}\u{2B1B}-\u{2B1C}\u{3030}\u{303D}\u{3297}\u{3299}]/gu,
  URL_PATTERN: /https?:\/\/[^\s<>"']+/gi,
  WORD_PATTERN: /\b[a-zA-Zа-яА-Я]{2,}\b/g,
  STOP_WORDS: new Set(['the','a','an','and','or','but','in','on','at','to','for','of','with','by','from','is','are','was','were','be','been','being','have','has','had','do','does','did','will','would','can','could','shall','should','may','might','i','you','he','she','it','we','they','my','your','his','her','its','our','their','me','him','us','them','this','that','these','those','not','no','nor','so','if','as','up','down','out','off','over','under','again','further','then','once','here','there','all','each','every','both','few','more','most','other','some','such','only','own','same','too','very','just','because','about','than','into','also','what','which','who','whom','when','where','why','how']),
  URL_PATTERN_STRICT: /https?:\/\/[^\s<>"']+|www\.[^\s<>"']+/gi
};

const DOM = {};
function cacheDOM() {
  DOM.fileInput = document.getElementById('fileInput');
  DOM.uploadZone = document.getElementById('uploadZone');
  DOM.fileName = document.getElementById('fileName');
  DOM.fileNameText = document.getElementById('fileNameText');
  DOM.loading = document.getElementById('loading');
  DOM.loaderDetail = document.getElementById('loaderDetail');
  DOM.results = document.getElementById('results');
  DOM.error = document.getElementById('error');
  DOM.chatTitle = document.getElementById('chatTitle');
  DOM.chatType = document.getElementById('chatType');
  DOM.msgCount = document.getElementById('msgCount');
  DOM.statsGrid = document.getElementById('statsGrid');
  DOM.chartsContainer = document.getElementById('chartsContainer');
  DOM.rawStats = document.getElementById('rawStats');
  DOM.tabs = document.querySelectorAll('.tab');
}

function showError(msg) {
  DOM.error.textContent = msg;
  DOM.error.classList.remove('hidden');
}

function formatNumber(n) {
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
  return n.toLocaleString();
}

function formatTime(seconds) {
  if (seconds < 60) return Math.round(seconds) + 's';
  if (seconds < 3600) return Math.round(seconds / 60) + 'm';
  if (seconds < 86400) return Math.round(seconds / 3600) + 'h';
  return Math.round(seconds / 86400) + 'd';
}

function normalizeMessages(data) {
  let messages = [], chatTitle = 'Unknown Chat', chatType = 'personal';
  if (data.chats && Array.isArray(data.chats.list)) {
    const c = data.chats.list[0];
    chatTitle = c.label || c.title || 'Unknown Chat';
    chatType = c.type === 'public_supergroup' || c.type === 'private_supergroup' ? 'group' : c.type || 'personal';
    messages = c.messages || [];
  } else if (Array.isArray(data.messages)) {
    messages = data.messages;
    chatTitle = data.name || data.title || 'Unknown Chat';
    chatType = data.type === 'public_supergroup' || data.type === 'private_supergroup' || data.type === 'group' || data.type === 'supergroup' ? 'group' : data.type || 'personal';
  } else if (data.chat && Array.isArray(data.chat.messages)) {
    messages = data.chat.messages;
    chatTitle = data.chat.label || data.chat.title || 'Unknown Chat';
    chatType = data.chat.type || 'personal';
  } else {
    const find = (obj) => {
      if (Array.isArray(obj) && obj.length > 0 && typeof obj[0] === 'object') {
        if (obj[0].text || obj[0].message || obj[0].content) return obj;
      }
      if (obj && typeof obj === 'object') for (const k in obj) { const f = find(obj[k]); if (f) return f; }
      return null;
    };
    const f = find(data);
    if (f) { messages = f; chatTitle = 'Detected Chat'; }
  }
  messages = messages.filter(m => m.type !== 'service' && (m.text !== undefined || m.message !== undefined || m.content !== undefined || m.photo || m.video || m.sticker || m.animation));
  return { messages, chatTitle, chatType };
}

function unify(messages) {
  return messages.map(m => {
    const ts = m.date || m.timestamp || m.time;
    const d = ts ? (typeof ts === 'number' ? new Date(ts * 1000) : new Date(ts)) : new Date();
    const rawText = m.text || m.message || m.content || '';
    const text = typeof rawText === 'string' ? rawText :
      Array.isArray(rawText) ? rawText.map(t => typeof t === 'string' ? t : t.text || '').join('') : '';
    const sender = typeof m.from === 'string' ? m.from : m.from && m.from.first_name ? m.from.first_name + (m.from.last_name ? ' ' + m.from.last_name : '') :
      m.from && m.from.username ? '@' + m.from.username : m.from || m.sender || m.author || 'Unknown';
    return {
      id: m.id || 0, timestamp: d,
      dateStr: d.toISOString().split('T')[0],
      timeStr: d.toTimeString().split(' ')[0],
      hour: d.getHours(), minute: d.getMinutes(),
      day: d.getDate(), month: d.getMonth() + 1, year: d.getFullYear(),
      monthStr: d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0'),
      dayOfWeek: d.getDay(), weekday: d.toLocaleDateString('en', { weekday: 'short' }),
      sender, text, textLength: text.length,
      words: text.match(/\b\w+\b/g) || [],
      wordCount: (text.match(/\b\w+\b/g) || []).length,
      emojis: text.match(CONFIG.EMOJI_PATTERN) || [],
      links: text.match(CONFIG.URL_PATTERN) || [],
      hasLink: (text.match(CONFIG.URL_PATTERN) || []).length > 0,
      isForwarded: !!m.forwarded_from || m.forwarded === true,
      isEdited: !!m.edited,
      hasMedia: !!(m.photo || m.video || m.sticker || m.animation || m.document || m.voice || m.audio),
      mediaType: m.photo ? 'photo' : m.video ? 'video' : m.sticker ? 'sticker' : m.animation ? 'gif' : m.document ? 'document' : m.voice || m.audio ? 'voice' : null,
      replyTo: m.reply_to_message_id || m.reply_to_msg_id || null,
      reactions: Array.isArray(m.reactions) ? m.reactions : [],
    };
  });
}

function analyze(messages, chatTitle, chatType) {
  const total = messages.length;
  if (total === 0) return null;
  const setSenders = new Set(); messages.forEach(m => setSenders.add(m.sender));
  const participants = Array.from(setSenders).sort();
  const totalWords = messages.reduce((s, m) => s + m.wordCount, 0);
  const totalChars = messages.reduce((s, m) => s + m.textLength, 0);
  const totalEmojis = messages.reduce((s, m) => s + m.emojis.length, 0);
  const allEmojis = []; messages.forEach(m => allEmojis.push(...m.emojis));
  const totalLinks = messages.reduce((s, m) => s + m.links.length, 0);
  const totalForwards = messages.filter(m => m.isForwarded).length;
  const totalEdits = messages.filter(m => m.isEdited).length;
  const mediaMsgs = messages.filter(m => m.hasMedia);
  const textMsgs = messages.filter(m => m.textLength > 0 && !m.hasMedia);
  const mediaTypes = messages.reduce((a, m) => { if (m.mediaType) a[m.mediaType] = (a[m.mediaType] || 0) + 1; return a; }, { photo: 0, video: 0, sticker: 0, gif: 0, document: 0, voice: 0 });
  const uniqueWords = new Set(); messages.forEach(m => m.words.forEach(w => uniqueWords.add(w.toLowerCase())));
  const bySender = {};
  messages.forEach(m => {
    if (!bySender[m.sender]) bySender[m.sender] = { sender: m.sender, count: 0, chars: 0, words: 0, emojis: 0, media: 0, links: 0 };
    bySender[m.sender].count++;
    bySender[m.sender].chars += m.textLength;
    bySender[m.sender].words += m.wordCount;
    bySender[m.sender].emojis += m.emojis.length;
    if (m.hasMedia) bySender[m.sender].media++;
    if (m.hasLink) bySender[m.sender].links++;
  });
  const topSenders = Object.values(bySender).sort((a, b) => b.count - a.count);
  const getMax = (o) => { let mk = '', mv = 0; for (const k in o) if (o[k] > mv) { mv = o[k]; mk = k; } return { k: mk, v: mv }; };
  const perDay = {}; messages.forEach(m => { perDay[m.dateStr] = (perDay[m.dateStr] || 0) + 1; });
  const perHour = {}; for (let i = 0; i < 24; i++) perHour[i] = 0; messages.forEach(m => perHour[m.hour]++);
  const perWeekday = {}; for (let i = 0; i < 7; i++) perWeekday[i] = 0; messages.forEach(m => perWeekday[m.dayOfWeek]++);
  const perMonth = {}; messages.forEach(m => { perMonth[m.monthStr] = (perMonth[m.monthStr] || 0) + 1; });
  const sortedByTime = [...messages].sort((a, b) => a.timestamp - b.timestamp);
  const dateRange = { start: sortedByTime[0].timestamp, end: sortedByTime[sortedByTime.length - 1].timestamp };
  const daysSpan = Math.max(1, Math.round((dateRange.end - dateRange.start) / 86400000) + 1);
  const avgPerDay = (total / daysSpan).toFixed(1);
  const bestDay = getMax(perDay);
  const bestMonth = getMax(perMonth);
  const bestHour = (() => { let maxV = 0, maxK = 0; for (let i = 0; i < 24; i++) if (perHour[i] > maxV) { maxV = perHour[i]; maxK = i; } return { k: maxK, v: maxV }; })();
  const wordFreq = {};
  messages.forEach(m => {
    m.words.forEach(w => { const lw = w.toLowerCase(); if (!CONFIG.STOP_WORDS.has(lw) && lw.length > 1) wordFreq[lw] = (wordFreq[lw] || 0) + 1; });
  });
  const topWords = Object.entries(wordFreq).sort((a, b) => b[1] - a[1]).slice(0, 50).map(([w, c]) => ({ word: w, count: c }));
  const emojiFreq = {};
  allEmojis.forEach(e => { emojiFreq[e] = (emojiFreq[e] || 0) + 1; });
  const topEmojis = Object.entries(emojiFreq).sort((a, b) => b[1] - a[1]).slice(0, 20).map(([e, c]) => ({ emoji: e, count: c }));
  const msgLengths = messages.map(m => m.textLength).filter(l => l > 0).sort((a, b) => a - b);
  const avgLength = msgLengths.length > 0 ? msgLengths.reduce((s, v) => s + v, 0) / msgLengths.length : 0;
  const longest = msgLengths.length > 0 ? msgLengths[msgLengths.length - 1] : 0;
  const respTimes = [];
  for (let i = 1; i < sortedByTime.length; i++) {
    if (sortedByTime[i].sender !== sortedByTime[i - 1].sender) {
      const diff = sortedByTime[i].timestamp - sortedByTime[i - 1].timestamp;
      if (diff > 0 && diff < 86400000) respTimes.push(diff / 1000);
    }
  }
  const avgResp = respTimes.length > 0 ? respTimes.reduce((s, v) => s + v, 0) / respTimes.length : 0;
  let longestPause = 0, pauseStart = null, pauseEnd = null;
  for (let i = 1; i < sortedByTime.length; i++) {
    const diff = sortedByTime[i].timestamp - sortedByTime[i - 1].timestamp;
    if (diff > longestPause) { longestPause = diff; pauseStart = sortedByTime[i - 1].timestamp; pauseEnd = sortedByTime[i].timestamp; }
  }
  const dayMsgs = messages.filter(m => m.hour >= 6 && m.hour < 18).length;
  const nightMsgs = messages.filter(m => m.hour < 6 || m.hour >= 18).length;
  const weekendMsgs = messages.filter(m => m.dayOfWeek === 0 || m.dayOfWeek === 6).length;
  const weekdayMsgs = messages.filter(m => m.dayOfWeek >= 1 && m.dayOfWeek <= 5).length;
  const replies = messages.filter(m => m.replyTo !== null).length;
  const replyToCount = {};
  messages.forEach(m => { if (m.replyTo !== null) repTo[m.sender] = (repTo[m.sender] || 0) + 1; });
  const replyTo = messages.filter(m => m.replyTo !== null);
  const replyTargets = {};
  messages.forEach(m => {
    if (m.replyTo !== null) {
      const target = sortedByTime.find(t => t.id === m.replyTo);
      if (target) replyTargets[target.sender] = (replyTargets[target.sender] || 0) + 1;
    }
  });
  const topRepliedTo = Object.entries(replyTargets).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([s, c]) => ({ sender: s, count: c }));
  const allReactions = [];
  messages.forEach(m => {
    m.reactions.forEach(r => { const em = r.emoji || r.reaction || ''; if (em) allReactions.push(em); });
  });
  const reactionFreq = {};
  allReactions.forEach(r => { reactionFreq[r] = (reactionFreq[r] || 0) + 1; });
  const topReactions = Object.entries(reactionFreq).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([r, c]) => ({ emoji: r, count: c }));
  const countedReactions = allReactions.length;
  const messagesWithReactions = messages.filter(m => m.reactions.length > 0).length;
  const mediaCount = total - textMsgs.length;
  const mediaPct = total > 0 ? (mediaCount / total * 100).toFixed(1) : 0;
  const textPct = total > 0 ? (textMsgs.length / total * 100).toFixed(1) : 0;
  const nightPct = total > 0 ? (nightMsgs / total * 100).toFixed(1) : 0;
  const dayPct = total > 0 ? (dayMsgs / total * 100).toFixed(1) : 0;
  const weekendPct = total > 0 ? (weekendMsgs / total * 100).toFixed(1) : 0;
  const replyPct = total > 0 ? (replies / total * 100).toFixed(1) : 0;
  const forwardPct = total > 0 ? (totalForwards / total * 100).toFixed(1) : 0;
  const topPct = topSenders.length > 0 && total > 0 ? (topSenders[0].count / total * 100).toFixed(1) : 0;
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

  return {
    chatTitle, chatType, total, participants, participantsCount: participants.length,
    totalWords, totalChars, totalEmojis, allEmojis, totalLinks, totalForwards, totalEdits,
    mediaTypes, uniqueWordsCount: uniqueWords.size,
    dateRange, daysSpan, avgPerDay: parseFloat(avgPerDay), bestDay, bestMonth, bestHour,
    perDay, perHour, perWeekday, perMonth, topSenders, topSender: topSenders[0],
    topPct: parseFloat(topPct),
    avgLength: Math.round(avgLength * 10) / 10, longest,
    topWords, topEmojis, msgLengths, lenDist,
    avgResp: Math.round(avgResp), respTimes,
    longestPause: { seconds: longestPause / 1000, start: pauseStart, end: pauseEnd },
    dayMsgs, nightMsgs, dayPct: parseFloat(dayPct), nightPct: parseFloat(nightPct),
    weekendMsgs, weekdayMsgs, weekendPct: parseFloat(weekendPct), weekdayPct: (100 - parseFloat(weekendPct)).toFixed(1),
    replies, replyPct: parseFloat(replyPct), replyTargets, topRepliedTo,
    forwardPct: parseFloat(forwardPct), mediaPct: parseFloat(mediaPct),
    countedReactions, messagesWithReactions, topReactions,
    sortedByTime, messages,
  };
}

function render(stats) {
  DOM.loading.classList.add('hidden');
  DOM.results.classList.remove('hidden');
  DOM.chatTitle.textContent = stats.chatTitle;
  DOM.chatType.textContent = stats.chatType === 'group' ? 'Group' : 'Personal';
  DOM.msgCount.textContent = formatNumber(stats.total) + ' msgs';
  renderStatsGrid(stats);
  renderCharts(stats);
  DOM.rawStats.textContent = JSON.stringify(stats, (k, v) => k === 'messages' || k === 'sortedByTime' || k === 'msgLengths' || k === 'respTimes' ? undefined : v, 2);
}

function renderStatsGrid(stats) {
  const cards = [
    { label: 'Total Messages', value: formatNumber(stats.total), sub: stats.daysSpan + ' days of chat', cls: '' },
    { label: 'Participants', value: stats.participantsCount, sub: stats.chatType === 'group' ? topSendersNote(stats) : '1-on-1 conversation', cls: 'accent-green' },
    { label: 'Messages per Day', value: stats.avgPerDay, sub: 'avg · peak: ' + formatNumber(stats.bestDay.v) + ' on ' + stats.bestDay.k, cls: 'accent-purple' },
    { label: 'Total Characters', value: formatNumber(stats.totalChars), sub: stats.totalWords + ' words · ' + stats.uniqueWordsCount + ' unique', cls: 'accent-orange' },
    { label: 'Avg. Message Length', value: Math.round(stats.avgLength), sub: 'Longest: ' + stats.longest + ' chars', cls: '' },
    { label: 'Media Messages', value: stats.mediaPct + '%', sub: Object.values(stats.mediaTypes).reduce((a, b) => a + b, 0) + ' files total', cls: 'accent-green' },
    { label: 'Avg. Response Time', value: formatTime(stats.avgResp), sub: 'between participants', cls: 'accent-purple' },
    { label: 'Emojis Used', value: formatNumber(stats.totalEmojis), sub: stats.topEmojis[0] ? 'Top: ' + stats.topEmojis[0].emoji + ' ×' + stats.topEmojis[0].count : 'none', cls: 'accent-orange' },
    { label: 'Replies', value: stats.replyPct + '%', sub: stats.replies + ' replied messages', cls: '' },
    { label: 'Forwarded', value: stats.forwardPct + '%', sub: formatNumber(stats.totalForwards) + ' forwarded', cls: 'accent-green' },
    { label: 'Active Sender', value: stats.topSender ? stats.topSender.sender.replace(/[^a-zA-Z0-9_ ]/g, '') : 'N/A', sub: stats.topPct + '% of all messages', cls: 'accent-purple' },
    { label: 'Night Activity', value: stats.nightPct + '%', sub: formatNumber(stats.nightMsgs) + ' messages after 18:00', cls: 'accent-orange' },
  ];
  DOM.statsGrid.innerHTML = cards.map(c =>
    `<div class="stat-card ${c.cls}"><div class="stat-label">${c.label}</div><div class="stat-value">${c.value}</div><div class="stat-sublabel">${c.sub}</div></div>`
  ).join('');
  function topSendersNote(s) {
    if (s.topSenders.length < 2) return '';
    const u1 = s.topSenders[0].sender, u2 = s.topSenders[1].sender;
    const p1 = (s.topSenders[0].count / s.total * 100).toFixed(0);
    const p2 = (s.topSenders[1].count / s.total * 100).toFixed(0);
    return u1 + ' ' + p1 + '% · ' + u2 + ' ' + p2 + '%';
  }
}

function renderCharts(stats) {
  const cc = DOM.chartsContainer;
  cc.innerHTML = '';
  addChart(cc, 'Messages Over Time', buildLine(stats.perDay, stats), 'line');
  addChart(cc, 'Activity by Hour', buildHour(stats.perHour), 'bar');
  addChart(cc, 'Activity by Day of Week', buildWeekday(stats.perWeekday), 'bar');
  addChart(cc, 'Monthly Activity', buildMonthly(stats.perMonth), 'bar');
  addChart(cc, 'Participants Activity', buildTopSenders(stats.topSenders, stats.total), 'bar');
  addChart(cc, 'Message Length Distribution', buildLenDist(stats.lenDist), 'bar');
  addChart(cc, 'Response Time Distribution', buildRespDist(stats.respTimes), 'bar');
  addChart(cc, 'Top Emojis', buildEmojiChart(stats.topEmojis), 'bar');
  addHeatmap(cc, 'Activity Heatmap', stats.sortedByTime);
  addWordCloud(cc, 'Top Words', stats.topWords);
  addChart(cc, 'Media Type Breakdown', buildMediaPie(stats.mediaTypes), 'doughnut');
  addChart(cc, 'Most Replied To', buildReplied(stats.topRepliedTo), 'bar');
  addChart(cc, 'Cumulative Messages', buildCumulative(stats.sortedByTime), 'line');
  addChart(cc, 'Messages per Sender', buildSenderPie(stats.topSenders), 'doughnut');
}

function addChart(cc, title, data, type) {
  if (!data) return;
  const panel = document.createElement('div');
  panel.className = 'chart-panel';
  panel.dataset.tab = determineTab(title);
  const h3 = document.createElement('h3');
  h3.textContent = title;
  panel.appendChild(h3);
  const canvas = document.createElement('canvas');
  canvas.className = 'chart-canvas';
  panel.appendChild(canvas);
  cc.appendChild(panel);
  new Chart(canvas, { type, data, options: chartOptions(type, data) });
}

function determineTab(title) {
  if (['Messages Over Time', 'Activity by Hour', 'Activity by Day of Week', 'Monthly Activity', 'Activity Heatmap'].includes(title)) return 'activity';
  if (['Participants Activity', 'Messages per Sender', 'Most Replied To', 'Cumulative Messages'].includes(title)) return 'users';
  if (['Message Length Distribution', 'Top Emojis', 'Top Words', 'Response Time Distribution'].includes(title)) return 'content';
  if (['Media Type Breakdown'].includes(title)) return 'media';
  return 'overview';
}

let chartInstances = [];

function chartOptions(type, data) {
  const base = {
    responsive: true, maintainAspectRatio: true,
    animation: { duration: 800, easing: 'easeOutQuart' },
    plugins: {
      legend: { labels: { color: '#94a3b8', font: { family: "'Inter', sans-serif", size: 11 }, boxWidth: 12, padding: 12 } }
    }
  };
  if (type === 'line' || type === 'bar') {
    base.scales = {
      x: { ticks: { color: '#64748b', maxTicksLimit: 20, font: { size: 10 } }, grid: { color: 'rgba(30,41,59,0.5)' } },
      y: { ticks: { color: '#64748b', font: { size: 10 }, precision: 0 }, grid: { color: 'rgba(30,41,59,0.5)' }, beginAtZero: true }
    };
  }
  if (type === 'doughnut') {
    base.plugins.legend.position = 'right';
  }
  if (data && data.datasets) {
    data.datasets.forEach((ds, i) => {
      if (!ds.borderColor && !ds.backgroundColor) {
        ds.backgroundColor = i === 0 ? '#06b6d4' : '#8b5cf6';
      }
    });
  }
  base.plugins.tooltip = {
    backgroundColor: '#1a2332',
    titleColor: '#f1f5f9',
    bodyColor: '#94a3b8',
    borderColor: '#1e293b',
    borderWidth: 1,
    padding: 10,
    cornerRadius: 8
  };
  return base;
}

function buildLine(perDay) {
  const labels = Object.keys(perDay).sort();
  return { labels, datasets: [{ label: 'Messages', data: labels.map(l => perDay[l]), borderColor: '#06b6d4', backgroundColor: 'rgba(6,182,212,0.1)', fill: true, tension: 0.3, pointRadius: 2, pointHoverRadius: 6 }] };
}

function buildHour(perHour) {
  const labels = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0') + ':00');
  const data = Array.from({ length: 24 }, (_, i) => perHour[i] || 0);
  const gradient = data.map(v => {
    const max = Math.max(...data, 1);
    const ratio = v / max;
    if (ratio > 0.7) return '#ef4444';
    if (ratio > 0.4) return '#f59e0b';
    if (ratio > 0.15) return '#06b6d4';
    return '#1e293b';
  });
  return { labels, datasets: [{ label: 'Messages', data, backgroundColor: gradient, borderRadius: 2 }] };
}

function buildWeekday(perWeekday) {
  const labels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const data = Array.from({ length: 7 }, (_, i) => perWeekday[i] || 0);
  return { labels, datasets: [{ label: 'Messages', data, backgroundColor: '#8b5cf6', borderRadius: 2 }] };
}

function buildMonthly(perMonth) {
  const labels = Object.keys(perMonth).sort();
  return { labels, datasets: [{ label: 'Messages', data: labels.map(l => perMonth[l]), backgroundColor: '#10b981', borderRadius: 2 }] };
}

function buildTopSenders(senders, total) {
  const top = senders.slice(0, 10);
  const colors = ['#06b6d4', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#3b82f6', '#14b8a6', '#a855f7', '#f97316'];
  return { labels: top.map(s => s.sender.replace(/[^a-zA-Z0-9_ ]/g, '')), datasets: [{ label: 'Messages', data: top.map(s => s.count), backgroundColor: top.map((_, i) => colors[i % colors.length]), borderRadius: 2 }] };
}

function buildLenDist(lenDist) {
  const labels = Object.keys(lenDist);
  return { labels, datasets: [{ label: 'Messages', data: labels.map(l => lenDist[l]), backgroundColor: '#06b6d4', borderRadius: 2 }] };
}

function buildRespDist(respTimes) {
  if (!respTimes || respTimes.length === 0) return null;
  const bins = [0, 0, 0, 0, 0, 0];
  const binLabels = ['<1m', '1-5m', '5-15m', '15-1h', '1-6h', '6h+'];
  respTimes.forEach(s => {
    if (s < 60) bins[0]++; else if (s < 300) bins[1]++; else if (s < 900) bins[2]++; else if (s < 3600) bins[3]++; else if (s < 21600) bins[4]++; else bins[5]++;
  });
  return { labels: binLabels, datasets: [{ label: 'Responses', data: bins, backgroundColor: '#f59e0b', borderRadius: 2 }] };
}

function buildEmojiChart(topEmojis) {
  const top = topEmojis.slice(0, 10);
  if (top.length === 0) return null;
  const colors = ['#06b6d4', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#3b82f6', '#14b8a6', '#a855f7', '#f97316'];
  return { labels: top.map(e => e.emoji), datasets: [{ label: 'Uses', data: top.map(e => e.count), backgroundColor: top.map((_, i) => colors[i % colors.length]), borderRadius: 2 }] };
}

function buildMediaPie(mediaTypes) {
  const labels = Object.keys(mediaTypes).filter(k => mediaTypes[k] > 0);
  if (labels.length === 0) return null;
  const colors = ['#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
  return { labels, datasets: [{ label: 'Media', data: labels.map(l => mediaTypes[l]), backgroundColor: colors.slice(0, labels.length), borderWidth: 0 }] };
}

function buildReplied(replied) {
  if (!replied || replied.length === 0) return null;
  const top = replied.slice(0, 10);
  return { labels: top.map(s => s.sender.replace(/[^a-zA-Z0-9_ ]/g, '')), datasets: [{ label: 'Replies received', data: top.map(s => s.count), backgroundColor: '#ec4899', borderRadius: 2 }] };
}

function buildCumulative(sorted) {
  if (!sorted || sorted.length === 0) return null;
  const days = {};
  sorted.forEach(m => { const d = m.dateStr; if (!days[d]) days[d] = 0; days[d]++; });
  const labels = Object.keys(days).sort();
  let cum = 0;
  const data = labels.map(l => { cum += days[l]; return cum; });
  return { labels, datasets: [{ label: 'Total Messages', data, borderColor: '#8b5cf6', backgroundColor: 'rgba(139,92,246,0.1)', fill: true, tension: 0.3, pointRadius: 0 }] };
}

function buildSenderPie(senders) {
  const top = senders.slice(0, 8);
  if (top.length < 2) return null;
  const colors = ['#06b6d4', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#3b82f6', '#14b8a6'];
  return { labels: top.map(s => s.sender.replace(/[^a-zA-Z0-9_ ]/g, '')), datasets: [{ label: 'Messages', data: top.map(s => s.count), backgroundColor: colors.slice(0, top.length), borderWidth: 0 }] };
}

function addHeatmap(cc, title, messages) {
  if (!messages || messages.length === 0) return;
  const panel = document.createElement('div');
  panel.className = 'chart-panel';
  panel.dataset.tab = 'activity';
  const h3 = document.createElement('h3');
  h3.textContent = title;
  panel.appendChild(h3);
  const heatmap = document.createElement('div');
  heatmap.className = 'heatmap-grid';
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const matrix = {};
  days.forEach((_, dy) => { hours.forEach(h => { if (!matrix[dy]) matrix[dy] = {}; matrix[dy][h] = 0; }); });
  messages.forEach(m => { if (matrix[m.dayOfWeek] !== undefined) matrix[m.dayOfWeek][m.hour]++; });
  const maxVal = Math.max(...Object.values(matrix).flatMap(d => Object.values(d)), 1);
  const allCells = [];
  allCells.push('<div class="heatmap-header"></div>' + hours.map(h => `<div class="heatmap-header">${h}</div>`).join(''));
  days.forEach((dy, dIndex) => {
    allCells.push(`<div class="heatmap-label">${dy}</div>`);
    hours.forEach(h => {
      const v = matrix[dIndex][h];
      const ratio = v / maxVal;
      let color;
      if (v === 0) color = '#0d1225';
      else if (ratio < 0.1) color = '#0c2d3b';
      else if (ratio < 0.25) color = '#0b5e7a';
      else if (ratio < 0.5) color = '#0a8eb8';
      else if (ratio < 0.75) color = '#06b6d4';
      else color = '#ff6b6b';
      allCells.push(`<div class="heatmap-cell" style="background:${color}" title="${days[dIndex]} ${h}:00 — ${v} msgs"></div>`);
    });
  });
  heatmap.innerHTML = allCells.join('');
  panel.appendChild(heatmap);
  cc.appendChild(panel);
}

function addWordCloud(cc, title, words) {
  if (!words || words.length === 0) return;
  const panel = document.createElement('div');
  panel.className = 'chart-panel';
  panel.dataset.tab = 'content';
  const h3 = document.createElement('h3');
  h3.textContent = title;
  panel.appendChild(h3);
  const cloud = document.createElement('div');
  cloud.className = 'wordcloud';
  const maxCount = words[0].count;
  words.slice(0, 40).forEach(w => {
    const ratio = w.count / maxCount;
    const size = 10 + ratio * 24;
    const opacity = 0.4 + ratio * 0.6;
    const span = document.createElement('span');
    span.style.cssText = `font-size:${size}px;opacity:${opacity}`;
    span.textContent = w.word;
    span.title = `${w.word}: ${w.count}`;
    cloud.appendChild(span);
  });
  panel.appendChild(cloud);
  cc.appendChild(panel);
}

function initTabs() {
  DOM.tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      DOM.tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const target = tab.dataset.tab;
      document.querySelectorAll('.chart-panel').forEach(p => {
        if (target === 'overview' || p.dataset.tab === target) p.style.display = 'block';
        else p.style.display = 'none';
      });
    });
  });
}

function init() {
  cacheDOM();
  initTabs();

  DOM.uploadZone.addEventListener('click', () => DOM.fileInput.click());
  DOM.uploadZone.addEventListener('dragover', (e) => { e.preventDefault(); DOM.uploadZone.classList.add('dragover'); });
  DOM.uploadZone.addEventListener('dragleave', () => DOM.uploadZone.classList.remove('dragover'));
  DOM.uploadZone.addEventListener('drop', (e) => {
    e.preventDefault();
    DOM.uploadZone.classList.remove('dragover');
    const file = e.dataTransfer.files[0];
    if (file && file.name.endsWith('.json')) processFile(file);
  });
  DOM.fileInput.addEventListener('change', (e) => {
    if (e.target.files[0]) processFile(e.target.files[0]);
  });
}

function processFile(file) {
  DOM.fileName.classList.remove('hidden');
  DOM.fileNameText.textContent = file.name + ' (' + formatNumber(file.size) + ' B)';
  DOM.results.classList.add('hidden');
  DOM.error.classList.add('hidden');
  DOM.loading.classList.remove('hidden');
  DOM.loaderDetail.textContent = 'Reading file...';
  const reader = new FileReader();
  reader.onprogress = (e) => {
    if (e.lengthComputable) DOM.loaderDetail.textContent = 'Loading... ' + Math.round(e.loaded / e.total * 100) + '%';
  };
  reader.onload = (e) => {
    try {
      DOM.loaderDetail.textContent = 'Parsing JSON...';
      const data = JSON.parse(e.target.result);
      DOM.loaderDetail.textContent = 'Normalizing messages...';
      const { messages: raw, chatTitle, chatType } = normalizeMessages(data);
      DOM.loaderDetail.textContent = 'Unifying ' + formatNumber(raw.length) + ' messages...';
      const unified = unify(raw);
      DOM.loaderDetail.textContent = 'Computing statistics...';
      const stats = analyze(unified, chatTitle, chatType);
      if (!stats) { showError('No messages found in the export.'); return; }
      DOM.loaderDetail.textContent = 'Rendering results...';
      setTimeout(() => render(stats), 50);
    } catch (err) {
      showError('Error: ' + err.message);
      DOM.loading.classList.add('hidden');
    }
  };
  reader.onerror = () => { showError('Error reading file'); DOM.loading.classList.add('hidden'); };
  reader.readAsText(file);
}

document.addEventListener('DOMContentLoaded', init);
})();
