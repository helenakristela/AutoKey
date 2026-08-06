"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import StatsPanel from "@/components/StatsPanel";
import Editor from "@/components/Editor";
import SegmentationPanel from "@/components/SegmentationPanel";
import SmartTrimPanel from "@/components/SmartTrimPanel";
import BigramPanel from "@/components/BigramPanel";
export default function Home() {
  const [stats, setStats] = useState<any>(null);
  const [bigramEnabled, setBigramEnabled] = useState(true);
  const [bigramCount, setBigramCount] = useState(0);
  useEffect(() => {
    api.stats().then(setStats).catch(() => setStats(null));
  }, []);
  return <main className="min-h-screen px-6 py-8 md:px-12 lg:px-20">
      <header className="mb-8 flex items-end justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
            Auto<span className="text-mint">Key</span>
          </h1>
        </div>
        <StatsPanel stats={stats} />
      </header>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="lg:col-span-2">
          <Editor bigramEnabled={bigramEnabled} onBigramCountChange={setBigramCount} />
        </section>
        <section className="space-y-6">
          <SegmentationPanel />
          <BigramPanel enabled={bigramEnabled} setEnabled={setBigramEnabled} count={bigramCount} />
          <SmartTrimPanel />
        </section>
      </div>
    </main>;
}
