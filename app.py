import logging
from flask import Flask, jsonify, render_template
import feedparser
import requests
from bs4 import BeautifulSoup

app = Flask(__name__)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

FEED_URL = "https://docs.cloud.google.com/feeds/bigquery-release-notes.xml"

def clean_html_text(html_content):
    """Strips HTML tags and normalizes whitespace for tweet text."""
    try:
        soup = BeautifulSoup(html_content, 'html.parser')
        # Replace links with text + href in parentheses if it's brief,
        # but for tweets we'll keep it simple and just get the plain text.
        text = soup.get_text(separator=' ')
        # Normalize whitespace
        text = ' '.join(text.split())
        return text
    except Exception as e:
        logger.error(f"Error cleaning HTML: {e}")
        return html_content

def parse_release_notes(feed_xml):
    """Parses the BigQuery release notes Atom feed and splits entries into individual updates."""
    feed = feedparser.parse(feed_xml)
    
    parsed_entries = []
    
    for entry in feed.entries:
        date_str = entry.get('title', 'Unknown Date')
        entry_link = entry.get('link', '')
        entry_id = entry.get('id', '')
        
        # Google release note feeds usually have content in 'summary' or 'content'
        html_content = entry.get('summary', '')
        if not html_content and 'content' in entry:
            html_content = entry.get('content', [{}])[0].get('value', '')
            
        if not html_content:
            continue
            
        soup = BeautifulSoup(html_content, 'html.parser')
        updates = []
        
        current_type = None
        current_content = []
        
        for element in soup.contents:
            if hasattr(element, 'name') and element.name is not None:
                if element.name == 'h3':
                    # Save the previous update before starting a new one
                    if current_type or current_content:
                        content_html = ''.join(current_content).strip()
                        updates.append({
                            'type': current_type or 'General',
                            'content_html': content_html,
                            'content_text': clean_html_text(content_html)
                        })
                    current_type = element.get_text().strip()
                    current_content = []
                else:
                    current_content.append(str(element))
            else:
                current_content.append(str(element))
                
        # Append the last update
        if current_type or current_content:
            content_html = ''.join(current_content).strip()
            updates.append({
                'type': current_type or 'General',
                'content_html': content_html,
                'content_text': clean_html_text(content_html)
            })
            
        # Filter out empty updates
        updates = [u for u in updates if u['content_html'].strip()]
        
        parsed_entries.append({
            'date': date_str,
            'link': entry_link,
            'id': entry_id,
            'updates': updates
        })
        
    return {
        'title': feed.feed.get('title', 'BigQuery Release Notes'),
        'description': feed.feed.get('subtitle', 'Latest updates for Google Cloud BigQuery'),
        'entries': parsed_entries
    }

@app.route('/')
def index():
    """Renders the main dashboard page."""
    return render_template('index.html')

@app.route('/api/releases')
def get_releases():
    """Fetches the latest release notes and returns parsed JSON."""
    try:
        logger.info(f"Fetching release notes feed from {FEED_URL}")
        response = requests.get(FEED_URL, timeout=10)
        response.raise_for_status()
        
        logger.info("Feed fetched successfully. Parsing...")
        data = parse_release_notes(response.text)
        return jsonify(data)
    except requests.exceptions.RequestException as e:
        logger.error(f"Network error fetching feed: {e}")
        return jsonify({
            'error': 'Failed to fetch release notes from Google Cloud servers. Please check your network connection.',
            'details': str(e)
        }), 502
    except Exception as e:
        logger.error(f"Error parsing feed: {e}")
        return jsonify({
            'error': 'An internal error occurred while processing the release notes.',
            'details': str(e)
        }), 500

if __name__ == '__main__':
    app.run(host='127.0.0.1', port=5000, debug=True)
