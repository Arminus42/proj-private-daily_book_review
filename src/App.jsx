import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, BookOpen, Newspaper } from 'lucide-react';

// 신문사 ID를 한글 이름으로 변환하는 매핑
const SOURCE_NAMES = {
  hani: '한겨레',
  mk: '매일경제',
  hankyung: '한국경제',
  ohmynews: '오마이뉴스',
  donga: '동아일보',
  chosun: '조선일보',
  khan: '경향신문',
  nocut: '노컷뉴스'
};

const App = () => {
  const [data, setData] = useState(null);
  const [activeTab, setActiveTab] = useState(null); // 초기값 null
  const [indices, setIndices] = useState({}); // 동적 초기화

  useEffect(() => {
    fetch('/data.json')
      .then(res => res.json())
      .then(result => {
        setData(result);
        
        // 데이터가 로드되면 첫 번째 키(신문사)를 활성 탭으로 설정
        const keys = Object.keys(result);
        if (keys.length > 0) {
          setActiveTab(keys[0]);
          
          // 각 신문사별 인덱스 0으로 초기화
          const initialIndices = {};
          keys.forEach(key => initialIndices[key] = 0);
          setIndices(initialIndices);
        }
      })
      .catch(err => {
        console.error("데이터 로드 실패:", err);
        setData({});
      });
  }, []);

  if (!data) return (
    <div className="flex h-screen items-center justify-center font-bold text-lg text-gray-500 gap-2">
      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
      데이터를 불러오는 중...
    </div>
  );

  // 데이터가 아예 없는 경우
  if (Object.keys(data).length === 0) return (
    <div className="flex h-screen flex-col items-center justify-center text-gray-500 gap-4">
      <Newspaper size={48} className="text-gray-300" />
      <p>저장된 서평 데이터가 없습니다.</p>
      <p className="text-sm">터미널에서 크롤러를 실행해주세요.</p>
    </div>
  );

  const currentArticles = activeTab ? (data[activeTab] || []) : [];
  const currentIndex = activeTab ? (indices[activeTab] || 0) : 0;
  const currentArticle = currentArticles[currentIndex];

  const handlePrev = () => {
    if (!activeTab) return;
    setIndices(prev => ({
      ...prev,
      [activeTab]: Math.max(0, prev[activeTab] - 1)
    }));
  };

  const handleNext = () => {
    if (!activeTab) return;
    setIndices(prev => ({
      ...prev,
      [activeTab]: Math.min(currentArticles.length - 1, prev[activeTab] + 1)
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-10 font-sans selection:bg-blue-100">
      
      {/* 헤더 */}
      <div className="w-full max-w-4xl px-6 mb-8 flex items-center gap-3">
        <div className="p-2 bg-blue-600 rounded-lg shadow-lg shadow-blue-200">
          <BookOpen className="text-white w-6 h-6" />
        </div>
        <h1 className="text-2xl font-bold text-gray-800 tracking-tight">오늘의 서평</h1>
        <span className="text-sm text-gray-400 font-medium mt-1 ml-auto">
          {new Date().toLocaleDateString()}
        </span>
      </div>

      {/* 탭 버튼 (동적 생성) */}
      <div className="w-full max-w-4xl px-6 flex flex-wrap gap-2 mb-6">
        {Object.keys(data).map(key => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ease-in-out border
              ${activeTab === key 
                ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-200 transform -translate-y-0.5' 
                : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50 hover:text-gray-700'}`}
          >
            {SOURCE_NAMES[key] || key.toUpperCase()} 
            <span className="ml-2 opacity-60 text-xs bg-black/10 px-1.5 py-0.5 rounded-full">
              {data[key]?.length || 0}
            </span>
          </button>
        ))}
      </div>

      {/* 메인 카드 영역 */}
      <div className="w-full max-w-5xl px-4 flex items-center justify-center gap-4 h-[700px]">
        
        {/* 왼쪽 버튼 */}
        <button 
          onClick={handlePrev} 
          disabled={!currentArticle || currentIndex === 0}
          className="p-3 rounded-full bg-white shadow-lg border border-gray-100 text-gray-600 hover:text-blue-600 hover:bg-blue-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200"
        >
          <ChevronLeft size={24} />
        </button>

        {/* 서평 카드 */}
        <div className="bg-white rounded-2xl shadow-xl w-full h-full flex flex-col overflow-hidden border border-gray-100 relative group">
          
          {!currentArticle ? (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-4">
              <BookOpen size={48} className="opacity-20" />
              <p>이 신문사에는 오늘 수집된 서평이 없습니다.</p>
            </div>
          ) : (
            <>
              {/* 카드 헤더 */}
              <div className="bg-white px-8 py-6 border-b border-gray-100 sticky top-0 z-10 shadow-sm">
                 <div className="flex items-center gap-2 text-xs font-bold text-blue-600 mb-2 uppercase tracking-wider">
                    <span>{SOURCE_NAMES[activeTab] || activeTab}</span>
                    <span className="text-gray-300">|</span>
                    <span className="text-gray-400">{currentArticle.date}</span>
                 </div>
                 <h2 className="text-2xl font-bold text-gray-900 leading-snug mb-3">
                   {currentArticle.title}
                 </h2>
                 <a 
                  href={currentArticle.link} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="inline-flex items-center text-sm font-medium text-gray-400 hover:text-blue-600 transition-colors"
                 >
                   원문 보기
                   <ChevronRight size={14} className="ml-0.5" />
                 </a>
              </div>
              
              {/* 본문 스크롤 영역 */}
              {/* 중요: 크롤러가 수집한 full_text를 보여줌. 없으면 content(미리보기) 사용 */}
              <div className="flex-1 p-8 overflow-y-auto bg-[#fdfdfd]">
                <div className="prose prose-lg max-w-none text-gray-700 leading-8 whitespace-pre-line text-[16px] text-justify font-medium">
                  {currentArticle.full_text || currentArticle.content}
                </div>
              </div>
              
              {/* 하단 인디케이터 */}
              <div className="absolute bottom-6 right-8 bg-gray-900/80 backdrop-blur-sm text-white px-4 py-1.5 rounded-full text-xs font-bold tracking-wide shadow-lg">
                {currentIndex + 1} <span className="text-white/40 mx-1">/</span> {currentArticles.length}
              </div>
            </>
          )}
        </div>

        {/* 오른쪽 버튼 */}
        <button 
          onClick={handleNext} 
          disabled={!currentArticle || currentIndex === currentArticles.length - 1}
          className="p-3 rounded-full bg-white shadow-lg border border-gray-100 text-gray-600 hover:text-blue-600 hover:bg-blue-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200"
        >
          <ChevronRight size={24} />
        </button>
      </div>
    </div>
  );
};

export default App;