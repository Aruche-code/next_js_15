'use client';

import { NodesMap, NodeType, useTreeStore } from "@/app/store/useTreeStore";
import { ChevronDown, ChevronRight, File, Folder } from 'lucide-react';
import React, { useCallback, useMemo, useState } from "react";
// import React from "react";

// 定数定義
const TREE_CONFIG = {
    indentSize: 20,
    basePadding: 8,
    iconSize: 16
} as const;

const UI_TEXT = {
    deleteConfirm: (name: string) => `「${name}」を削除しますか？`,
    placeholders: {
        name: '名前を入力'
    },
    buttons: {
        add: '追加',
        cancel: 'キャンセル',
        addTooltip: '追加',
        deleteTooltip: '削除'
    },
    options: {
        file: 'ファイル',
        folder: 'フォルダ'
    }
} as const;

// 型定義
type TreeNodeProps = {
    nodeId: string;
    level?: number;
}

type NodeState = {
    isExpanded: boolean;
    isSelected: boolean;
    hasChildren: boolean;
    isFolder: boolean;
}

type AddFormData = {
    name: string;
    type: NodeType;
}

// セレクター関数（パフォーマンス最適化）
const useExpandedNodes = (): Set<string> => useTreeStore(state => state.expandedNodes);
const useSelectedNode = (): string | null => useTreeStore(state => state.selectedNode);
const useNodes = (): NodesMap => useTreeStore(state => state.nodes);

// カスタムフック：ノード状態
const useNodeState = (nodeId: string, expandedNodes: Set<string>, selectedNode: string | null): NodeState | null => {
    const nodes = useNodes();
    const node = nodes[nodeId];

    return useMemo(() => {
        if (!node) return null;

        return {
            isExpanded: expandedNodes.has(nodeId),
            isSelected: selectedNode === nodeId,
            hasChildren: node.children.length > 0,
            isFolder: node.type === 'folder'
        };
    }, [node, expandedNodes, selectedNode, nodeId]);
};

// カスタムフック：追加フォーム状態管理
const useAddForm = () => {
    const [showAddForm, setShowAddForm] = useState<boolean>(false);
    const [formData, setFormData] = useState<AddFormData>({
        name: '',
        type: 'file'
    });

    const resetForm = useCallback(() => {
        setFormData({ name: '', type: 'file' });
        setShowAddForm(false);
    }, []);

    const updateFormData = useCallback((updates: Partial<AddFormData>) => {
        setFormData(prev => ({ ...prev, ...updates }));
    }, []);

    return {
        showAddForm,
        setShowAddForm,
        formData,
        updateFormData,
        resetForm
    };
};

// ユーティリティ関数
const calculatePadding = (level: number): string => {
    return `${level * TREE_CONFIG.indentSize + TREE_CONFIG.basePadding}px`;
};

// サブコンポーネント：ノードアイコン
const NodeIcon: React.FC<{
    isFolder: boolean;
    isExpanded: boolean;
    hasChildren: boolean;
    onToggle: (e: React.MouseEvent<HTMLDivElement>) => void;
}> = ({ isFolder, isExpanded, hasChildren, onToggle }) => (
    <div
        className="flex items-center justify-center w-4 h-4 mr-1"
        onClick={onToggle}
    >
        {isFolder && hasChildren && (
            isExpanded ? (
                <ChevronDown size={TREE_CONFIG.iconSize} className="text-gray-600" />
            ) : (
                <ChevronRight size={TREE_CONFIG.iconSize} className="text-gray-600" />
            )
        )}
    </div>
);

// サブコンポーネント：ファイル/フォルダアイコン
const TypeIcon: React.FC<{ isFolder: boolean }> = ({ isFolder }) => (
    <div className="flex items-center mr-2">
        {isFolder ? (
            <Folder size={TREE_CONFIG.iconSize} className="text-blue-600 mr-1" />
        ) : (
            <File size={TREE_CONFIG.iconSize} className="text-gray-600 mr-1" />
        )}
    </div>
);

// サブコンポーネント：アクションボタン
const ActionButtons: React.FC<{
    isFolder: boolean;
    canDelete: boolean;
    onAdd: () => void;
    onDelete: () => void;
}> = ({ isFolder, canDelete, onAdd, onDelete }) => (
    <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {isFolder && (
            <button
                onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                    e.stopPropagation();
                    onAdd();
                }}
                className="p-1 text-gray-500 hover:text-blue-600 rounded"
                title={UI_TEXT.buttons.addTooltip}
            >
                +
            </button>
        )}
        {canDelete && (
            <button
                onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                    e.stopPropagation();
                    onDelete();
                }}
                className="p-1 text-gray-500 hover:text-red-600 rounded"
                title={UI_TEXT.buttons.deleteTooltip}
            >
                ×
            </button>
        )}
    </div>
);

// サブコンポーネント：追加フォーム
const AddForm: React.FC<{
    level: number;
    formData: AddFormData;
    onUpdateFormData: (updates: Partial<AddFormData>) => void;
    onSubmit: () => void;
    onCancel: () => void;
    onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}> = ({ level, formData, onUpdateFormData, onSubmit, onCancel, onKeyDown }) => (
    <div
        className="ml-4 p-2 bg-gray-50 rounded border"
        style={{ marginLeft: calculatePadding(level + 1) }}
    >
        <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }} className="space-y-2">
            <input
                type="text"
                value={formData.name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    onUpdateFormData({ name: e.target.value })
                }
                placeholder={UI_TEXT.placeholders.name}
                className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:border-blue-500"
                autoFocus
                onKeyDown={onKeyDown}
            />
            <div className="flex items-center space-x-2">
                <select
                    value={formData.type}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                        onUpdateFormData({ type: e.target.value as NodeType })
                    }
                    className="px-2 py-1 text-sm border rounded focus:outline-none focus:border-blue-500"
                >
                    <option value="file">{UI_TEXT.options.file}</option>
                    <option value="folder">{UI_TEXT.options.folder}</option>
                </select>
                <button
                    type="submit"
                    className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                    {UI_TEXT.buttons.add}
                </button>
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-3 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600"
                >
                    {UI_TEXT.buttons.cancel}
                </button>
            </div>
        </form>
    </div>
);

// サブコンポーネント：子ノード一覧
const ChildNodes: React.FC<{
    children: string[];
    level: number;
}> = ({ children, level }) => (
    <div>
        {children.map((childId: string) => (
            <div key={childId} className="group">
                <TreeNode nodeId={childId} level={level + 1} />
            </div>
        ))}
    </div>
);

// メインコンポーネント
const TreeNode: React.FC<TreeNodeProps> = ({ nodeId, level = 0 }) => {
    const nodes = useNodes();
    const expandedNodes = useExpandedNodes();
    const selectedNode = useSelectedNode();
    const { toggleNode, selectNode, addNode, deleteNode } = useTreeStore();

    const node = nodes[nodeId];
    const nodeState = useNodeState(nodeId, expandedNodes, selectedNode);
    const addForm = useAddForm();

    // ノードが存在しない場合は何も表示しない
    if (!node || !nodeState) return null;

    const { isExpanded, isSelected, hasChildren, isFolder } = nodeState;

    // イベントハンドラー
    const handleToggle = React.useCallback((e: React.MouseEvent<HTMLDivElement>): void => {
        e.stopPropagation();
        if (isFolder) {
            toggleNode(nodeId);
        }
    }, [isFolder, toggleNode, nodeId]);

    const handleSelect = useCallback((): void => {
        selectNode(nodeId);
    }, [selectNode, nodeId]);

    const handleAddNode = useCallback((): void => {
        if (addForm.formData.name.trim()) {
            addNode(nodeId, addForm.formData.name.trim(), addForm.formData.type);
            addForm.resetForm();
            if (!isExpanded && isFolder) {
                toggleNode(nodeId);
            }
        }
    }, [addForm, nodeId, addNode, isExpanded, isFolder, toggleNode]);

    const handleDelete = useCallback((): void => {
        if (confirm(UI_TEXT.deleteConfirm(node.name))) {
            deleteNode(nodeId);
        }
    }, [node.name, deleteNode, nodeId]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>): void => {
        if (e.key === 'Enter') {
            handleAddNode();
        } else if (e.key === 'Escape') {
            addForm.resetForm();
        }
    }, [handleAddNode, addForm]);

    return (
        <div className="select-none">
            <div
                className={`flex items-center py-1 px-2 hover:bg-gray-100 cursor-pointer rounded transition-colors ${isSelected ? 'bg-blue-100 border-l-4 border-blue-500' : ''
                    }`}
                style={{ paddingLeft: calculatePadding(level) }}
                onClick={handleSelect}
            >
                <NodeIcon
                    isFolder={isFolder}
                    isExpanded={isExpanded}
                    hasChildren={hasChildren}
                    onToggle={handleToggle}
                />

                <TypeIcon isFolder={isFolder} />

                <span className="flex-1 text-sm">{node.name}</span>

                <ActionButtons
                    isFolder={isFolder}
                    canDelete={!!node.parentId}
                    onAdd={() => addForm.setShowAddForm(true)}
                    onDelete={handleDelete}
                />
            </div>

            {addForm.showAddForm && (
                <AddForm
                    level={level}
                    formData={addForm.formData}
                    onUpdateFormData={addForm.updateFormData}
                    onSubmit={handleAddNode}
                    onCancel={addForm.resetForm}
                    onKeyDown={handleKeyDown}
                />
            )}

            {isFolder && isExpanded && hasChildren && (
                <ChildNodes children={node.children} level={level} />
            )}
        </div>
    );
};

export default TreeNode;