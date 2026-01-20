import feedparser
import requests
from bs4 import BeautifulSoup
import json
import os
import time
from datetime import datetime, timedelta

# --- 설정 ---

# 1. 크롤링 대상 신문사 RSS 및 본문 추출 선택자(Selector) 정의
# (수집 성공률이 확인된 5개 메이저 매체)
NEWSPAPERS = [
    # 1. 한겨레 (문화 일반: 서평 퀄리티 높음)
    {
        "name": "한겨레", "id": "hani",
        "url": "https://www.hani.co.kr/rss/culture/",
        "selector": ".article-text, .text, #a-left-scroll-in"
    },
    # 2. 매일경제 (문화/연예: 데이터 수신 안정적)
    {
        "name": "매일경제", "id": "mk",
        "url": "https://www.mk.co.kr/rss/30000023/",
        "selector": ".news_cnt_detail_wrap, .view_txt, .art_txt"
    },
    # 3. 한국경제 (생활/문화: 서평 및 칼럼 풍부)
    {
        "name": "한국경제", "id": "hankyung",
        "url": "https://www.hankyung.com/feed/life",
        "selector": "#articletxt, .article-body"
    },
    # 4. 오마이뉴스 (책 전문: 가장 확실한 서평 소스)
    {
        "name": "오마이뉴스", "id": "ohmynews",
        "url": "http://rss.ohmynews.com/rss/book.xml",
        "selector": ".article_view, .at_contents"
    },
    # 5. 동아일보 (문화: RSS 살아있음)
    {
        "name": "동아일보", "id": "donga",
        "url": "https://rss.donga.com/culture.xml",
        "selector": ".article_txt, .article_view, #article_txt"
    }
]

# 2. 필터링 키워드
REQUIRED_KEYWORDS = ["책", "서평", "도서", "출판", "신간", "작가", "저자", "소설", "에세이", "문학", "인문", "독서", "베스트셀러", "읽기", "서점"]
EXCLUDE_KEYWORDS = ["영화", "드라마", "방송", "공연", "전시", "화보", "포토", "여행", "날씨", "부고", "맛집", "개봉", "시청률", "예능", "별세", "인사", "동정"]

def clean_text(text):
    """불필요한 공백 및 노이즈 문구(TTS, 광고 등) 제거"""
    if not text:
        return ""
    
    # 노이즈 필터링 키워드 (이 문구가 포함된 줄은 삭제)
    NOISE_PATTERNS = [
        "기사를 읽어드립니다",
        "Your browser does not support",
        "audio element",
        "audio",
        "0:00",
        "사진 확대",
        "광고",
        "배너",
        "닫기",
        "기자",  # 단순히 'OOO 기자'만 있는 줄 제거용
        "이메일",
        "구독"
    ]
    
    cleaned_lines = []
    for line in text.splitlines():
        line = line.strip()
        if not line: continue
        
        # 1. 노이즈 패턴 검사
        is_noise = False
        for pattern in NOISE_PATTERNS:
            if pattern in line:
                is_noise = True
                break
        if is_noise: continue
        
        # 2. 너무 짧은, 의미 없는 단어만 있는 줄 제거 (단, 핵심 단어는 제외)
        if len(line) < 2 and line not in ["책", "삶", "시", "꿈", "끝"]:
             continue

        cleaned_lines.append(line)
        
    return "\n\n".join(cleaned_lines)

def fetch_rss_feed(url):
    """requests를 사용하여 RSS XML 데이터를 가져온 후 feedparser로 파싱 (차단 우회용)"""
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
        'Referer': 'https://www.google.com/'
    }
    try:
        res = requests.get(url, headers=headers, timeout=15)
        res.encoding = res.apparent_encoding # 한글 깨짐 방지
        if res.status_code != 200:
            return None
        return feedparser.parse(res.content)
    except Exception as e:
        print(f"   ❌ RSS 요청 실패: {e}")
        return None

def get_article_content(url, selector):
    """URL에서 HTML을 가져와 selector에 해당하는 본문 텍스트 추출 (강력한 필터링 적용)"""
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
        res = requests.get(url, headers=headers, timeout=10)
        res.encoding = res.apparent_encoding 
        
        if res.status_code != 200:
            return None

        soup = BeautifulSoup(res.text, 'html.parser')

        # 1. 불필요한 태그 제거 (DOM 단계에서 삭제)
        trash_selectors = [
            # 기본 불필요 태그
            'script', 'style', 'iframe', 'header', 'footer', 'nav', 
            '.ad', '.ads', '.ad_box', '#sidebar', 
            '.reporter_area', '.copyright', '.related_news', '.rel_news',
            
            # TTS 및 오디오 관련 (노이즈 원흉)
            '.tts_box', '.audiop', '.audio-player', '.btn_tts', '.vod_player',
            
            # 이미지 캡션 및 확대 버튼
            'figcaption', '.img_desc', '.desc_txt', '.img_caption', '.caption', 
            '.photo_zoom', '.zoom_btn', '.btn_photo_zoom', '.image-area'
        ]
        
        for selector_str in trash_selectors:
            for trash in soup.select(selector_str):
                trash.decompose()

        # 2. 지정된 선택자로 본문 찾기
        content_area = soup.select_one(selector)
        
        # 3. Fallback: 일반적인 본문 태그 검색
        if not content_area:
            content_area = soup.select_one('article, #article_body, .news_view, div[itemprop="articleBody"]')

        if content_area:
            # 텍스트 추출 후 2차 필터링(clean_text) 수행
            return clean_text(content_area.get_text(separator='\n'))
        else:
            return None

    except Exception as e:
        # print(f"      ⚠️ 본문 에러: {e}")
        return None

def crawl_and_extract():
    today = datetime.now().date()
    limit_date = today - timedelta(days=5) # 최근 5일치
    
    print(f"📅 [크롤링 시작] ({limit_date} ~ {today})")
    print("-" * 50)
    
    all_data = {}

    for paper in NEWSPAPERS:
        print(f"\n📰 [{paper['name']}] RSS 확인 중...")
        
        feed = fetch_rss_feed(paper['url'])
        
        if not feed or not feed.entries:
            print("   ⚠️ RSS 피드를 가져오지 못했습니다 (차단 또는 비어있음).")
            continue
            
        print(f"   ✅ RSS 수신 완료: {len(feed.entries)}개 항목")
        
        articles = []
        count = 0
        
        for entry in feed.entries:
            if count >= 3: # 신문사별 최대 3개 (테스트용)
                break

            # 날짜 파싱
            pub_struct = entry.get('published_parsed')
            if pub_struct:
                pub_date = datetime(*pub_struct[:6]).date()
            else:
                pub_date = today

            if pub_date < limit_date:
                continue
            
            title = entry.get('title', '')
            link = entry.get('link', '')
            
            # 제목 필터링
            if any(kw in title for kw in EXCLUDE_KEYWORDS):
                continue
            if not any(kw in title for kw in REQUIRED_KEYWORDS):
                continue
            
            print(f"   🔎 [수집] {title[:20]}... ({pub_date})")
            
            # 본문 추출
            full_text = get_article_content(link, paper['selector'])
            
            if not full_text or len(full_text) < 200:
                print("      ㄴ 🚫 본문 추출 실패 (내용 짧음)")
                continue
            
            # 이미지 추출
            img_src = ""
            if 'media_content' in entry:
                img_src = entry.media_content[0]['url']
            elif 'enclosure' in entry:
                 img_src = entry.enclosure.get('href', '')

            articles.append({
                "source": paper['name'],
                "title": title,
                "link": link,
                "date": pub_date.strftime("%Y-%m-%d"),
                "image": img_src,
                "content": full_text[:200] + "...", # 미리보기용
                "full_text": full_text              # 전체 본문
            })
            
            count += 1
            time.sleep(0.5) # 과도한 요청 방지
        
        if articles:
            all_data[paper['id']] = articles
            print(f"   💾 {len(articles)}개 기사 저장됨.")
        else:
            print("   💨 조건에 맞는 서평 기사 없음.")

        time.sleep(1)

    # 결과 저장
    public_dir = os.path.join(os.path.dirname(__file__), '../public')
    os.makedirs(public_dir, exist_ok=True)
    output_path = os.path.join(public_dir, 'data.json')
    
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(all_data, f, ensure_ascii=False, indent=2)
    
    print(f"\n🚀 [완료] 결과 저장됨: {output_path}")

if __name__ == "__main__":
    crawl_and_extract()