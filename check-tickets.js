import fetch from 'node-fetch';
import fs from 'fs';
import 'dotenv/config'; // Optional for local .env use

//
// 🔧 CONFIGURATION
//
const INCLUDE_ENGLISH = true;
const INCLUDE_DUTCH = true;
const INCLUDE_INSIDE = true;
const INCLUDE_GARDEN = true;
const ONLY_AVAILABLE = false;
const LOOKAHEAD_DAYS = 14;

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

const CACHE_FILE = 'last-available-tickets.json';
const OUTPUT_FILE = 'ticket-report.txt';

const cliArgMode = process.argv.includes('--mode=all') ? 'all'
                  : process.argv.includes('--mode=new') ? 'new'
                  : 'none';

//
// 📅 Date range
//
function formatDate(date) {
  return date.toISOString().split('T')[0];
}
const today = new Date();
const future = new Date();
future.setDate(today.getDate() + LOOKAHEAD_DAYS);
const startDate = formatDate(today);
const endDate = formatDate(future);

const API_URL = `https://tt112apiweb.sites.ticketteam.cloud/DSServerDLL.dll/datasnap/rest/TMethods/GetListOfEventGroup//1/${startDate}/${endDate}/NL/W0001000`;

//
// 🧠 Filtering
//
function matchesLanguage(desc) {
  const lower = desc.toLowerCase();
  return (INCLUDE_ENGLISH && (lower.includes('english') || lower.includes('eng'))) ||
         (INCLUDE_DUTCH && (lower.includes('dutch') || lower.includes('nederlands') || lower.includes('ned')));
}
function matchesType(desc) {
  const lower = desc.toLowerCase();
  return (INCLUDE_INSIDE && (lower.includes('inside the palace') || lower.includes('in het paleis'))) ||
         (INCLUDE_GARDEN && (lower.includes('garden') || lower.includes('tuinrondleiding')));
}
function isRelevantTour(tour) {
  return matchesLanguage(tour.description) && matchesType(tour.description);
}

//
// 📬 Telegram sender (with optional silent mode)
//
async function sendTelegramMessage(text, silent = false) {
  const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;
  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: TELEGRAM_CHAT_ID,
      text: text.slice(0, 4000),
      parse_mode: 'Markdown',
      disable_notification: silent, // 🔕 true = silent, false = push
    }),
  });
}

//
// 📂 File Helpers
//
function loadLastTickets() {
  if (!fs.existsSync(CACHE_FILE)) return [];
  return JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8'));
}
function saveTickets(tickets) {
  fs.writeFileSync(CACHE_FILE, JSON.stringify(tickets, null, 2));
}
function writeReportToFile(lines) {
  fs.writeFileSync(OUTPUT_FILE, lines.join('\n') + '\n');
}
function diffTickets(oldList, newList) {
  const oldSet = new Set(oldList.map(t => t.id));
  return newList.filter(t => !oldSet.has(t.id));
}

//
// 🚀 MAIN
//
async function fetchTickets() {
  const res = await fetch(API_URL, { headers: { 'Accept': 'application/json' } });
  const json = await res.json();
  const rows = json.result?.[0]?.fields?.FEvents?.fields?.Rows || [];

  const all = rows.map(row => ({
    date: row[0],
    time: row[2],
    description: row[1].replace(/\\\//g, '/'),
    availableSeats: parseInt(row[3]),
    id: row[4],
  })).filter(isRelevantTour);

  const available = all.filter(t => t.availableSeats > 0);
  return { all, available };
}

const { all, available } = await fetchTickets();
const previous = loadLastTickets();
const newOnes = diffTickets(previous, available);
const relevant = ONLY_AVAILABLE ? available : all;

const reportLines = [];

if (newOnes.length > 0) {
  reportLines.push(`🎉 NEW TICKETS AVAILABLE:`);
  newOnes.forEach(t =>
    reportLines.push(`- ${t.date} at ${t.time}: ${t.description} (${t.availableSeats} seats)`)
  );
} else {
  reportLines.push('No new tickets since last check.');
}

reportLines.push(`\n📅 Filtered tours (${startDate} → ${endDate}):`);
if (relevant.length > 0) {
  relevant.forEach(t => {
    const status = t.availableSeats > 0 ? '🟢' : '🔴';
    reportLines.push(`${status} ${t.date} at ${t.time}: ${t.description} (${t.availableSeats} seats)`);
  });
} else {
  reportLines.push('(none)');
}

console.log(reportLines.join('\n'));
writeReportToFile(reportLines);
saveTickets(available);

//
// 📬 Telegram logic
//
if (cliArgMode === 'new' && newOnes.length > 0) {
  const message = `🚨 *New Peace Palace tickets available!*\n\n` +
    newOnes.map(t =>
      `• ${t.date} at ${t.time}: ${t.description} (${t.availableSeats} seats)`
    ).join('\n');
  await sendTelegramMessage(message, false); // 🔔 PUSH ALERT
}

if (cliArgMode === 'all') {
  const message = [
    `📅 *Daily tour overview* (${startDate} → ${endDate}):`,
    ...relevant.map(t => {
      const status = t.availableSeats > 0 ? '🟢' : '🔴';
      return `${status} ${t.date} at ${t.time}: ${t.description} (${t.availableSeats} seats)`;
    })
  ].join('\n') || 'No tours found.';
  await sendTelegramMessage(message, true); // 🔕 SILENT ALERT
}
