import React, { useState } from "react";
import { BioVizReport } from "./lib/schema";
import { 
  Loader2, 
  Database, 
  ShieldCheck, 
  Microscope, 
  FileText, 
  ChevronRight, 
  ExternalLink, 
  Info,
  AlertCircle
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function App() {
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<BioVizReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const formData = new FormData(e.currentTarget);
    
    try {
      const res = await fetch("/api/analyze", { 
        method: "POST", 
        body: formData 
      });
      
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Analysis failed");
      }
      
      const data = await res.json();
      setReport(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#0f172a] font-sans selection:bg-indigo-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                <Microscope className="text-white w-5 h-5" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                BioViz <span className="text-indigo-600 font-extrabold italic">Atlas</span>
              </h1>
            </div>
            <p className="text-slate-500 text-sm font-medium">Provenance-First Biological Interpretation Engine</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 bg-slate-200 text-slate-700 text-[10px] font-bold uppercase tracking-widest rounded-full">Prototype v1.0</span>
            <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Left Column: Input */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                  <FileText size={16} /> Analysis Parameters
                </h2>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-5">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 uppercase">Protein Sequence</label>
                  <textarea 
                    name="sequence" 
                    required 
                    className="w-full h-40 p-3 text-xs font-mono border border-slate-200 rounded-xl bg-slate-50 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none" 
                    placeholder="Paste FASTA or raw amino acids...&#10;>P01308 | INS_HUMAN&#10;MALWMRLLPLLALLALWGPDPAAAFVNQHLCGSHLVEALYLVCGERGFFYTPKTRREAED..."
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 uppercase">Research Paper (PDF)</label>
                  <div className="relative">
                    <input 
                      type="file" 
                      name="file" 
                      accept="application/pdf" 
                      className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 transition-all" 
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 uppercase">Biological Question</label>
                  <input 
                    name="question" 
                    required 
                    className="w-full p-3 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all" 
                    placeholder="e.g., Identify the key binding motifs?" 
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 uppercase">Organism</label>
                  <input 
                    name="organism" 
                    defaultValue="Homo sapiens"
                    className="w-full p-3 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all" 
                  />
                </div>

                <button 
                  disabled={loading} 
                  className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50 transition-all flex justify-center items-center shadow-lg shadow-indigo-200 active:scale-[0.98]"
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin mr-2" /> 
                      <span>Analyzing Sequence...</span>
                    </>
                  ) : (
                    "Generate Atlas Report"
                  )}
                </button>
              </form>
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex gap-3 text-red-700 animate-in fade-in slide-in-from-top-2">
                <AlertCircle className="shrink-0" size={20} />
                <p className="text-sm font-medium">{error}</p>
              </div>
            )}
          </div>

          {/* Right Column: Results */}
          <div className="lg:col-span-8">
            {!report && !loading && (
              <div className="h-[600px] flex flex-col items-center justify-center bg-white border-2 border-dashed border-slate-200 rounded-3xl text-slate-400 p-10 text-center">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                  <Microscope size={40} className="opacity-20" />
                </div>
                <h3 className="text-lg font-bold text-slate-600 mb-2">Ready for Analysis</h3>
                <p className="max-w-xs text-sm">Submit a protein sequence and an optional research paper to generate an interactive interpretation report.</p>
              </div>
            )}

            {loading && !report && (
              <div className="h-[600px] flex flex-col items-center justify-center bg-white border border-slate-200 rounded-3xl p-10 text-center">
                <div className="relative w-24 h-24 mb-8">
                  <div className="absolute inset-0 border-4 border-indigo-100 rounded-full" />
                  <div className="absolute inset-0 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Database className="text-indigo-600 animate-pulse" />
                  </div>
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-2">Synthesizing Report</h3>
                <div className="space-y-2 max-w-sm">
                  <p className="text-sm text-slate-500 animate-pulse">Running local heuristics...</p>
                  <p className="text-sm text-slate-500 animate-pulse delay-75">Resolving protein identity...</p>
                  <p className="text-sm text-slate-500 animate-pulse delay-150">Querying Gemini 1.5 Flash...</p>
                </div>
              </div>
            )}

            {report && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
                {/* Main Summary Card */}
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h2 className="text-2xl font-extrabold text-slate-900 mb-2">{report.title}</h2>
                      <p className="text-slate-600 leading-relaxed">{report.summary}</p>
                    </div>
                  </div>
                  
                  {/* Protein Track Visualization */}
                  <div className="mt-10 mb-12">
                    <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 px-1">
                      <span>N-Terminus</span>
                      <span>{report.proteinLength} Amino Acids</span>
                      <span>C-Terminus</span>
                    </div>
                    <div className="relative h-14 w-full bg-slate-100 rounded-2xl border border-slate-200 overflow-hidden shadow-inner">
                      {/* Grid lines */}
                      <div className="absolute inset-0 flex justify-between px-4 pointer-events-none opacity-10">
                        {[...Array(10)].map((_, i) => (
                          <div key={i} className="w-px h-full bg-slate-900" />
                        ))}
                      </div>
                      
                      {/* Regions */}
                      {report.regions.map((r, i) => (
                        <div 
                          key={i} 
                          className="absolute h-full bg-indigo-500/20 border-x border-indigo-500/40 group cursor-help transition-all hover:bg-indigo-500/30"
                          style={{ 
                            left: `${(r.start / report.proteinLength) * 100}%`, 
                            width: `${((r.end - r.start) / report.proteinLength) * 100}%` 
                          }}
                        >
                          <div className="opacity-0 group-hover:opacity-100 absolute bottom-full mb-3 left-1/2 -translate-x-1/2 bg-slate-900 text-white p-3 rounded-xl text-[10px] w-48 z-50 shadow-xl pointer-events-none transition-all">
                            <div className="font-bold mb-1 text-indigo-300">{r.label}</div>
                            <div className="text-slate-300 mb-2">{r.reason}</div>
                            <div className="flex justify-between border-t border-slate-700 pt-1">
                              <span>Confidence</span>
                              <span>{Math.round(r.confidence * 100)}%</span>
                            </div>
                            <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-900" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Identity Info */}
                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                      <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                        <Database size={14} /> Canonical Identity
                      </h3>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center py-2 border-b border-slate-200/50">
                          <span className="text-sm text-slate-500">Symbol</span>
                          <span className="text-sm font-bold text-indigo-600">{report.canonicalProtein.approvedSymbol || "N/A"}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-slate-200/50">
                          <span className="text-sm text-slate-500">UniProt</span>
                          <span className="text-sm font-mono font-medium">{report.canonicalProtein.uniprotAccession || "N/A"}</span>
                        </div>
                        <div className="flex justify-between items-center py-2">
                          <span className="text-sm text-slate-500">Organism</span>
                          <span className="text-sm font-medium italic">{report.canonicalProtein.organism || "N/A"}</span>
                        </div>
                      </div>
                    </div>

                    {/* Provenance Panel */}
                    <div className="bg-indigo-50/50 p-6 rounded-2xl border border-indigo-100">
                      <h3 className="text-xs font-bold uppercase tracking-widest text-indigo-400 mb-4 flex items-center gap-2">
                        <ShieldCheck size={14} /> Provenance Root
                      </h3>
                      <div className="bg-white p-4 rounded-xl border border-indigo-100 shadow-sm mb-4">
                        <div className="font-mono text-[10px] break-all text-indigo-900 leading-relaxed">
                          {report.provenance.rootHash}
                        </div>
                      </div>
                      <div className="flex justify-between items-center text-[10px] font-bold text-indigo-400 uppercase tracking-wider">
                        <span>Artifact Count: {report.provenance.artifactCount}</span>
                        <span className="flex items-center gap-1 text-green-600"><ShieldCheck size={10} /> Verified Trace</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Detailed Insights & Mentions */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                  <div className="md:col-span-7 space-y-6">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 px-2">Structural Insights</h3>
                    {report.regions.map((r, i) => (
                      <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:border-indigo-200 transition-all group">
                        <div className="flex justify-between items-center mb-3">
                          <span className="px-3 py-1 bg-indigo-50 text-indigo-700 text-[10px] font-bold rounded-full">{r.label}</span>
                          <span className="text-xs font-mono text-slate-400">AA {r.start} - {r.end}</span>
                        </div>
                        <p className="text-sm text-slate-600 leading-relaxed mb-4">{r.reason}</p>
                        <div className="flex items-center gap-4">
                          <div className="flex-1 h-1 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${r.confidence * 100}%` }} />
                          </div>
                          <span className="text-[10px] font-bold text-slate-400">{Math.round(r.confidence * 100)}% Confidence</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="md:col-span-5 space-y-8">
                    {/* Database Links */}
                    <div className="space-y-4">
                      <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 px-2">Cross-References</h3>
                      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                        {report.databaseLinks.map((link, i) => (
                          <a 
                            key={i} 
                            href={link.url} 
                            target="_blank" 
                            rel="noreferrer"
                            className="flex items-center justify-between p-4 hover:bg-slate-50 transition-all border-b border-slate-100 last:border-0"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600">
                                <Database size={14} />
                              </div>
                              <div>
                                <div className="text-xs font-bold text-slate-900">{link.source}</div>
                                <div className="text-[10px] font-mono text-slate-400">{link.id}</div>
                              </div>
                            </div>
                            <ExternalLink size={14} className="text-slate-300" />
                          </a>
                        ))}
                      </div>
                    </div>

                    {/* Paper Mentions */}
                    {report.paperMentions.length > 0 && (
                      <div className="space-y-4">
                        <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 px-2">Paper Mentions</h3>
                        <div className="space-y-3">
                          {report.paperMentions.map((m, i) => (
                            <div key={i} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                              <div className="flex justify-between items-center mb-2">
                                <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded uppercase">{m.matchedAlias}</span>
                                {m.page && <span className="text-[10px] text-slate-400">Page {m.page}</span>}
                              </div>
                              <p className="text-xs text-slate-600 italic leading-relaxed">"{m.snippet}"</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Next Steps */}
                    <div className="space-y-4">
                      <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 px-2">Exploratory Next Steps</h3>
                      <div className="bg-slate-900 p-6 rounded-2xl shadow-xl">
                        <ul className="space-y-3">
                          {report.nextSteps.map((step, i) => (
                            <li key={i} className="flex gap-3 text-xs text-slate-300 leading-relaxed">
                              <ChevronRight size={14} className="shrink-0 text-indigo-400" />
                              {step}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Footer Info */}
      <footer className="mt-20 py-10 border-t border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Info size={14} className="text-slate-400" />
            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">
              Exploratory Prototype • Non-Clinical Use Only • BioViz Tech © 2026
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
