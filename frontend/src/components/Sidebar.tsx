import { memo, useState, useCallback } from 'react';

interface NavItem {
  id: string;
  label: string;
  path: string;
}

const ANALYSIS_NAV: NavItem[] = [
  { id: 'overview', label: '데이터 개요', path: 'M3 3h7v7H3V3zm11 0h7v7h-7V3zm0 11h7v7h-7v-7zM3 14h7v7H3v-7z' },
  { id: 'quality', label: '품질 알림', path: 'M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z' },
  { id: 'stats', label: '컬럼 통계', path: 'M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5' },
  { id: 'distributions', label: '분포 차트', path: 'M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z' },
  { id: 'correlation', label: '상관관계', path: 'M7.5 14.25v2.25m3-4.5v4.5m3-6.75v6.75m3-9v9M6 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z' },
  { id: 'outliers', label: '이상값', path: 'M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z' },
];

const DATA_NAV: NavItem[] = [
  { id: 'data-table', label: '미리보기 테이블', path: 'M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h7.5c.621 0 1.125-.504 1.125-1.125m-9.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-7.5A1.125 1.125 0 0112 18.375m9.75-12.75c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125m19.5 0v1.5c0 .621-.504 1.125-1.125 1.125M2.25 5.625v1.5c0 .621.504 1.125 1.125 1.125m0 0h17.25m-17.25 0h7.5c.621 0 1.125.504 1.125 1.125M3.375 8.25c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m17.25-3.75h-7.5c-.621 0-1.125.504-1.125 1.125m8.625-1.125c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h7.5m-7.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125M12 10.875v-1.5m0 1.5c0 .621-.504 1.125-1.125 1.125M12 10.875c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125M12 12h7.5m-7.5 0c-.621 0-1.125.504-1.125 1.125M3.375 12c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m17.25-3.75c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125M3.375 15.75h7.5m-7.5 0c-.621 0-1.125.504-1.125 1.125' },
];

interface SidebarProps {
  onNewFile: () => void;
  fileName?: string;
}

function NavIcon({ path }: { path: string }) {
  return (
    <svg className="w-[18px] h-[18px] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d={path} />
    </svg>
  );
}

export const Sidebar = memo(function Sidebar({ onNewFile, fileName }: SidebarProps) {
  const [active, setActive] = useState('overview');

  const handleClick = useCallback((id: string) => {
    setActive(id);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const linkClass = (id: string) =>
    `w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-primary ${
      active === id
        ? 'bg-primary-light text-primary font-medium'
        : 'text-text-muted hover:bg-surface hover:text-text'
    }`;

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-60 bg-surface-raised border-r border-border flex flex-col z-40" aria-label="사이드바 내비게이션">
      {/* Brand */}
      <div className="px-5 pt-6 pb-4 border-b border-border-light">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
            </svg>
          </div>
          <div>
            <h1 className="text-base font-bold text-text">DataLens</h1>
            <p className="text-[11px] text-text-subtle leading-tight">Dataset Explorer</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto sidebar-scroll">
        <p className="text-[11px] font-semibold text-text-subtle uppercase tracking-wider px-3 mb-2">분석</p>
        <div className="flex flex-col gap-0.5">
          {ANALYSIS_NAV.map((item) => (
            <button key={item.id} type="button" onClick={() => handleClick(item.id)} className={linkClass(item.id)} aria-current={active === item.id ? 'true' : undefined}>
              <NavIcon path={item.path} />
              {item.label}
            </button>
          ))}
        </div>

        <p className="text-[11px] font-semibold text-text-subtle uppercase tracking-wider px-3 mt-5 mb-2">데이터</p>
        <div className="flex flex-col gap-0.5">
          {DATA_NAV.map((item) => (
            <button key={item.id} type="button" onClick={() => handleClick(item.id)} className={linkClass(item.id)} aria-current={active === item.id ? 'true' : undefined}>
              <NavIcon path={item.path} />
              {item.label}
            </button>
          ))}
        </div>
      </nav>

      {/* Bottom */}
      <div className="px-3 pb-4 border-t border-border-light pt-3 space-y-2">
        {fileName && (
          <div className="px-3 py-2.5 bg-surface rounded-lg">
            <p className="text-[11px] text-text-subtle uppercase tracking-wider">현재 파일</p>
            <p className="text-sm text-text font-medium truncate mt-0.5">{fileName}</p>
          </div>
        )}
        <button
          type="button"
          onClick={onNewFile}
          className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-hover transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          새 파일 업로드
        </button>
      </div>
    </aside>
  );
});
