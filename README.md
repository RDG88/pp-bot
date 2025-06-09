# 🕊️ Peace Palace Ticket Watcher

This project monitors available tickets for guided tours at the Peace Palace via the TicketTeam API and alerts you via Telegram.

It supports:

- Filtering for:
  - "Inside the Palace" and/or Garden tours
  - Dutch 🇳🇱 and/or English 🇬🇧 tours
- ⏱ Scheduled checks with GitHub Actions
- 🔔 Emergency Telegram alerts when new tickets become available posted to telegram
- 💤 Daily silent summary of all filtered tours posted to telegram
- 💾 Cached state to avoid duplicate alerts

---

## 🚀 Features

| Feature                 | Description                              |
|-------------------------|------------------------------------------|
| Language Filter         | Supports English and Dutch               |
| Tour Type Filter        | Inside the Palace or Garden              |
| Dynamic Date Range      | Defaults to **today + 14 days**          |
| Telegram Alerts         | High-priority for new tickets, silent for summaries |
| GitHub Actions Schedule | Hourly & daily at 16:00 NL time (14:00 UTC) |
| State Tracking          | Saves cache to `last-available-tickets.json` |

---

## 📦 Local Setup

### 1. Clone the Repo

```bash
git clone https://github.com/YOUR_USERNAME/pp-bot.git
cd pp-bot
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment

Create a `.env` file:

```bash
cp .env.example .env
```

Fill it in with:

```env
TELEGRAM_TOKEN=your_bot_token_here
TELEGRAM_CHAT_ID=your_chat_id_here
```

> You can get your token from [@BotFather](https://t.me/BotFather)

---

## 🧪 Running Locally

Run an emergency check for new tickets:

```bash
node check-tickets.js --mode=new
```

Run the daily summary (all filtered tours):

```bash
node check-tickets.js --mode=all
```

Output is written to:

- `ticket-report.txt` → human-readable summary
- `last-available-tickets.json` → ticket cache for tracking

---

## 🤖 GitHub Actions Setup

### 1. Add Secrets

Go to your **GitHub repo → Settings → Secrets → Actions** and add:

| Name              | Value                         |
|-------------------|-------------------------------|
| `GH_PAT`          | Your GitHub PAT (push access) |
| `TELEGRAM_TOKEN`  | Telegram bot token            |
| `TELEGRAM_CHAT_ID`| Telegram chat ID              |

### 2. GitHub Workflow

The included workflow file:

```
.github/workflows/check-tickets.yml
```

- Runs every **hour** to send emergency alerts
- Sends a **silent summary daily at 16:00 NL time** (14:00 UTC)
- Commits updated ticket cache back to `main`

---

## 🔧 Config Options

Edit these at the top of `check-tickets.js`:

```js
const INCLUDE_ENGLISH = true;
const INCLUDE_DUTCH = true;
const INCLUDE_INSIDE = true;
const INCLUDE_GARDEN = true;
const ONLY_AVAILABLE = false;
const LOOKAHEAD_DAYS = 14;
```

---

## 📄 Example Output

```txt
🎉 NEW TICKETS AVAILABLE:
- 2025-06-20 at 14:00: Inside the Palace - English (6 seats)

📅 Filtered tours (2025-06-09 → 2025-06-23):
🟢 2025-06-20 at 14:00: Inside the Palace - English (6 seats)
🔴 2025-06-21 at 13:00: Inside the Palace - Dutch (0 seats)
```


---

## 📬 Questions?

Feel free to open an issue

---

## 🛡 Disclaimer

This project is not affiliated with the Peace Palace or TicketTeam.   

It was created out of frustration with how tour options are presented on the Peace Palace website, where it’s easy to mistakenly book a Garden tour instead of the highly limited *Inside the Palace* experience.

To avoid missing out again, this bot was built to automatically track availability and send timely alerts.

Use at your own risk.
