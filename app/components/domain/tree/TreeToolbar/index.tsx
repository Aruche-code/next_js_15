'use client';

import { useTreeStore } from "@/app/store/useTreeStore";

// ツールバーコンポーネント
const TreeToolbar: React.FC = () => {
  const { expandAll, collapseAll, resetStore } = useTreeStore();

  return (
    <div className="flex items-center space-x-2 mb-4">
      <button
        onClick={expandAll}
        className="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
      >
        全て展開
      </button>
      <button
        onClick={collapseAll}
        className="px-3 py-1 text-sm bg-yellow-500 text-white rounded hover:bg-yellow-600 transition-colors"
      >
        全て折りたたみ
      </button>
      <button
        onClick={resetStore}
        className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
      >
        リセット
      </button>
    </div>
  );
};

export default TreeToolbar;