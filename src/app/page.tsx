"use client";

import "@xyflow/react/dist/style.css";

import {
  Background,
  BackgroundVariant,
  Controls,
  Panel,
  ReactFlow,
  ReactFlowProvider,
} from "@xyflow/react";
import { Plus, TableProperties } from "lucide-react";

import { EntityNode } from "@/components/EntityNode";
import { Button } from "@/components/ui/button";
import { useSchemaStore } from "@/store/useSchemaStore";

const nodeTypes = {
  entity: EntityNode,
};

function SchemaCanvas() {
  const nodes = useSchemaStore((state) => state.nodes);
  const edges = useSchemaStore((state) => state.edges);
  const onNodesChange = useSchemaStore((state) => state.onNodesChange);
  const onEdgesChange = useSchemaStore((state) => state.onEdgesChange);
  const onConnect = useSchemaStore((state) => state.onConnect);
  const addEntity = useSchemaStore((state) => state.addEntity);

  return (
    <div className="h-screen w-screen overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.16),_transparent_26%),linear-gradient(180deg,_rgba(248,250,252,1)_0%,_rgba(239,246,255,1)_100%)] dark:bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.16),_transparent_22%),linear-gradient(180deg,_rgba(2,6,23,1)_0%,_rgba(15,23,42,1)_100%)]">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.4}
        maxZoom={1.5}
        proOptions={{ hideAttribution: true }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={24}
          size={1.25}
          color="rgba(100, 116, 139, 0.32)"
        />
        <Controls
          position="bottom-right"
          className="!overflow-hidden !rounded-2xl !border !border-slate-200/80 !bg-white/90 !shadow-lg backdrop-blur dark:!border-slate-800 dark:!bg-slate-950/90"
        />

        <Panel position="top-left">
          <div className="flex items-center gap-4 rounded-2xl border border-slate-200/80 bg-white/85 p-3 shadow-lg backdrop-blur dark:border-slate-800 dark:bg-slate-950/85">
            <div className="flex size-10 items-center justify-center rounded-2xl bg-slate-950 text-white dark:bg-slate-100 dark:text-slate-950">
              <TableProperties className="size-5" />
            </div>

            <div className="min-w-0">
              <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                Archive Visual Modeller
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Add entities, drag them into place, and sketch relationships.
              </p>
            </div>

            <Button
              onClick={addEntity}
              className="h-10 rounded-xl px-4 shadow-sm"
              size="lg"
            >
              <Plus className="size-4" />
              Add Entity
            </Button>
          </div>
        </Panel>
      </ReactFlow>
    </div>
  );
}

export default function Home() {
  return (
    <ReactFlowProvider>
      <SchemaCanvas />
    </ReactFlowProvider>
  );
}
