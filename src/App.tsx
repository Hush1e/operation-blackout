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
  Search
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

const MatrixBackground = () => {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden opacity-10">
      <div className="absolute inset-0 bg-[#0a0a0a]" />
      <div className="flex justify-around w-full h-full text-[#00ff22] font-mono text-sm leading-none opacity-20">
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
};

const Terminal = ({ messages }: { messages: TerminalMessage[] }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="bg-black/80 border border-[#00ff22]/30 rounded-lg p-4 font-mono text-sm h-48 overflow-hidden flex flex-col backdrop-blur-sm">
      <div className="flex items-center gap-2 mb-2 pb-2 border-b border-[#00ff22]/20 text-[#00ff22]">
        <TerminalIcon size={16} />
        <span className="text-xs uppercase tracking-widest font-bold">System Console v2.0.4</span>
      </div>
      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-1 scrollbar-hide">
        {messages.map((msg, i) => (
          <div key={i} className={cn(
            "flex gap-2",
            msg.type === 'error' ? "text-red-500" : 
            msg.type === 'success' ? "text-emerald-400" : 
            msg.type === 'warning' ? "text-amber-400" : "text-[#00ff22]"
          )}>
            <span className="opacity-50 text-[10px] shrink-0">[{msg.timestamp}]</span>
            <span className="break-all">{msg.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const Timer = ({ timeLeft }: { timeLeft: number }) => {
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  
  return (
    <div className={cn(
      "flex items-center gap-2 px-4 py-2 bg-black/60 border rounded-full font-mono font-bold tracking-wider",
      timeLeft < 60 ? "border-red-500 text-red-500 animate-pulse" : "border-[#00ff22]/50 text-[#00ff22]"
    )}>
      <Clock size={16} />
      <span>{minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}</span>
    </div>
  );
};

// --- Game Stages ---

const IntroStage = ({ onStart }: { onStart: () => void }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, scale: 0.95 }}
    className="max-w-2xl w-full text-center space-y-8 p-8"
  >
    <div className="relative inline-block">
      <ShieldAlert size={80} className="text-[#00ff22] mx-auto mb-4 animate-pulse" />
      <motion.div 
        animate={{ rotate: 360 }}
        transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
        className="absolute -inset-4 border border-[#00ff22]/20 rounded-full"
      />
    </div>
    
    <div className="space-y-4">
      <h1 className="text-4xl md:text-5xl font-black text-[#00ff22] tracking-tighter uppercase italic">
        Cyber Guard
      </h1>
      <p className="text-[#00ff22]/80 font-mono text-sm max-w-md mx-auto">
        INTRUSION DETECTED. A rogue exploit has been deployed against the Lincoln High School central servers. 
        As lead Incident Response Analyst, your mission is to neutralize the threat before the graduation database is deleted.
      </p>
    </div>

    <button 
      onClick={onStart}
      className="group relative px-8 py-4 bg-transparent border-2 border-[#00ff22] text-[#00ff22] font-black uppercase tracking-widest hover:bg-[#00ff22] hover:text-black transition-all duration-300 transform active:scale-95"
    >
      <span className="relative z-10">Initialize Countermeasures</span>
      <div className="absolute inset-0 bg-[#00ff22] opacity-0 group-hover:opacity-10 blur-xl transition-opacity" />
    </button>
  </motion.div>
);

const PhishingStage = ({ onSuccess, onFail }: { onSuccess: (hint: string) => void, onFail: (msg: string) => void }) => {
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
      subject: "URGENT: Your account password has expired!",
      content: "Security breach detected. Your password has been flagged. Click here to login to our secure portal and verify your identity: http://g00gle.verify-acc.net/login/auth",
      isPhish: true,
      reason: "Suspicious domain (g00gle) and external URL."
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
    <div className="w-full max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-[#00ff22] flex items-center gap-2">
          <Mail size={24} /> STAGE 1: INBOX ANALYSIS
        </h2>
        <div className="text-xs font-mono text-[#00ff22]/60 uppercase tracking-widest">
          Find the Phishing Attempt
        </div>
      </div>
      
      <div className="grid gap-4">
        {emails.map((email) => (
          <button
            key={email.id}
            onClick={() => email.isPhish ? onSuccess("G") : onFail("Clicked legitimate email. Hacker gained 10s lead.")}
            className="text-left bg-black/40 border border-[#00ff22]/20 p-4 rounded-lg hover:border-[#00ff22] hover:bg-[#00ff22]/5 transition-all group"
          >
            <div className="flex justify-between items-start mb-2">
              <span className="text-sm font-bold text-[#00ff22]/80">{email.sender}</span>
              <span className="text-[10px] text-[#00ff22]/40 font-mono tracking-tighter">04:18 PM</span>
            </div>
            <div className="text-sm font-bold text-[#00ff22] mb-1">{email.subject}</div>
            <div className="text-xs text-[#00ff22]/60 line-clamp-1 italic">{email.content}</div>
          </button>
        ))}
      </div>
    </div>
  );
};

const PasswordStage = ({ onSuccess, onFail }: { onSuccess: (hint: string) => void, onFail: (msg: string) => void }) => {
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
      onFail("Password too weak. System lockout remains active.");
    }
  };

  return (
    <div className="w-full max-w-xl space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-[#00ff22] flex items-center gap-2">
          <Lock size={24} /> STAGE 2: ACCESS OVERRIDE
        </h2>
      </div>

      <div className="bg-black/40 border border-[#00ff22]/20 p-6 rounded-lg space-y-6">
        <p className="text-sm text-[#00ff22]/70 font-mono italic">
          Default admin password leaked. Create a new "Titan-Class" secure password to re-lock the system.
        </p>

        <div className="space-y-4">
          <input 
            type="text"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="ENTER NEW SECURE PASSWORD..."
            className="w-full bg-black border border-[#00ff22]/40 p-4 font-mono text-[#00ff22] focus:outline-none focus:border-[#00ff22] placeholder:text-[#00ff22]/20"
            autoFocus
          />

          <div className="grid grid-cols-2 gap-3 text-[10px] font-mono tracking-wider uppercase">
            <div className={cn("flex items-center gap-2", checks.length ? "text-emerald-400" : "text-[#00ff22]/40")}>
              {checks.length ? <ShieldCheck size={12} /> : <AlertTriangle size={12} />}
              At least 12 characters
            </div>
            <div className={cn("flex items-center gap-2", checks.number ? "text-emerald-400" : "text-[#00ff22]/40")}>
              {checks.number ? <ShieldCheck size={12} /> : <AlertTriangle size={12} />}
              Includes a number
            </div>
            <div className={cn("flex items-center gap-2", checks.special ? "text-emerald-400" : "text-[#00ff22]/40")}>
              {checks.special ? <ShieldCheck size={12} /> : <AlertTriangle size={12} />}
              Includes special symbol
            </div>
            <div className={cn("flex items-center gap-2", checks.upper ? "text-emerald-400" : "text-[#00ff22]/40")}>
              {checks.upper ? <ShieldCheck size={12} /> : <AlertTriangle size={12} />}
              Uppercase character
            </div>
          </div>
        </div>

        <button 
          onClick={handleSubmit}
          className="w-full py-3 bg-[#00ff22] text-black font-black uppercase tracking-widest hover:bg-[#00ff22]/80 transition-colors"
        >
          Update Access Token
        </button>
      </div>
    </div>
  );
};

const CipherStage = ({ onSuccess, onFail }: { onSuccess: (hint: string) => void, onFail: (msg: string) => void }) => {
  const [answer, setAnswer] = useState("");
  const encrypted = "HVFDSH"; // Shift +3 (A->D, B->E...) so ESCAPE
  
  const handleSubmit = () => {
    if (answer.toUpperCase() === "ESCAPE") {
      onSuccess("A");
    } else {
      onFail("Decryption sequence failed. Data packet lost.");
    }
  };

  return (
    <div className="w-full max-w-xl space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-[#00ff22] flex items-center gap-2">
          <Key size={24} /> STAGE 3: PACKET DECRYPTION
        </h2>
      </div>

      <div className="bg-black/40 border border-[#00ff22]/20 p-6 rounded-lg space-y-6">
        <div className="text-center space-y-2">
          <div className="text-xs font-mono text-[#00ff22]/40 uppercase tracking-widest">Encrypted Stream</div>
          <div className="text-5xl font-black text-[#00ff22] tracking-[0.2em]">{encrypted}</div>
          <div className="text-xs font-mono text-[#00ff22]/60 italic mt-4">
            Hint: The hacker is using a simple Caesar Cipher. Shift each letter BACK by 3 positions.
          </div>
        </div>

        <div className="space-y-4">
          <input 
            type="text"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            placeholder="DECRYPTED KEYWORD..."
            className="w-full bg-black border border-[#00ff22]/40 p-4 font-mono text-[#00ff22] text-center focus:outline-none focus:border-[#00ff22] placeholder:text-[#00ff22]/20 uppercase"
            autoFocus
          />
        </div>

        <button 
          onClick={handleSubmit}
          className="w-full py-3 bg-[#00ff22] text-black font-black uppercase tracking-widest hover:bg-[#00ff22]/80 transition-colors"
        >
          Execute Decryption
        </button>
      </div>
    </div>
  );
};

const NetworkStage = ({ onSuccess, onFail }: { onSuccess: (hint: string) => void, onFail: (msg: string) => void }) => {
  const logs = [
    { time: "16:20:01", src: "192.168.1.1", dst: "SERVER_MAIN", port: 80, info: "HTTP GET /index.html", suspicious: false },
    { time: "16:20:05", src: "192.168.1.5", dst: "SERVER_MAIN", port: 443, info: "SSL Handshake", suspicious: false },
    { time: "16:21:12", src: "10.0.4.152", dst: "SERVER_MAIN", port: 21, info: "FTP CONNECTION ATTEMPT", suspicious: true },
    { time: "16:21:13", src: "10.0.4.152", dst: "SERVER_MAIN", port: 22, info: "SSH CONNECTION ATTEMPT", suspicious: true },
    { time: "16:21:14", src: "10.0.4.152", dst: "SERVER_MAIN", port: 23, info: "TELNET CONNECTION ATTEMPT", suspicious: true },
    { time: "16:21:15", src: "10.0.4.152", dst: "SERVER_MAIN", port: 25, info: "SMTP CONNECTION ATTEMPT", suspicious: true },
    { time: "16:22:40", src: "192.168.1.12", dst: "SERVER_MAIN", port: 443, info: "SSL Handshake", suspicious: false }
  ];

  return (
    <div className="w-full max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-[#00ff22] flex items-center gap-2">
          <Network size={24} /> STAGE 4: ANOMALY DETECTION
        </h2>
      </div>

      <div className="bg-black/60 border border-[#00ff22]/20 rounded-lg overflow-hidden font-mono text-[10px] md:text-xs">
        <div className="bg-[#00ff22]/10 p-3 flex justify-between uppercase font-bold tracking-widest text-[#00ff22]/80">
          <span>Timestamp</span>
          <span>Source IP</span>
          <span>Destination</span>
          <span>Port</span>
          <span className="hidden md:block">Process</span>
        </div>
        <div className="divide-y divide-[#00ff22]/10">
          {logs.map((log, i) => (
            <button
              key={i}
              onClick={() => log.suspicious ? onSuccess("R") : onFail("Analyzing friendly traffic. Wasted system resources.")}
              className="w-full flex justify-between p-3 hover:bg-[#00ff22]/5 text-[#00ff22]/60 text-left transition-colors"
            >
              <span className="w-16">{log.time}</span>
              <span className="w-24 md:w-32 font-bold">{log.src}</span>
              <span className="w-20 md:w-32">{log.dst}</span>
              <span className="w-8">{log.port}</span>
              <span className="hidden md:block flex-1 italic truncate">{log.info}</span>
            </button>
          ))}
        </div>
      </div>
      <p className="text-center text-xs text-[#00ff22]/60 font-mono italic">
        Select the Source IP initiating a high-frequency port scan attack.
      </p>
    </div>
  );
};

const FinalStage = ({ onSuccess, onFail, hints }: { onSuccess: () => void, onFail: (msg: string) => void, hints: string[] }) => {
  const [code, setCode] = useState("");
  // Hints: G, U, A, R (from previous stages) + maybe final one is "D"? 
  // Let's say code is GUARD.
  
  const handleSubmit = () => {
    if (code.toUpperCase() === "GUARD") {
      onSuccess();
    } else {
      onFail("Security override sequence rejected. Final defense failing!");
    }
  };

  return (
    <div className="w-full max-w-xl space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-[#00ff22] flex items-center gap-2">
          <Unlock size={24} /> FINAL STAGE: SHUTDOWN COMMAND
        </h2>
      </div>

      <div className="bg-black/40 border border-[#00ff22]/20 p-6 rounded-lg space-y-6">
        <div className="bg-[#00ff22]/5 p-4 border border-dashed border-[#00ff22]/30 rounded text-center">
          <p className="text-xs font-mono mb-2 uppercase tracking-widest text-[#00ff22]/40">Gathered fragments</p>
          <div className="flex justify-center gap-4">
            {hints.map((h, i) => (
              <div key={i} className="w-10 h-10 border border-[#00ff22] flex items-center justify-center font-black text-[#00ff22] text-xl bg-[#00ff22]/10">
                {h}
              </div>
            ))}
            <div className="w-10 h-10 border border-[#00ff22]/30 flex items-center justify-center font-black text-[#00ff22]/30 text-xl italic">
              ?
            </div>
          </div>
          <p className="mt-4 text-[10px] text-[#00ff22]/60 font-mono italic">
            The final character is hidden. Complete the word that represents your role as a cyber __ __ __ __ D.
          </p>
        </div>

        <div className="space-y-4">
          <input 
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            placeholder="ENTER FULL SECURITY CODE..."
            className="w-full bg-black border border-[#00ff22]/40 p-4 font-mono text-[#00ff22] text-center focus:outline-none focus:border-[#00ff22] placeholder:text-[#00ff22]/20 uppercase tracking-[0.5em]"
            autoFocus
          />
        </div>

        <button 
          onClick={handleSubmit}
          className="w-full py-4 bg-[#00ff22] text-black font-black uppercase tracking-widest hover:bg-[#00ff22]/80 transition-colors shadow-[0_0_20px_rgba(0,255,34,0.4)]"
        >
          ENGAGE EMERGENCY SHUTDOWN
        </button>
      </div>
    </div>
  );
};

const VictoryScreen = ({ onRestart, timeRemaining }: { onRestart: () => void, timeRemaining: number }) => (
  <motion.div 
    initial={{ scale: 0.8, opacity: 0 }}
    animate={{ scale: 1, opacity: 1 }}
    className="max-w-xl w-full text-center space-y-8 p-12 bg-black/80 border-2 border-[#00ff22] rounded-2xl shadow-[0_0_50px_rgba(0,255,34,0.2)] backdrop-blur-md"
  >
    <div className="relative">
      <CheckCircle2 size={100} className="text-[#00ff22] mx-auto mb-6" />
      <motion.div 
        animate={{ scale: [1, 1.2, 1], opacity: [1, 0, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="absolute inset-0 bg-[#00ff22]/20 blur-3xl rounded-full"
      />
    </div>

    <div className="space-y-4">
      <h2 className="text-4xl font-black text-[#00ff22] uppercase italic">Threat Neutralized</h2>
      <p className="font-mono text-[#00ff22]/80">
        Database secured. Malware purged. The Lincoln High Graduation Day is safe, thanks to your rapid response.
      </p>
      <div className="py-4 border-y border-[#00ff22]/20 font-mono">
        <div className="text-[10px] uppercase text-[#00ff22]/40 tracking-[0.3em] mb-1">Time Remaining</div>
        <div className="text-3xl font-bold text-[#00ff22]">{Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}</div>
      </div>
    </div>

    <button 
      onClick={onRestart}
      className="flex items-center gap-2 mx-auto px-8 py-3 bg-[#00ff22] text-black font-bold rounded-lg hover:bg-[#00ff22]/80 transition-all"
    >
      <RefreshCw size={18} /> New Shift
    </button>
  </motion.div>
);

const GameOverScreen = ({ onRestart, reason }: { onRestart: () => void, reason: string }) => (
  <motion.div 
    initial={{ scale: 0.8, opacity: 0 }}
    animate={{ scale: 1, opacity: 1 }}
    className="max-w-xl w-full text-center space-y-8 p-12 bg-black/80 border-2 border-red-500 rounded-2xl shadow-[0_0_50px_rgba(239,68,68,0.2)] backdrop-blur-md"
  >
    <XCircle size={100} className="text-red-500 mx-auto mb-6" />

    <div className="space-y-4">
      <h2 className="text-4xl font-black text-red-500 uppercase italic">Security Breach</h2>
      <p className="font-mono text-red-500/80">
        {reason || "The system clock hit zero. The hacker has successfully deleted the graduation records."}
      </p>
    </div>

    <button 
      onClick={onRestart}
      className="flex items-center gap-2 mx-auto px-8 py-3 bg-red-500 text-white font-bold rounded-lg hover:bg-red-600 transition-all"
    >
      <RefreshCw size={18} /> Retry Mission
    </button>
  </motion.div>
);

export default function App() {
  const [stage, setStage] = useState<GameStage>('intro');
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes
  const [messages, setMessages] = useState<TerminalMessage[]>([]);
  const [hints, setHints] = useState<string[]>([]);
  const [gameOverReason, setGameOverReason] = useState("");
  const gameTimerRef = useRef<NodeJS.Timeout | null>(null);

  const addMessage = (text: string, type: 'info' | 'error' | 'success' | 'warning' = 'info') => {
    const timestamp = new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setMessages(prev => [...prev, { text, type, timestamp }]);
  };

  const startGame = () => {
    setStage('phishing');
    setTimeLeft(600);
    setHints([]);
    setMessages([{ text: "Initializing defensive protocols...", type: 'info', timestamp: 'SYSTEM' }]);
    addMessage("Analyzing network traffic...", 'warning');
    addMessage("Alert: Phishing attack detected in administration pool.", 'error');
  };

  const restartGame = () => {
    setStage('intro');
    setTimeLeft(600);
    setHints([]);
    setMessages([]);
    if (gameTimerRef.current) clearInterval(gameTimerRef.current);
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
    setStage(nextStage);
  };

  const handleStageFail = (message: string, penalty: number = 20) => {
    addMessage(message, 'error');
    setTimeLeft(prev => Math.max(0, prev - penalty));
    addMessage(`Time penalty applied: -${penalty} seconds`, 'error');
  };

  return (
    <div className="relative min-h-screen bg-[#0a0a0a] text-white flex flex-col font-sans selection:bg-[#00ff22] selection:text-black">
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

      {/* Header */}
      {stage !== 'intro' && stage !== 'victory' && stage !== 'game-over' && (
        <header className="relative z-10 p-6 flex justify-between items-start pointer-events-none">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-[#00ff22]">
              <Cpu size={20} />
              <h1 className="font-mono text-sm font-bold tracking-widest uppercase">Lincoln High Defense Grid</h1>
            </div>
            <div className="text-[10px] font-mono text-[#00ff22]/40 tracking-tighter uppercase px-2 py-0.5 bg-[#00ff22]/5 rounded inline-block">
              Status: <span className="text-[#00ff22] animate-pulse">Scanning Threats</span>
            </div>
          </div>
          <div className="pointer-events-auto">
            <Timer timeLeft={timeLeft} />
          </div>
        </header>
      )}

      {/* Main Content */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center p-4">
        <AnimatePresence mode="wait">
          {stage === 'intro' && (
            <motion.div key="intro" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <IntroStage onStart={startGame} />
            </motion.div>
          )}
          
          {stage === 'phishing' && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} key="phishing">
              <PhishingStage 
                onSuccess={(hint) => handleStageSuccess('password', "Phishing attempt isolated and blocked.", hint)} 
                onFail={(msg) => handleStageFail(msg)} 
              />
            </motion.div>
          )}

          {stage === 'password' && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} key="password">
              <PasswordStage 
                onSuccess={(hint) => handleStageSuccess('cipher', "Admin portal secured with high-entropy entropy credential.", hint)} 
                onFail={(msg) => handleStageFail(msg)} 
              />
            </motion.div>
          )}

          {stage === 'cipher' && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} key="cipher">
              <CipherStage 
                onSuccess={(hint) => handleStageSuccess('network', "Encrypted packet intercepted and decoded.", hint)} 
                onFail={(msg) => handleStageFail(msg)} 
              />
            </motion.div>
          )}

          {stage === 'network' && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} key="network">
              <NetworkStage 
                onSuccess={(hint) => handleStageSuccess('final', "Attacker's control server IP identified.", hint)} 
                onFail={(msg) => handleStageFail(msg)} 
              />
            </motion.div>
          )}

          {stage === 'final' && (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.1 }} key="final">
              <FinalStage 
                hints={hints}
                onSuccess={() => setStage('victory')} 
                onFail={(msg) => handleStageFail(msg, 50)} 
              />
            </motion.div>
          )}

          {stage === 'victory' && (
            <motion.div key="victory" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <VictoryScreen onRestart={restartGame} timeRemaining={timeLeft} />
            </motion.div>
          )}
          {stage === 'game-over' && (
            <motion.div key="game-over" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <GameOverScreen onRestart={restartGame} reason={gameOverReason} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Terminal View Footer */}
      {stage !== 'intro' && stage !== 'victory' && stage !== 'game-over' && (
        <footer className="relative z-10 p-4 bottom-0 w-full max-w-5xl mx-auto mb-4">
          <Terminal messages={messages} />
        </footer>
      )}

      {/* Custom Scanlines Effect */}
      <div className="fixed inset-0 pointer-events-none z-50 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%] opacity-20" />
    </div>
  );
}
