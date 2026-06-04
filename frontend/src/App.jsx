import React, { useState, useRef, useEffect, useCallback } from "react";
import axios from "axios";

const API = "http://localhost:8000/api/v1";

const THEME = {
  POSITIVE: { glow:"#22c55e", bg:"rgba(34,197,94,0.12)", text:"#4ade80", bar:"#22c55e", emoji:"😊", label:"Positive" },
  NEGATIVE: { glow:"#ef4444", bg:"rgba(239,68,68,0.12)",  text:"#f87171", bar:"#ef4444", emoji:"😞", label:"Negative" },
  NEUTRAL:  { glow:"#f59e0b", bg:"rgba(245,158,11,0.12)", text:"#fbbf24", bar:"#f59e0b", emoji:"😐", label:"Neutral"  },
};
const EMOTION_MAP = { joy:"🎉", anger:"😠", fear:"😨", sadness:"😢", surprise:"😲", disgust:"🤢", neutral:"😐" };
const EXAMPLES = [
  "I absolutely love this product, it changed my life!",
  "Terrible customer service, completely disappointed.",
  "The delivery arrived on time and was well packaged.",
  "This movie was an absolute masterpiece!",
  "I hate waiting so long, this is unacceptable.",
];

const CSS = `
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
  @keyframes fadeUp{from{opacity:0;transform:translateY(16px);}to{opacity:1;transform:translateY(0);}}
  @keyframes pulse{0%,100%{transform:scale(1);}50%{transform:scale(1.07);}}
  @keyframes spin{to{transform:rotate(360deg);}}
  @keyframes barGrow{from{width:0%;}}
  @keyframes shimmer{0%{background-position:-200% 0;}100%{background-position:200% 0;}}
  .fade-up{animation:fadeUp 0.4s cubic-bezier(.4,0,.2,1) both;}
  .emoji-pulse{animation:pulse 2s ease-in-out infinite;display:inline-block;}
  .card{background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:20px;margin-bottom:16px;}
  .tab-btn{padding:8px 14px;border-radius:8px;border:1px solid rgba(255,255,255,0.08);background:transparent;color:#64748b;cursor:pointer;font-size:13px;transition:all 0.2s;font-family:inherit;}
  .tab-btn.active{border-color:rgba(99,102,241,0.5);background:rgba(99,102,241,0.2);color:#a5b4fc;font-weight:500;}
  .analyze-btn{padding:12px 28px;border-radius:10px;border:none;font-weight:600;font-size:15px;cursor:pointer;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;transition:opacity 0.2s,transform 0.1s;width:100%;font-family:inherit;}
  .analyze-btn:hover:not(:disabled){opacity:0.9;transform:translateY(-1px);}
  .analyze-btn:disabled{opacity:0.45;cursor:not-allowed;}
  .secondary-btn{padding:12px 16px;border-radius:10px;border:1px solid rgba(255,255,255,0.12);background:transparent;color:#94a3b8;cursor:pointer;font-size:14px;transition:background 0.2s;width:100%;font-family:inherit;}
  .secondary-btn:hover{background:rgba(255,255,255,0.05);}
  .danger-btn{padding:12px 16px;border-radius:10px;border:1px solid rgba(239,68,68,0.3);background:rgba(239,68,68,0.08);color:#f87171;cursor:pointer;font-size:14px;transition:background 0.2s;width:100%;font-family:inherit;}
  .danger-btn:hover{background:rgba(239,68,68,0.15);}
  .textarea{width:100%;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:12px;color:#e2e8f0;font-size:15px;padding:14px;resize:vertical;min-height:120px;outline:none;line-height:1.6;font-family:inherit;transition:border-color 0.2s;}
  .textarea:focus{border-color:rgba(99,102,241,0.5);}
  .score-bar{height:8px;border-radius:99px;background:rgba(255,255,255,0.06);overflow:hidden;margin-top:5px;}
  .score-bar-fill{height:100%;border-radius:99px;animation:barGrow 0.8s cubic-bezier(.4,0,.2,1) both;}
  .btn-row{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:12px;}
  .btn-row-3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-top:12px;}
  .toggle{width:40px;height:22px;border-radius:99px;background:rgba(255,255,255,0.1);position:relative;transition:background 0.25s;border:none;cursor:pointer;flex-shrink:0;}
  .toggle.on{background:#6366f1;}
  .toggle::after{content:'';position:absolute;width:16px;height:16px;border-radius:50%;background:#fff;top:3px;left:3px;transition:transform 0.25s;}
  .toggle.on::after{transform:translateX(18px);}
  .chip{font-size:11px;padding:4px 10px;border-radius:20px;border:1px solid rgba(255,255,255,0.08);background:transparent;color:#64748b;cursor:pointer;white-space:nowrap;font-family:inherit;}
  .chip:hover{background:rgba(255,255,255,0.06);color:#94a3b8;}
  .pin-btn{font-size:16px;background:none;border:none;cursor:pointer;padding:4px;border-radius:6px;transition:transform 0.15s;}
  .pin-btn:hover{transform:scale(1.2);}
  @keyframes micPulse{0%,100%{box-shadow:0 0 0 0 rgba(239,68,68,0.5);}70%{box-shadow:0 0 0 14px rgba(239,68,68,0);}}
  .mic-btn{width:38px;height:38px;border-radius:50%;border:2px solid rgba(255,255,255,0.1);cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:18px;transition:all 0.2s;background:rgba(255,255,255,0.05);}
  .mic-btn:hover{background:rgba(255,255,255,0.1);border-color:rgba(255,255,255,0.2);}
  .mic-btn.listening{background:rgba(239,68,68,0.15);border-color:#ef4444;animation:micPulse 1.4s ease-in-out infinite;}
  .voice-bar{display:flex;align-items:flex-end;gap:3px;height:20px;}
  .voice-bar span{width:3px;border-radius:99px;background:#ef4444;height:4px;animation:voiceWave 0.9s ease-in-out infinite;}
  .voice-bar span:nth-child(1){animation-delay:0s;}
  .voice-bar span:nth-child(2){animation-delay:0.15s;}
  .voice-bar span:nth-child(3){animation-delay:0.3s;}
  .voice-bar span:nth-child(4){animation-delay:0.15s;}
  .voice-bar span:nth-child(5){animation-delay:0s;}
  @keyframes voiceWave{0%,100%{height:4px;}50%{height:18px;}}
  ::-webkit-scrollbar{width:4px;}
  ::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.1);border-radius:99px;}
  @media(max-width:600px){
    .btn-row{grid-template-columns:1fr;}
    .btn-row-3{grid-template-columns:1fr 1fr;}
    .card{padding:14px;border-radius:12px;}
    .tab-btn{padding:7px 9px;font-size:11px;}
  }
  body.light .card{background:#ffffff;border-color:#e2e8f0;}
  body.light .textarea{background:#f8fafc;border-color:#cbd5e1;color:#1e293b;}
  body.light .tab-btn{color:#94a3b8;border-color:#e2e8f0;}
  body.light .tab-btn.active{background:#ede9fe;color:#4f46e5;border-color:#c4b5fd;}
  body.light .secondary-btn{border-color:#e2e8f0;color:#64748b;}
  body.light .score-bar{background:#f1f5f9;}
  body.light .chip{border-color:#e2e8f0;color:#94a3b8;}
  body.light .textarea{color:#1e293b;}
`;

// ── Gauge ──────────────────────────────────────────────────────────────────────
function SentimentGauge({ sentiment, confidence }) {
  const t = THEME[sentiment] || THEME.NEUTRAL;
  const r=70, cx=90, cy=90;
  const rad = d => d*Math.PI/180;
  const px = d => cx + r*Math.cos(rad(d));
  const py = d => cy + r*Math.sin(rad(d));
  const track = `M ${px(-135)} ${py(-135)} A ${r} ${r} 0 1 1 ${px(135)} ${py(135)}`;
  const fa = -135 + confidence*270;
  const fill = `M ${px(-135)} ${py(-135)} A ${r} ${r} 0 ${confidence>0.5?1:0} 1 ${px(fa)} ${py(fa)}`;
  return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",margin:"8px 0 16px"}}>
      <svg width="180" height="110" viewBox="0 0 180 110" style={{overflow:"visible"}}>
        <path d={track} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" strokeLinecap="round"/>
        <path d={fill} fill="none" stroke={t.glow} strokeWidth="10" strokeLinecap="round"
          style={{filter:`drop-shadow(0 0 6px ${t.glow})`,transition:"all 0.8s cubic-bezier(.4,0,.2,1)"}}/>
        <text x="90" y="78" textAnchor="middle" fill={t.text} fontSize="22" fontWeight="700" fontFamily="Inter">{(confidence*100).toFixed(0)}%</text>
        <text x="90" y="96" textAnchor="middle" fill="#475569" fontSize="11" fontFamily="Inter">confidence</text>
      </svg>
    </div>
  );
}

// ── Word Highlight ─────────────────────────────────────────────────────────────
function HighlightedText({ highlights }) {
  if (!highlights || highlights.length === 0) return null;
  return (
    <div style={{marginBottom:16}}>
      <p style={{fontSize:11,fontWeight:600,color:"#475569",letterSpacing:"0.08em",marginBottom:8}}>WORD SENTIMENT HIGHLIGHT</p>
      <div style={{fontSize:14,lineHeight:1.8,background:"rgba(255,255,255,0.03)",padding:"12px",borderRadius:10,border:"1px solid rgba(255,255,255,0.06)"}}>
        {highlights.map((h,i) => {
          const t = h.sentiment ? THEME[h.sentiment.toUpperCase()] : null;
          return (
            <span key={i} style={t ? {background:t.bg,color:t.text,borderRadius:4,padding:"1px 3px",fontWeight:500} : {color:"#94a3b8"}}>
              {h.token}
            </span>
          );
        })}
      </div>
    </div>
  );
}

// ── Compare Panel ──────────────────────────────────────────────────────────────
function ComparePanel({ lightMode }) {
  const [textA, setTextA] = useState("");
  const [textB, setTextB] = useState("");
  const [resultA, setResultA] = useState(null);
  const [resultB, setResultB] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const compare = async () => {
    if (!textA.trim() || !textB.trim()) { setError("Enter both texts to compare."); return; }
    setLoading(true); setError("");
    try {
      const [a, b] = await Promise.all([
        axios.post(`${API}/analyze`, { text: textA }),
        axios.post(`${API}/analyze`, { text: textB }),
      ]);
      setResultA(a.data); setResultB(b.data);
    } catch { setError("Cannot reach backend."); }
    setLoading(false);
  };

  const tA = resultA ? THEME[resultA.sentiment] || THEME.NEUTRAL : null;
  const tB = resultB ? THEME[resultB.sentiment] || THEME.NEUTRAL : null;

  return (
    <div className="card">
      <h2 style={{fontSize:16,fontWeight:600,marginBottom:4}}>Compare Two Texts</h2>
      <p style={{fontSize:12,color:"#475569",marginBottom:16}}>Analyze and compare sentiment of two different texts side by side</p>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
        <div>
          <p style={{fontSize:12,color:"#94a3b8",marginBottom:6}}>Text A</p>
          <textarea className="textarea" value={textA} onChange={e=>setTextA(e.target.value)} placeholder="Enter first text..." style={{minHeight:90,fontSize:13}}/>
          {resultA && tA && (
            <div style={{marginTop:8,padding:"10px 12px",borderRadius:10,background:tA.bg,border:`1px solid ${tA.glow}33`}}>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <span style={{fontSize:20}}>{tA.emoji}</span>
                <span style={{fontWeight:600,color:tA.text,fontSize:14}}>{tA.label}</span>
                <span style={{fontSize:12,color:"#64748b",marginLeft:"auto"}}>{(resultA.confidence*100).toFixed(0)}%</span>
              </div>
              {resultA.emotion && <div style={{fontSize:11,color:"#64748b",marginTop:4}}>{EMOTION_MAP[resultA.emotion]} {resultA.emotion}</div>}
            </div>
          )}
        </div>
        <div>
          <p style={{fontSize:12,color:"#94a3b8",marginBottom:6}}>Text B</p>
          <textarea className="textarea" value={textB} onChange={e=>setTextB(e.target.value)} placeholder="Enter second text..." style={{minHeight:90,fontSize:13}}/>
          {resultB && tB && (
            <div style={{marginTop:8,padding:"10px 12px",borderRadius:10,background:tB.bg,border:`1px solid ${tB.glow}33`}}>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <span style={{fontSize:20}}>{tB.emoji}</span>
                <span style={{fontWeight:600,color:tB.text,fontSize:14}}>{tB.label}</span>
                <span style={{fontSize:12,color:"#64748b",marginLeft:"auto"}}>{(resultB.confidence*100).toFixed(0)}%</span>
              </div>
              {resultB.emotion && <div style={{fontSize:11,color:"#64748b",marginTop:4}}>{EMOTION_MAP[resultB.emotion]} {resultB.emotion}</div>}
            </div>
          )}
        </div>
      </div>
      {resultA && resultB && (
        <div style={{padding:"12px",borderRadius:10,background:"rgba(99,102,241,0.08)",border:"1px solid rgba(99,102,241,0.2)",marginBottom:12,fontSize:13,color:"#a5b4fc",textAlign:"center"}}>
          {resultA.sentiment === resultB.sentiment
            ? `Both texts are ${resultA.sentiment} — similar sentiment`
            : `Text A is ${resultA.sentiment} vs Text B is ${resultB.sentiment} — different sentiment`}
          {" · "}
          {resultA.confidence > resultB.confidence
            ? `Text A is more confident by ${((resultA.confidence - resultB.confidence)*100).toFixed(0)}%`
            : `Text B is more confident by ${((resultB.confidence - resultA.confidence)*100).toFixed(0)}%`}
        </div>
      )}
      {error && <div style={{marginBottom:10,padding:"8px 12px",borderRadius:8,background:"rgba(239,68,68,0.1)",color:"#fca5a5",fontSize:13}}>⚠️ {error}</div>}
      <button className="analyze-btn" onClick={compare} disabled={loading||!textA.trim()||!textB.trim()}>
        {loading ? "Comparing..." : "⚡ Compare Texts"}
      </button>
    </div>
  );
}

// ── Stats Chart ────────────────────────────────────────────────────────────────
function MiniChart({ history }) {
  const counts = { POSITIVE:0, NEGATIVE:0, NEUTRAL:0 };
  history.forEach(h => { counts[h.sentiment] = (counts[h.sentiment]||0)+1; });
  const total = history.length || 1;
  return (
    <div style={{marginTop:16}}>
      <p style={{fontSize:11,fontWeight:600,color:"#475569",letterSpacing:"0.08em",marginBottom:12}}>BREAKDOWN ({history.length} total)</p>
      {Object.entries(counts).map(([key, val]) => {
        const t = THEME[key]; const pct = Math.round((val/total)*100);
        return (
          <div key={key} style={{marginBottom:10}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
              <span style={{fontSize:13,color:"#94a3b8"}}>{t.emoji} {key.charAt(0)+key.slice(1).toLowerCase()}</span>
              <span style={{fontSize:13,fontWeight:600,color:t.text}}>{val} ({pct}%)</span>
            </div>
            <div className="score-bar"><div className="score-bar-fill" style={{width:`${pct}%`,background:t.bar}}/></div>
          </div>
        );
      })}
    </div>
  );
}

// ── Share Card ─────────────────────────────────────────────────────────────────
function shareResult(result) {
  const t = THEME[result.sentiment] || THEME.NEUTRAL;
  const text = `SentimentAI Result\n\n${t.emoji} ${t.label} (${(result.confidence*100).toFixed(1)}% confident)\n\nText: "${result.text.slice(0,100)}${result.text.length>100?"...":""}"\n\nEmotion: ${result.emotion || "N/A"}\nLanguage: ${result.language || "English"}\n\nAnalyzed by SentimentAI`;
  if (navigator.share) {
    navigator.share({ title:"SentimentAI Result", text }).catch(()=>{});
  } else {
    navigator.clipboard.writeText(text).then(() => alert("Result copied to clipboard!"));
  }
}

// ── Main App ──────────────────────────────────────────────────────────────────
export default function App() {
  const [text, setText]           = useState("");
  const [result, setResult]       = useState(null);
  const [loading, setLoading]     = useState(false);
  const [history, setHistory]     = useState([]);
  const [pinned, setPinned]       = useState([]);
  const [tab, setTab]             = useState("analyze");
  const [error, setError]         = useState("");
  const [lightMode, setLightMode] = useState(false);
  const [listening, setListening]     = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const fileRef = useRef();
  const recognitionRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      setVoiceSupported(true);
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = "en-US";
      rec.onresult = (e) => {
        const transcript = Array.from(e.results).map(r => r[0].transcript).join(" ");
        setText(transcript);
      };
      rec.onend = () => setListening(false);
      rec.onerror = () => { setListening(false); };
      recognitionRef.current = rec;
    }
  }, []);

  const toggleVoice = () => {
    if (!recognitionRef.current) return;
    if (listening) {
      recognitionRef.current.stop();
      setListening(false);
    } else {
      setText("");
      recognitionRef.current.start();
      setListening(true);
    }
  };

  useEffect(() => {
    document.body.style.background = lightMode ? "#f1f5f9" : "#0f0f13";
    document.body.style.color      = lightMode ? "#1e293b" : "#e2e8f0";
    lightMode ? document.body.classList.add("light") : document.body.classList.remove("light");
  }, [lightMode]);

  const analyze = async () => {
    if (!text.trim() || loading) return;
    setLoading(true); setError(""); setResult(null);
    try {
      const { data } = await axios.post(`${API}/analyze`, { text });
      setResult(data);
      setHistory(h => [data, ...h.slice(0,49)]);
    } catch {
      setError("Cannot reach backend. Make sure uvicorn is running in Terminal 1.");
    }
    setLoading(false);
  };

  const uploadFile = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    const isPDF = file.name.toLowerCase().endsWith(".pdf");
    const isCSV = file.name.toLowerCase().endsWith(".csv");
    if (!isPDF && !isCSV) { setError("Only CSV or PDF files supported."); return; }
    const form = new FormData(); form.append("file", file);
    setLoading(true); setError("");
    try {
      const endpoint = isPDF ? `${API}/analyze/pdf` : `${API}/analyze/csv`;
      const { data } = await axios.post(endpoint, form);
      if (isPDF) {
        const r = {
          text: `PDF: ${file.name} — ${data.total_chunks} sections`,
          sentiment: data.summary.positive >= data.summary.negative ? "POSITIVE" : "NEGATIVE",
          confidence: data.summary.avg_confidence,
          scores: { positive: data.summary.positive/data.summary.total, negative: data.summary.negative/data.summary.total, neutral: data.summary.neutral/data.summary.total },
          emotion: data.results[0]?.emotion || null,
          emoji: data.summary.positive >= data.summary.negative ? "😊" : "😞",
          color: "#6366f1", keywords: [], highlights: [], language: "English", warning: null,
          char_count: data.total_chars, word_count: 0,
        };
        setResult(r); setHistory(h => [r, ...h.slice(0,49)]);
      } else {
        alert(`✅ Analyzed ${data.total_rows} rows! Check console (F12) for details.`);
      }
    } catch (err) { setError(err.response?.data?.detail || "File upload failed."); }
    setLoading(false); e.target.value = "";
  };

  const togglePin = (item) => {
    setPinned(p => p.find(x=>x.text===item.text) ? p.filter(x=>x.text!==item.text) : [item,...p.slice(0,9)]);
  };
  const isPinned = (item) => pinned.some(x => x.text === item.text);

  const theme = result ? (THEME[result.sentiment] || THEME.NEUTRAL) : null;

  const TABS = ["analyze","compare","history","pinned","stats"];

  return (
    <>
      <style>{CSS}</style>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet"/>
      <div style={{minHeight:"100vh",fontFamily:"'Inter',sans-serif"}}>

        {/* Header */}
        <header style={{borderBottom:`1px solid ${lightMode?"#e2e8f0":"rgba(255,255,255,0.07)"}`,padding:"12px 16px",display:"flex",alignItems:"center",gap:10,background:lightMode?"rgba(255,255,255,0.9)":"rgba(255,255,255,0.02)",backdropFilter:"blur(12px)",position:"sticky",top:0,zIndex:100}}>
          <div style={{width:34,height:34,borderRadius:9,background:"linear-gradient(135deg,#6366f1,#8b5cf6)",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:16,color:"#fff",flexShrink:0}}>S</div>
          <div style={{flex:1}}>
            <div style={{fontWeight:600,fontSize:15}}>SentimentAI</div>
            <div style={{fontSize:10,color:"#475569"}}>RoBERTa · DistilBERT</div>
          </div>
          <button className={`toggle ${lightMode?"on":""}`} onClick={()=>setLightMode(m=>!m)} title="Toggle theme"/>
          <nav style={{display:"flex",gap:5,flexWrap:"wrap"}}>
            {TABS.map(t=>(
              <button key={t} className={`tab-btn ${tab===t?"active":""}`} onClick={()=>setTab(t)}>
                {t==="pinned"?"📌":""}{t.charAt(0).toUpperCase()+t.slice(1)}
                {t==="pinned"&&pinned.length>0?` (${pinned.length})`:""}
              </button>
            ))}
          </nav>
        </header>

        <main style={{maxWidth:900,margin:"0 auto",padding:"20px 14px"}}>

          {/* ── ANALYZE ── */}
          {tab==="analyze"&&(<>
            <div className="card">
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
                <span style={{fontSize:13,fontWeight:500,color:"#94a3b8"}}>Enter text to analyze</span>
                <span style={{fontSize:11,color:text.length>9000?"#ef4444":"#475569"}}>{text.length}/10000</span>
              </div>
              {/* Voice input indicator */}
              {listening && (
                <div style={{display:"flex",alignItems:"center",gap:10,padding:"8px 12px",borderRadius:10,background:"rgba(239,68,68,0.1)",border:"1px solid rgba(239,68,68,0.25)",marginBottom:8}}>
                  <div className="voice-bar">
                    <span/><span/><span/><span/><span/>
                  </div>
                  <span style={{fontSize:13,color:"#f87171",fontWeight:500}}>Listening... speak now</span>
                  <span style={{fontSize:11,color:"#64748b",marginLeft:"auto"}}>Click 🎤 to stop</span>
                </div>
              )}
              <div style={{position:"relative"}}>
                <textarea className="textarea" value={text} onChange={e=>setText(e.target.value)}
                  onKeyDown={e=>{if(e.ctrlKey&&e.key==="Enter")analyze();}}
                  placeholder={listening ? "🎤 Speak now... your words will appear here" : "Paste a review, tweet, article, feedback... (supports long text!)"}
                  style={{paddingRight:56}}/>
                {voiceSupported && (
                  <button className={`mic-btn ${listening?"listening":""}`}
                    onClick={toggleVoice}
                    title={listening?"Stop recording":"Start voice input"}
                    style={{position:"absolute",right:10,bottom:10,boxSizing:"border-box"}}>
                    {listening ? "⏹️" : "🎤"}
                  </button>
                )}
              </div>
              <div style={{display:"flex",flexWrap:"wrap",gap:6,margin:"10px 0"}}>
                {EXAMPLES.map((ex,i)=><button key={i} className="chip" onClick={()=>setText(ex)}>{ex.slice(0,28)}…</button>)}
              </div>
              <div className="btn-row">
                <button className="analyze-btn" onClick={analyze} disabled={loading||!text.trim()}>
                  {loading
                    ? <span style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
                        <span style={{width:14,height:14,border:"2px solid rgba(255,255,255,0.3)",borderTopColor:"#fff",borderRadius:"50%",animation:"spin 0.7s linear infinite",display:"inline-block"}}/>
                        Analyzing...
                      </span>
                    : "⚡ Analyze Sentiment"}
                </button>
                <button className="secondary-btn" onClick={()=>fileRef.current.click()}>📂 CSV / PDF</button>
                <input ref={fileRef} type="file" accept=".csv,.pdf" style={{display:"none"}} onChange={uploadFile}/>
              </div>
              {error&&<div style={{marginTop:12,padding:"10px 14px",borderRadius:10,background:"rgba(239,68,68,0.1)",border:"1px solid rgba(239,68,68,0.2)",fontSize:13,color:"#fca5a5"}}>⚠️ {error}</div>}
            </div>

            {result&&theme&&!loading&&(
              <div className="card fade-up" style={{border:`1px solid ${theme.glow}33`,boxShadow:`0 0 40px ${theme.glow}12`}}>
                {/* Top */}
                <div style={{display:"flex",flexDirection:"column",alignItems:"center",marginBottom:4}}>
                  <div className="emoji-pulse" style={{fontSize:50,marginBottom:6}}>{theme.emoji}</div>
                  <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap",justifyContent:"center"}}>
                    <span style={{fontSize:22,fontWeight:700,color:theme.text}}>{theme.label}</span>
                    {result.emotion&&<span style={{background:"rgba(255,255,255,0.05)",color:"#94a3b8",padding:"4px 12px",borderRadius:99,fontSize:12,border:"1px solid rgba(255,255,255,0.08)"}}>{EMOTION_MAP[result.emotion]||""} {result.emotion}</span>}
                    {result.language&&result.language!=="English"&&<span style={{background:"rgba(99,102,241,0.1)",color:"#a5b4fc",padding:"4px 12px",borderRadius:99,fontSize:12,border:"1px solid rgba(99,102,241,0.2)"}}>🌍 {result.language}</span>}
                  </div>
                  {/* Meta info */}
                  <div style={{display:"flex",gap:16,marginTop:8,fontSize:11,color:"#475569"}}>
                    {result.word_count>0&&<span>📝 {result.word_count} words</span>}
                    {result.char_count>0&&<span>🔤 {result.char_count} chars</span>}
                  </div>
                  <p style={{fontSize:12,color:"#64748b",marginTop:6,textAlign:"center",fontStyle:"italic",maxWidth:400,padding:"0 8px"}}>
                    "{result.text.length>90?result.text.slice(0,90)+"...":result.text}"
                  </p>
                </div>

                {/* Warning */}
                {result.warning&&(
                  <div style={{margin:"8px 0",padding:"8px 12px",borderRadius:8,background:"rgba(245,158,11,0.1)",border:"1px solid rgba(245,158,11,0.2)",fontSize:12,color:"#fbbf24"}}>
                    ⚠️ {result.warning}
                  </div>
                )}

                <SentimentGauge sentiment={result.sentiment} confidence={result.confidence}/>

                {/* Scores */}
                <div style={{marginBottom:16}}>
                  <p style={{fontSize:11,fontWeight:600,color:"#475569",letterSpacing:"0.08em",marginBottom:10}}>SCORE BREAKDOWN</p>
                  {Object.entries(result.scores).map(([key,val])=>{
                    const t=THEME[key.toUpperCase()]||THEME.NEUTRAL;
                    return(
                      <div key={key} style={{marginBottom:10}}>
                        <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                          <span style={{fontSize:13,color:"#94a3b8",textTransform:"capitalize"}}>{key}</span>
                          <span style={{fontSize:13,fontWeight:600,color:t.text}}>{(val*100).toFixed(1)}%</span>
                        </div>
                        <div className="score-bar"><div className="score-bar-fill" style={{width:`${val*100}%`,background:t.bar}}/></div>
                      </div>
                    );
                  })}
                </div>

                {/* Word highlights */}
                <HighlightedText highlights={result.highlights}/>

                {/* Keywords */}
                {result.keywords.length>0&&(
                  <div style={{marginBottom:16}}>
                    <p style={{fontSize:11,fontWeight:600,color:"#475569",letterSpacing:"0.08em",marginBottom:8}}>KEY SENTIMENT WORDS</p>
                    <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
                      {result.keywords.map((kw,i)=>{
                        const kt=THEME[(kw.sentiment||"neutral").toUpperCase()]||THEME.NEUTRAL;
                        return <span key={i} style={{padding:"5px 14px",borderRadius:99,fontSize:13,background:kt.bg,color:kt.text,border:`1px solid ${kt.glow}30`}}>{kw.word}</span>;
                      })}
                    </div>
                  </div>
                )}

                {/* Action buttons */}
                <div className="btn-row">
                  <button className="secondary-btn" onClick={()=>togglePin(result)}>
                    {isPinned(result) ? "📌 Pinned!" : "📌 Pin Result"}
                  </button>
                  <button className="secondary-btn" onClick={()=>shareResult(result)}>
                    📤 Share Result
                  </button>
                </div>
              </div>
            )}
          </>)}

          {/* ── COMPARE ── */}
          {tab==="compare"&&<ComparePanel lightMode={lightMode}/>}

          {/* ── HISTORY ── */}
          {tab==="history"&&(
            <div className="card">
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
                <h2 style={{fontSize:16,fontWeight:600}}>Analysis History</h2>
                {history.length>0&&<button onClick={()=>setHistory([])} style={{fontSize:12,color:"#ef4444",background:"none",border:"none",cursor:"pointer"}}>Clear all</button>}
              </div>
              {history.length===0?(
                <div style={{textAlign:"center",padding:"48px 0",color:"#334155"}}>
                  <div style={{fontSize:36,marginBottom:10}}>📭</div>
                  <div style={{fontSize:14}}>No analyses yet!</div>
                </div>
              ):history.map((h,i)=>{
                const ht=THEME[h.sentiment]||THEME.NEUTRAL;
                return(
                  <div key={i} style={{display:"flex",gap:10,padding:"12px 0",borderBottom:"1px solid rgba(255,255,255,0.05)",alignItems:"flex-start"}}>
                    <span style={{fontSize:20,flexShrink:0}}>{ht.emoji}</span>
                    <div style={{flex:1,minWidth:0}}>
                      <p style={{margin:"0 0 5px",fontSize:13,color:lightMode?"#334155":"#cbd5e1",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{h.text}</p>
                      <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                        <span style={{background:ht.bg,color:ht.text,padding:"2px 10px",borderRadius:99,fontSize:11,fontWeight:500}}>{h.sentiment}</span>
                        <span style={{color:"#475569",fontSize:11}}>{(h.confidence*100).toFixed(0)}% conf</span>
                        {h.emotion&&<span style={{color:"#475569",fontSize:11}}>{EMOTION_MAP[h.emotion]} {h.emotion}</span>}
                        {h.language&&h.language!=="English"&&<span style={{color:"#475569",fontSize:11}}>🌍 {h.language}</span>}
                      </div>
                    </div>
                    <div style={{display:"flex",gap:4,flexShrink:0}}>
                      <button className="pin-btn" onClick={()=>togglePin(h)} title="Pin">{isPinned(h)?"📌":"🔖"}</button>
                      <button onClick={()=>{setText(h.text);setTab("analyze");}} style={{fontSize:11,padding:"3px 10px",borderRadius:8,border:"1px solid rgba(255,255,255,0.08)",background:"transparent",color:"#475569",cursor:"pointer"}}>Reuse</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── PINNED ── */}
          {tab==="pinned"&&(
            <div className="card">
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
                <h2 style={{fontSize:16,fontWeight:600}}>📌 Pinned Analyses</h2>
                {pinned.length>0&&<button onClick={()=>setPinned([])} style={{fontSize:12,color:"#ef4444",background:"none",border:"none",cursor:"pointer"}}>Clear all</button>}
              </div>
              {pinned.length===0?(
                <div style={{textAlign:"center",padding:"48px 0",color:"#334155"}}>
                  <div style={{fontSize:36,marginBottom:10}}>📌</div>
                  <div style={{fontSize:14}}>No pinned analyses yet! Pin results from the Analyze tab.</div>
                </div>
              ):pinned.map((h,i)=>{
                const ht=THEME[h.sentiment]||THEME.NEUTRAL;
                return(
                  <div key={i} style={{padding:"14px",borderRadius:12,border:`1px solid ${ht.glow}22`,background:ht.bg,marginBottom:10}}>
                    <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:6}}>
                      <span style={{fontSize:24}}>{ht.emoji}</span>
                      <span style={{fontWeight:600,color:ht.text,fontSize:15}}>{ht.label}</span>
                      <span style={{fontSize:12,color:"#64748b"}}>{(h.confidence*100).toFixed(0)}% confident</span>
                      {h.emotion&&<span style={{fontSize:12,color:"#64748b",marginLeft:"auto"}}>{EMOTION_MAP[h.emotion]} {h.emotion}</span>}
                    </div>
                    <p style={{fontSize:13,color:lightMode?"#334155":"#94a3b8",marginBottom:8,lineHeight:1.5}}>{h.text.slice(0,150)}{h.text.length>150?"...":""}</p>
                    <div style={{display:"flex",gap:8}}>
                      <button onClick={()=>{setText(h.text);setTab("analyze");}} style={{fontSize:12,padding:"5px 14px",borderRadius:8,border:"1px solid rgba(255,255,255,0.15)",background:"transparent",color:"#94a3b8",cursor:"pointer"}}>Reanalyze</button>
                      <button onClick={()=>shareResult(h)} style={{fontSize:12,padding:"5px 14px",borderRadius:8,border:"1px solid rgba(255,255,255,0.15)",background:"transparent",color:"#94a3b8",cursor:"pointer"}}>📤 Share</button>
                      <button onClick={()=>togglePin(h)} style={{fontSize:12,padding:"5px 14px",borderRadius:8,border:"1px solid rgba(239,68,68,0.3)",background:"transparent",color:"#f87171",cursor:"pointer",marginLeft:"auto"}}>Unpin</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── STATS ── */}
          {tab==="stats"&&(
            <div className="card">
              <h2 style={{fontSize:16,fontWeight:600,marginBottom:4}}>Session Stats</h2>
              <p style={{fontSize:12,color:"#475569",marginBottom:16}}>Based on your current session</p>
              {history.length===0?(
                <div style={{textAlign:"center",padding:"48px 0",color:"#334155"}}>
                  <div style={{fontSize:36,marginBottom:10}}>📊</div>
                  <div style={{fontSize:14}}>Analyze some text first!</div>
                </div>
              ):(<>
                <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:16}}>
                  {[
                    {label:"Total",value:history.length,color:"#a5b4fc"},
                    {label:"Avg Conf",value:(history.reduce((a,h)=>a+h.confidence,0)/history.length*100).toFixed(0)+"%",color:"#34d399"},
                    {label:"Pinned",value:pinned.length,color:"#fbbf24"},
                  ].map((s,i)=>(
                    <div key={i} style={{background:"rgba(255,255,255,0.04)",borderRadius:12,padding:"14px 10px",textAlign:"center",border:"1px solid rgba(255,255,255,0.06)"}}>
                      <div style={{fontSize:22,fontWeight:700,color:s.color}}>{s.value}</div>
                      <div style={{fontSize:11,color:"#475569",marginTop:2}}>{s.label}</div>
                    </div>
                  ))}
                </div>
                <MiniChart history={history}/>
                <div style={{marginTop:16}}>
                  <p style={{fontSize:11,fontWeight:600,color:"#475569",letterSpacing:"0.08em",marginBottom:10}}>EMOTIONS DETECTED</p>
                  <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
                    {[...new Set(history.map(h=>h.emotion).filter(Boolean))].map((em,i)=>(
                      <span key={i} style={{padding:"5px 14px",borderRadius:99,fontSize:13,background:"rgba(255,255,255,0.05)",color:"#94a3b8",border:"1px solid rgba(255,255,255,0.08)"}}>
                        {EMOTION_MAP[em]} {em}
                      </span>
                    ))}
                  </div>
                </div>
                <div style={{marginTop:16}}>
                  <p style={{fontSize:11,fontWeight:600,color:"#475569",letterSpacing:"0.08em",marginBottom:10}}>LANGUAGES DETECTED</p>
                  <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
                    {[...new Set(history.map(h=>h.language).filter(Boolean))].map((lang,i)=>(
                      <span key={i} style={{padding:"5px 14px",borderRadius:99,fontSize:13,background:"rgba(255,255,255,0.05)",color:"#94a3b8",border:"1px solid rgba(255,255,255,0.08)"}}>
                        🌍 {lang}
                      </span>
                    ))}
                  </div>
                </div>
              </>)}
            </div>
          )}

        </main>
      </div>
    </>
  );
}