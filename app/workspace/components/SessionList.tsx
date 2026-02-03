import type { PartnerSessionSummary } from '@/app/types/partner';

interface SessionListProps {
  sessions: PartnerSessionSummary[];
  selectedId?: string | null;
  onSelect: (id: string) => void;
}

function formatTime(iso: string) {
  const date = new Date(iso);
  return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
}

function formatDate(iso: string) {
  const date = new Date(iso);
  return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
}

export default function SessionList({ sessions, selectedId, onSelect }: SessionListProps) {
  if (!sessions.length) {
    return (
      <div className="text-sm text-gray-500 text-center py-10">暂无 Session</div>
    );
  }

  return (
    <div className="space-y-3">
      {sessions.map(session => (
        <button
          key={session.id}
          className={`w-full text-left rounded-xl border p-3 transition ${
            selectedId === session.id
              ? 'border-emerald-500 bg-emerald-50'
              : 'border-gray-200 hover:border-emerald-300'
          }`}
          onClick={() => onSelect(session.id)}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-emerald-700">
              {session.mode}
            </span>
            <span className="text-xs text-gray-400">
              {formatDate(session.createdAt)} {formatTime(session.createdAt)}
            </span>
          </div>
          <div className="mt-2 text-sm font-medium text-gray-900 truncate">
            {session.topic || session.pageTitle || '未命名主题'}
          </div>
          <div className="mt-1 text-xs text-gray-500 truncate">
            {session.pageDomain || '未知来源'} · {session.messageCount} msgs · {session.assetCount} assets
          </div>
          <div className="mt-2 text-xs text-gray-400">
            {session.status}
          </div>
        </button>
      ))}
    </div>
  );
}
