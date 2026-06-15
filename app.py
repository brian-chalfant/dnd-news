import time
import requests
from bs4 import BeautifulSoup
import re
import hashlib
from datetime import datetime, date
import email.utils
from flask import Flask, jsonify, render_template, request

app = Flask(__name__)

# Curated Wizards of the Coast D&D 5E Roadmap (2025-2026)
WOTC_ROADMAP = [
    {
        "id": "players_workbook_2026",
        "title": "Player's Workbook of Epic Adventures",
        "date_str": "May 5, 2026",
        "type": "Accessory",
        "season": "Season of Horror",
        "link": "https://dnd.wizards.com/products",
        "content_html": "<p>An interactive companion workbook designed to assist players with character creation, backstory planning, and campaign logging. Structured specifically to align with the revised 2024 Player's Handbook guidelines.</p><ul><li>Interactive prompt pages</li><li>Expanded backstory generators</li><li>Session-by-session chronicle logs</li></ul>",
        "content_text": "Player's Workbook of Epic Adventures (Released May 5, 2026) is an interactive companion workbook designed to assist players with character creation, backstory planning, and campaign logging, fully aligned with the revised 2024 Player's Handbook rules."
    },
    {
        "id": "ravenloft_horrors_2026",
        "title": "Ravenloft: The Horrors Within",
        "date_str": "June 16, 2026",
        "type": "Sourcebook",
        "season": "Season of Horror",
        "link": "https://www.dndbeyond.com/posts",
        "content_html": "<p>The flagship sourcebook of the <strong>Season of Horror</strong>, updating the dark realms of Ravenloft for the revised 2024 core rules. Introduces horror-themed subclasses, gothic species options, new dark backgrounds, and 'Dark Gift' feats, plus dedicated advice for Dungeon Masters running cosmic, gothic, and occult horror.</p><ul><li>New horror-themed subclasses</li><li>Gothic character options and species</li><li>DM guides for dread atmospheres & fear mechanics</li></ul>",
        "content_text": "Ravenloft: The Horrors Within (Releasing June 16, 2026) is the flagship sourcebook of the Season of Horror, updating Ravenloft for the revised 2024 core rules. Introduces horror-themed subclasses, gothic species, backgrounds, and Dark Gift feats."
    },
    {
        "id": "reference_cards_2026",
        "title": "D&D Reference Cards",
        "date_str": "August 11, 2026",
        "type": "Accessory",
        "season": "Season of Magic",
        "link": "https://dnd.wizards.com/products",
        "content_html": "<p>A premium boxed set of reference cards designed to speed up gameplay during the <strong>Season of Magic</strong>. Provides quick table lookups for spell slots, character conditions, equipment rules, and status tracking.</p><ul><li>Over 150 high-durability reference cards</li><li>Color-coded by category</li><li>Comprehensive status tracking conditions</li></ul>",
        "content_text": "D&D Reference Cards (Releasing August 11, 2026) is a premium boxed set of reference cards for spelling list queries, conditions, and rules reference, designed to speed up gameplay during the Season of Magic."
    },
    {
        "id": "arcana_unleashed_2026",
        "title": "Arcana Unleashed",
        "date_str": "September 22, 2026",
        "type": "Sourcebook",
        "season": "Season of Magic",
        "link": "https://www.dndbeyond.com/posts",
        "content_html": "<p>A major high-magic sourcebook introducing spellcraft expansions, new arcane subclasses, magical backgrounds, and 'evolving' magic items that grow in strength alongside your player character. Expands spell lists and spellcasting options for all casting classes.</p><ul><li>Brand new spell lists and scaling spell mechanics</li><li>Evolving artifacts and magic items</li><li>High-magic themed character options & subclasses</li></ul>",
        "content_text": "Arcana Unleashed (Releasing September 22, 2026) is a major high-magic sourcebook introducing spellcraft expansions, new arcane subclasses, magical backgrounds, and evolving magic items that level up with your character."
    },
    {
        "id": "arcana_deadfall_2026",
        "title": "Arcana Unleashed: Deadfall",
        "date_str": "September 29, 2026",
        "type": "Adventure",
        "season": "Season of Magic",
        "link": "https://www.dndbeyond.com/posts",
        "content_html": "<p>A challenging adventure module designed for mid-to-high level play, set during a devastating wizard war. Players will delve deep into the strongholds of the Red Wizards of Thay to halt a magical cataclysm.</p><ul><li>Tense tactical encounters in arcane towers</li><li>New NPC stat blocks for Thay spellcasters</li><li>High-stakes adventure focusing on stopping a world-ending ritual</li></ul>",
        "content_text": "Arcana Unleashed: Deadfall (Releasing September 29, 2026) is an adventure module designed for mid-to-high level play, set during a wizard war where players combat the Red Wizards of Thay."
    },
    {
        "id": "winter_secret_2026",
        "title": "WotC Winter Secret Release (TBA)",
        "date_str": "December 8, 2026",
        "type": "Sourcebook",
        "season": "Season of Champions",
        "link": "https://dnd.wizards.com/products",
        "content_html": "<p>The unannounced culminating product of the <strong>Season of Champions</strong>. Anticipated to focus on high-level character challenges, epic quests, planar exploration, and rules for legendary characters.</p><ul><li>Unannounced core supplement details</li><li>Tied to the Season of Champions finale</li><li>Rumored rules for epic levels & planar travel</li></ul>",
        "content_text": "WotC Winter Secret Release (December 8, 2026) is the unannounced culminating sourcebook of the Season of Champions, rumored to focus on high-level character challenges and epic quests."
    },
    {
        "id": "monster_manual_2025",
        "title": "Monster Manual (2024 Core)",
        "date_str": "February 18, 2025",
        "type": "Core Rulebook",
        "season": "Core Refresh",
        "link": "https://dnd.wizards.com/products/monster-manual",
        "content_html": "<p>The ultimate compilation of D&D monsters, fully updated for the 2024 core rules refresh. Contains over 500 monsters, including fresh tactical encounters, redesigned stat blocks, and brand new lore.</p><ul><li>Over 500 monster profiles with revised stat blocks</li><li>Dozens of high-level threat updates</li><li>DM tools for encounter building & combat tactics</li></ul>",
        "content_text": "Monster Manual (Released February 18, 2025) is the final piece of the 2024 core rulebook refresh, containing over 500 monsters with revamped stat blocks, artwork, and tactical advice."
    },
    {
        "id": "starter_borderland_2025",
        "title": "Heroes of the Borderland Starter Set",
        "date_str": "September 16, 2025",
        "type": "Accessory",
        "season": "Core Refresh",
        "link": "https://dnd.wizards.com/products",
        "content_html": "<p>A beginner-focused starter set built around the 2024 core rules, featuring an adventure inspired by the legendary classic 'Keep on the Borderlands' module. Includes pregenerated characters, rules overview, and dice.</p><ul><li>2024 rules-compliant introductory adventure</li><li>6 pregenerated character sheets</li><li>Set of 7 polyhedral gaming dice</li></ul>",
        "content_text": "Heroes of the Borderland Starter Set (Released September 16, 2025) is a beginner-focused starter set built around the revised 2024 rules, featuring an adventure inspired by Keep on the Borderlands."
    }
]

# In-memory cache for news feed
news_cache = {
    "items": [],
    "last_fetched": 0,
    "error": None
}
CACHE_TTL = 300  # 5 minutes

def get_release_status(release_date_str):
    try:
        release_date = datetime.strptime(release_date_str, "%B %d, %Y").date()
    except ValueError:
        try:
            # Fallback for monthly-only dates like "September 2026"
            release_date = datetime.strptime(release_date_str, "%B %Y").date()
        except ValueError:
            return "Upcoming", "Date TBA"
            
    # Use June 15, 2026 as the 'current local time' anchor as specified in metadata
    today = date(2026, 6, 15)
    delta = (release_date - today).days
    
    if delta < 0:
        return "Released", f"Released on {release_date_str}"
    elif delta == 0:
        return "Releasing Today", "Releasing today!"
    elif delta == 1:
        return "Upcoming", "Releasing tomorrow!"
    elif delta < 30:
        return "Upcoming", f"Releasing in {delta} days"
    else:
        months = delta // 30
        if months == 1:
            return "Upcoming", "Releasing in 1 month"
        return "Upcoming", f"Releasing in {months} months"

def fetch_enworld_news():
    try:
        response = requests.get("https://www.enworld.org/index.php?forums/-/index.rss", timeout=10, headers={
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        })
        if response.status_code != 200:
            return []
        
        soup = BeautifulSoup(response.text, 'xml')
        items = soup.find_all('item')
        news_items = []
        
        # Keywords to identify WotC D&D release-related news
        keywords = ["dnd", "d&d", "wizards", "wotc", "beyond", "hasbro", "ttrpg", "rulebook", "adventure", "ravenloft", "arcana unleashed"]
        book_keywords = ["book", "release", "roadmap", "upcoming", "preorder", "preview", "season", "announce", "schedule"]
        
        for item in items:
            title = item.title.text.strip() if item.title else ""
            link = item.link.text.strip() if item.link else ""
            pub_date = item.pubDate.text.strip() if item.pubDate else ""
            
            content_desc = item.description.text.strip() if item.description else ""
            desc_soup = BeautifulSoup(content_desc, 'html.parser')
            desc_text = desc_soup.get_text().strip()
            desc_text = re.sub(r'\s+', ' ', desc_text)
            
            title_lower = title.lower()
            desc_lower = desc_text.lower()
            
            is_relevant = False
            if any(k in title_lower for k in keywords):
                if any(bk in title_lower for bk in book_keywords) or any(bk in desc_lower for bk in book_keywords):
                    is_relevant = True
            
            if is_relevant:
                try:
                    parsed_date = email.utils.parsedate_to_datetime(pub_date)
                    date_str = parsed_date.strftime("%B %d, %Y")
                    iso_date = parsed_date.isoformat()
                except Exception:
                    date_str = pub_date
                    iso_date = datetime.now().isoformat()
                    
                content_hash = hashlib.md5(title.encode('utf-8')).hexdigest()[:8]
                item_id = f"news_{content_hash}"
                
                news_items.append({
                    "id": item_id,
                    "title": title,
                    "date": date_str,
                    "updated": iso_date,
                    "type": "News Update",
                    "season": "Community News",
                    "status": "News",
                    "status_label": "Live News",
                    "content_html": f"<p>{desc_text[:320]}...</p>",
                    "content_text": f"{desc_text[:320]}...",
                    "link": link
                })
        return news_items
    except Exception as e:
        print(f"Error fetching community news: {e}")
        return []

def get_dnd_data(force_refresh=False):
    now = time.time()
    
    # Refresh news cache if expired or empty
    if force_refresh or not news_cache["items"] or (now - news_cache["last_fetched"] > CACHE_TTL) or news_cache["error"]:
        news_items = fetch_enworld_news()
        news_cache["items"] = news_items
        news_cache["last_fetched"] = now
        news_cache["error"] = None
        
    # Process static D&D roadmap items with dynamic countdowns
    processed_roadmap = []
    for book in WOTC_ROADMAP:
        status, status_label = get_release_status(book["date_str"])
        # Format updated field based on target date if possible
        try:
            target_date = datetime.strptime(book["date_str"], "%B %d, %Y").date()
            updated_iso = datetime(target_date.year, target_date.month, target_date.day).isoformat() + "Z"
        except ValueError:
            updated_iso = datetime(2026, 12, 31).isoformat() + "Z"
            
        processed_roadmap.append({
            "id": book["id"],
            "title": book["title"],
            "date": book["date_str"],
            "updated": updated_iso,
            "type": book["type"],
            "season": book["season"],
            "status": status,
            "status_label": status_label,
            "content_html": book["content_html"],
            "content_text": book["content_text"],
            "link": book["link"]
        })
        
    # Combine static books and live news items
    all_items = processed_roadmap + news_cache["items"]
    
    return {
        "updates": all_items,
        "last_fetched": news_cache["last_fetched"],
        "error": news_cache["error"]
    }

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/updates', methods=['GET'])
def api_updates():
    force_refresh = request.args.get('refresh', 'false').lower() == 'true'
    result = get_dnd_data(force_refresh=force_refresh)
    return jsonify(result)

if __name__ == '__main__':
    app.run(host='127.0.0.1', port=5000, debug=True)
