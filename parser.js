(function () {
const fileInput = document.getElementById('fileInput');
const fileNameSpan = document.getElementById('fileName');
const loadingEl = document.getElementById('loading');
const resultsEl = document.getElementById('results');
const errorEl = document.getElementById('error');
const statsGrid = document.querySelector('.stats-grid');
const chartsContainer = document.querySelector('.charts-container');

fileInput.addEventListener('change', e => {
const file = e.target.files[0];
if (!file) return;
fileNameSpan.textContent = file.name;
fileNameSpan.classList.remove('hidden');
resultsEl.classList.add('hidden');
errorEl.classList.add('hidden');
statsGrid.innerHTML = '';
chartsContainer.innerHTML = '';
loadingEl.classList.remove('hidden');
const reader = new FileReader();
reader.onload = event => {
try {
const data = JSON.parse(event.target.result);
const analysis = analyzeChat(data);
renderResults(analysis);
} catch (err) {
showError('Invalid JSON file: ' + err.message);
} finally {
loadingEl.classList.add('hidden');
}
};
reader.onerror = () => {
showError('Error reading file');
loadingEl.classList.add('hidden');
};
reader.readAsText(file);
});

function showError(message) {
errorEl.textContent = message;
errorEl.classList.remove('hidden');
}

function analyzeChat(data) {
let messages = [];
let chatTitle = 'Unknown Chat';
let chatType = 'unknown';
if (data.chats && Array.isArray(data.chats.list)) {
const chat = data.chats.list[0];
chatTitle = chat.title || 'Unknown Chat';
chatType = chat.type || 'unknown';
messages = chat.messages || [];
} else if (Array.isArray(data.messages)) {
messages = data.messages;
chatTitle = data.name || 'Unknown Chat';
chatType = data.type || 'unknown';
} else if (data.chat && Array.isArray(data.chat.messages)) {
messages = data.chat.messages;
chatTitle = data.chat.title || 'Unknown Chat';
chatType = data.chat.type || 'unknown';
} else {
const findMessages = obj => {
if (Array.isArray(obj)) {
if (obj.length > 0 && typeof obj[0] === 'object') {
const first = obj[0];
if (first.text || first.message || first.content) return obj;
}
} else if (obj && typeof obj === 'object') {
for (const key in obj) {
const found = findMessages(obj[key]);
if (found) return found;
}
}
return null;
};
const found = findMessages(data);
if (found) {
messages = found;
chatTitle = 'Detected Chat';
chatType = 'unknown';
}
}
messages = messages.filter(m => m.type !== 'service' && (m.text || m.message || m.content) && !(m.actor && m.actor === 'chat_create'));
const unifiedMessages = messages.map(msg => {
const timestamp = msg.date || msg.timestamp || msg.time;
const date = timestamp ? new Date(timestamp * 1000) : new Date();
const text = msg.text || msg.message || msg.content || '';
const sender = msg.from || msg.sender || msg.author || 'Unknown';
const replyToMsgId = msg.reply_to_message_id || msg.reply_to_msg_id || null;
const reactions = msg.reactions || [];
return {
id: msg.id || msg.message_id || 0,
timestamp: date,
date: date.toISOString().split('T')[0],
time: date.toTimeString().split(' ')[0],
hour: date.getHours(),
dayOfWeek: date.getDay(),
sender: typeof sender === 'string' ? sender : sender.first_name || sender.username || 'Unknown',
text: typeof text === 'string' ? text : (Array.isArray(text) ? text.map(t => typeof t === 'string' ? t : t.text || '').join('') : ''),
textLength: typeof text === 'string' ? text.length : 0,
replyToMsgId,
reactions: Array.isArray(reactions) ? reactions : [],
hasMedia: !!msg.photo || !!msg.video || !!msg.sticker || !!msg.animation || !!msg.document || !!msg.voice || !!msg.audio,
mediaType: msg.photo ? 'photo' : msg.video ? 'video' : msg.sticker ? 'sticker' : msg.animation ? 'gif' : msg.document ? 'document' : msg.voice || msg.audio ? 'voice' : null
};
});
const stats = {
totalMessages: unifiedMessages.length,
dateRange: getDateRange(unifiedMessages),
participants: getParticipants(unifiedMessages),
messagesPerDay: getMessagesPerDay(unifiedMessages),
messagesPerHour: getMessagesPerHour(unifiedMessages),
messagesPerDayOfWeek: getMessagesPerDayOfWeek(unifiedMessages),
avgMessageLength: getAvgMessageLength(unifiedMessages),
topSenders: getTopSenders(unifiedMessages, 10),
responseTimes: getResponseTimes(unifiedMessages),
mediaStats: getMediaStats(unifiedMessages),
chatType,
chatTitle
};
return { stats, unifiedMessages };
}
function getDateRange(messages) {
if (messages.length === 0) return { start: null, end: null };
const sorted = [...messages].sort((a, b) => a.timestamp - b.timestamp);
return { start: sorted[0].timestamp, end: sorted[sorted.length - 1].timestamp };
}
function getParticipants(messages) {
const set = new Set();
messages.forEach(m => set.add(m.sender));
return Array.from(set);
}
function getMessagesPerDay(messages) {
const map = {};
messages.forEach(m => {
const day = m.date;
map[day] = (map[day] || 0) + 1;
});
return map;
}
function getMessagesPerHour(messages) {
const map = {};
for (let i = 0; i < 24; i++) map[i] = 0;
messages.forEach(m => {
map[m.hour] = (map[m.hour] || 0) + 1;
});
return map;
}
function getMessagesPerDayOfWeek(messages) {
const map = {};
for (let i = 0; i < 7; i++) map[i] = 0;
messages.forEach(m => {
map[m.dayOfWeek] = (map[m.dayOfWeek] || 0) + 1;
});
return map;
}
function getAvgMessageLength(messages) {
if (messages.length === 0) return 0;
const total = messages.reduce((sum, m) => sum + m.textLength, 0);
return total / messages.length;
}
function getTopSenders(messages, limit = 10) {
const counts = {};
messages.forEach(m => {
counts[m.sender] = (counts[m.sender] || 0) + 1;
});
return Object.entries(counts)
.sort((a, b) => b[1] - a[1])
.slice(0, limit)
.map(([sender, count]) => ({ sender, count }));
}
function getResponseTimes(messages) {
const times = [];
for (let i = 1; i < messages.length; i++) {
if (messages[i].sender !== messages[i - 1].sender) {
const diff = messages[i].timestamp - messages[i - 1].timestamp;
if (diff > 0 && diff < 86400000) times.push(diff / 1000);
}
}
return times;
}
function getMediaStats(messages) {
const counts = { photo: 0, video: 0, sticker: 0, gif: 0, document: 0, voice: 0 };
messages.forEach(m => {
if (m.mediaType && counts[m.mediaType] !== undefined) counts[m.mediaType]++;
});
return counts;
}
function renderResults({ stats, unifiedMessages }) {
loadingEl.classList.add('hidden');
resultsEl.classList.remove('hidden');
statsGrid.innerHTML = `
<div class="stat-card">
<h3>Total Messages</h3>
<div class="stat-value">${stats.totalMessages.toLocaleString()}</div>
<div class="stat-label">in the chat</div>
</div>
<div class="stat-card">
<h3>Participants</h3>
<div class="stat-value">${stats.participants.length}</div>
<div class="stat-label">unique senders</div>
</div>
<div class="stat-card">
<h3>Date Range</h3>
<div class="stat-value">${stats.dateRange.start ? stats.dateRange.start.toLocaleDateString() : 'N/A'} – ${stats.dateRange.end ? stats.dateRange.end.toLocaleDateString() : 'N/A'}</div>
<div class="stat-label">chat history</div>
</div>
<div class="stat-card">
<h3>Avg. Message Length</h3>
<div class="stat-value">${Math.round(stats.avgMessageLength)}</div>
<div class="stat-label">characters per message</div>
</div>
<div class="stat-card">
<h3>Most Active Sender</h3>
<div class="stat-value">${stats.topSenders[0] ? stats.topSenders[0].sender : 'N/A'}</div>
<div class="stat-label">${stats.topSenders[0] ? stats.topSenders[0].count.toLocaleString() + ' messages' : 'N/A'}</div>
</div>
<div class="stat-card">
<h3>Media Messages</h3>
<div class="stat-value">${Object.values(stats.mediaStats).reduce((a, b) => a + b, 0)}</div>
<div class="stat-label">photos, videos, stickers, etc.</div>
</div>
`;
chartsContainer.innerHTML = '';
createCharts(stats, unifiedMessages);
}
function createCharts(stats, messages) {
// Chart 1: Messages per day
const dayChartCtx = document.createElement('canvas');
dayChartCtx.className = 'chart-canvas';
chartsContainer.appendChild(createChartContainer('Messages per Day', dayChartCtx));
const dayData = stats.messagesPerDay;
const dayLabels = Object.keys(dayData).sort();
const dayValues = dayLabels.map(label => dayData[label]);
new Chart(dayChartCtx, {
type: 'line',
data: {
labels: dayLabels,
datasets: [{
label: 'Messages',
data: dayValues,
borderColor: '#3498db',
backgroundColor: 'rgba(52,152,219,0.1)',
tension: 0.1
}]
},
options: {
responsive: true,
maintainAspectRatio: false,
plugins: { legend: { display: false }, tooltip: { mode: 'index', intersect: false } },
scales: { y: { beginAtZero: true, ticks: { precision: 0 } } }
}
});
// Chart 2: Messages per hour
const hourChartCtx = document.createElement('canvas');
hourChartCtx.className = 'chart-canvas';
chartsContainer.appendChild(createChartContainer('Messages by Hour of Day', hourChartCtx));
const hourLabels = Array.from({ length: 24 }, (_, i) => `${i}:00`);
const hourValues = Array.from({ length: 24 }, (_, i) => stats.messagesPerHour[i] || 0);
new Chart(hourChartCtx, {
type: 'bar',
data: {
labels: hourLabels,
datasets: [{
label: 'Messages',
data: hourValues,
backgroundColor: '#2ecc71'
}]
},
options: {
responsive: true,
maintainAspectRatio: false,
plugins: { legend: { display: false }, tooltip: { mode: 'index', intersect: false } },
scales: { y: { beginAtZero: true, ticks: { precision: 0 } } }
}
});
// Chart 3: Messages by day of week
const dowChartCtx = document.createElement('canvas');
dowChartCtx.className = 'chart-canvas';
chartsContainer.appendChild(createChartContainer('Messages by Day of Week', dowChartCtx));
const dowLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const dowValues = Array.from({ length: 7 }, (_, i) => stats.messagesPerDayOfWeek[i] || 0);
new Chart(dowChartCtx, {
type: 'bar',
data: {
labels: dowLabels,
datasets: [{
label: 'Messages',
data: dowValues,
backgroundColor: '#9b59b6'
}]
},
options: {
responsive: true,
maintainAspectRatio: false,
plugins: { legend: { display: false }, tooltip: { mode: 'index', intersect: false } },
scales: { y: { beginAtZero: true, ticks: { precision: 0 } } }
}
});
// Chart 4: Top senders
const senderChartCtx = document.createElement('canvas');
senderChartCtx.className = 'chart-canvas';
chartsContainer.appendChild(createChartContainer('Top Senders', senderChartCtx));
const topSenders = stats.topSenders.slice(0, 8);
const senderLabels = topSenders.map(s => s.sender);
const senderValues = topSenders.map(s => s.count);
new Chart(senderChartCtx, {
type: 'bar',
data: {
labels: senderLabels,
datasets: [{
label: 'Message Count',
data: senderValues,
backgroundColor: '#e74c3c'
}]
},
options: {
responsive: true,
maintainAspectRatio: false,
indexAxis: 'y',
plugins: { legend: { display: false }, tooltip: { mode: 'index', intersect: false } },
scales: { x: { beginAtZero: true, ticks: { precision: 0 } } }
}
});
// Chart 5: Media type distribution
const mediaChartCtx = document.createElement('canvas');
mediaChartCtx.className = 'chart-canvas';
chartsContainer.appendChild(createChartContainer('Media Type Distribution', mediaChartCtx));
const mediaLabels = Object.keys(stats.mediaStats).filter(k => stats.mediaStats[k] > 0);
const mediaData = mediaLabels.map(k => stats.mediaStats[k]);
new Chart(mediaChartCtx, {
type: 'pie',
data: {
labels: mediaLabels,
datasets: [{
label: 'Media Count',
data: mediaData,
backgroundColor: [
'#ff9ff3', '#feca57', '#48cae4', '#00b4d8',
'#0077b6', '#8338ec', '#3a86ff'
].slice(0, mediaLabels.length)
}]
},
options: {
responsive: true,
maintainAspectRatio: false,
plugins: {
legend: { position: 'bottom' },
tooltip: { callbacks: {
label: ctx => {
const label = ctx.label || '';
const value = ctx.parsed || 0;
const sum = ctx.dataset.data.reduce((a, b) => a + b, 0);
const percentage = ((value / sum) * 100).toFixed(1) + '%';
return `${label}: ${value} (${percentage})`;
}
}}
}
}});
// Chart 6: Response time distribution
const respChartCtx = document.createElement('canvas');
respChartCtx.className = 'chart-canvas';
chartsContainer.appendChild(createChartContainer('Response Time Distribution', respChartCtx));
const responseTimes = stats.responseTimes;
if (responseTimes.length > 0) {
const bins = [0, 0, 0, 0, 0];
const binLabels = ['<1m', '1-5m', '5-10m', '10-30m', '>30m'];
responseTimes.forEach(sec => {
if (sec < 60) bins[0]++;
else if (sec < 300) bins[1]++;
else if (sec < 600) bins[2]++;
else if (sec < 1800) bins[3]++;
else bins[4]++;
});
new Chart(respChartCtx, {
type: 'bar',
data: {
labels: binLabels,
datasets: [{
label: 'Response Count',
data: bins,
backgroundColor: '#f39c12'
}]
},
options: {
responsive: true,
maintainAspectRatio: false,
plugins: { legend: { display: false }, tooltip: { mode: 'index', intersect: false } },
scales: { y: { beginAtZero: true, ticks: { precision: 0 } } }
}
});
} else {
respChartCtx.parentNode.innerHTML = '<p style="text-align:center; color:#7f8c8d;">No response time data available</p>';
}
}
function createChartContainer(title, canvas) {
const container = document.createElement('div');
container.className = 'chart-container';
container.innerHTML = `<h3>${title}</h3>`;
container.appendChild(canvas);
return container;
}
})();
