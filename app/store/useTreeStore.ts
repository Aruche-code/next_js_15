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

// 初期データ
const INITIAL_NODES: NodesMap = {
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
} as const;

const INITIAL_EXPANDED_NODES = new Set(['1', '2']);
const ROOT_NODE_ID = '1';

// ユーティリティ関数
const generateNodeId = (): string => Date.now().toString();

const createNewNode = (
  id: string,
  name: string,
  type: NodeType,
  parentId: string
): TreeNodeModel => ({
  id,
  name,
  type,
  parentId,
  children: []
});

const deleteNodeRecursively = (
  nodes: NodesMap,
  nodeId: string,
  deletedIds: Set<string> = new Set()
): Set<string> => {
  const node = nodes[nodeId];
  if (!node || deletedIds.has(nodeId)) return deletedIds;

  deletedIds.add(nodeId);

  // 子ノードを再帰的に削除
  node.children.forEach(childId => {
    deleteNodeRecursively(nodes, childId, deletedIds);
  });

  return deletedIds;
};

const removeDeletedNodesFromExpanded = (
  expandedNodes: Set<string>,
  deletedIds: Set<string>
): Set<string> => {
  return new Set([...expandedNodes].filter(id => !deletedIds.has(id)));
};

const getAllFolderIds = (nodes: NodesMap): string[] => {
  return Object.values(nodes)
    .filter(node => node.type === 'folder')
    .map(node => node.id);
};

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

  // 新規追加：ヘルパー関数
  getNodeById: (nodeId: string) => TreeNodeModel | undefined;
  getChildrenNodes: (nodeId: string) => TreeNodeModel[];
  isNodeExpanded: (nodeId: string) => boolean;
  hasChildren: (nodeId: string) => boolean;
}

// Zustandストアの作成
export const useTreeStore = create<TreeStore>((set, get) => ({
  // 初期状態
  nodes: INITIAL_NODES,
  expandedNodes: INITIAL_EXPANDED_NODES,
  selectedNode: null,

  // ノード展開/折りたたみトグル
  toggleNode: (nodeId: string) => {
    set((state) => {
      const node = state.nodes[nodeId];
      if (!node || node.type !== 'folder') return state;

      const newExpandedNodes = new Set(state.expandedNodes);
      if (newExpandedNodes.has(nodeId)) {
        newExpandedNodes.delete(nodeId);
      } else {
        newExpandedNodes.add(nodeId);
      }

      return { expandedNodes: newExpandedNodes };
    });
  },

  // ノード選択
  selectNode: (nodeId: string) => {
    set({ selectedNode: nodeId });
  },

  // ノード追加
  addNode: (parentId: string, name: string, type: NodeType = 'file') => {
    const state = get();
    const parentNode = state.nodes[parentId];

    if (!parentNode || parentNode.type !== 'folder') {
      console.warn(`親ノード ${parentId} が見つからないか、フォルダではありません`);
      return;
    }

    const newId = generateNodeId();
    const newNode = createNewNode(newId, name, type, parentId);

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

  // ノード削除
  deleteNode: (nodeId: string) => {
    const state = get();
    const node = state.nodes[nodeId];

    // ルートノードまたは存在しないノードは削除不可
    if (!node || !node.parentId) {
      console.warn(`ノード ${nodeId} は削除できません`);
      return;
    }

    // 削除対象のIDを収集
    const deletedIds = deleteNodeRecursively(state.nodes, nodeId);

    // 新しいnodesオブジェクトを作成（削除対象を除外）
    const newNodes = { ...state.nodes };
    deletedIds.forEach(id => {
      delete newNodes[id];
    });

    // 親ノードの子リストから削除
    const parent = newNodes[node.parentId];
    if (parent) {
      parent.children = parent.children.filter(childId => childId !== nodeId);
    }

    // 展開状態から削除されたノードを除外
    const newExpandedNodes = removeDeletedNodesFromExpanded(state.expandedNodes, deletedIds);

    // 選択ノードが削除された場合はクリア
    const newSelectedNode = deletedIds.has(state.selectedNode || '') ? null : state.selectedNode;

    set({
      nodes: newNodes,
      expandedNodes: newExpandedNodes,
      selectedNode: newSelectedNode
    });
  },

  // 全フォルダを展開
  expandAll: () => {
    const state = get();
    const allFolderIds = getAllFolderIds(state.nodes);
    set({ expandedNodes: new Set(allFolderIds) });
  },

  // 全フォルダを折りたたみ（ルートは除く）
  collapseAll: () => {
    set({ expandedNodes: new Set([ROOT_NODE_ID]) });
  },

  // ストア全体をリセット
  resetStore: () => {
    set({
      nodes: INITIAL_NODES,
      expandedNodes: INITIAL_EXPANDED_NODES,
      selectedNode: null
    });
  },

  // ヘルパー関数：IDでノードを取得
  getNodeById: (nodeId: string) => {
    return get().nodes[nodeId];
  },

  // ヘルパー関数：子ノード一覧を取得
  getChildrenNodes: (nodeId: string) => {
    const state = get();
    const node = state.nodes[nodeId];
    if (!node) return [];

    return node.children
      .map(childId => state.nodes[childId])
      .filter(Boolean);
  },

  // ヘルパー関数：ノードが展開されているか確認
  isNodeExpanded: (nodeId: string) => {
    return get().expandedNodes.has(nodeId);
  },

  // ヘルパー関数：ノードに子要素があるか確認
  hasChildren: (nodeId: string) => {
    const node = get().nodes[nodeId];
    return node ? node.children.length > 0 : false;
  }
}));