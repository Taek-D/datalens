import { useEffect, useState } from 'react';
import { apiClient } from './api/client';

type ServerStatus = 'idle' | 'warming' | 'ready' | 'error';

function App() {
  const [serverStatus, setServerStatus] = useState<ServerStatus>('idle');

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

  return (
    <>
      {serverStatus === 'warming' && (
        <div className="fixed top-0 inset-x-0 bg-amber-50 text-amber-800 text-sm text-center py-2">
          분석 서버에 연결 중... (최대 60초 소요될 수 있습니다)
        </div>
      )}
      <main className="min-h-screen bg-surface text-text font-sans">
        <div className="max-w-5xl mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold text-primary mb-2">DataLens</h1>
          <p className="text-text-muted">데이터 파일을 드롭하면 즉시 인사이트를 제공합니다.</p>
        </div>
      </main>
    </>
  );
}

export default App;
