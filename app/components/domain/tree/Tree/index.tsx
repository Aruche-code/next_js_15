'use client';

import { NodesMap, TreeNodeModel, useTreeStore } from "@/app/store/useTreeStore";
import { useMemo } from "react";
import TreeNode from "../TreeNode";
import TreeStatsComponent from "../TreeStats";
import TreeToolbar from "../TreeToolbar";

// 定数定義
const TREE_CONFIG = {
    maxHeight: 'max-h-96',
    containerMaxWidth: 'max-w-6xl',
    gridCols: {
        default: 'grid-cols-1',
        large: 'lg:grid-cols-3'
    }
} as const;

const UI_TEXT = {
    title: 'Zustand ツリーUI',
    fileTree: 'ファイルツリー',
    selectedItem: '選択中のアイテム',
    selectItemPrompt: 'アイテムを選択してください',
    operationTitle: '操作方法',
    operations: [
        'フォルダアイコンまたは矢印をクリックして展開/折りたたみ',
        'アイテム名をクリックして選択',
        'フォルダにマウスを合わせて「+」ボタンで新規追加',
        '「×」ボタンでアイテムを削除（ルートフォルダ以外）',
        'Enterキーで追加、Escapeキーでキャンセル'
    ]
} as const;

// セレクター関数（パフォーマンス最適化）
const useSelectedNode = (): string | null => useTreeStore(state => state.selectedNode);
const useNodes = (): NodesMap => useTreeStore(state => state.nodes);

// カスタムフック：ルートノード取得
const useRootNodes = (nodes: NodesMap): TreeNodeModel[] => {
    return useMemo(() =>
        Object.values(nodes).filter(node => node.parentId === null),
        [nodes]
    );
};

// カスタムフック：選択ノード詳細取得
const useSelectedNodeDetails = (selectedNode: string | null, nodes: NodesMap) => {
    return useMemo(() => {
        if (!selectedNode || !nodes[selectedNode]) return null;

        const node = nodes[selectedNode];
        return {
            name: node.name,
            type: node.type === 'folder' ? 'フォルダ' : 'ファイル',
            id: selectedNode,
            childrenCount: node.children.length
        };
    }, [selectedNode, nodes]);
};

// サブコンポーネント：選択アイテム詳細
const SelectedItemDetails: React.FC<{
    selectedNode: string | null;
    nodes: NodesMap;
}> = ({ selectedNode, nodes }) => {
    const nodeDetails = useSelectedNodeDetails(selectedNode, nodes);

    if (!nodeDetails) {
        return (
            <div className="bg-gray-50 p-4 rounded text-gray-500 text-center text-sm">
                {UI_TEXT.selectItemPrompt}
            </div>
        );
    }

    return (
        <div className="bg-gray-50 p-4 rounded">
            <div className="space-y-2 text-sm">
                <p><span className="font-medium">名前:</span> {nodeDetails.name}</p>
                <p><span className="font-medium">タイプ:</span> {nodeDetails.type}</p>
                <p><span className="font-medium">ID:</span> {nodeDetails.id}</p>
                {nodeDetails.childrenCount > 0 && (
                    <p><span className="font-medium">子要素数:</span> {nodeDetails.childrenCount}</p>
                )}
            </div>
        </div>
    );
};

// サブコンポーネント：操作説明
const OperationGuide: React.FC = () => (
    <div className="mt-8 p-4 bg-blue-50 rounded-lg border-l-4 border-blue-400">
        <h3 className="font-semibold text-blue-800 mb-3">{UI_TEXT.operationTitle}</h3>
        <ul className="text-sm text-blue-700 space-y-1">
            {UI_TEXT.operations.map((operation, index) => (
                <li key={index}>• {operation}</li>
            ))}
        </ul>
    </div>
);

// サブコンポーネント：ツリービュー
const TreeView: React.FC<{ rootNodes: TreeNodeModel[] }> = ({ rootNodes }) => (
    <div className="lg:col-span-2 border rounded-lg p-4 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">{UI_TEXT.fileTree}</h2>
        <TreeToolbar />
        <div className={`border rounded bg-gray-50 p-3 ${TREE_CONFIG.maxHeight} overflow-auto`}>
            {rootNodes.map((node: TreeNodeModel) => (
                <TreeNode key={node.id} nodeId={node.id} />
            ))}
        </div>
    </div>
);

// サブコンポーネント：サイドバー
const Sidebar: React.FC<{
    selectedNode: string | null;
    nodes: NodesMap;
}> = ({ selectedNode, nodes }) => (
    <div className="space-y-6">
        <div className="border rounded-lg p-4 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-700 mb-4">{UI_TEXT.selectedItem}</h2>
            <SelectedItemDetails selectedNode={selectedNode} nodes={nodes} />
        </div>

        <div className="border rounded-lg p-4 shadow-sm">
            <TreeStatsComponent />
        </div>
    </div>
);

// メインコンポーネント
const Tree: React.FC = () => {
    const nodes = useNodes();
    const selectedNode = useSelectedNode();
    const rootNodes = useRootNodes(nodes);

    return (
        <div className={`${TREE_CONFIG.containerMaxWidth} mx-auto p-6 bg-white`}>
            <h1 className="text-3xl font-bold text-gray-800 mb-8">{UI_TEXT.title}</h1>

            <div className={`grid ${TREE_CONFIG.gridCols.default} ${TREE_CONFIG.gridCols.large} gap-6`}>
                <TreeView rootNodes={rootNodes} />
                <Sidebar selectedNode={selectedNode} nodes={nodes} />
            </div>

            <OperationGuide />
        </div>
    );
};

export default Tree;