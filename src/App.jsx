import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, BookOpen } from 'lucide-react';

const App = () => {
  const [data, setData] = useState(null);
  const [activeTab, setActiveTab] = useState('chosun'); 
  const [indices, setIndices] = useState({ chosun: 0, hani: 0 });

  useEffect(() => {
    fetch('/data.json')
      .then(res => res.json())
      .then(result => setData(result))
      .catch(err => {
        console.error("데이터 로드 실패:", err);
        // 데이터가 없을 때를 대비한 더미 데이터 설정 (테스트용)
        setData({
          chosun: [],
          hani: []
        });
      });
  }, []);

  if (!data) return <div className="flex h-screen items-center justify-center font-bold text-lg text-gray-500">데이터를 불러오는 중...</div>;

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
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-10 font-sans selection:bg-blue-100">
      
      {/* 헤더 */}
      <div className="w-full max-w-2xl px-6 mb-8 flex items-center gap-3">
        <div className="p-2 bg-blue-600 rounded-lg shadow-lg shadow-blue-200">
          <BookOpen className="text-white w-6 h-6" />
        </div>
        <h1 className="text-2xl font-bold text-gray-800 tracking-tight">오늘의 서평</h1>
      </div>

      {/* 탭 버튼 */}
      <div className="w-full max-w-2xl px-6 flex gap-3 mb-6">
        {['chosun', 'hani'].map(key => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ease-in-out
              ${activeTab === key 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 transform -translate-y-0.5' 
                : 'bg-white text-gray-500 hover:bg-gray-50 hover:text-gray-700 border border-gray-200'}`}
          >
            {key === 'chosun' ? '조선일보' : '한겨레'}
          </button>
        ))}
      </div>

      {/* 메인 카드 영역 */}
      <div className="w-full max-w-4xl px-4 flex items-center justify-center gap-4 h-[600px]">
        
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
              <p>오늘 수집된 기사가 없습니다.</p>
              <p className="text-xs">터미널에서 크롤러를 실행해보세요.</p>
            </div>
          ) : (
            <>
              {/* 카드 헤더 */}
              <div className="bg-white p-8 border-b border-gray-100 sticky top-0 z-10">
                 <h2 className="text-2xl font-bold text-gray-900 leading-snug mb-3">
                   {currentArticle.title}
                 </h2>
                 <a 
                  href={currentArticle.link} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="inline-flex items-center text-sm font-medium text-blue-500 hover:text-blue-700 hover:underline transition-colors"
                 >
                   원문 전체 보기
                   <ChevronRight size={14} className="ml-0.5" />
                 </a>
              </div>
              
              {/* 본문 스크롤 영역 */}
              <div className="flex-1 p-8 overflow-y-auto leading-8 text-gray-700 whitespace-pre-line text-[16px] text-justify font-medium">
                {currentArticle.content}
              </div>
              
              {/* 하단 인디케이터 */}
              <div className="absolute bottom-6 right-8 bg-black/70 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-xs font-bold tracking-wide shadow-sm">
                {currentIndex + 1} <span className="text-white/50 mx-1">/</span> {currentArticles.length}
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
