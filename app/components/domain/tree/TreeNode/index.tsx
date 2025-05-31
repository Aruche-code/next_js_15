'use client';

import { NodesMap, NodeType, useTreeStore } from "@/app/store/useTreeStore";
import { ChevronDown, ChevronRight, File, Folder } from 'lucide-react';
import React from "react";

// セレクター関数（パフォーマンス最適化）
const useExpandedNodes = (): Set<string> => useTreeStore(state => state.expandedNodes);
const useSelectedNode = (): string | null => useTreeStore(state => state.selectedNode);
const useNodes = (): NodesMap => useTreeStore(state => state.nodes);

// TreeNodeコンポーネントのProps型定義
type TreeNodeProps = {
    nodeId: string;
    level?: number;
}

// ツリーノードコンポーネント
const TreeNode: React.FC<TreeNodeProps> = ({ nodeId, level = 0 }) => {
    const nodes = useNodes();
    const expandedNodes = useExpandedNodes();
    const selectedNode = useSelectedNode();
    const { toggleNode, selectNode, addNode, deleteNode } = useTreeStore();

    const [showAddForm, setShowAddForm] = React.useState<boolean>(false);
    const [newNodeName, setNewNodeName] = React.useState<string>('');
    const [newNodeType, setNewNodeType] = React.useState<NodeType>('file');

    const node = nodes[nodeId];
    if (!node) return null;

    const isExpanded: boolean = expandedNodes.has(nodeId);
    const isSelected: boolean = selectedNode === nodeId;
    const hasChildren: boolean = node.children.length > 0;
    const isFolder: boolean = node.type === 'folder';

    const handleToggle = (e: React.MouseEvent<HTMLDivElement>): void => {
        e.stopPropagation();
        if (isFolder) {
            toggleNode(nodeId);
        }
    };

    const handleSelect = (): void => {
        selectNode(nodeId);
    };

    const handleAddNode = (e: React.FormEvent<HTMLFormElement> | React.MouseEvent<HTMLButtonElement>): void => {
        e.preventDefault();
        if (newNodeName.trim()) {
            addNode(nodeId, newNodeName.trim(), newNodeType);
            setNewNodeName('');
            setShowAddForm(false);
            if (!isExpanded && isFolder) {
                toggleNode(nodeId);
            }
        }
    };

    const handleDelete = (e: React.MouseEvent<HTMLButtonElement>): void => {
        e.stopPropagation();
        if (confirm(`「${node.name}」を削除しますか？`)) {
            deleteNode(nodeId);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
        if (e.key === 'Enter') {
            handleAddNode(e as any);
        } else if (e.key === 'Escape') {
            setShowAddForm(false);
        }
    };

    return (
        <div className="select-none">
            <div
                className={`flex items-center py-1 px-2 hover:bg-gray-100 cursor-pointer rounded transition-colors ${isSelected ? 'bg-blue-100 border-l-4 border-blue-500' : ''
                    }`}
                style={{ paddingLeft: `${level * 20 + 8}px` }}
                onClick={handleSelect}
            >
                <div
                    className="flex items-center justify-center w-4 h-4 mr-1"
                    onClick={handleToggle}
                >
                    {isFolder && hasChildren && (
                        isExpanded ? (
                            <ChevronDown size={16} className="text-gray-600" />
                        ) : (
                            <ChevronRight size={16} className="text-gray-600" />
                        )
                    )}
                </div>

                <div className="flex items-center mr-2">
                    {isFolder ? (
                        <Folder size={16} className="text-blue-600 mr-1" />
                    ) : (
                        <File size={16} className="text-gray-600 mr-1" />
                    )}
                </div>

                <span className="flex-1 text-sm">{node.name}</span>

                <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {isFolder && (
                        <button
                            onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                                e.stopPropagation();
                                setShowAddForm(true);
                            }}
                            className="p-1 text-gray-500 hover:text-blue-600 rounded"
                            title="追加"
                        >
                            +
                        </button>
                    )}
                    {node.parentId && (
                        <button
                            onClick={handleDelete}
                            className="p-1 text-gray-500 hover:text-red-600 rounded"
                            title="削除"
                        >
                            ×
                        </button>
                    )}
                </div>
            </div>

            {showAddForm && (
                <div
                    className="ml-4 p-2 bg-gray-50 rounded border"
                    style={{ marginLeft: `${(level + 1) * 20 + 8}px` }}
                >
                    <form onSubmit={handleAddNode} className="space-y-2">
                        <input
                            type="text"
                            value={newNodeName}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewNodeName(e.target.value)}
                            placeholder="名前を入力"
                            className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:border-blue-500"
                            autoFocus
                            onKeyDown={handleKeyDown}
                        />
                        <div className="flex items-center space-x-2">
                            <select
                                value={newNodeType}
                                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setNewNodeType(e.target.value as NodeType)}
                                className="px-2 py-1 text-sm border rounded focus:outline-none focus:border-blue-500"
                            >
                                <option value="file">ファイル</option>
                                <option value="folder">フォルダ</option>
                            </select>
                            <button
                                type="submit"
                                className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                            >
                                追加
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowAddForm(false)}
                                className="px-3 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600"
                            >
                                キャンセル
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {isFolder && isExpanded && hasChildren && (
                <div>
                    {node.children.map((childId: string) => (
                        <div key={childId} className="group">
                            <TreeNode nodeId={childId} level={level + 1} />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default TreeNode;