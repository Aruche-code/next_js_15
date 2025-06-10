'use client';

import {
    DndContext,
    DragEndEvent,
    DragOverlay,
    DragStartEvent,
    KeyboardSensor,
    PointerSensor,
    pointerWithin,
    useDraggable,
    useDroppable,
    useSensor,
    useSensors
} from '@dnd-kit/core';
import { ChevronDown, ChevronRight, Folder, FolderOpen } from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Virtuoso } from 'react-virtuoso';

// Types
interface FolderNode {
    id: string;
    name: string;
    parentId: string | null;
    children?: FolderNode[];
    isExpanded?: boolean;
    isLoading?: boolean;
    level?: number;
}

interface FlattenedNode extends FolderNode {
    level: number;
    visible: boolean;
}

// Mock API
const mockFetchChildren = async (parentId: string): Promise<FolderNode[]> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return Array.from({ length: Math.floor(Math.random() * 5) + 2 }, (_, i) => ({
        id: `${parentId}-${i}`,
        name: `Folder ${parentId}-${i}`,
        parentId,
    }));
};

const DropArea: React.FC<{ id: string; height?: number }> = ({ id, height = 2 }) => {
    const { isOver, setNodeRef } = useDroppable({ id });
    return (
        <div
            ref={setNodeRef}
            style={{
                height,
                background: isOver ? '#60a5fa' : undefined,
                transition: 'background 0.15s',
                margin: '0 0 2px 0',
                borderRadius: 3,
            }}
        />
    );
};

const DraggableFolder: React.FC<{
    node: FlattenedNode;
    isSelected: boolean;
    onToggle: (id: string) => void;
    onSelect: (id: string) => void;
    isDragging?: boolean;
}> = ({ node, isSelected, onToggle, onSelect, isDragging }) => {
    const { attributes, listeners, setNodeRef: setDragNodeRef, isDragging: dragging } = useDraggable({ id: node.id });
    const { isOver, setNodeRef: setDropNodeRef } = useDroppable({ id: `drop:folder:${node.id}` });

    // ドラッグ＆ドロップ用refを合成
    const combinedRef = (nodeEl: HTMLDivElement | null) => {
        setDragNodeRef(nodeEl);
        setDropNodeRef(nodeEl);
    };

    const handleRowClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onSelect(node.id);
    };

    const handlePointerDown = (e: React.PointerEvent) => {
        if (listeners?.onPointerDown) listeners.onPointerDown(e);
    };

    const handleToggleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onToggle(node.id);
    };

    return (
        <div
            ref={combinedRef}
            {...attributes}
            {...listeners}
            style={{
                opacity: isDragging || dragging ? 0.5 : 1,
                outline: isSelected ? '2px solid #2563eb' : undefined,
                background: isOver
                    ? "#a5d8ff" // ← ドロップ中ハイライト追加
                    : isSelected
                        ? "#dbeafe"
                        : undefined,
                marginLeft: node.level * 20,
                borderRadius: 6,
                transition: 'background 0.15s'
            }}
            className={
                "flex items-center py-2 px-2 cursor-pointer transition-colors " +
                (isSelected ? "bg-blue-100 hover:bg-blue-200 ring-2 ring-blue-400 ring-inset" : "hover:bg-gray-100")
            }
            onClick={handleRowClick}
            onPointerDown={handlePointerDown}
            role="treeitem"
            aria-selected={isSelected}
            aria-expanded={node.isExpanded}
            aria-level={node.level + 1}
            tabIndex={isSelected ? 0 : -1}
        >
            <button
                type="button"
                onClick={handleToggleClick}
                className="mr-1 p-1 hover:bg-gray-300 rounded transition-colors"
                tabIndex={-1}
                aria-label={node.isExpanded ? "折りたたむ" : "展開する"}
            >
                {node.isLoading ? (
                    <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                ) : node.children !== undefined || node.isExpanded ? (
                    node.isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />
                ) : (
                    <div className="w-4 h-4" />
                )}
            </button>
            {node.isExpanded ? <FolderOpen size={16} className="mr-2" /> : <Folder size={16} className="mr-2" />}
            <span className="select-none">{node.name}</span>
        </div>
    );
};

// DragOverlayContent
const DragOverlayContent: React.FC<{ node: FlattenedNode; flattenedNodes: FlattenedNode[] }> = ({ node, flattenedNodes }) => {
    const MAX_COUNT = 20; // 上限ノード数

    // 再帰的に展開中子孫もすべてリストアップ
    const collectExpanded = (nodeId: string, baseLevel: number, acc: FlattenedNode[] = []): FlattenedNode[] => {
        if (acc.length >= MAX_COUNT) return acc;
        const currentNode = flattenedNodes.find(n => n.id === nodeId);
        if (!currentNode) return acc;

        acc.push(currentNode);
        if (
            currentNode.isExpanded &&
            currentNode.children &&
            currentNode.children.length > 0 &&
            acc.length < MAX_COUNT
        ) {
            for (const child of currentNode.children) {
                if (acc.length >= MAX_COUNT) break;
                collectExpanded(child.id, baseLevel, acc);
            }
        }
        return acc;
    };

    const draggedNodes = collectExpanded(node.id, node.level);
    const baseLevel = node.level;

    return (
        <div className="bg-white shadow-lg rounded border border-gray-300 p-2 opacity-90 min-w-[180px]">
            {draggedNodes.map((n) => (
                <div
                    key={n.id}
                    className="flex items-center py-1"
                    style={{ marginLeft: `${(n.level - baseLevel) * 20}px` }}
                >
                    {n.isExpanded ? <FolderOpen size={16} className="mr-2" /> : <Folder size={16} className="mr-2" />}
                    <span>{n.name}</span>
                </div>
            ))}
            {draggedNodes.length >= MAX_COUNT && (
                <div className="text-xs text-gray-400 italic mt-1">…さらに省略されています</div>
            )}
        </div>
    );
};

function generateFolders(count: number, parentId: string): FolderNode[] {
    return Array.from({ length: count }, (_, i) => ({
        id: `${parentId}-auto-${i + 1}`,
        name: `AutoFolder-${i + 1}`,
        parentId: parentId,
    }));
}

// Main Component
const VirtualTree: React.FC = () => {
    const [folders, setFolders] = useState<FolderNode[]>([
        { id: 'root-1', name: 'Documents', parentId: null, children: generateFolders(5, 'root-1') },
        { id: 'root-2', name: 'Pictures', parentId: null, children: generateFolders(5, 'root-2') },
        { id: 'root-3', name: 'Music', parentId: null, children: generateFolders(5, 'root-3') },
        { id: 'root-4', name: 'Ex', parentId: null, children: generateFolders(10000, 'root-4') },
    ]);
    const [selectedId, setSelectedId] = useState<string | null>('root-1');
    const [activeId, setActiveId] = useState<string | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const virtuosoRef = useRef<any>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5,
            },
        }),
        useSensor(KeyboardSensor, {
            keyboardCodes: {
                start: [],
                cancel: ['Escape'],
                end: [],
            },
        })
    );

    const flattenTree = useCallback((nodes: FolderNode[], level = 0): FlattenedNode[] => {
        const result: FlattenedNode[] = [];
        for (const node of nodes) {
            result.push({
                ...node,
                level,
                visible: true,
            });
            if (node.isExpanded && node.children) {
                result.push(...flattenTree(node.children, level + 1));
            }
        }
        return result;
    }, []);
    const flattenedNodes = useMemo(() => flattenTree(folders), [folders, flattenTree]);

    // 遅延ロード
    const loadChildren = async (nodeId: string) => {
        const updateNode = (nodes: FolderNode[]): FolderNode[] =>
            nodes.map(node =>
                node.id === nodeId
                    ? { ...node, isLoading: true }
                    : node.children
                        ? { ...node, children: updateNode(node.children) }
                        : node
            );
        setFolders(updateNode(folders));
        const children = await mockFetchChildren(nodeId);
        setFolders(prevFolders => {
            const update = (nodes: FolderNode[]): FolderNode[] =>
                nodes.map(node =>
                    node.id === nodeId
                        ? { ...node, children, isLoading: false, isExpanded: true }
                        : node.children
                            ? { ...node, children: update(node.children) }
                            : node
                );
            return update(prevFolders);
        });
    };

    const toggleFolder = async (nodeId: string) => {
        const node = flattenedNodes.find(n => n.id === nodeId);
        if (!node) return;
        if (!node.children && !node.isLoading) {
            await loadChildren(nodeId);
        } else if (!node.isLoading) {
            setFolders(prevFolders => {
                const update = (nodes: FolderNode[]): FolderNode[] =>
                    nodes.map(n =>
                        n.id === nodeId
                            ? { ...n, isExpanded: !n.isExpanded }
                            : n.children
                                ? { ...n, children: update(n.children) }
                                : n
                    );
                return update(prevFolders);
            });
        }
    };

    // DnD Logic
    const handleDragStart = (event: DragStartEvent) => setActiveId(event.active.id as string);

    const handleDragEnd = (event: DragEndEvent) => {
        setActiveId(null);
        const { active, over } = event;
        if (!over || !active) return;
        const overId = String(over.id);
        const activeNode = flattenedNodes.find(n => n.id === String(active.id));
        if (!activeNode) return;
        const match = overId.match(/^drop:(folder|before|after):(.+)$/);
        if (!match) return;
        const [, zone, targetId] = match;

        // 自分自身や子孫へのドロップを禁止
        if (isDescendant(activeNode.id, targetId)) return;

        if (zone === 'folder') {
            setFolders(prev => {
                const [removedTree, removedNode] = removeNode(prev, activeNode.id);
                if (!removedNode) return prev;
                return insertNode(removedTree, removedNode, targetId);
            });
        } else if (zone === 'before' || zone === 'after') {
            const refNode = flattenedNodes.find(n => n.id === targetId);
            if (!refNode) return;
            const parentId = refNode.parentId;
            const siblings = flattenedNodes.filter(n => n.parentId === parentId);
            let insertIndex = siblings.findIndex(n => n.id === targetId);
            if (zone === 'after') insertIndex += 1;
            setFolders(prev => {
                const [removedTree, removedNode] = removeNode(prev, activeNode.id);
                if (!removedNode) return prev;
                if (parentId === null) {
                    const result = [...removedTree];
                    if (insertIndex > result.length) insertIndex = result.length;
                    result.splice(insertIndex, 0, { ...removedNode, parentId: null });
                    return result;
                }
                return insertNode(removedTree, removedNode, parentId, insertIndex);
            });
        }
    };

    function isDescendant(dragId: string, targetId: string): boolean {
        if (dragId === targetId) return true;
        const node = flattenedNodes.find(n => n.id === targetId);
        if (!node) return false;
        let current = node;
        while (current?.parentId) {
            if (current.parentId === dragId) return true;
            current = flattenedNodes.find(n => n.id === current.parentId)!;
        }
        return false;
    }

    const removeNode = (nodes: FolderNode[], id: string): [FolderNode[], FolderNode | null] => {
        let removed: FolderNode | null = null;
        const filtered = nodes
            .map(node => {
                if (node.id === id) {
                    removed = node;
                    return null;
                }
                if (node.children) {
                    const [newChildren, childRemoved] = removeNode(node.children, id);
                    if (childRemoved) removed = childRemoved;
                    return { ...node, children: newChildren };
                }
                return node;
            })
            .filter(Boolean) as FolderNode[];
        return [filtered, removed];
    };

    const insertNode = (
        nodes: FolderNode[],
        nodeToInsert: FolderNode,
        targetParentId: string | null,
        insertIndex: number | null = null
    ): FolderNode[] => {
        return nodes.map(node => {
            if (node.id === targetParentId) {
                let newChildren = node.children ? [...node.children] : [];
                if (insertIndex === null || insertIndex > newChildren.length) {
                    newChildren.push({ ...nodeToInsert, parentId: node.id });
                } else {
                    newChildren.splice(insertIndex, 0, { ...nodeToInsert, parentId: node.id });
                }
                return { ...node, isExpanded: true, children: newChildren };
            }
            if (node.children) {
                return { ...node, children: insertNode(node.children, nodeToInsert, targetParentId, insertIndex) };
            }
            return node;
        });
    };

    // キーボード操作
    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (!selectedId || activeId) return;
        const currentIndex = flattenedNodes.findIndex(n => n.id === selectedId);
        if (currentIndex === -1) return;
        const currentNode = flattenedNodes[currentIndex];
        let handled = false;

        switch (e.key) {
            case 'ArrowUp':
                e.preventDefault();
                if (currentIndex > 0) {
                    setSelectedId(flattenedNodes[currentIndex - 1].id);
                    virtuosoRef.current?.scrollToIndex({ index: currentIndex - 1, align: 'center' });
                    handled = true;
                }
                break;

            case 'ArrowDown':
                e.preventDefault();
                if (currentIndex < flattenedNodes.length - 1) {
                    setSelectedId(flattenedNodes[currentIndex + 1].id);
                    virtuosoRef.current?.scrollToIndex({ index: currentIndex + 1, align: 'center' });
                    handled = true;
                }
                break;

            case 'ArrowRight':
                e.preventDefault();
                if (!currentNode.isExpanded && (currentNode.children || !currentNode.isLoading)) {
                    toggleFolder(currentNode.id);
                    handled = true;
                } else if (currentNode.isExpanded && currentNode.children && currentNode.children.length > 0) {
                    const childIndex = flattenedNodes.findIndex(n => n.parentId === currentNode.id);
                    if (childIndex !== -1) {
                        setSelectedId(flattenedNodes[childIndex].id);
                        virtuosoRef.current?.scrollToIndex({ index: childIndex, align: 'center' });
                        handled = true;
                    }
                }
                break;

            case 'ArrowLeft':
                e.preventDefault();
                if (currentNode.isExpanded) {
                    toggleFolder(currentNode.id);
                    handled = true;
                } else if (currentNode.parentId) {
                    const parentIndex = flattenedNodes.findIndex(n => n.id === currentNode.parentId);
                    if (parentIndex !== -1) {
                        setSelectedId(currentNode.parentId);
                        virtuosoRef.current?.scrollToIndex({ index: parentIndex, align: 'center' });
                        handled = true;
                    }
                }
                break;

            case 'Enter':
            case ' ':
                e.preventDefault();
                toggleFolder(currentNode.id);
                handled = true;
                break;
        }

        if (handled) {
            setTimeout(() => {
                const selectedElement = containerRef.current?.querySelector('[aria-selected="true"]');
                if (selectedElement instanceof HTMLElement) {
                    selectedElement.focus();
                }
            }, 0);
        }
    }, [selectedId, flattenedNodes, activeId]);

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);

    const activeNode = activeId ? flattenedNodes.find(n => n.id === activeId) : null;

    return (
        <div
            ref={containerRef}
            className="w-full h-full outline-none bg-white border border-gray-200 rounded-lg"
            role="tree"
            aria-label="フォルダツリー"
        >
            <div className="p-4 border-b border-gray-200">
                <p className="text-xs text-gray-500 mt-1">
                    選択中: {selectedId || 'なし'}
                </p>
            </div>
            <DndContext
                sensors={sensors}
                collisionDetection={pointerWithin}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
            >
                <Virtuoso
                    ref={virtuosoRef}
                    style={{ height: '500px', width: '500px' }}
                    totalCount={flattenedNodes.length}
                    itemContent={(index) => {
                        const node = flattenedNodes[index];
                        return (
                            <>
                                {/* 上ドロップゾーン */}
                                <DropArea id={`drop:before:${node.id}`} />
                                <DraggableFolder
                                    key={node.id}
                                    node={node}
                                    isSelected={selectedId === node.id}
                                    onToggle={toggleFolder}
                                    onSelect={setSelectedId}
                                    isDragging={activeId === node.id}
                                />
                                {/* 下ドロップゾーン */}
                                <DropArea id={`drop:after:${node.id}`} />
                            </>
                        );
                    }}
                />
                <DragOverlay>
                    {activeId && activeNode ? (
                        <DragOverlayContent node={activeNode} flattenedNodes={flattenedNodes} />
                    ) : null}
                </DragOverlay>
            </DndContext>
        </div>
    );
};

export default VirtualTree;