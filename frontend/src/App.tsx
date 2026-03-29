import { lazy, Suspense, useEffect, useState } from 'react';
import { apiClient } from './api/client';
import { useStore } from './store';
import { useAnalysis } from './hooks/useAnalysis';
import { DropZone } from './components/DropZone';
import { DataTable } from './components/DataTable';
import { AnalysisProgress } from './components/AnalysisProgress';
import { Sidebar } from './components/Sidebar';

const AnalysisView = lazy(() =>
  import('./components/analysis/AnalysisView').then((m) => ({ default: m.AnalysisView })),
);

type ServerStatus = 'idle' | 'warming' | 'ready' | 'error';

function App() {
  const [serverStatus, setServerStatus] = useState<ServerStatus>('idle');

  const status = useStore((s) => s.status);
  const rawData = useStore((s) => s.rawData);
  const columns = useStore((s) => s.columns);
  const error = useStore((s) => s.error);
  const fileName = useStore((s) => s.fileName);
  const resetStore = useStore((s) => s.resetStore);

  const { retryAnalysis } = useAnalysis();

  useEffect(() => {
    let warmupTimer: ReturnType<typeof setTimeout>;
    const checkHealth = async () => {
      warmupTimer = setTimeout(() => setServerStatus('warming'), 2000);
      try {
        await apiClient.get('/health');
        clearTimeout(warmupTimer);
        setServerStatus('ready');
      } catch {
        clearTimeout(warmupTimer);
        setServerStatus('error');
      }
    };
    checkHealth();
    return () => clearTimeout(warmupTimer);
  }, []);

  const isDashboard = status === 'done' || status === 'analyzing' || (status === 'error' && rawData.length > 0);

  // ─── Landing Layout (idle / uploading / error-no-data) ───
  if (!isDashboard) {
    return (
      <main className="min-h-screen bg-surface font-sans flex flex-col">
        {serverStatus === 'warming' && (
          <div className="fixed top-0 inset-x-0 bg-warning-light text-amber-800 text-sm text-center py-2 z-50" role="alert">
            분석 서버에 연결 중... (최대 60초 소요될 수 있습니다)
          </div>
        )}

        <div className="flex-1 flex items-center justify-center px-4 py-12">
          <div className="w-full max-w-lg">
            {/* Branding */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-primary rounded-2xl mb-4">
                <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-text">DataLens</h1>
              <p className="text-text-muted mt-2">데이터 파일을 드롭하면 즉시 인사이트를 제공합니다</p>
            </div>

            {/* DropZone */}
            <DropZone />

            {/* Features */}
            <div className="grid grid-cols-3 gap-4 mt-8">
              {[
                { label: '분포 분석', desc: '히스토그램 · 바차트' },
                { label: '상관관계', desc: 'Pearson 히트맵' },
                { label: '이상값 탐지', desc: 'IQR 자동 감지' },
              ].map((f) => (
                <div key={f.label} className="text-center">
                  <p className="text-sm font-medium text-text">{f.label}</p>
                  <p className="text-xs text-text-subtle mt-0.5">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    );
  }

  // ─── Dashboard Layout (analyzing / done / error-with-data) ───
  return (
    <div className="min-h-screen bg-surface font-sans">
      {serverStatus === 'warming' && (
        <div className="fixed top-0 inset-x-0 bg-warning-light text-amber-800 text-sm text-center py-2 z-50" role="alert">
          분석 서버에 연결 중... (최대 60초 소요될 수 있습니다)
        </div>
      )}

      <Sidebar onNewFile={resetStore} fileName={fileName ?? undefined} status={status} />

      {/* Skip link */}
      <a href="#dashboard-content" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-64 focus:z-50 focus:bg-primary focus:text-white focus:px-4 focus:py-2 focus:rounded-lg">
        콘텐츠로 건너뛰기
      </a>

      <main className="ml-60 min-h-screen" id="dashboard-content">
        {/* Dashboard Header */}
        <header className="sticky top-0 z-30 bg-surface-raised/80 backdrop-blur-sm border-b border-border-light px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-text">대시보드</h2>
              <p className="text-sm text-text-muted mt-0.5">
                {status === 'analyzing' ? '데이터를 분석하고 있습니다...' : '데이터 분석 결과를 확인하세요'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {fileName && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary-light text-primary text-sm font-medium rounded-full">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                  </svg>
                  {fileName}
                </span>
              )}
              <button
                type="button"
                className="px-4 py-2 text-sm font-medium border border-border rounded-lg text-text-muted hover:bg-surface hover:border-primary/30 transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                onClick={resetStore}
              >
                새 파일
              </button>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="px-8 py-6">
          {status === 'analyzing' && (
            <div className="mb-6">
              <AnalysisProgress />
              {rawData.length > 0 && <div className="mt-4"><DataTable columns={columns} data={rawData} /></div>}
            </div>
          )}

          {status === 'error' && rawData.length > 0 && (
            <div className="bg-error-light border border-error/20 rounded-lg px-4 py-3 flex items-center justify-between gap-4 mb-6" role="alert">
              <p className="text-sm text-error">{error ?? '분석 중 오류가 발생했습니다.'}</p>
              <button type="button" className="text-sm font-medium text-error underline underline-offset-2 hover:text-error/80 flex-shrink-0 transition-colors" onClick={retryAnalysis}>
                다시 시도
              </button>
            </div>
          )}

          {status === 'done' && (
            <>
              <Suspense fallback={<div className="text-sm text-text-muted text-center py-8">분석 결과를 불러오는 중...</div>}>
                <AnalysisView />
              </Suspense>
              <div id="data-table" className="mt-8 scroll-mt-20">
                <h2 className="text-lg font-semibold mb-3 text-text">미리보기 테이블</h2>
                <DataTable columns={columns} data={rawData} />
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
