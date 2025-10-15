"use client";

import React, { useState, useRef } from "react";
import { OrchestratorService } from "@/services/orchestrator";
import type { OrchestratorPayload } from "@/types/payloadBuilder";
import { PublicationHeader } from "@/components/view/PublicationHeader";
import { PublicationForm } from "@/components/organisms/PublicationForm";
import { AppLayout } from "@/layouts/AppLayout";
import { Trash2 } from "lucide-react";

export function CreatePublicationPage() {
  const [mode, setMode] = useState<"write" | "json">("write");
  const [jsonText, setJsonText] = useState("");
  const [files, setFiles] = useState<{ name: string; data: any }[]>([]);
  const [payloads, setPayloads] = useState<OrchestratorPayload[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setJsonText(value);
    try {
      const parsed = JSON.parse(value);
      setPayloads([parsed]);
    } catch {
      setPayloads([]);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = e.target.files;
    if (!list) return;

    const parsed: { name: string; data: any }[] = [];
    for (const file of Array.from(list)) {
      try {
        const text = await file.text();
        parsed.push({ name: file.name, data: JSON.parse(text) });
      } catch {
        console.warn(`${file.name} ignoré (JSON invalide)`);
      }
    }
    setFiles(parsed);
    setPayloads(parsed.map((p) => p.data));
  };

  const handleRemoveFile = (name: string) => {
    setFiles((prev) => prev.filter((f) => f.name !== name));
    setPayloads((prev) => prev.filter((_, i) => files[i]?.name !== name));
  };

  const handleProcess = async () => {
    setIsProcessing(true);
    try {
      const results = await Promise.allSettled(
        payloads.map((payload) => OrchestratorService.publicate(payload)),
      );

      const succeeded = results.filter((r) => r.status === "fulfilled").length;
      const failed = results.filter((r) => r.status === "rejected").length;

      alert(`Traitement terminé: ${succeeded} succès, ${failed} échecs`);

      if (succeeded > 0) {
        setJsonText("");
        setFiles([]);
        setPayloads([]);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    } catch (error) {
      console.error("Erreur lors du traitement:", error);
      alert("Erreur lors du traitement des payloads");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFormSubmit = async (payload: OrchestratorPayload) => {
    setIsProcessing(true);
    try {
      await OrchestratorService.publicate(payload);
      alert("Publication créée avec succès");
    } catch (error) {
      console.error("Erreur lors de la création:", error);
      alert("Erreur lors de la création de la publication");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <AppLayout>
      <div className="mx-auto w-full max-w-screen-2xl space-y-10 py-8">
        <header className="flex flex-wrap justify-between items-center gap-3">
          <PublicationHeader title={"Nouvelle publication"} />
          <div className="flex gap-2">
            <button
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors hover:cursor-pointer ${
                mode === "write"
                  ? "bg-amber-600 text-white hover:bg-amber-700"
                  : "bg-[#292929] border border-neutral-700 text-gray-300 hover:bg-[#333333]"
              }`}
              onClick={() => setMode("write")}
            >
              Édition
            </button>
            <button
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors hover:cursor-pointer ${
                mode === "json"
                  ? "bg-amber-600 text-white hover:bg-amber-700"
                  : "bg-[#292929] border border-neutral-700 text-gray-300 hover:bg-[#333333]"
              }`}
              onClick={() => setMode("json")}
            >
              JSON
            </button>
          </div>
        </header>

        {mode === "write" && <PublicationForm onSubmit={handleFormSubmit} />}

        {mode === "json" && (
          <section className="bg-[#2a2a2a]/70 border border-neutral-700 rounded-xl shadow p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-400">
                Coller un payload JSON :
              </label>
              <textarea
                value={jsonText}
                onChange={handleTextChange}
                rows={12}
                placeholder='Exemple: {"action": "create", "payload": {...}}'
                className="w-full font-mono text-sm leading-snug px-3 py-2 border border-gray-600 rounded-md bg-[#292929] text-gray-200 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <input
                type="file"
                accept=".json"
                multiple
                ref={fileInputRef}
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                className="px-4 py-2 border border-neutral-700 rounded-md text-sm font-medium text-gray-300 bg-[#292929] hover:bg-[#333333] transition-colors hover:cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                Charger des fichiers JSON
              </button>
              <button
                disabled={payloads.length === 0 || isProcessing}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors hover:cursor-pointer ${
                  payloads.length && !isProcessing
                    ? "bg-amber-600 text-white hover:bg-amber-700"
                    : "bg-[#292929] text-gray-500 border border-neutral-700 cursor-not-allowed"
                }`}
                onClick={handleProcess}
              >
                {isProcessing ? "Traitement..." : "Traiter les payloads"}
              </button>
            </div>

            {files.length > 0 && (
              <div className="text-sm text-gray-400">
                <p className="font-medium mb-2">Fichiers chargés :</p>
                <ul className="space-y-1">
                  {files.map((f) => (
                    <li
                      key={f.name}
                      className="flex items-center justify-between bg-[#1f1f1f]/50 px-3 py-2 rounded-md border border-neutral-700"
                    >
                      <span>{f.name}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveFile(f.name)}
                        className="ml-2 p-1 rounded hover:bg-red-500/10 text-red-500 hover:cursor-pointer"
                      >
                        <Trash2 size={16} />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        )}
      </div>
    </AppLayout>
  );
}
