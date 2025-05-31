import { create } from 'zustand';

// 基本的な型定義
export type NodeType = 'folder' | 'file';

export type TreeNodeModel = {
  id: string;
  name: string;
  type: NodeType;
  parentId: string | null;
  children: string[];
}

export type NodesMap = {
  [key: string]: TreeNodeModel;
}

// Zustandストアの型定義
type TreeStore = {
  // 状態
  nodes: NodesMap;
  expandedNodes: Set<string>;
  selectedNode: string | null;

  // アクション
  toggleNode: (nodeId: string) => void;
  selectNode: (nodeId: string) => void;
  addNode: (parentId: string, name: string, type?: NodeType) => void;
  deleteNode: (nodeId: string) => void;
  expandAll: () => void;
  collapseAll: () => void;
  resetStore: () => void;
}

// Zustandストアの作成
export const useTreeStore = create<TreeStore>((set, get) => ({
  // 状態
  nodes: {
    '1': { id: '1', name: 'プロジェクトルート', type: 'folder', parentId: null, children: ['2', '3', '4'] },
    '2': { id: '2', name: 'src', type: 'folder', parentId: '1', children: ['5', '6', '7'] },
    '3': { id: '3', name: 'public', type: 'folder', parentId: '1', children: ['8', '9'] },
    '4': { id: '4', name: 'README.md', type: 'file', parentId: '1', children: [] },
    '5': { id: '5', name: 'components', type: 'folder', parentId: '2', children: ['10', '11'] },
    '6': { id: '6', name: 'hooks', type: 'folder', parentId: '2', children: ['12'] },
    '7': { id: '7', name: 'App.tsx', type: 'file', parentId: '2', children: [] },
    '8': { id: '8', name: 'index.html', type: 'file', parentId: '3', children: [] },
    '9': { id: '9', name: 'favicon.ico', type: 'file', parentId: '3', children: [] },
    '10': { id: '10', name: 'Header.tsx', type: 'file', parentId: '5', children: [] },
    '11': { id: '11', name: 'TreeView.tsx', type: 'file', parentId: '5', children: [] },
    '12': { id: '12', name: 'useTree.ts', type: 'file', parentId: '6', children: [] }
  },
  expandedNodes: new Set(['1', '2']),
  selectedNode: null,

  // アクション
  toggleNode: (nodeId: string) => set((state) => ({
    expandedNodes: new Set(
      state.expandedNodes.has(nodeId)
        ? [...state.expandedNodes].filter(id => id !== nodeId)
        : [...state.expandedNodes, nodeId]
    )
  })),

  selectNode: (nodeId: string) => set({ selectedNode: nodeId }),

  addNode: (parentId: string, name: string, type: NodeType = 'file') => {
    const newId = Date.now().toString();
    const newNode: TreeNodeModel = {
      id: newId,
      name,
      type,
      parentId,
      children: []
    };

    set((state) => ({
      nodes: {
        ...state.nodes,
        [newId]: newNode,
        [parentId]: {
          ...state.nodes[parentId],
          children: [...state.nodes[parentId].children, newId]
        }
      }
    }));
  },

  deleteNode: (nodeId: string) => {
    const state = get();
    const node = state.nodes[nodeId];
    if (!node || !node.parentId) return;

    const newNodes = { ...state.nodes };
    const deleteRecursively = (id: string): void => {
      const nodeToDelete = newNodes[id];
      if (nodeToDelete) {
        nodeToDelete.children.forEach(deleteRecursively);
        delete newNodes[id];
      }
    };

    // 親ノードから削除対象を除去
    const parent = newNodes[node.parentId];
    if (parent) {
      parent.children = parent.children.filter(childId => childId !== nodeId);
    }

    // 再帰的に削除
    deleteRecursively(nodeId);

    const newExpandedNodes = new Set([...state.expandedNodes].filter(id => newNodes[id]));

    set({
      nodes: newNodes,
      expandedNodes: newExpandedNodes,
      selectedNode: state.selectedNode === nodeId ? null : state.selectedNode
    });
  },

  // 複数ノードを一括展開
  expandAll: () => set((state) => {
    const allFolderIds = Object.values(state.nodes)
      .filter(node => node.type === 'folder')
      .map(node => node.id);
    return { expandedNodes: new Set(allFolderIds) };
  }),

  // 全て折りたたみ
  collapseAll: () => set({ expandedNodes: new Set(['1']) }),

  // ストア全体をリセット
  resetStore: () => set(() => ({
    expandedNodes: new Set(['1']),
    selectedNode: null
  }))
}));