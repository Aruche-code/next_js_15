'use client';

import { NodesMap, useTreeStore } from "@/app/store/useTreeStore";
import { memo, useMemo } from "react";

// 定数定義
const UI_TEXT = {
  title: '統計情報',
  labels: {
    totalNodes: '総ノード数',
    folders: 'フォルダ数',
    files: 'ファイル数',
    expanded: '展開中'
  }
} as const;

// 統計情報の型定義
type TreeStats = {
  totalNodes: number;
  folders: number;
  files: number;
  expandedCount: number;
}

type StatItemProps = {
  label: string;
  value: number;
}

// セレクター関数（パフォーマンス最適化）
const useExpandedNodes = (): Set<string> => useTreeStore(state => state.expandedNodes);
const useNodes = (): NodesMap => useTreeStore(state => state.nodes);

// カスタムフック：統計情報計算
const useTreeStats = (nodes: NodesMap, expandedNodes: Set<string>): TreeStats => {
  return useMemo(() => {
    const nodeList = Object.values(nodes);

    return {
      totalNodes: nodeList.length,
      folders: nodeList.filter(node => node.type === 'folder').length,
      files: nodeList.filter(node => node.type === 'file').length,
      expandedCount: expandedNodes.size
    };
  }, [nodes, expandedNodes]);
};

// サブコンポーネント：統計項目
const StatItem: React.FC<StatItemProps> = memo(({ label, value }) => (
  <div className="flex justify-between items-center">
    <span className="text-gray-600">{label}:</span>
    <span className="font-medium text-gray-800">{value}</span>
  </div>
));

StatItem.displayName = 'StatItem';

// 統計項目の配列を生成する関数
const getStatItems = (stats: TreeStats): StatItemProps[] => [
  { label: UI_TEXT.labels.totalNodes, value: stats.totalNodes },
  { label: UI_TEXT.labels.folders, value: stats.folders },
  { label: UI_TEXT.labels.files, value: stats.files },
  { label: UI_TEXT.labels.expanded, value: stats.expandedCount }
];

// メインコンポーネント
const TreeStatsComponent: React.FC = () => {
  const nodes = useNodes();
  const expandedNodes = useExpandedNodes();
  const stats = useTreeStats(nodes, expandedNodes);
  const statItems = useMemo(() => getStatItems(stats), [stats]);

  return (
    <div className="bg-gray-50 p-4 rounded">
      <h4 className="font-medium text-gray-700 mb-3">{UI_TEXT.title}</h4>
      <div className="space-y-2 text-sm">
        {statItems.map((item, index) => (
          <StatItem
            key={`${item.label}-${index}`}
            label={item.label}
            value={item.value}
          />
        ))}
      </div>
    </div>
  );
};

export default TreeStatsComponent;