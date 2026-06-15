# D&D Book Release Pulse

An interactive, premium dashboard application built with **Python Flask** and **Vanilla HTML, CSS, and JavaScript**. It tracks upcoming and recent **Dungeons & Dragons 5th Edition book releases** by Wizards of the Coast (WotC) alongside live tabletop community news.

**Live Repository**: [brian-chalfant/dnd-news](https://github.com/brian-chalfant/dnd-news)

---

## 🎲 Core Features

1. **WotC Release Roadmap**: Curated schedule of all key 2025/2026 rulebooks, campaign sourcebooks, accessories, and adventure modules.
2. **Dynamic Countdown Calculator**: Automatically calculates release status tags relative to the system date (e.g., *Releasing tomorrow!*, *Releasing in 3 months*, or *Released on [Date]*).
3. **Live EN World News Scraper**: Integrated RSS feed reader that downloads and parses community topics, filtering specifically for WotC, D&D Beyond updates, book pre-orders, and announcements.
4. **Dark/Light Mode Theme Swapper**: A button in the header that toggles the color scheme between dark and light modes by overriding CSS root variables, persisting the user's preference in `localStorage`.
5. **Card & Grid Utilities**:
   * **Copy to Clipboard**: A one-click copy button on each card that copies the plaintext description of that specific release (isolated to prevent opening the sidebar).
   * **CSV Export**: An export button in the filter bar that outputs the currently filtered/sorted grid list directly to a downloadable CSV file.
6. **RPG Tweet Composer Drawer**:
   * **Thematic Style presets**: Draft messages using *Hype Bard* (pro), *Casual Player* (enthusiastic), or *Short Scroll* (minimal) layout structures.
   * **RPG Emojis**: Auto-injects class-themed emojis (`🎲`, `🐉`, `📜`, `⚔️`, `✨`) matching the product category.
   * **Twitter Character Count Safety**: Substitutes out links for a flat 23-character count (per Twitter's link policy) to prevent draft overflow.
   * **Web Intent Integration**: Immediate redirection to post drafts directly on X (Twitter).

---

## 📂 Project Structure

```text
├── app.py                  # Flask server, database roadmap, and RSS news aggregator
├── requirements.txt        # Python library dependencies
├── .gitignore              # Files excluded from git tracking
├── README.md               # Project overview and instruction guide
├── templates/
│   └── index.html          # Webpage layout structure and Tweet composer drawer
└── static/
    ├── css/
    │   └── style.css       # Styling tokens (fonts, animations, glassmorphism)
    └── js/
        └── app.js          # Client-side filtering, card rendering, and Tweet logic
```

---

## 🚀 Getting Started

### Prerequisites
* Python 3.10 or higher
* pip (Python package installer)

### 1. Clone the Repository
```bash
git clone https://github.com/brian-chalfant/dnd-news.git
cd dnd-news
```

### 2. Install Dependencies
Install the required packages declared in [requirements.txt](file:///D:/AICourse/agy-cli-projects/requirements.txt):
```bash
pip install -r requirements.txt
```

### 3. Start the Server
Run the Flask application:
```bash
python app.py
```
By default, the server runs in debug mode and is accessible at:
👉 **[http://127.0.0.1:5000](http://127.0.0.1:5000)**

---

## ⚙️ Configuration

* **Cache TTL**: News feed items are cached in memory for 5 minutes (`300` seconds) in `app.py` to prevent redundant network calls. You can adjust this duration by modifying `CACHE_TTL` in [app.py](file:///D:/AICourse/agy-cli-projects/app.py#L102).
* **Keywords Filter**: Adjust the lists `keywords` and `book_keywords` in [app.py](file:///D:/AICourse/agy-cli-projects/app.py#L145-L146) to customize what articles are flagged as book releases.
