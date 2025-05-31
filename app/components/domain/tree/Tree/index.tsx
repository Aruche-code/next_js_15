'use client';

import { NodesMap, TreeNodeModel, useTreeStore } from "@/app/store/useTreeStore";
import React from "react";
import TreeNode from "../TreeNode";
import TreeStatsComponent from "../TreeStats";
import TreeToolbar from "../TreeToolbar";

// セレクター関数（パフォーマンス最適化）
const useSelectedNode = (): string | null => useTreeStore(state => state.selectedNode);
const useNodes = (): NodesMap => useTreeStore(state => state.nodes);

// メインコンポーネント
const Tree: React.FC = () => {
    const nodes = useNodes();
    const selectedNode = useSelectedNode();

    const rootNodes: TreeNodeModel[] = React.useMemo(() =>
        Object.values(nodes).filter(node => node.parentId === null),
        [nodes]
    );

    return (
        <div className="max-w-6xl mx-auto p-6 bg-white">
            <h1 className="text-3xl font-bold text-gray-800 mb-8">Zustand ツリーUI</h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 border rounded-lg p-4 shadow-sm">
                    <h2 className="text-lg font-semibold text-gray-700 mb-4">ファイルツリー</h2>
                    <TreeToolbar />
                    <div className="border rounded bg-gray-50 p-3 max-h-96 overflow-auto">
                        {rootNodes.map((node: TreeNodeModel) => (
                            <TreeNode key={node.id} nodeId={node.id} />
                        ))}
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="border rounded-lg p-4 shadow-sm">
                        <h2 className="text-lg font-semibold text-gray-700 mb-4">選択中のアイテム</h2>
                        {selectedNode ? (
                            <div className="bg-gray-50 p-4 rounded">
                                <div className="space-y-2 text-sm">
                                    <p><span className="font-medium">名前:</span> {nodes[selectedNode]?.name}</p>
                                    <p><span className="font-medium">タイプ:</span> {nodes[selectedNode]?.type === 'folder' ? 'フォルダ' : 'ファイル'}</p>
                                    <p><span className="font-medium">ID:</span> {selectedNode}</p>
                                    {nodes[selectedNode]?.children.length > 0 && (
                                        <p><span className="font-medium">子要素数:</span> {nodes[selectedNode].children.length}</p>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="bg-gray-50 p-4 rounded text-gray-500 text-center text-sm">
                                アイテムを選択してください
                            </div>
                        )}
                    </div>

                    <div className="border rounded-lg p-4 shadow-sm">
                        <TreeStatsComponent />
                    </div>
                </div>
            </div>

            <div className="mt-8 p-4 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                <h3 className="font-semibold text-blue-800 mb-3">操作方法</h3>
                <ul className="text-sm text-blue-700 space-y-1">
                    <li>• フォルダアイコンまたは矢印をクリックして展開/折りたたみ</li>
                    <li>• アイテム名をクリックして選択</li>
                    <li>• フォルダにマウスを合わせて「+」ボタンで新規追加</li>
                    <li>• 「×」ボタンでアイテムを削除（ルートフォルダ以外）</li>
                    <li>• Enterキーで追加、Escapeキーでキャンセル</li>
                </ul>
            </div>
        </div>
    );
};

export default Tree;