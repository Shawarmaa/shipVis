import os
import requests
import json

def query_news_api(query: str, start_date: str, end_date: str):
    """
    Function to query news articles from NewsAPI based on a search query.
    Returns a list of articles with title, description, url, and publishedAt.
    """

    stress_keywords = "strike OR closure OR delay OR accident OR gridlock OR congestion"
    query = f'"{query}" AND ({stress_keywords})'

    appid = os.getenv("NEWS_ID")

    url = (
        "https://newsapi.org/v2/everything?"
        f"q={query}&"
        f"from={start_date}&"
        f"to={end_date}&"
        f"sortBy=publishedAt&"
        f"language=en&"
        f"apiKey={appid}"
    )
    
    response = requests.get(url)
    data = response.json()
    
    if data.get("status") != "ok":
        raise Exception(f"NewsAPI error: {data.get('message', 'Unknown error')}")
    
    articles = data.get("articles", [])
    formatted_articles = []
    
    for article in articles:
        formatted_articles.append({
            "title": article.get("title"),
            "description": article.get("description"),
            "url": article.get("url"),
            "publishedAt": article.get("publishedAt")
        })
    
    return formatted_articles