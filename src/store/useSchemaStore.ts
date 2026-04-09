"use client";

import {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  type Connection,
  type Edge,
  type EdgeChange,
  type Node,
  type NodeChange,
  type XYPosition,
} from "@xyflow/react";
import { create } from "zustand";

export type EntityColumn = {
  name: string;
  type: string;
  isPrimary?: boolean;
};

export type EntityNodeData = {
  label: string;
  ttl: string;
  columns: EntityColumn[];
};

export type SchemaNode = Node<EntityNodeData, "entity">;
export type SchemaEdge = Edge;

type SchemaState = {
  nodes: SchemaNode[];
  edges: SchemaEdge[];
  onNodesChange: (changes: NodeChange<SchemaNode>[]) => void;
  onEdgesChange: (changes: EdgeChange<SchemaEdge>[]) => void;
  onConnect: (connection: Connection) => void;
  addEntity: () => void;
};

const DEFAULT_COLUMNS: EntityColumn[] = [
  { name: "id", type: "UUID", isPrimary: true },
  { name: "created_at", type: "Timestamp" },
  { name: "updated_at", type: "Timestamp" },
];

const getEntityPosition = (index: number): XYPosition => {
  const column = index % 3;
  const row = Math.floor(index / 3);

  return {
    x: 96 + column * 320 + (index % 2) * 16,
    y: 120 + row * 220,
  };
};

const createEntityNode = (index: number): SchemaNode => ({
  id: `entity-${crypto.randomUUID()}`,
  type: "entity",
  position: getEntityPosition(index),
  data: {
    label: index === 0 ? "New_Entity" : `New_Entity_${index + 1}`,
    ttl: "30d",
    columns: DEFAULT_COLUMNS,
  },
});

export const useSchemaStore = create<SchemaState>((set) => ({
  nodes: [createEntityNode(0)],
  edges: [],
  onNodesChange: (changes) =>
    set((state) => ({
      nodes: applyNodeChanges(changes, state.nodes),
    })),
  onEdgesChange: (changes) =>
    set((state) => ({
      edges: applyEdgeChanges(changes, state.edges),
    })),
  onConnect: (connection) =>
    set((state) => ({
      edges: addEdge(
        {
          ...connection,
          animated: true,
        },
        state.edges,
      ),
    })),
  addEntity: () =>
    set((state) => ({
      nodes: [...state.nodes, createEntityNode(state.nodes.length)],
    })),
}));
