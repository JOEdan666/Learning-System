import type { PartnerAsset } from '@/app/types/partner';

interface AssetCardsProps {
  assets: PartnerAsset[];
  onDelete: (id: string) => void;
}

export default function AssetCards({ assets, onDelete }: AssetCardsProps) {
  if (!assets.length) {
    return (
      <div className="text-sm text-gray-500 text-center py-10">暂无 Assets</div>
    );
  }

  return (
    <div className="space-y-4">
      {assets.map(asset => (
        <div
          key={asset.id}
          className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div className="text-xs font-semibold uppercase text-emerald-700">
              {asset.type}
            </div>
            {asset.id && (
              <button
                className="text-xs text-red-500 hover:text-red-600"
                onClick={() => onDelete(asset.id!)}
              >
                删除
              </button>
            )}
          </div>
          <div className="mt-2 text-sm font-medium text-gray-900">
            {asset.title}
          </div>
          <div className="mt-2 text-xs text-gray-600 whitespace-pre-wrap">
            {asset.content?.summary || asset.content?.text || JSON.stringify(asset.content || {})}
          </div>
          {asset.actionItems && asset.actionItems.length > 0 && (
            <div className="mt-3 space-y-1 text-xs text-gray-600">
              {asset.actionItems.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span>{item.text}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
