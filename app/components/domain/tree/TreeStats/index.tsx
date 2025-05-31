'use client';

import { NodesMap, useTreeStore } from "@/app/store/useTreeStore";
import React from "react";

// 統計情報の型定義
type TreeStats = {
  totalNodes: number;
  folders: number;
  files: number;
  expandedCount: number;
}

// セレクター関数（パフォーマンス最適化）
const useExpandedNodes = (): Set<string> => useTreeStore(state => state.expandedNodes);
const useNodes = (): NodesMap => useTreeStore(state => state.nodes);

// 統計情報コンポーネント
const TreeStatsComponent: React.FC = () => {
  const nodes = useNodes();
  const expandedNodes = useExpandedNodes();

  const stats: TreeStats = React.useMemo(() => {
    const nodeList = Object.values(nodes);
    return {
      totalNodes: nodeList.length,
      folders: nodeList.filter(node => node.type === 'folder').length,
      files: nodeList.filter(node => node.type === 'file').length,
      expandedCount: expandedNodes.size
    };
  }, [nodes, expandedNodes]);

  return (
    <div className="bg-gray-50 p-3 rounded text-sm">
      <h4 className="font-medium text-gray-700 mb-2">統計情報</h4>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>総ノード数: {stats.totalNodes}</div>
        <div>フォルダ数: {stats.folders}</div>
        <div>ファイル数: {stats.files}</div>
        <div>展開中: {stats.expandedCount}</div>
      </div>
    </div>
  );
};

export default TreeStatsComponent;