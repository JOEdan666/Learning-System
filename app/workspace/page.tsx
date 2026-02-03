'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import SessionList from './components/SessionList';
import SessionDetail from './components/SessionDetail';
import AssetCards from './components/AssetCards';
import type { PartnerSessionSummary, PartnerSessionDetail, PartnerAsset } from '@/app/types/partner';

function WorkspaceContent() {
  const searchParams = useSearchParams();
  const presetSession = searchParams.get('session');

  const [sessions, setSessions] = useState<PartnerSessionSummary[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<PartnerSessionDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [modeFilter, setModeFilter] = useState('');
  const [domainFilter, setDomainFilter] = useState('');

  useEffect(() => {
    if (presetSession) {
      setSelectedId(presetSession);
    }
  }, [presetSession]);

  useEffect(() => {
    fetchSessions();
  }, [query, modeFilter, domainFilter]);

  useEffect(() => {
    if (selectedId) {
      fetchDetail(selectedId);
    } else {
      setDetail(null);
    }
  }, [selectedId]);

  const domainOptions = useMemo(() => {
    const set = new Set<string>();
    sessions.forEach(session => {
      if (session.pageDomain) set.add(session.pageDomain);
    });
    return Array.from(set);
  }, [sessions]);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (query) params.set('query', query);
      if (modeFilter) params.set('mode', modeFilter);
      if (domainFilter) params.set('domain', domainFilter);

      const res = await fetch(`/api/partner/session?${params.toString()}`);
      if (!res.ok) return;
      const data = await res.json();
      const list = data.sessions || [];
      setSessions(list);

      if (!presetSession) {
        if (!selectedId || !list.some((item: PartnerSessionSummary) => item.id === selectedId)) {
          setSelectedId(list[0]?.id || null);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchDetail = async (id: string) => {
    try {
      const res = await fetch(`/api/partner/session/${id}`);
      if (!res.ok) {
        setDetail(null);
        return;
      }
      const data = await res.json();
      setDetail(data);
    } catch {
      setDetail(null);
    }
  };

  const handleDeleteAsset = async (id: string) => {
    await fetch(`/api/partner/asset/${id}`, { method: 'DELETE' });
    setDetail(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        assets: prev.assets.filter((asset: PartnerAsset) => asset.id !== id),
      };
    });
  };

  return (
    <div className="min-h-screen bg-[#f6f1e9] text-gray-900">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold">🧠 Workspace</h1>
            <p className="text-sm text-gray-600">Sessions · Detail · Assets</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <input
              className="rounded-full border border-gray-300 bg-white px-4 py-2 text-sm focus:border-emerald-400 focus:outline-none"
              placeholder="搜索 topic / url / message"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            <select
              className="rounded-full border border-gray-300 bg-white px-3 py-2 text-sm"
              value={modeFilter}
              onChange={(event) => setModeFilter(event.target.value)}
            >
              <option value="">All Modes</option>
              <option value="Study">Study</option>
              <option value="Work">Work</option>
              <option value="Brainstorm">Brainstorm</option>
            </select>
            <select
              className="rounded-full border border-gray-300 bg-white px-3 py-2 text-sm"
              value={domainFilter}
              onChange={(event) => setDomainFilter(event.target.value)}
            >
              <option value="">All Domains</option>
              {domainOptions.map(domain => (
                <option key={domain} value={domain}>{domain}</option>
              ))}
            </select>
          </div>
        </header>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[280px_minmax(0,1fr)_320px]">
          <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-500 uppercase">Sessions</h2>
              {loading && <span className="text-xs text-gray-400">加载中...</span>}
            </div>
            <SessionList
              sessions={sessions}
              selectedId={selectedId}
              onSelect={setSelectedId}
            />
          </section>

          <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-500 uppercase mb-4">Session Detail</h2>
            <SessionDetail detail={detail} />
          </section>

          <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-500 uppercase mb-4">Assets</h2>
            <AssetCards assets={detail?.assets || []} onDelete={handleDeleteAsset} />
          </section>
        </div>
      </div>
    </div>
  );
}

export default function WorkspacePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#f6f1e9] text-gray-700 flex items-center justify-center">
          <div className="text-center space-y-3">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500 mx-auto" aria-hidden />
            <p className="text-sm">正在加载 Workspace...</p>
          </div>
        </div>
      }
    >
      <WorkspaceContent />
    </Suspense>
  );
}
