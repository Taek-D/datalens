import { useEffect, useState } from 'react';
import { apiClient } from './api/client';
import { useStore } from './store';
import { useAnalysis } from './hooks/useAnalysis';
import { DropZone } from './components/DropZone';
import { DataTable } from './components/DataTable';
import { AnalysisProgress } from './components/AnalysisProgress';

type ServerStatus = 'idle' | 'warming' | 'ready' | 'error';

function App() {
  const [serverStatus, setServerStatus] = useState<ServerStatus>('idle');

  const status = useStore((s) => s.status);
  const rawData = useStore((s) => s.rawData);
  const columns = useStore((s) => s.columns);
  const error = useStore((s) => s.error);
  const resetStore = useStore((s) => s.resetStore);

  // Auto-triggers analysis when store status becomes 'analyzing'
  const { retryAnalysis } = useAnalysis();

  useEffect(() => {
    let warmupTimer: ReturnType<typeof setTimeout>;

    const checkHealth = async () => {
      warmupTimer = setTimeout(() => {
        setServerStatus('warming');
      }, 2000);

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

  const renderContent = () => {
    switch (status) {
      case 'idle':
        return <DropZone />;

      case 'uploading':
        // DropZone shows internal progress bar when status === 'uploading'
        return <DropZone />;

      case 'analyzing':
        return (
          <div className="flex flex-col gap-4">
            <AnalysisProgress />
            {rawData.length > 0 && (
              <DataTable columns={columns} data={rawData} />
            )}
          </div>
        );

      case 'done':
        return (
          <div className="flex flex-col gap-4">
            <DataTable columns={columns} data={rawData} />
            <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-6 text-center text-gray-400 text-sm">
              차트 및 분석 결과는 Phase 3에서 추가됩니다.
            </div>
          </div>
        );

      case 'error':
        if (rawData.length === 0) {
          // Upload failed — show DropZone to retry from scratch
          return <DropZone />;
        }
        // Analysis failed — show data table + error banner + retry
        return (
          <div className="flex flex-col gap-4">
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 flex items-center justify-between gap-4">
              <p className="text-sm text-red-700">{error ?? '분석 중 오류가 발생했습니다.'}</p>
              <button
                type="button"
                className="text-sm font-medium text-red-700 underline underline-offset-2 hover:text-red-800 flex-shrink-0"
                onClick={retryAnalysis}
              >
                다시 시도
              </button>
            </div>
            <DataTable columns={columns} data={rawData} />
          </div>
        );

      default:
        return <DropZone />;
    }
  };

  const showNewFileButton = status === 'done' || (status === 'error' && rawData.length > 0);

  return (
    <>
      {serverStatus === 'warming' && (
        <div className="fixed top-0 inset-x-0 bg-amber-50 text-amber-800 text-sm text-center py-2 z-50">
          분석 서버에 연결 중... (최대 60초 소요될 수 있습니다)
        </div>
      )}
      <main className="min-h-screen bg-surface text-text font-sans">
        <div className="max-w-5xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-primary">DataLens</h1>
              <p className="text-text-muted mt-1">데이터 파일을 드롭하면 즉시 인사이트를 제공합니다.</p>
            </div>
            {showNewFileButton && (
              <button
                type="button"
                className="px-4 py-2 text-sm font-medium border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                onClick={resetStore}
              >
                새 파일 업로드
              </button>
            )}
          </div>

          {renderContent()}
        </div>
      </main>
    </>
  );
}

export default App;
