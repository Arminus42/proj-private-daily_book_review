import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, BookOpen } from 'lucide-react';

const App = () => {
  const [data, setData] = useState(null);
  const [activeTab, setActiveTab] = useState('chosun'); // 현재 선택된 신문사
  const [indices, setIndices] = useState({ chosun: 0, hani: 0 }); // 각 신문사별 현재 보고 있는 기사 인덱스

  useEffect(() => {
    // 로컬 개발시에는 public/data.json을 fetch
    // 배포시에는 해당 URL에서 가져옴
    fetch('/data.json')
      .then(res => res.json())
      .then(result => setData(result))
      .catch(err => console.error("데이터 로드 실패", err));
  }, []);

  if (!data) return <div className="flex h-screen items-center justify-center">Loading...</div>;

  const currentArticles = data[activeTab] || [];
  const currentIndex = indices[activeTab];
  const currentArticle = currentArticles[currentIndex];

  const handlePrev = () => {
    setIndices(prev => ({
      ...prev,
      [activeTab]: Math.max(0, prev[activeTab] - 1)
    }));
  };

  const handleNext = () => {
    setIndices(prev => ({
      ...prev,
      [activeTab]: Math.min(currentArticles.length - 1, prev[activeTab] + 1)
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-10 font-sans">
      
      {/* 1. 헤더 */}
      <div className="w-full max-w-2xl px-6 mb-8 flex items-center gap-2">
        <BookOpen className="text-blue-600" />
        <h1 className="text-2xl font-bold text-gray-800">오늘의 서평</h1>
      </div>

      {/* 2. 신문사 선택 탭 (Buttons) */}
      <div className="w-full max-w-2xl px-6 flex gap-4 mb-6">
        {Object.keys(data).map(key => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300
              ${activeTab === key 
                ? 'bg-blue-600 text-white shadow-md transform scale-105' 
                : 'bg-white text-gray-500 hover:bg-gray-100 border border-gray-200'}`}
          >
            {key === 'chosun' ? '조선일보' : '한겨레'}
          </button>
        ))}
      </div>

      {/* 3. 메인 콘텐츠 (Card UI) */}
      <div className="w-full max-w-2xl px-4 flex items-center justify-center gap-4">
        
        {/* 왼쪽 버튼 */}
        <button 
          onClick={handlePrev} 
          disabled={currentIndex === 0}
          className="p-2 rounded-full bg-white shadow-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition"
        >
          <ChevronLeft size={24} />
        </button>

        {/* 서평 카드 */}
        <div className="bg-white rounded-2xl shadow-xl w-full h-[600px] flex flex-col overflow-hidden border border-gray-100 relative">
          
          {/* 기사가 없을 경우 */}
          {!currentArticle && (
            <div className="flex-1 flex items-center justify-center text-gray-400">
              오늘의 기사가 없습니다.
            </div>
          )}

          {/* 기사 내용 */}
          {currentArticle && (
            <>
              <div className="bg-gray-50 p-6 border-b border-gray-100">
                 <h2 className="text-xl font-bold text-gray-900 leading-snug mb-2">
                   {currentArticle.title}
                 </h2>
                 <a href={currentArticle.link} target="_blank" rel="noreferrer" className="text-xs text-blue-500 hover:underline">
                   원문 보기 ↗
                 </a>
              </div>
              
              <div className="flex-1 p-6 overflow-y-auto leading-relaxed text-gray-700 whitespace-pre-line text-sm text-justify">
                {currentArticle.content}
              </div>
              
              {/* 페이지 인디케이터 */}
              <div className="absolute bottom-4 right-6 text-xs text-gray-400 bg-white/80 px-2 py-1 rounded-md">
                {currentIndex + 1} / {currentArticles.length}
              </div>
            </>
          )}
        </div>

        {/* 오른쪽 버튼 */}
        <button 
          onClick={handleNext} 
          disabled={currentIndex === currentArticles.length - 1}
          className="p-2 rounded-full bg-white shadow-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition"
        >
          <ChevronRight size={24} />
        </button>
      </div>

    </div>
  );
};

export default App;
