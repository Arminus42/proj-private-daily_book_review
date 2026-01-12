# scripts/crawler.py
import requests
from bs4 import BeautifulSoup
import json
import os
from datetime import datetime

# 신문사별 설정 (실제 개발 시 개발자 도구로 class 확인 필수)
NEWSPAPERS = {
    "chosun": {
        "name": "조선일보",
        "url": "https://www.chosun.com/culture/book/",
        "list_selector": ".story-card-wrapper .story-card",
        "title_selector": ".story-link",
        "content_selector": ".article-body" # 상세 페이지 내부 본문 class
    },
    "hani": {
        "name": "한겨레",
        "url": "https://www.hani.co.kr/arti/culture/book/home01.html",
        "list_selector": ".article-area",
        "title_selector": "h4.article-title a",
        "content_selector": ".text"
    }
}

def get_full_content(url, selector):
    try:
        res = requests.get(url, headers={'User-Agent': 'Mozilla/5.0'})
        soup = BeautifulSoup(res.text, 'html.parser')
        # 불필요한 태그 제거 (광고, 이미지 캡션 등)
        for trash in soup.select('script, style, iframe'):
            trash.decompose()
        content = soup.select_one(selector)
        return content.get_text(strip=True, separator='\n') if content else "본문을 불러올 수 없습니다."
    except:
        return "링크 접속 실패"

def crawl():
    today_data = {}
    
    for key, config in NEWSPAPERS.items():
        print(f"Crawling {config['name']}...")
        res = requests.get(config['url'], headers={'User-Agent': 'Mozilla/5.0'})
        soup = BeautifulSoup(res.text, 'html.parser')
        
        articles = []
        # 최신 5개만 가져오기 예시
        for item in soup.select(config['list_selector'])[:5]: 
            title_tag = item.select_one(config['title_selector'])
            if not title_tag: continue
            
            link = title_tag['href']
            if not link.startswith('http'):
                link = config['url'].split('.com')[0] + '.com' + link # 상대경로 처리
                
            full_text = get_full_content(link, config['content_selector'])
            
            articles.append({
                "title": title_tag.text.strip(),
                "link": link,
                "content": full_text
            })
            
        today_data[key] = articles

    # public 폴더에 JSON 저장
    output_path = os.path.join(os.path.dirname(__file__), '../public/data.json')
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(today_data, f, ensure_ascii=False, indent=2)
    print("Data saved to public/data.json")

if __name__ == "__main__":
    crawl()
