/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Terminal as TerminalIcon, 
  ShieldAlert, 
  ShieldCheck, 
  Mail, 
  Lock, 
  Key, 
  Network, 
  Cpu, 
  AlertTriangle, 
  ChevronRight,
  Clock,
  Unlock,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Activity,
  Zap,
  HardDrive
} from 'lucide-react';
import { cn } from './lib/utils';

// --- Types ---
type GameStage = 'intro' | 'phishing' | 'password' | 'cipher' | 'network' | 'final' | 'victory' | 'game-over';

interface TerminalMessage {
  text: string;
  type: 'info' | 'error' | 'success' | 'warning';
  timestamp: string;
}

// --- Components ---

const MatrixBackground = () => (
  <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden opacity-5">
    <div className="absolute inset-0 bg-[#050505]" />
    <div className="flex justify-around w-full h-full text-[#22c55e] font-mono text-sm leading-none opacity-20">
      {Array.from({ length: 40 }).map((_, i) => (
        <div key={i} className="flex flex-col animate-matrix" style={{ animationDelay: `${Math.random() * 5}s`, animationDuration: `${10 + Math.random() * 20}s` }}>
          {Array.from({ length: 50 }).map((_, j) => (
            <span key={j}>{Math.random() > 0.5 ? '1' : '0'}</span>
          ))}
        </div>
      ))}
    </div>
  </div>
);

// --- Sound Manager (Web Audio API) ---
const playSound = (type: 'intro' | 'correct' | 'error' | 'click' | 'victory' | 'beeping') => {
  const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioContext) return;
  
  const ctx = new AudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  
  osc.connect(gain);
  gain.connect(ctx.destination);
  
  const now = ctx.currentTime;
  
  switch (type) {
    case 'intro':
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(40, now);
      osc.frequency.exponentialRampToValueAtTime(120, now + 2);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 2);
      osc.start(now);
      osc.stop(now + 2);
      break;
    case 'correct':
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.exponentialRampToValueAtTime(1046.50, now + 0.2); // C6
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
      osc.start(now);
      osc.stop(now + 0.3);
      break;
    case 'error':
      osc.type = 'square';
      osc.frequency.setValueAtTime(110, now);
      osc.frequency.linearRampToValueAtTime(40, now + 0.2);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
      osc.start(now);
      osc.stop(now + 0.3);
      break;
    case 'click':
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(200, now);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
      osc.start(now);
      osc.stop(now + 0.05);
      break;
    case 'victory':
      [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = 'sine';
        o.frequency.setValueAtTime(freq, now + (i * 0.1));
        g.gain.setValueAtTime(0.1, now + (i * 0.1));
        g.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
        o.connect(g);
        g.connect(ctx.destination);
        o.start(now + (i * 0.1));
        o.stop(now + 0.6);
      });
      break;
    case 'beeping':
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
      osc.start(now);
      osc.stop(now + 0.1);
      break;
  }
};

const STAGE_HINTS: Record<string, string[]> = {
  phishing: [
    "Look closely at the sender addresses. Are they from the official '.edu' domain?",
    "Check the URL carefully. 'g00gle' with zeros is a common tactical error used in credential harvesting."
  ],
  password: [
    "Security protocols require diversity: Mix capitals, numbers, and symbols like '!' or '#'.",
    "Ensure the total bit-depth is at least 12 characters long for maximum encryption strength."
  ],
  cipher: [
    "The hacker is using a Caesar Shift of +3. To reverse it, count 3 steps BACK in the alphabet.",
    "H shifts back to E (H -> G -> F -> E). Apply this to the full HVFDSH buffer."
  ],
  network: [
    "Search for the source performing many connections in a row (21, 22, 23, 25). That's a 'Port Scan'.",
    "Identify the internal IP address 10.0.4.152. Its behavior is consistent with an automated probe."
  ],
  final: [
    "The override code is 5 letters long. Combine the bytes you collected: G, U, A, R, D.",
    "You are the shield stopping the attack. Type the word that represents your role: GUARD."
  ]
};

const Terminal = ({ messages, onCommand }: { messages: TerminalMessage[], onCommand: (cmd: string) => void }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [input, setInput] = useState("");

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    onCommand(input.trim().toLowerCase());
    setInput("");
    playSound('click');
  };

  return (
    <div className="bg-[#101010]/80 backdrop-blur-md border border-[#22c55e]/20 rounded-lg p-3 font-mono text-[11px] h-full overflow-hidden flex flex-col shadow-[0_0_15px_rgba(34,197,94,0.05)]">
      <div className="flex items-center gap-2 mb-2 pb-2 border-b border-[#22c55e]/20 text-[#22c55e] opacity-60">
        <TerminalIcon size={12} />
        <span className="text-[10px] uppercase tracking-widest font-bold">System Console v4.0.1</span>
      </div>
      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-1 scrollbar-hide mb-2">
        {messages.map((msg, i) => (
          <div key={i} className={cn(
            "flex gap-2 leading-tight",
            msg.type === 'error' ? "text-[#ef4444]" : 
            msg.type === 'success' ? "text-[#22c55e]" : 
            msg.type === 'warning' ? "text-amber-400" : "text-[#22c55e]"
          )}>
            <span className="opacity-40 shrink-0">[{msg.timestamp}]</span>
            <span className="break-all">{msg.text}</span>
          </div>
        ))}
        {messages.length === 0 && <p className="text-white/40 italic">Waiting for uplink...</p>}
      </div>
      <form onSubmit={handleSubmit} className="flex gap-2 border-t border-[#22c55e]/10 pt-2">
        <span className="text-[#22c55e]">root@ir-analyst:~$</span>
        <input 
          type="text" 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 bg-transparent border-none outline-none text-[#22c55e] placeholder:text-[#22c55e]/20"
          placeholder="ENTER COMMAND..."
          autoFocus
        />
      </form>
    </div>
  );
};

const HintButton = ({ onHint, hintsUsed }: { onHint: () => void, hintsUsed: number }) => (
  <button 
    onClick={onHint}
    disabled={hintsUsed >= 2}
    className={cn(
      "px-3 py-1 border text-[9px] font-bold uppercase tracking-widest transition-all",
      hintsUsed >= 2 
        ? "border-white/10 text-white/10" 
        : "border-amber-400/30 text-amber-400 bg-amber-400/5 hover:bg-amber-400/20"
    )}
  >
    {hintsUsed >= 2 ? "NO HINTS LEFT" : `REQUEST HINT (${2 - hintsUsed})`}
  </button>
);

const TimerDisplay = ({ timeLeft }: { timeLeft: number }) => {
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  
  return (
    <div className="flex flex-col items-end">
      <div className={cn(
        "text-3xl font-black tabular-nums transition-colors duration-500",
        timeLeft < 60 ? "text-[#ef4444] animate-pulse" : "text-[#ef4444]"
      )}>
        {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
      </div>
      <div className="text-[10px] uppercase tracking-widest text-[#ef4444] opacity-80 decoration-red-500/50">TIME TO LOCKOUT</div>
    </div>
  );
};

const ProgressMap = ({ currentStage }: { currentStage: GameStage }) => {
  const stages: { id: GameStage; label: string }[] = [
    { id: 'phishing', label: 'PHISH' },
    { id: 'password', label: 'PASS' },
    { id: 'cipher', label: 'CIPH' },
    { id: 'network', label: 'NET' },
    { id: 'final', label: 'CODE' }
  ];

  const getStageIndex = (s: GameStage) => stages.findIndex(item => item.id === s);
  const currentIndex = getStageIndex(currentStage);

  return (
    <div className="h-40 bg-[#101010]/80 backdrop-blur-md border border-[#22c55e]/20 rounded-lg p-3">
      <h3 className="text-[10px] uppercase border-b border-[#22c55e]/20 pb-2 mb-2 opacity-60 font-bold tracking-widest">Progress Map</h3>
      <div className="grid grid-cols-3 gap-2 mt-2">
        {stages.map((s, i) => {
          const isDone = i < currentIndex;
          const isCurrent = i === currentIndex;
          return (
            <div 
              key={s.id} 
              className={cn(
                "h-10 border flex items-center justify-center text-[10px] font-bold tracking-tighter transition-all duration-500",
                isDone ? "border-[#22c55e] bg-[#22c55e]/20 text-[#22c55e]" : 
                isCurrent ? "border-[#22c55e] bg-[#22c55e]/40 text-[#22c55e] shadow-[0_0_10px_#22c55e]" : 
                "border-white/20 text-white/20 opacity-30"
              )}
            >
              {isDone ? 'DONE' : s.label}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const NetworkVitals = ({ integrity }: { integrity: number }) => (
  <div className="flex-1 bg-[#101010]/80 backdrop-blur-md border border-[#22c55e]/20 rounded-lg p-3">
    <h3 className="text-[10px] uppercase border-b border-[#22c55e]/20 pb-2 mb-2 opacity-60 font-bold tracking-widest">Network Vitals</h3>
    <div className="space-y-4 mt-4 text-[10px] font-mono">
      <div>
        <div className="flex justify-between mb-1">
          <span>DATABASE INTEGRITY</span>
          <span className={integrity < 50 ? "text-[#ef4444]" : "text-[#22c55e]"}>{integrity}%</span>
        </div>
        <div className="w-full h-1 bg-white/10">
          <div 
            className={cn("h-full transition-all duration-1000", integrity < 50 ? "bg-[#ef4444] shadow-[0_0_5px_#ef4444]" : "bg-[#22c55e] shadow-[0_0_5px_#22c55e]")} 
            style={{ width: `${integrity}%` }}
          />
        </div>
      </div>
      <div>
        <div className="flex justify-between mb-1">
          <span>TRAFFIC ANOMALY</span>
          <span className="text-[#ef4444]">CRITICAL</span>
        </div>
        <div className="w-full h-1 bg-white/10">
          <div className="w-[88%] h-full bg-[#ef4444] shadow-[0_0_5px_#ef4444] animate-pulse" />
        </div>
      </div>
      <div>
        <div className="flex justify-between mb-1">
          <span>ENCRYPTION SHIELD</span>
          <span className="text-[#22c55e]">STABLE</span>
        </div>
        <div className="w-full h-1 bg-white/10">
          <div className="w-[95%] h-full bg-[#22c55e] shadow-[0_0_5px_#22c55e]" />
        </div>
      </div>
    </div>
    <div className="mt-8 flex justify-center">
      <div className="w-20 h-20 border border-[#22c55e]/30 rounded-full flex items-center justify-center relative">
        <div className="absolute inset-0 border-t-2 border-[#22c55e] rounded-full animate-spin"></div>
        <div className="text-center font-bold">
          <div className="text-[8px]">SCANNING</div>
          <div className="text-[6px] opacity-40">THREAT L4</div>
        </div>
      </div>
    </div>
  </div>
);

// --- Game Stages ---

const IntroStage = ({ onStart }: { onStart: () => void }) => (
  <motion.div 
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.95 }}
    className="max-w-2xl w-full text-center space-y-12 p-12 bg-[#151515]/90 backdrop-blur-xl border border-[#22c55e]/30 rounded-2xl shadow-[0_0_50px_rgba(34,197,94,0.1)]"
  >
    <div className="relative inline-block">
      <div className="w-24 h-24 rounded-full border-4 border-[#22c55e] flex items-center justify-center animate-pulse shadow-[0_0_20px_rgba(34,197,94,0.3)]">
        <ShieldAlert size={48} className="text-[#22c55e]" />
      </div>
      <motion.div 
        animate={{ rotate: 360 }}
        transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
        className="absolute -inset-6 border-2 border-dashed border-[#22c55e]/20 rounded-full"
      />
    </div>
    
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-5xl md:text-6xl font-black text-[#22c55e] tracking-tighter uppercase italic">
          Cyber Guard
        </h1>
        <div className="h-1 w-24 bg-[#22c55e] mx-auto opacity-50" />
      </div>
      <p className="text-[#22c55e]/80 font-mono text-sm max-w-md mx-auto leading-relaxed">
        INTRUSION DETECTED. A rogue exploit has been deployed against the Lincoln High School central servers. 
        As lead Incident Response Analyst, your mission is to neutralize the threat before the graduation database is deleted.
      </p>
    </div>

    <button 
      onClick={onStart}
      className="group relative px-10 py-5 bg-[#22c55e]/10 border-2 border-[#22c55e] text-[#22c55e] font-black uppercase tracking-[0.2em] hover:bg-[#22c55e] hover:text-black transition-all duration-500 overflow-hidden"
    >
      <span className="relative z-10">Initialize Countermeasures</span>
      <motion.div 
        initial={{ x: '-100%' }}
        whileHover={{ x: '100%' }}
        transition={{ duration: 0.5 }}
        className="absolute inset-0 bg-white/20 skew-x-12"
      />
    </button>
  </motion.div>
);

const PhishingStage = ({ onSuccess, onFail, onHint, hintsUsed }: { onSuccess: (hint: string) => void, onFail: (msg: string, penalty?: number) => void, onHint: () => void, hintsUsed: number }) => {
  const emails = [
    {
      id: 1,
      sender: "Principal Higgins <higgins@lincolnhigh.edu>",
      subject: "Meeting regarding graduation ceremony",
      content: "Hello Team, please review the final seating chart for tomorrow. It is attached to this internal memo.",
      isPhish: false
    },
    {
      id: 2,
      sender: "IT Support <admin@lincoln-high-security.com>",
      subject: "URGENT: Your student account credentials",
      content: "Security breach detected. Your password has been flagged. Click here to login to our secure portal and verify your identity: http://g00gle.verify-acc.net/login/auth",
      isPhish: true
    },
    {
      id: 3,
      sender: "Library Services <noreply@lib.lincoln.edu>",
      subject: "Overdue Book Notice",
      content: "This is a reminder that 'The Cuckoo's Egg' is currently 3 days overdue. Please return it to avoid further fines.",
      isPhish: false
    }
  ];

  return (
    <div className="w-full h-full flex flex-col">
      <div className="bg-[#22c55e]/10 border-b border-[#22c55e]/40 px-4 py-2 flex justify-between items-center bg-black/20">
        <div className="flex items-center gap-4">
          <span className="text-sm font-bold uppercase tracking-widest text-[#22c55e]">Objective: Identify Phishing</span>
          <HintButton onHint={onHint} hintsUsed={hintsUsed} />
        </div>
        <span className="text-[10px] py-0.5 px-2 bg-[#22c55e] text-black font-black rounded uppercase tracking-tighter">STAGE 01/05</span>
      </div>
      
      <div className="flex-1 p-6 overflow-y-auto space-y-4 font-sans">
        {emails.map((email) => (
          <div key={email.id} className="bg-white/5 border border-white/10 rounded-lg p-5 group hover:border-[#22c55e]/30 transition-all">
            <div className="border-b border-white/10 pb-3 mb-4 flex justify-between items-start">
              <div>
                <p className="text-[10px] uppercase opacity-50 font-mono">From:</p>
                <p className="text-sm font-bold text-[#e5e7eb]">{email.sender}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase opacity-50 font-mono">Subject:</p>
                <p className="text-sm font-bold text-[#e5e7eb]">{email.subject}</p>
              </div>
            </div>
            
            <div className="space-y-4 mb-6">
              <p className="text-sm text-[#e5e7eb]/80 leading-relaxed italic">{email.content}</p>
            </div>

            <div className="flex gap-4">
              <button 
                onClick={() => email.isPhish ? onSuccess("G") : onFail("Analyzing legitimate data. Resource leak!")}
                className="flex-1 py-3 border border-[#22c55e] bg-[#22c55e]/10 text-[#22c55e] text-[10px] font-black uppercase tracking-widest hover:bg-[#22c55e] hover:text-black transition-all"
              >
                Mark as Malicious
              </button>
              <button 
                onClick={() => email.isPhish ? onFail("Threat allowed to penetrate perimeter!") : onSuccess("G")}
                className="flex-1 py-3 border border-white/10 bg-white/5 text-white/40 text-[10px] font-black uppercase tracking-widest hover:bg-white/10 hover:text-white transition-all font-mono"
              >
                Verify & Pass
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const PasswordStage = ({ onSuccess, onFail, onHint, hintsUsed }: { onSuccess: (hint: string) => void, onFail: (msg: string, penalty?: number) => void, onHint: () => void, hintsUsed: number }) => {
  const [password, setPassword] = useState("");
  const [checks, setChecks] = useState({
    length: false,
    number: false,
    special: false,
    upper: false
  });

  useEffect(() => {
    setChecks({
      length: password.length >= 12,
      number: /[0-9]/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
      upper: /[A-Z]/.test(password)
    });
  }, [password]);

  const handleSubmit = () => {
    if (Object.values(checks).every(Boolean)) {
      onSuccess("U");
    } else {
      onFail("Password security depth insufficient. System lockdown persists.");
    }
  };

  return (
    <div className="w-full h-full flex flex-col">
      <div className="bg-[#22c55e]/10 border-b border-[#22c55e]/40 px-4 py-2 flex justify-between items-center bg-black/20">
        <div className="flex items-center gap-4">
          <span className="text-sm font-bold uppercase tracking-widest text-[#22c55e]">Objective: Access Override</span>
          <HintButton onHint={onHint} hintsUsed={hintsUsed} />
        </div>
        <span className="text-[10px] py-0.5 px-2 bg-[#22c55e] text-black font-black rounded uppercase tracking-tighter">STAGE 02/05</span>
      </div>

      <div className="flex-1 p-8 flex flex-col items-center justify-center space-y-12">
        <p className="text-xs text-[#22c55e]/70 font-mono italic text-center max-w-sm">
          Default admin password compromised. Generating NEW multi-factor cryptographic key string...
        </p>

        <div className="w-full max-w-md space-y-8">
          <div className="relative group">
            <input 
              type="text"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="ENTER SECURE SEQUENCE..."
              className="w-full bg-black/60 border-2 border-[#22c55e]/40 p-5 font-mono text-[#22c55e] text-center focus:outline-none focus:border-[#22c55e] placeholder:text-[#22c55e]/20 transition-all text-xl tracking-[0.2em]"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {Object.entries(checks).map(([key, val]) => (
              <div 
                key={key} 
                className={cn(
                  "p-4 border flex flex-col items-center gap-2 transition-all",
                  val ? "border-[#22c55e] bg-[#22c55e]/10 text-[#22c55e]" : "border-white/10 bg-white/5 text-white/20"
                )}
              >
                {val ? <ShieldCheck size={18} /> : <AlertTriangle size={18} />}
                <span className="text-[9px] uppercase tracking-widest font-black">
                  {key === 'length' ? '12+ Characters' : key === 'number' ? 'Include Number' : key === 'special' ? 'Special Symbol' : 'Uppercase'}
                </span>
              </div>
            ))}
          </div>
        </div>

        <button 
          onClick={handleSubmit}
          className="w-full max-w-md py-4 bg-[#22c55e] text-black font-black uppercase tracking-[0.4em] hover:bg-white hover:text-black transition-all active:scale-95 shadow-[0_0_20px_rgba(34,197,94,0.3)]"
        >
          Inject Credentials
        </button>
      </div>
    </div>
  );
};

const CipherStage = ({ onSuccess, onFail, onHint, hintsUsed }: { onSuccess: (hint: string) => void, onFail: (msg: string, penalty?: number) => void, onHint: () => void, hintsUsed: number }) => {
  const [answer, setAnswer] = useState("");
  const encrypted = "HVFDSH";
  
  const handleSubmit = () => {
    if (answer.toUpperCase() === "ESCAPE") {
      onSuccess("A");
    } else {
      onFail("Decryption sequence rejected. Data corruption detected.");
    }
  };

  return (
    <div className="w-full h-full flex flex-col">
      <div className="bg-[#22c55e]/10 border-b border-[#22c55e]/40 px-4 py-2 flex justify-between items-center bg-black/20">
        <div className="flex items-center gap-4">
          <span className="text-sm font-bold uppercase tracking-widest text-[#22c55e]">Objective: Packet Decryption</span>
          <HintButton onHint={onHint} hintsUsed={hintsUsed} />
        </div>
        <span className="text-[10px] py-0.5 px-2 bg-[#22c55e] text-black font-black rounded uppercase tracking-tighter">STAGE 03/05</span>
      </div>

      <div className="flex-1 p-8 flex flex-col items-center justify-center space-y-12">
        <div className="text-center space-y-4">
          <div className="text-[10px] font-mono text-[#22c55e]/40 uppercase tracking-[0.4em]">Encrypted Buffer</div>
          <div className="text-7xl font-black text-[#22c55e] tracking-[0.3em] animate-pulse drop-shadow-[0_0_15px_rgba(34,197,94,0.5)]">
            {encrypted}
          </div>
          <p className="text-[10px] font-mono text-[#22c55e]/60 italic max-w-xs mx-auto">
            HINT: Reverse Caesar shift by 3 units (X = X - 3). Standard alphabetical indexing.
          </p>
        </div>

        <div className="w-full max-w-md space-y-6">
          <input 
            type="text"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            placeholder="DECODED KEYWORD..."
            className="w-full bg-black/60 border-2 border-[#22c55e]/40 p-5 font-mono text-[#22c55e] text-center focus:outline-none focus:border-[#22c55e] placeholder:text-[#22c55e]/20 uppercase tracking-[0.4em] text-lg"
            autoFocus
          />
          <button 
            onClick={handleSubmit}
            className="w-full py-4 border-2 border-[#22c55e] bg-[#22c55e]/10 text-[#22c55e] font-black uppercase tracking-[0.3em] hover:bg-[#22c55e] hover:text-black transition-all"
          >
            Execute Decryption
          </button>
        </div>
      </div>
    </div>
  );
};

const NetworkStage = ({ onSuccess, onFail, onHint, hintsUsed }: { onSuccess: (hint: string) => void, onFail: (msg: string, penalty?: number) => void, onHint: () => void, hintsUsed: number }) => {
  const logs = [
    { time: "16:20:01", src: "192.168.1.1", dst: "MAIN", port: 80, info: "HTTP GET /", suspicious: false },
    { time: "16:20:05", src: "192.168.1.5", dst: "MAIN", port: 443, info: "SSL HAND", suspicious: false },
    { time: "16:21:12", src: "10.0.4.152", dst: "MAIN", port: 21, info: "FTP BRUTE", suspicious: true },
    { time: "16:21:13", src: "10.0.4.152", dst: "MAIN", port: 22, info: "SSH PROBE", suspicious: true },
    { time: "16:21:14", src: "10.0.4.152", dst: "MAIN", port: 23, info: "TELNET ACCESS", suspicious: true },
    { time: "16:21:15", src: "10.0.4.152", dst: "MAIN", port: 25, info: "SMTP RELAY", suspicious: true },
    { time: "16:22:40", src: "192.168.1.12", dst: "MAIN", port: 443, info: "SSL HAND", suspicious: false }
  ];

  return (
    <div className="w-full h-full flex flex-col">
      <div className="bg-[#22c55e]/10 border-b border-[#22c55e]/40 px-4 py-2 flex justify-between items-center bg-black/20">
        <div className="flex items-center gap-4">
          <span className="text-sm font-bold uppercase tracking-widest text-[#22c55e]">Objective: Anomaly Detection</span>
          <HintButton onHint={onHint} hintsUsed={hintsUsed} />
        </div>
        <span className="text-[10px] py-0.5 px-2 bg-[#22c55e] text-black font-black rounded uppercase tracking-tighter">STAGE 04/05</span>
      </div>

      <div className="flex-1 p-6 overflow-hidden flex flex-col">
        <div className="bg-[#101010]/80 backdrop-blur-md border border-[#22c55e]/20 rounded-lg overflow-hidden flex-1 flex flex-col font-mono text-[10px]">
          <div className="bg-[#22c55e]/10 p-3 flex justify-between uppercase font-black tracking-widest text-[#22c55e]/80 border-b border-[#22c55e]/20">
            <span className="w-16">Time</span>
            <span className="w-32">Source IP</span>
            <span className="w-16 text-center">Port</span>
            <span className="flex-1 text-right">Process</span>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-[#22c55e]/10">
            {logs.map((log, i) => (
              <button
                key={i}
                onClick={() => log.suspicious ? onSuccess("R") : onFail("Analyzing friendly node. Operational latency!")}
                className="w-full flex items-center justify-between p-3 hover:bg-[#22c55e]/10 text-[#22c55e]/60 text-left transition-colors font-bold uppercase"
              >
                <span className="w-16">{log.time}</span>
                <span className="w-32 text-white">{log.src}</span>
                <span className="w-16 text-center">{log.port}</span>
                <span className="flex-1 text-right truncate italic">{log.info}</span>
              </button>
            ))}
          </div>
        </div>
        <p className="mt-4 text-center text-[10px] text-[#22c55e]/60 font-mono italic">
          IDENTIFY THE IP SOURCE PERFORMING SEQUENTIAL PORT PROBING ON UNASSIGNED PORTS.
        </p>
      </div>
    </div>
  );
};

const FinalStage = ({ onSuccess, onFail, onHint, hintsUsed, hints }: { onSuccess: () => void, onFail: (msg: string, penalty?: number) => void, onHint: () => void, hintsUsed: number, hints: string[] }) => {
  const [code, setCode] = useState("");
  
  const handleSubmit = () => {
    if (code.toUpperCase() === "GUARD") {
      onSuccess();
    } else {
      onFail("Master sequence code mismatch. Core dump triggered!", 50);
    }
  };

  return (
    <div className="w-full h-full flex flex-col">
      <div className="bg-[#22c55e]/10 border-b border-[#22c55e]/40 px-4 py-2 flex justify-between items-center bg-black/20">
        <div className="flex items-center gap-4">
          <span className="text-sm font-bold uppercase tracking-widest text-[#22c55e]">Objective: Shutdown Command</span>
          <HintButton onHint={onHint} hintsUsed={hintsUsed} />
        </div>
        <span className="text-[10px] py-0.5 px-2 bg-[#22c55e] text-black font-black rounded uppercase tracking-tighter">FINAL STAGE</span>
      </div>

      <div className="flex-1 p-8 flex flex-col items-center justify-center space-y-12">
        <div className="w-full max-w-sm bg-[#22c55e]/5 p-8 border-2 border-dashed border-[#22c55e]/30 rounded-2xl text-center space-y-8">
          <p className="text-[10px] font-mono uppercase tracking-[0.4em] text-[#22c55e]/40">Security Fragment Pool</p>
          <div className="flex justify-center gap-4">
            {hints.map((h, i) => (
              <div key={i} className="w-14 h-14 border-2 border-[#22c55e] flex items-center justify-center font-black text-[#22c55e] text-3xl bg-[#22c55e]/10 shadow-[0_0_15px_rgba(34,197,94,0.3)]">
                {h}
              </div>
            ))}
            <div className="w-14 h-14 border-2 border-[#22c55e]/20 flex items-center justify-center font-black text-[#22c55e]/20 text-3xl italic bg-black/40">
              ?
            </div>
          </div>
          <p className="text-[9px] text-[#22c55e]/60 font-mono italic px-4 leading-relaxed">
            SYSTEM INSTRUCTION: Assemble decrypted bytes into the final override string. 
            The full sequence represents your operational designation as a cyber __ __ __ __ D.
          </p>
        </div>

        <div className="w-full max-w-md space-y-6">
          <input 
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            placeholder="OVERRIDE CODE..."
            className="w-full bg-black/60 border-2 border-[#22c55e] p-6 font-mono text-[#22c55e] text-center focus:outline-none placeholder:text-[#22c55e]/10 uppercase tracking-[1em] text-3xl shadow-[0_0_20px_rgba(34,197,94,0.2)]"
            autoFocus
          />
          <button 
            onClick={handleSubmit}
            className="w-full py-5 bg-[#22c55e] text-black font-black uppercase tracking-[0.4em] hover:bg-white transition-all text-sm shadow-[0_0_40px_rgba(34,197,94,0.4)]"
          >
            ENGAGE EMERGENCY PURGE
          </button>
        </div>
      </div>
    </div>
  );
};

const VictoryScreen = ({ onRestart, timeRemaining }: { onRestart: () => void, timeRemaining: number }) => (
  <motion.div 
    initial={{ scale: 0.9, opacity: 0 }}
    animate={{ scale: 1, opacity: 1 }}
    className="max-w-2xl w-full text-center space-y-12 p-16 bg-[#151515]/95 backdrop-blur-3xl border-2 border-[#22c55e] rounded-3xl shadow-[0_0_100px_rgba(34,197,94,0.2)]"
  >
    <div className="relative">
      <CheckCircle2 size={120} className="text-[#22c55e] mx-auto drop-shadow-[0_0_20px_rgba(34,197,94,0.5)]" />
      <motion.div 
        animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0, 0.3] }}
        transition={{ duration: 3, repeat: Infinity }}
        className="absolute inset-0 bg-[#22c55e] blur-3xl rounded-full"
      />
    </div>

    <div className="space-y-6">
      <h2 className="text-6xl font-black text-[#22c55e] uppercase italic tracking-tighter">Mission Success</h2>
      <p className="font-mono text-[#22c55e]/80 max-w-sm mx-auto leading-relaxed">
        Intrusion neutralized. Graduation database integrity restored. Threat profile logged for cyber-forensics.
      </p>
      
      <div className="py-8 border-y border-[#22c55e]/20 inline-block px-16">
        <div className="text-[10px] uppercase text-[#22c55e]/40 tracking-[0.5em] mb-2 font-black">Performance Record</div>
        <div className="text-5xl font-black text-[#22c55e] tabular-nums">
          {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
        </div>
      </div>
    </div>

    <button 
      onClick={onRestart}
      className="flex items-center gap-3 mx-auto px-12 py-5 bg-[#22c55e] text-black font-black uppercase text-sm tracking-widest hover:bg-white transition-all shadow-[0_0_30px_rgba(34,197,94,0.3)] group"
    >
      <RefreshCw size={24} className="group-hover:rotate-180 transition-transform duration-500" /> New Operation
    </button>
  </motion.div>
);

const GameOverScreen = ({ onRestart, reason }: { onRestart: () => void, reason: string }) => (
  <motion.div 
    initial={{ scale: 0.9, opacity: 0 }}
    animate={{ scale: 1, opacity: 1 }}
    className="max-w-2xl w-full text-center space-y-12 p-16 bg-[#151515]/95 backdrop-blur-3xl border-2 border-[#ef4444] rounded-3xl shadow-[0_0_100px_rgba(239,68,68,0.2)]"
  >
    <XCircle size={120} className="text-[#ef4444] mx-auto drop-shadow-[0_0_20px_rgba(239,68,68,0.5)]" />

    <div className="space-y-6">
      <h2 className="text-6xl font-black text-[#ef4444] uppercase italic tracking-tighter">System Offline</h2>
      <p className="font-mono text-[#ef4444]/80 max-w-sm mx-auto leading-relaxed">
        {reason || "The system clock hit zero. The hacker has successfully deleted the graduation records."}
      </p>
    </div>

    <button 
      onClick={onRestart}
      className="flex items-center gap-3 mx-auto px-12 py-5 bg-[#ef4444] text-white font-black uppercase text-sm tracking-widest hover:bg-white hover:text-black transition-all shadow-[0_0_30px_rgba(239,68,68,0.3)] group"
    >
      <RefreshCw size={24} className="group-hover:-rotate-180 transition-transform duration-500" /> System Reboot
    </button>
  </motion.div>
);

export default function App() {
  const [stage, setStage] = useState<GameStage>('intro');
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes
  const [messages, setMessages] = useState<TerminalMessage[]>([]);
  const [hints, setHints] = useState<string[]>([]);
  const [hintsUsedCount, setHintsUsedCount] = useState(0);
  const [gameOverReason, setGameOverReason] = useState("");
  const [dbIntegrity, setDbIntegrity] = useState(100);
  const gameTimerRef = useRef<NodeJS.Timeout | null>(null);

  const addMessage = (text: string, type: 'info' | 'error' | 'success' | 'warning' = 'info') => {
    const timestamp = new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setMessages(prev => [...prev, { text, type, timestamp }]);
  };

  const handleCommand = (cmd: string) => {
    const command = cmd.toLowerCase().trim();
    addMessage(`> ${command}`, 'info');

    if (command === 'help') {
      addMessage("Available commands: HELP, SCAN, STATUS, HINT, DECODE", 'info');
      addMessage("HELP: List all available system commands.", 'info');
      addMessage("SCAN: Run deep network packet analysis.", 'info');
      addMessage("STATUS: Retrieve current mission telemetry.", 'info');
      addMessage("HINT: Request tactical intelligence for current stage.", 'info');
    } else if (command === 'scan') {
      addMessage("Initializing deep packet inspection...", 'warning');
      setTimeout(() => addMessage("Tracing malicious IP hops...", 'warning'), 1000);
      setTimeout(() => addMessage("Anomalous sequence detected in STAGE 4 partition.", 'success'), 2500);
    } else if (command === 'status') {
      addMessage(`MISSION STAGE: ${stage.toUpperCase()}`, 'info');
      addMessage(`TIME REMAINING: ${timeLeft}s`, timeLeft < 60 ? 'error' : 'info');
      addMessage(`DB INTEGRITY: ${dbIntegrity}%`, dbIntegrity < 50 ? 'error' : 'success');
    } else if (command === 'hint') {
      provideHint();
    } else if (command === 'decode') {
      if (stage === 'cipher') {
        addMessage("Buffer: HVFDSH", 'info');
        addMessage("Frequency analysis: High delta at shift -3.", 'warning');
      } else {
        addMessage("No encrypted buffer found in current memory space.", 'error');
      }
    } else {
      addMessage(`Unknown command: ${command}. Type HELP for options.`, 'error');
    }
  };

  const provideHint = () => {
    const currentHints = STAGE_HINTS[stage];
    if (currentHints && hintsUsedCount < 2) {
      addMessage(`INTEL REQUESTED: ${currentHints[hintsUsedCount]}`, 'warning');
      setHintsUsedCount(prev => prev + 1);
      playSound('click');
    } else if (hintsUsedCount >= 2) {
      addMessage("Maximum hint requests exceeded for this sector.", 'error');
      playSound('error');
    } else {
      addMessage("Intel unavailable for current operational state.", 'error');
    }
  };

  const startGame = () => {
    setStage('phishing');
    setTimeLeft(600);
    setDbIntegrity(100);
    setHints([]);
    setHintsUsedCount(0);
    setMessages([{ text: "Initializing defensive protocols...", type: 'info', timestamp: 'SYSTEM' }]);
    addMessage("Analyzing network traffic...", 'warning');
    addMessage("Alert: Phishing attack detected in administration pool.", 'error');
    playSound('intro');
  };

  const restartGame = () => {
    setStage('intro');
    setTimeLeft(600);
    setDbIntegrity(100);
    setHints([]);
    setHintsUsedCount(0);
    setMessages([]);
    if (gameTimerRef.current) clearInterval(gameTimerRef.current);
    playSound('click');
  };

  useEffect(() => {
    if (stage !== 'intro' && stage !== 'victory' && stage !== 'game-over') {
      gameTimerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setStage('game-over');
            setGameOverReason("Time expired. System compromise complete.");
            return 0;
          }
          if (prev < 30 && prev % 2 === 0) {
            playSound('beeping');
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (gameTimerRef.current) clearInterval(gameTimerRef.current);
    }
    return () => {
      if (gameTimerRef.current) clearInterval(gameTimerRef.current);
    };
  }, [stage]);

  const handleStageSuccess = (nextStage: GameStage, message: string, hint: string | null = null) => {
    if (hint) setHints(prev => [...prev, hint]);
    addMessage(message, 'success');
    playSound('correct');
    setHintsUsedCount(0);
    setStage(nextStage);
    if (nextStage === 'victory') playSound('victory');
  };

  const handleStageFail = (message: string, penalty: number = 30) => {
    addMessage(message, 'error');
    playSound('error');
    setTimeLeft(prev => Math.max(0, prev - penalty));
    setDbIntegrity(prev => Math.max(0, prev - 15));
    addMessage(`Time penalty: -${penalty}s applied.`, 'error');
    addMessage(`Database integrity compromised.`, 'warning');
  };

  const isMainUIActive = stage !== 'intro' && stage !== 'victory' && stage !== 'game-over';

  return (
    <div className="relative min-h-screen bg-[#050505] text-[#22c55e] flex flex-col font-mono selection:bg-[#22c55e] selection:text-black overflow-hidden p-6 border-4 border-[#1a1a1a]">
      <style>
        {`
          @keyframes matrix {
            0% { transform: translateY(-100%); }
            100% { transform: translateY(100%); }
          }
          .animate-matrix {
            animation: matrix linear infinite;
          }
          .scrollbar-hide::-webkit-scrollbar {
            display: none;
          }
          .scrollbar-hide {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
        `}
      </style>
      
      <MatrixBackground />

      {/* Retro Overlay */}
      <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden" 
           style={{ background: 'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.15) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.02), rgba(0, 255, 0, 0.01), rgba(0, 0, 255, 0.02))', backgroundSize: '100% 4px, 3px 100%' }}>
      </div>

      {isMainUIActive ? (
        <div className="relative z-10 flex flex-col h-full gap-4 max-w-7xl mx-auto w-full flex-1 min-h-0">
          {/* Header */}
          <header className="flex justify-between items-center bg-[#101010]/80 backdrop-blur-md border border-[#22c55e]/30 p-5 rounded-2xl shadow-[0_0_30px_rgba(34,197,94,0.05)]">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full border-2 border-[#22c55e] flex items-center justify-center animate-pulse shadow-[0_0_20px_rgba(34,197,94,0.3)]">
                <Cpu size={28} />
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-tighter uppercase italic">Cyber Guard Station</h1>
                <p className="text-[10px] opacity-70 uppercase tracking-[0.3em]">Unit: IR-CENTRAL // Authorization: ANALYST-09</p>
              </div>
            </div>
            <TimerDisplay timeLeft={timeLeft} />
          </header>

          <div className="flex-1 grid grid-cols-12 gap-4 h-full overflow-hidden min-h-0">
            {/* Left Sidebar */}
            <aside className="col-span-3 flex flex-col gap-4 overflow-hidden">
              <div className="flex-1 min-h-0">
                <Terminal messages={messages} onCommand={handleCommand} />
              </div>
              <ProgressMap currentStage={stage} />
            </aside>

            {/* Stage Content */}
            <main className="col-span-6 bg-[#151515]/90 backdrop-blur-2xl border-2 border-[#22c55e]/40 rounded-2xl relative overflow-hidden flex flex-col shadow-[0_0_50px_rgba(34,197,94,0.1)]">
              <div className="flex-1 overflow-hidden">
                <AnimatePresence mode="wait">
                  {stage === 'phishing' && (
                    <motion.div key="phishing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full">
                      <PhishingStage 
                        onSuccess={(hint) => handleStageSuccess('password', "Threat neutralized. Origin IP logged.", hint)} 
                        onFail={(msg) => handleStageFail(msg)} 
                        onHint={provideHint}
                        hintsUsed={hintsUsedCount}
                      />
                    </motion.div>
                  )}

                  {stage === 'password' && (
                    <motion.div key="password" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full">
                      <PasswordStage 
                        onSuccess={(hint) => handleStageSuccess('cipher', "Access point re-fortified.", hint)} 
                        onFail={(msg) => handleStageFail(msg)} 
                        onHint={provideHint}
                        hintsUsed={hintsUsedCount}
                      />
                    </motion.div>
                  )}

                  {stage === 'cipher' && (
                    <motion.div key="cipher" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full">
                      <CipherStage 
                        onSuccess={(hint) => handleStageSuccess('network', "Attacker command string recovered.", hint)} 
                        onFail={(msg) => handleStageFail(msg)} 
                        onHint={provideHint}
                        hintsUsed={hintsUsedCount}
                      />
                    </motion.div>
                  )}

                  {stage === 'network' && (
                    <motion.div key="network" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full">
                      <NetworkStage 
                        onSuccess={(hint) => handleStageSuccess('final', "Hacker control server isolated.", hint)} 
                        onFail={(msg) => handleStageFail(msg)} 
                        onHint={provideHint}
                        hintsUsed={hintsUsedCount}
                      />
                    </motion.div>
                  )}

                  {stage === 'final' && (
                    <motion.div key="final" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full">
                      <FinalStage 
                        hints={hints}
                        onSuccess={() => setStage('victory')} 
                        onFail={(msg) => handleStageFail(msg, 50)} 
                        onHint={provideHint}
                        hintsUsed={hintsUsedCount}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Layout Footer Overlay for Stage hints */}
              <div className="p-5 border-t border-[#22c55e]/20 bg-black/40 backdrop-blur-md">
                <p className="text-[10px] text-white/50 leading-relaxed font-mono">
                  <span className="text-[#22c55e] mr-2 font-black tracking-widest uppercase">Intel Brief:</span> 
                  {stage === 'phishing' && "Check the 'From' domain suffix and hover over links to inspect for non-institutional TLDs."}
                  {stage === 'password' && "The lock requires high-entropy credentials. Ensure all 4 hardware security checks go green."}
                  {stage === 'cipher' && "Decrypt the intercepted buffer using a standard -3 rotation offset on the ASCII map."}
                  {stage === 'network' && "Analyze the traffic spikes. Select the IP attempting to probe unassigned service ports (21-25)."}
                  {stage === 'final' && "Concatenate gathered security fragments to formulate the final Master Guard Command."}
                </p>
              </div>
            </main>

            {/* Right Sidebar */}
            <aside className="col-span-3 flex flex-col gap-4 overflow-hidden">
              <NetworkVitals integrity={dbIntegrity} />
              
              <div className="h-44 bg-[#101010]/80 backdrop-blur-md border border-[#22c55e]/20 rounded-lg p-4 flex flex-col">
                <h3 className="text-[10px] uppercase border-b border-[#22c55e]/20 pb-2 mb-2 opacity-60 font-bold tracking-widest">Decryption Rig</h3>
                <div className="flex-1 flex items-center justify-center gap-4">
                  <div className="w-14 h-14 border border-[#22c55e]/30 rounded-xl bg-white/5 flex items-center justify-center opacity-30 shadow-inner">
                    <HardDrive size={24} />
                  </div>
                  <div className="w-14 h-14 border border-[#22c55e]/30 rounded-xl bg-white/5 flex items-center justify-center opacity-30 shadow-inner">
                    <Zap size={24} />
                  </div>
                  <div className="w-14 h-14 border border-[#22c55e]/30 rounded-xl bg-white/5 flex items-center justify-center opacity-30 shadow-inner">
                    <Activity size={24} />
                  </div>
                </div>
                <div className="text-[8px] text-center opacity-20 uppercase tracking-[0.4em] font-black italic">Sub-systems: Standby</div>
              </div>
            </aside>
          </div>

          <footer className="mt-auto border-t border-[#22c55e]/20 pt-4 flex justify-between items-center text-[10px] opacity-40 uppercase tracking-[0.4em] font-mono">
            <span>Session: SCHOOL-IR-CENTRAL-09</span>
            <span>Firmware: v4.0.1 ALPHA (BUILD 822)</span>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#22c55e] animate-pulse"></div>
              <span>Data-link: Optimized</span>
            </div>
          </footer>
        </div>
      ) : (
        <div className="relative z-10 flex flex-col items-center justify-center flex-1 w-full max-w-7xl mx-auto">
          <AnimatePresence mode="wait">
            {stage === 'intro' && (
              <motion.div key="intro" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full flex justify-center">
                <IntroStage onStart={startGame} />
              </motion.div>
            )}
            {stage === 'victory' && (
              <motion.div key="victory" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full flex justify-center">
                <VictoryScreen onRestart={restartGame} timeRemaining={timeLeft} />
              </motion.div>
            )}
            {stage === 'game-over' && (
              <motion.div key="game-over" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full flex justify-center">
                <GameOverScreen onRestart={restartGame} reason={gameOverReason} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
