# BigQuery Release Radar 🛰️

A premium, modern web application that fetches the latest **Google Cloud BigQuery release notes**, parses them into individual update cards, and lets you select, customize, and post them to X (Twitter).

Built with **Python Flask** and **plain vanilla HTML, CSS, and JavaScript**.

---

## 🌟 Key Features

*   **Smart RSS Parsing & Segmentation**: Parses Google Cloud's official Atom feed and segments daily release updates into discrete visual cards (Features, Issues, Changes, Deprecations) instead of long text blocks.
*   **Instant Client-Side Filtering**: Live search and category filters (Features, Issues, etc.) run in real-time on the browser with zero lag.
*   **Integrated X (Twitter) Composer**: Populates a custom tweet with the update type, content summary, deep link to the documentation, and pre-selected hashtags.
*   **Accurate Character Limit Management**: A custom character counting script correctly maps links to exactly 23 characters matching Twitter's `t.co` shortening mechanism.
*   **Modern Dark-Mode Interface**: Crafted with a premium glassmorphic UI, color-coded status badges, micro-animations, and a responsive drawer layout for mobile devices.

---

## 📂 Project Structure

```
bq-releases-notes/
├── app.py                # Flask application, feed fetcher, & XML/HTML parser
├── requirements.txt      # Python dependencies
├── .gitignore            # Git exclusion rules
├── templates/
│   └── index.html        # Semantic HTML5 & embedded vector SVGs
└── static/
    ├── css/
    │   └── style.css     # CSS variables, glassmorphic layout, & animations
    └── js/
        └── app.js        # State manager, Twitter composer, & client filters
```

---

## 🚀 Quick Start

### 1. Prerequisites
Ensure you have **Python 3.8+** installed on your system.

### 2. Setup and Installation

Clone or navigate to the project directory and set up the Python virtual environment:

```bash
# Navigate to the project directory
cd bq-releases-notes

# Create a virtual environment
python3 -m venv .venv

# Install dependencies
.venv/bin/pip install -r requirements.txt
```

### 3. Run the Server

Start the Flask development server:

```bash
.venv/bin/python app.py
```

The server will spin up locally. Open your browser and navigate to:
👉 **[http://127.0.0.1:5000](http://127.0.0.1:5000)**

---

## 🛠️ Tech Stack

*   **Backend**: Python, Flask, `requests`, `feedparser`, `beautifulsoup4`
*   **Frontend**: Plain Vanilla HTML5, Vanilla CSS3 (Custom Variables, Flexbox, Grid), Vanilla JavaScript (ES6)
*   **APIs**: Twitter Web Intent API
*   **Typography**: Inter (Google Fonts)

---

## 📄 License
This project is open-source and available under the MIT License.
