'use client';

import { useTreeStore } from "@/app/store/useTreeStore";
import { memo, useCallback, useMemo } from "react";

// 定数定義
const BUTTON_STYLES = {
  base: 'px-3 py-1 text-sm text-white rounded transition-colors font-medium',
  variants: {
    expand: 'bg-green-500 hover:bg-green-600',
    collapse: 'bg-yellow-500 hover:bg-yellow-600',
    reset: 'bg-red-500 hover:bg-red-600'
  }
} as const;

const UI_TEXT = {
  buttons: {
    expandAll: '全て展開',
    collapseAll: '全て折りたたみ',
    reset: 'リセット'
  },
  tooltips: {
    expandAll: '全てのフォルダを展開します',
    collapseAll: '全てのフォルダを折りたたみます（ルート除く）',
    reset: 'ツリーを初期状態にリセットします'
  }
} as const;

// ボタンの設定データ
type ButtonConfig = {
  key: string;
  label: string;
  tooltip: string;
  variant: keyof typeof BUTTON_STYLES.variants;
  action: () => void;
}

// カスタムフック：ボタン設定
const useToolbarButtons = (): ButtonConfig[] => {
  const { expandAll, collapseAll, resetStore } = useTreeStore();

  return useMemo(() => [
    {
      key: 'expand',
      label: UI_TEXT.buttons.expandAll,
      tooltip: UI_TEXT.tooltips.expandAll,
      variant: 'expand' as const,
      action: expandAll
    },
    {
      key: 'collapse',
      label: UI_TEXT.buttons.collapseAll,
      tooltip: UI_TEXT.tooltips.collapseAll,
      variant: 'collapse' as const,
      action: collapseAll
    },
    {
      key: 'reset',
      label: UI_TEXT.buttons.reset,
      tooltip: UI_TEXT.tooltips.reset,
      variant: 'reset' as const,
      action: resetStore
    }
  ], [expandAll, collapseAll, resetStore]);
};

// サブコンポーネント：ツールバーボタン
const ToolbarButton: React.FC<{
  config: ButtonConfig;
}> = memo(({ config }) => {
  const handleClick = useCallback(() => {
    config.action();
  }, [config.action]);

  return (
    <button
      onClick={handleClick}
      className={`${BUTTON_STYLES.base} ${BUTTON_STYLES.variants[config.variant]}`}
      title={config.tooltip}
      type="button"
    >
      {config.label}
    </button>
  );
});

ToolbarButton.displayName = 'ToolbarButton';

// メインコンポーネント
const TreeToolbar: React.FC = () => {
  const buttons = useToolbarButtons();

  return (
    <div className="flex items-center space-x-2 mb-4">
      {buttons.map((buttonConfig) => (
        <ToolbarButton
          key={buttonConfig.key}
          config={buttonConfig}
        />
      ))}
    </div>
  );
};

export default TreeToolbar;