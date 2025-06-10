'use client';

import {
    DndContext,
    DragOverlay,
    PointerSensor,
    pointerWithin,
    useDraggable,
    useDroppable,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Virtuoso, VirtuosoHandle } from 'react-virtuoso';

// ------------------ 型・ユーティリティ -------------------

type FolderNode = {
    id: string;
    name: string;
    parentId: string | null;
    isExpanded?: boolean;
    children?: FolderNode[];
};
type FolderFlatNode = FolderNode & { level: number; type: 'folder' };

type BookNode = {
    id: string;
    title: string;
    author: string;
    parentId: string | null;
    isExpanded?: boolean;
    children?: BookNode[];
};
type BookFlatNode = BookNode & { level: number; type: 'book' };

type FlatNode = FolderFlatNode | BookFlatNode;
type DropZoneType = 'before' | 'after' | 'folder';

type DropAreaId = string; // drop:type:zone:nodeId

function parseDropAreaId(id: DropAreaId): { type: 'folder' | 'book'; zone: DropZoneType; nodeId: string } | null {
    const m = id.match(/^drop:(folder|book):(before|after|folder):(.+)$/);
    if (!m) return null;
    return { type: m[1] as any, zone: m[2] as any, nodeId: m[3] };
}

// Folder系
function flattenFolderTree(nodes: FolderNode[], level = 0): FolderFlatNode[] {
    let result: FolderFlatNode[] = [];
    for (const n of nodes) {
        result.push({ ...n, level, type: 'folder' });
        if (n.isExpanded && n.children) {
            result = result.concat(flattenFolderTree(n.children, level + 1));
        }
    }
    return result;
}
function toggleFolderNode(nodes: FolderNode[], id: string): FolderNode[] {
    return nodes.map(n =>
        n.id === id
            ? { ...n, isExpanded: !n.isExpanded }
            : n.children
                ? { ...n, children: toggleFolderNode(n.children, id) }
                : n
    );
}
function isDescendantFolder(flat: FolderFlatNode[], dragId: string, targetId: string): boolean {
    if (dragId === targetId) return true;
    const node = flat.find(n => n.id === targetId);
    if (!node) return false;
    let cur = node;
    while (cur?.parentId) {
        if (cur.parentId === dragId) return true;
        cur = flat.find(n => n.id === cur.parentId)!;
    }
    return false;
}
function removeFolderNode(nodes: FolderNode[], id: string): [FolderNode[], FolderNode | null] {
    let removed: FolderNode | null = null;
    const filtered = nodes
        .map(node => {
            if (node.id === id) {
                removed = node;
                return null;
            }
            if (node.children) {
                const [children, childRemoved] = removeFolderNode(node.children, id);
                if (childRemoved) removed = childRemoved;
                return { ...node, children };
            }
            return node;
        })
        .filter(Boolean) as FolderNode[];
    return [filtered, removed];
}
function insertFolderNode(
    nodes: FolderNode[],
    nodeToInsert: FolderNode,
    targetParentId: string | null,
    insertIndex: number | null = null
): FolderNode[] {
    if (targetParentId === null) {
        const arr = [...nodes];
        arr.splice(insertIndex ?? arr.length, 0, { ...nodeToInsert, parentId: null });
        return arr;
    }
    return nodes.map(n => {
        if (n.id === targetParentId) {
            const children = n.children ? [...n.children] : [];
            const idx = insertIndex ?? children.length;
            children.splice(idx, 0, { ...nodeToInsert, parentId: n.id });
            return { ...n, isExpanded: true, children };
        }
        if (n.children) {
            return { ...n, children: insertFolderNode(n.children, nodeToInsert, targetParentId, insertIndex) };
        }
        return n;
    });
}

// Book系
function flattenBookTree(nodes: BookNode[], level = 0): BookFlatNode[] {
    let result: BookFlatNode[] = [];
    for (const n of nodes) {
        result.push({ ...n, level, type: 'book' });
        if (n.isExpanded && n.children) {
            result = result.concat(flattenBookTree(n.children, level + 1));
        }
    }
    return result;
}
function toggleBookNode(nodes: BookNode[], id: string): BookNode[] {
    return nodes.map(n =>
        n.id === id
            ? { ...n, isExpanded: !n.isExpanded }
            : n.children
                ? { ...n, children: toggleBookNode(n.children, id) }
                : n
    );
}
function isDescendantBook(flat: BookFlatNode[], dragId: string, targetId: string): boolean {
    if (dragId === targetId) return true;
    const node = flat.find(n => n.id === targetId);
    if (!node) return false;
    let cur = node;
    while (cur?.parentId) {
        if (cur.parentId === dragId) return true;
        cur = flat.find(n => n.id === cur.parentId)!;
    }
    return false;
}
function removeBookNode(nodes: BookNode[], id: string): [BookNode[], BookNode | null] {
    let removed: BookNode | null = null;
    const filtered = nodes
        .map(node => {
            if (node.id === id) {
                removed = node;
                return null;
            }
            if (node.children) {
                const [children, childRemoved] = removeBookNode(node.children, id);
                if (childRemoved) removed = childRemoved;
                return { ...node, children };
            }
            return node;
        })
        .filter(Boolean) as BookNode[];
    return [filtered, removed];
}
function insertBookNode(
    nodes: BookNode[],
    nodeToInsert: BookNode,
    targetParentId: string | null,
    insertIndex: number | null = null
): BookNode[] {
    if (targetParentId === null) {
        const arr = [...nodes];
        arr.splice(insertIndex ?? arr.length, 0, { ...nodeToInsert, parentId: null });
        return arr;
    }
    return nodes.map(n => {
        if (n.id === targetParentId) {
            const children = n.children ? [...n.children] : [];
            const idx = insertIndex ?? children.length;
            children.splice(idx, 0, { ...nodeToInsert, parentId: n.id });
            return { ...n, isExpanded: true, children };
        }
        if (n.children) {
            return { ...n, children: insertBookNode(n.children, nodeToInsert, targetParentId, insertIndex) };
        }
        return n;
    });
}

// ------------------- UI部品 (変更なし) ----------------------

const DropArea: React.FC<{ id: DropAreaId; height?: number; level?: number }> = ({ id, height = 4, level = 0 }) => {
    const { isOver, setNodeRef } = useDroppable({ id });
    const marginLeft = level * 20;
    return (
        <div
            ref={setNodeRef}
            style={{
                height,
                background: isOver ? '#48c9b0' : 'transparent',
                borderRadius: 4,
                transition: 'background 0.15s',
                marginLeft
            }}
        />
    );
};

const FolderRow: React.FC<{
    node: FolderFlatNode;
    selected: boolean;
    isDragging?: boolean;
    onToggle: (id: string) => void;
    onSelect: (id: string) => void;
}> = ({ node, selected, isDragging, onToggle, onSelect }) => {
    const { attributes, listeners, setNodeRef: setDraggableNodeRef, isDragging: dragging } = useDraggable({ id: node.id });
    const { isOver, setNodeRef: setDroppableNodeRef } = useDroppable({
        id: `drop:folder:folder:${node.id}`,
    });

    const setNodeRef = useCallback((element: HTMLElement | null) => {
        setDraggableNodeRef(element);
        setDroppableNodeRef(element);
    }, [setDraggableNodeRef, setDroppableNodeRef]);

    return (
        <div
            ref={setNodeRef}
            {...attributes}
            {...listeners}
            style={{
                display: 'flex',
                alignItems: 'center',
                marginLeft: node.level * 20,
                background: isOver ? '#b7e4c7' : isDragging || dragging ? '#aed6f1' : selected ? '#d6eaf8' : undefined,
                cursor: 'pointer',
                padding: '4px 8px',
                borderRadius: 6,
                opacity: isDragging || dragging ? 0.6 : 1,
                transition: 'background-color 0.2s',
            }}
            onClick={() => onSelect(node.id)}
            tabIndex={0}
            aria-selected={selected}
        >
            <span
                style={{ marginRight: 6, width: 18, textAlign: 'center', cursor: 'pointer' }}
                onClick={e => {
                    e.stopPropagation();
                    onToggle(node.id);
                }}
            >
                {node.children && node.children.length > 0 ? (node.isExpanded ? '▼' : '▶') : ''}
            </span>
            <span role="img" aria-label="Folder" style={{ marginRight: 6 }}>
                📁
            </span>
            {node.name}
        </div>
    );
};

const BookRow: React.FC<{
    node: BookFlatNode;
    selected: boolean;
    isDragging?: boolean;
    onToggle: (id: string) => void;
    onSelect: (id: string) => void;
}> = ({ node, selected, isDragging, onToggle, onSelect }) => {
    const { attributes, listeners, setNodeRef: setDraggableNodeRef, isDragging: dragging } = useDraggable({ id: node.id });

    const isDroppable = node.children !== undefined;
    const { isOver, setNodeRef: setDroppableNodeRef } = useDroppable({
        id: `drop:book:folder:${node.id}`,
        disabled: !isDroppable,
    });

    const setNodeRef = useCallback((element: HTMLElement | null) => {
        setDraggableNodeRef(element);
        setDroppableNodeRef(element);
    }, [setDraggableNodeRef, setDroppableNodeRef]);

    return (
        <div
            ref={setNodeRef}
            {...attributes}
            {...listeners}
            style={{
                display: 'flex',
                alignItems: 'center',
                marginLeft: node.level * 20,
                background: isDroppable && isOver ? '#fff2c6' : isDragging || dragging ? '#fae5a7' : selected ? '#fcf3cf' : undefined,
                cursor: 'pointer',
                padding: '4px 8px',
                borderRadius: 6,
                opacity: isDragging || dragging ? 0.6 : 1,
                transition: 'background-color 0.2s',
            }}
            onClick={() => onSelect(node.id)}
            tabIndex={0}
            aria-selected={selected}
        >
            <span
                style={{ marginRight: 6, width: 18, textAlign: 'center', cursor: 'pointer' }}
                onClick={e => {
                    e.stopPropagation();
                    onToggle(node.id);
                }}
            >
                {node.children && node.children.length > 0 ? (node.isExpanded ? '▼' : '▶') : ''}
            </span>
            <span role="img" aria-label="Book" style={{ marginRight: 6 }}>
                📚
            </span>
            <span>
                <strong>{node.title}</strong>
                <span style={{ fontSize: 12, color: '#666', marginLeft: 8 }}>
                    by {node.author}
                </span>
            </span>
        </div>
    );
};

const DragOverlayContent: React.FC<{ node: FlatNode }> = ({ node }) => {
    if (node.type === 'folder') {
        return (
            <div style={{
                background: '#aed6f1',
                padding: '4px 16px',
                borderRadius: 6,
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center'
            }}>
                📁 {node.name}
            </div>
        );
    }
    if (node.type === 'book') {
        return (
            <div style={{
                background: '#fae5a7',
                padding: '4px 16px',
                borderRadius: 6,
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center'
            }}>
                📚 {node.title}
                <span style={{ fontSize: 12, color: '#666', marginLeft: 8 }}>by {node.author}</span>
            </div>
        );
    }
    return null;
};

// --------------------- メイン (ここから変更) -----------------------

const VirtualMultiTree: React.FC = () => {

    function generateFolders(count: number, parentId: string): FolderNode[] {
        return Array.from({ length: count }, (_, i) => ({
            id: `${parentId}-auto-${i + 1}`,
            name: `AutoFolder-${i + 1}`,
            parentId: parentId,
        }));
    }

    // State
    const [folderRoots, setFolderRoots] = useState<FolderNode[]>([
        {
            id: 'folder-1',
            name: 'Documents',
            parentId: null,
            isExpanded: true,
            children: [
                { id: 'folder-1-1', name: 'Projects', parentId: 'folder-1', children: [] },
                { id: 'folder-1-2', name: 'Personal', parentId: 'folder-1', children: [] },
            ],
        },
        {
            id: 'folder-2',
            name: 'Pictures',
            parentId: null,
            isExpanded: false,
            children: [...generateFolders(100000, 'folder-2')],
        },
    ]);
    const [bookRoots, setBookRoots] = useState<BookNode[]>([
        {
            id: 'book-root-1',
            title: 'Programming',
            author: '',
            parentId: null,
            isExpanded: true,
            children: [
                { id: 'book-1', title: 'React Handbook', author: 'Kent C. Dodds', parentId: 'book-root-1' },
                { id: 'book-2', title: 'Effective TypeScript', author: 'Dan Vanderkam', parentId: 'book-root-1' },
            ],
        },
        {
            id: 'book-root-2',
            title: 'Novels',
            author: '',
            parentId: null,
            isExpanded: false,
            children: [
                { id: 'book-3', title: 'Norwegian Wood', author: 'Haruki Murakami', parentId: 'book-root-2' },
            ],
        },
    ]);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [activeId, setActiveId] = useState<string | null>(null);


    const virtuosoRef = useRef<VirtuosoHandle>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const flattenedNodes = useMemo<FlatNode[]>(() => [
        ...flattenFolderTree(folderRoots),
        ...flattenBookTree(bookRoots),
    ], [folderRoots, bookRoots]);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 4 } })
    );

    const findNode = (id: string) => flattenedNodes.find(n => n.id === id);

    // handleDragEnd ロジック
    const handleDragEnd = ({ active, over }: any) => {
        setActiveId(null);
        if (!over) return;
        const dropInfo = parseDropAreaId(String(over.id));
        const src = findNode(String(active.id));
        if (!dropInfo || !src || src.type !== dropInfo.type) return;

        if (src.type === 'folder') {
            const flat = flattenedNodes.filter(n => n.type === 'folder') as FolderFlatNode[];
            if (isDescendantFolder(flat, src.id, dropInfo.nodeId)) return;
            setFolderRoots(prev => {
                const [removed, node] = removeFolderNode(prev, src.id);
                if (!node) return prev;
                if (dropInfo.zone === 'folder') {
                    return insertFolderNode(removed, node, dropInfo.nodeId, null);
                } else {
                    const target = flat.find(n => n.id === dropInfo.nodeId);
                    const parentChildren = target?.parentId
                        ? flat.find(f => f.id === target.parentId)?.children ?? []
                        : folderRoots;
                    const siblings = parentChildren.map(c => flat.find(f => f.id === c.id)!);
                    let idx = siblings.findIndex(n => n.id === target?.id);

                    if (dropInfo.zone === 'after') idx += 1;
                    return insertFolderNode(
                        removed,
                        node,
                        target?.parentId ?? null,
                        idx
                    );
                }
            });
        }
        if (src.type === 'book') {
            const flat = flattenedNodes.filter(n => n.type === 'book') as BookFlatNode[];
            if (isDescendantBook(flat, src.id, dropInfo.nodeId)) return;
            setBookRoots(prev => {
                const [removed, node] = removeBookNode(prev, src.id);
                if (!node) return prev;
                if (dropInfo.zone === 'folder') {
                    return insertBookNode(removed, node, dropInfo.nodeId, null);
                }
                else {
                    const target = flat.find(n => n.id === dropInfo.nodeId);
                    const parentChildren = target?.parentId
                        ? flat.find(f => f.id === target.parentId)?.children ?? []
                        : bookRoots;
                    const siblings = parentChildren.map(c => flat.find(f => f.id === c.id)!);
                    let idx = siblings.findIndex(n => n.id === target?.id);
                    if (dropInfo.zone === 'after')
                        idx += 1;
                    return insertBookNode(
                        removed,
                        node,
                        target?.parentId ?? null,
                        idx
                    );
                }
            });
        }
    };

    const handleToggle = useCallback(
        (id: string) => {
            const node = findNode(id);
            if (!node) return;
            if (node.type === 'folder') setFolderRoots(f => toggleFolderNode(f, id));
            else if (node.type === 'book') setBookRoots(b => toggleBookNode(b, id));
        }, [flattenedNodes]
    );

    const handleSelect = (id: string) => setSelectedId(id);
    const handleDragStart = ({ active }: any) => setActiveId(String(active.id));

    // キーボード操作ハンドラ
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
                    const newIndex = currentIndex - 1;
                    setSelectedId(flattenedNodes[newIndex].id);
                    virtuosoRef.current?.scrollToIndex({ index: newIndex, align: 'center' });
                    handled = true;
                }
                break;

            case 'ArrowDown':
                e.preventDefault();
                if (currentIndex < flattenedNodes.length - 1) {
                    const newIndex = currentIndex + 1;
                    setSelectedId(flattenedNodes[newIndex].id);
                    virtuosoRef.current?.scrollToIndex({ index: newIndex, align: 'center' });
                    handled = true;
                }
                break;

            case 'ArrowRight':
                e.preventDefault();
                if (!currentNode.isExpanded && currentNode.children && currentNode.children.length > 0) {
                    handleToggle(currentNode.id);
                    handled = true;
                } else if (currentNode.isExpanded && currentNode.children && currentNode.children.length > 0) {
                    const newIndex = currentIndex + 1;
                    if (newIndex < flattenedNodes.length) {
                        setSelectedId(flattenedNodes[newIndex].id);
                        virtuosoRef.current?.scrollToIndex({ index: newIndex, align: 'center' });
                        handled = true;
                    }
                }
                break;

            case 'ArrowLeft':
                e.preventDefault();
                if (currentNode.isExpanded) {
                    handleToggle(currentNode.id);
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
                if (currentNode.children && currentNode.children.length > 0) {
                    handleToggle(currentNode.id);
                    handled = true;
                }
                break;
        }

        if (handled) {
            setTimeout(() => {
                const selectedElement = containerRef.current?.querySelector<HTMLElement>('[aria-selected="true"]');
                selectedElement?.focus();
            }, 0);
        }
    }, [selectedId, flattenedNodes, activeId, handleToggle]);

    // keydownイベントリスナーを登録
    useEffect(() => {
        const container = containerRef.current;
        if (container) {
            container.addEventListener('keydown', handleKeyDown);
            return () => container.removeEventListener('keydown', handleKeyDown);
        }
    }, [handleKeyDown]);


    const renderItem = (index: number) => {
        const node = flattenedNodes[index];

        if (node.type === 'folder') {
            return (
                <React.Fragment key={node.id}>
                    <DropArea id={`drop:folder:before:${node.id}`} height={4} level={node.level} />
                    <FolderRow
                        node={node}
                        selected={selectedId === node.id}
                        isDragging={activeId === node.id}
                        onToggle={handleToggle}
                        onSelect={handleSelect}
                    />
                    <DropArea id={`drop:folder:after:${node.id}`} height={4} level={node.level} />
                </React.Fragment>
            );
        }

        if (node.type === 'book') {
            return (
                <React.Fragment key={node.id}>
                    <DropArea id={`drop:book:before:${node.id}`} height={4} level={node.level} />
                    <BookRow
                        node={node}
                        selected={selectedId === node.id}
                        isDragging={activeId === node.id}
                        onToggle={handleToggle}
                        onSelect={handleSelect}
                    />
                    <DropArea id={`drop:book:after:${node.id}`} height={4} level={node.level} />
                </React.Fragment>
            );
        }

        return null;
    };

    const activeNode = activeId ? findNode(activeId) : null;

    return (
        <div ref={containerRef} style={{ border: '1px solid #bbb', borderRadius: 8, width: 430, margin: '30px auto', background: '#fafcff', boxShadow: '0 2px 10px #eee' }}>
            <DndContext
                sensors={sensors}
                collisionDetection={pointerWithin}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
            >
                <div style={{ height: 440, borderTop: '1px solid #eee' }}>
                    <Virtuoso
                        ref={virtuosoRef}
                        style={{ height: 440 }}
                        totalCount={flattenedNodes.length}
                        itemContent={renderItem}
                    />
                </div>
                <DragOverlay>
                    {activeNode && <DragOverlayContent node={activeNode} />}
                </DragOverlay>
            </DndContext>
            <div style={{ padding: 8, borderTop: '1px solid #eee', fontSize: 14, color: '#444' }}>
                選択中: {selectedId ?? 'なし'}
            </div>
        </div>
    );
};

export default VirtualMultiTree;