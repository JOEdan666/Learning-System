import type { PartnerSessionDetail } from '@/app/types/partner';

interface SessionDetailProps {
  detail?: PartnerSessionDetail | null;
}

export default function SessionDetail({ detail }: SessionDetailProps) {
  if (!detail) {
    return (
      <div className="text-sm text-gray-500 text-center py-10">选择左侧 Session 查看详情</div>
    );
  }

  const { session, messages } = detail;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-3 text-sm text-gray-600">
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
            {session.mode}
          </span>
          <span>{session.pageDomain || '未知来源'}</span>
        </div>
        <div className="mt-3 text-lg font-semibold text-gray-900">
          {session.topic || session.pageTitle || '未命名主题'}
        </div>
        <div className="mt-2 text-sm text-gray-500">
          {session.goal || '未设定目标'}
        </div>
        {session.pageUrl && (
          <div className="mt-2 text-xs text-emerald-700 truncate">{session.pageUrl}</div>
        )}
      </div>

      <div className="space-y-4">
        {messages.map(message => (
          <div
            key={message.id}
            className={`rounded-2xl border p-4 ${
              message.role === 'user'
                ? 'border-gray-200 bg-gray-50'
                : 'border-emerald-200 bg-emerald-50'
            }`}
          >
            <div className="text-xs font-semibold uppercase text-gray-500">
              {message.role === 'user' ? 'User' : 'Assistant'}
            </div>
            {message.role === 'assistant' ? (
              <AssistantContent contentJson={message.contentJson} fallback={message.content} />
            ) : (
              <div className="mt-2 text-sm text-gray-800 whitespace-pre-wrap">
                {message.content || '—'}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function AssistantContent({ contentJson, fallback }: { contentJson?: any; fallback?: string }) {
  if (!contentJson) {
    return (
      <div className="mt-2 text-sm text-gray-800 whitespace-pre-wrap">{fallback || '—'}</div>
    );
  }

  return (
    <div className="mt-3 space-y-4 text-sm text-gray-800">
      {Array.isArray(contentJson.tldr) && (
        <div>
          <div className="text-xs font-semibold text-gray-500 mb-2">TL;DR</div>
          <ul className="list-disc list-inside space-y-1">
            {contentJson.tldr.map((item: string, index: number) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </div>
      )}

      {Array.isArray(contentJson.reasoning_points) && (
        <div>
          <div className="text-xs font-semibold text-gray-500 mb-2">理由</div>
          <ul className="list-disc list-inside space-y-1">
            {contentJson.reasoning_points.map((item: string, index: number) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </div>
      )}

      {Array.isArray(contentJson.action_items) && (
        <div>
          <div className="text-xs font-semibold text-gray-500 mb-2">行动项</div>
          <ul className="space-y-1">
            {contentJson.action_items.map((item: any, index: number) => (
              <li key={index} className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <span>{item.text || item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {Array.isArray(contentJson.citations) && contentJson.citations.length > 0 && (
        <div>
          <div className="text-xs font-semibold text-gray-500 mb-2">引用</div>
          <div className="space-y-2">
            {contentJson.citations.map((cite: any, index: number) => (
              <div key={index} className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs">
                <div className="text-gray-700">{cite.quote}</div>
                <div className="text-amber-700 mt-1">{cite.source || cite.ref}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
