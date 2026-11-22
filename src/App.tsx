/** @license SPDX-License-Identifier: Apache-2.0 */
import React, {useEffect, useReducer, useRef, useState} from 'react';
const HOME='https://hush1e.github.io/';
const stages=['Email triage','Access security','Cipher puzzle','Network investigation','Recovery'];
const hints=[
 ['Compare each message with the expected school context. A familiar name or .edu address alone is not proof of safety.','The urgent IT message requests credentials at a lookalike address. Report that one; the other two match the expected context.'],
 ['Use a made-up phrase of at least 15 characters. Spaces are welcome. Never enter a real password.','Try unrelated words, such as orbit meadow lantern. This is a practice input, not a strength guarantee.'],
 ['Reverse the +3 shift: move each letter three places BACK through the alphabet.','H becomes E, V becomes S. HVFDSH decodes to ESCAPE.'],
 ['Compare repeated activity from the same source with the stated baseline. A private IP is not inherently malicious.','10.0.4.152 probes several services in a short burst. Select any of its four rows to investigate that source.'],
 ['Combine your fragments G, U, A, R with the recovery team’s final fragment D.','Enter GUARD to authorize the simulated recovery plan.']
];
const lessons=[
 ['Email triage','Check context, sender and destination together. Report suspicious messages through a trusted channel; do not use the message’s own verification link.'],
 ['Access security','Use long, unique passwords or passphrases and an approved password manager. Add MFA or phishing-resistant authentication where available. Length alone does not prove strength.'],
 ['Cipher puzzle','A Caesar cipher is a historical puzzle, not secure modern encryption. This task practices pattern recognition, not production cryptography.'],
 ['Network investigation','Correlate events with the expected baseline. A burst of probes is a reason to investigate, not proof of attribution or permission to attack a source.'],
 ['Recovery','Follow an authorized response plan: contain, preserve evidence, validate clean backups, restore and verify. A puzzle code is not real incident-response authorization.']
];
const emails=[
 {sender:'Principal Higgins <higgins@lincolnhigh.edu>',subject:'Graduation seating chart',body:'As discussed at this morning’s meeting, please review the seating chart in the school’s usual internal document system.',phish:false,explanation:'This matches the expected meeting and usual workflow. In real work, verify the actual destination before opening documents.'},
 {sender:'IT Support <admin@lincoln-high-security.com>',subject:'URGENT: Verify your student credentials',body:'Your account will be suspended. Enter your password now at http://g00gle.verify-acc.example/login to keep access.',phish:true,explanation:'Urgency, an unexpected credential request and a lookalike destination make this the phishing message. Report it through the trusted school help desk.'},
 {sender:'Library Services <noreply@lib.lincolnhigh.edu>',subject:'Overdue book reminder',body:'The Cuckoo’s Egg is three days overdue. Please return it at the library desk. No payment or login is requested in this message.',phish:false,explanation:'This matches the expected library reminder and asks for an in-person return. Sender appearance alone would not prove a message safe.'}
];
const logs=[['09:42:01','192.168.1.1','80','Expected web request'],['09:42:02','192.168.1.5','443','Expected HTTPS session'],['09:42:03','10.0.4.152','21','Repeated FTP login failures'],['09:42:04','10.0.4.152','22','SSH connection probe'],['09:42:05','10.0.4.152','23','Telnet connection probe'],['09:42:06','10.0.4.152','25','SMTP connection probe'],['09:42:07','192.168.1.12','443','Expected HTTPS session']];
type State={stage:number;mode:'practice'|'challenge';left:number;elapsed:number;integrity:number;mistakes:number;hint:number;reviewed:number[];feedback:string;history:string[];paused:boolean;reason:string;completed:number};
const initial:State={stage:-1,mode:'practice',left:600,elapsed:0,integrity:100,mistakes:0,hint:0,reviewed:[],feedback:'',history:[],paused:false,reason:'',completed:0};
type Action={type:'start';mode:State['mode']}|{type:'reset'|'tick'|'pause'|'hint'|'next'}|{type:'answer';correct:boolean;message:string;email?:number;stage:number};
export function reducer(s:State,a:Action):State {
 if(a.type==='start')return {...initial,mode:a.mode,stage:0,feedback:'Review all three emails. Classify each using the scenario context.'};
 if(a.type==='reset')return {...initial};
 if(s.stage<0||s.stage>4)return s;
 if(a.type==='pause')return {...s,paused:!s.paused};
 if(s.paused)return s;
 if(a.type==='tick'){
  const left=s.mode==='challenge'?Math.max(0,s.left-1):s.left;
  return {...s,left,elapsed:s.elapsed+1,...(s.mode==='challenge'&&left===0?{stage:6,reason:'The challenge clock reached zero. Try again or use untimed practice to explore each decision.'}:{})};
 }
 if(a.type==='hint'){
  if(s.hint>=2)return s;
  const message=hints[s.stage][s.hint];
  return {...s,hint:s.hint+1,feedback:message,history:[...s.history,`Hint: ${message}`]};
 }
 if(a.type==='next'){
  if(s.stage!==0||s.reviewed.length!==3)return s;
  return {...s,stage:1,completed:1,hint:0,feedback:'Email triage complete. Fragment G recovered. Create a practice passphrase.'};
 }
 if(a.type!=='answer'||a.stage!==s.stage)return s;
 if(a.email!==undefined&&s.reviewed.includes(a.email))return s;
 if(a.correct){
  if(a.email!==undefined)return {...s,reviewed:[...s.reviewed,a.email],feedback:a.message,history:[...s.history,a.message]};
  return {...s,stage:s.stage+1,completed:s.stage+1,hint:0,feedback:a.message,history:[...s.history,a.message]};
 }
 const left=s.mode==='challenge'?Math.max(0,s.left-30):s.left;
 const integrity=s.mode==='challenge'?Math.max(0,s.integrity-15):s.integrity;
 const failed=s.mode==='challenge'&&(left===0||integrity===0);
 const message=a.message+(s.mode==='challenge'?' Challenge penalty: 30 seconds and 15 integrity points.':' Try again; practice has no penalties.');
 return {...s,left,integrity,mistakes:s.mistakes+1,feedback:message,history:[...s.history,message],...(failed?{stage:6,reason:left===0?'The challenge clock reached zero.':'The simulated integrity meter reached zero. Review the feedback and try again.'}:{})};
}
const clock=(n:number)=>`${Math.floor(n/60)}:${String(n%60).padStart(2,'0')}`;
let audio:AudioContext|undefined;
function tone(enabled:boolean,success:boolean){
 if(!enabled)return;
 try{audio??=new AudioContext();void audio.resume().catch(()=>{});const oscillator=audio.createOscillator(),gain=audio.createGain();oscillator.connect(gain);gain.connect(audio.destination);oscillator.frequency.value=success?660:180;gain.gain.setValueAtTime(.035,audio.currentTime);gain.gain.exponentialRampToValueAtTime(.001,audio.currentTime+.16);oscillator.start();oscillator.stop(audio.currentTime+.17);oscillator.onended=()=>{oscillator.disconnect();gain.disconnect();};}catch{/* Optional sound must never block play. */}
}
export default function App(){
 const [s,dispatch]=useReducer(reducer,initial);
 const [sound,setSound]=useState(false),[answer,setAnswer]=useState('');
 const heading=useRef<HTMLHeadingElement>(null);
 const active=s.stage>=0&&s.stage<=4;
 useEffect(()=>{if(!active||s.paused)return;const timer=setInterval(()=>dispatch({type:'tick'}),1000);return()=>clearInterval(timer);},[active,s.paused]);
 useEffect(()=>{setAnswer('');heading.current?.focus({preventScroll:true});window.scrollTo(0,0);},[s.stage]);
 const respond=(correct:boolean,message:string,email?:number)=>{tone(sound,correct);dispatch({type:'answer',correct,message,email,stage:s.stage});};
 const submit=(event:React.FormEvent)=>{
  event.preventDefault();
  if(s.stage===1)respond(answer.trim().length>=15,answer.trim().length>=15?'Practice length requirement met. Use unique credentials and MFA in real work. Fragment U recovered.':'Use at least 15 characters in this practice phrase.');
  if(s.stage===2)respond(answer.trim().toUpperCase()==='ESCAPE',answer.trim().toUpperCase()==='ESCAPE'?'Cipher decoded: ESCAPE. Fragment A recovered.':'That does not decode the message. Shift each letter back three places.');
  if(s.stage===4)respond(answer.trim().toUpperCase()==='GUARD',answer.trim().toUpperCase()==='GUARD'?'Recovery plan authorized in the simulation.':'The recovery code does not match. Combine G, U, A, R and D.');
 };
 return <div className="app-shell">
  <a className="skip-link" href="#mission">Skip to mission</a>
  <header className="topbar"><a href={HOME} className="brand">ND <span>Norma DePriest / Experience Lab</span></a><nav aria-label="Game navigation"><a href={`${HOME}experience-design.html#blackout`}>Case study</a><a href={`${HOME}projects.html`}>Portfolio</a><button className="small" aria-pressed={sound} onClick={()=>{setSound(!sound);tone(!sound,true);}}>Sound {sound?'on':'off'}</button></nav></header>
  <main id="mission">
   {s.stage===-1?<section className="intro panel">
    <p className="eyebrow">Cyber Guard / Interactive incident-response escape game</p><div className="hero-mark" aria-hidden="true">⏣</div>
    <h1 ref={heading} tabIndex={-1}>Operation<br/><span>Blackout</span></h1><p className="lead">The school’s records are at risk.<br/>Your next decision matters.</p>
    <p>Step into the role of an incident response analyst at fictional Lincoln High. Triage messages, secure access, decode a clue and investigate a suspicious traffic pattern to unlock the recovery plan.</p>
    <ol className="mission-path">{stages.map((name,i)=><li key={name}><b>0{i+1}</b>{name}</li>)}</ol>
    <div className="mode-grid"><div><h2>Explore at your pace</h2><p>No countdown or penalties. Hints and feedback help you work through every stage.</p><button className="primary" onClick={()=>dispatch({type:'start',mode:'practice'})}>Start untimed practice →</button></div><div><h2>Take the challenge</h2><p>10 minutes. Wrong answers cost 30 seconds and 15 integrity points. Pause whenever you need.</p><button onClick={()=>dispatch({type:'start',mode:'challenge'})}>Start 10-minute challenge →</button></div></div>
    <p className="fine">Five stages · Keyboard and touch friendly · No account required<br/>All messages, traffic and records are simulated. Inputs stay in this page; never enter real credentials. Progress resets if you reload.</p>
   </section>:active?<>
    <section className="mission-header panel"><div><p className="eyebrow">Operation Blackout / {s.mode==='practice'?'Untimed practice':'Timed challenge'}</p><h1>Cyber Guard station</h1></div><div className="controls"><div className="timer"><b>{clock(s.mode==='practice'?s.elapsed:s.left)}</b><span>{s.mode==='practice'?'Active play time':'Time remaining'}</span></div><button onClick={()=>dispatch({type:'pause'})}>{s.paused?'Resume mission':'Pause mission'}</button></div></section>
    <ol className="progress" aria-label="Mission progress">{stages.map((name,i)=><li key={name} className={i===s.stage?'current':i<s.stage?'done':''} aria-current={i===s.stage?'step':undefined}><b>{i<s.stage?'✓':`0${i+1}`}</b><span>{name}</span></li>)}</ol>
    {s.paused?<section className="panel paused"><h2>Mission paused</h2><p>Your timer is stopped and your progress is safe in this tab.</p><button className="primary" onClick={()=>dispatch({type:'pause'})}>Continue mission</button></section>:<div className="workstation"><section className="panel stage">
     <div className="stage-title"><div><p className="eyebrow">Stage 0{s.stage+1} / 05</p><h2 ref={heading} tabIndex={-1}>{stages[s.stage]}</h2></div><button className="small" disabled={s.hint>=2} onClick={()=>dispatch({type:'hint'})}>{s.hint>=2?'Hints shown':`Show hint (${2-s.hint})`}</button></div>
     <div className="feedback" role="status" aria-live="polite" aria-atomic="true">{s.feedback}</div>
     {s.stage===0&&<><p><strong>Briefing:</strong> You attended the principal’s meeting and expect a library reminder. Review all three messages. Decide which needs reporting and which fits the expected context. The displayed links are inert.</p><div className="email-stack">{emails.map((email,i)=><article className={`email ${s.reviewed.includes(i)?'reviewed':''}`} key={email.subject}><p className="eyebrow">Message 0{i+1} {s.reviewed.includes(i)?' / Reviewed ✓':''}</p><h3>{email.subject}</h3><p className="sender">{email.sender}</p><p>{email.body}</p><div className="button-row"><button disabled={s.reviewed.includes(i)} aria-label={`Report message ${i+1} as phishing`} onClick={()=>respond(email.phish,email.phish?email.explanation:'This message matches the expected context. Review its actual request, not just the sender name.',i)}>Report phishing</button><button disabled={s.reviewed.includes(i)} aria-label={`Mark message ${i+1} as expected`} onClick={()=>respond(!email.phish,!email.phish?email.explanation:'The urgent credential request and lookalike destination need reporting. Do not follow that link.',i)}>Expected message</button></div></article>)}</div><p>{s.reviewed.length} of 3 messages reviewed correctly.</p><button className="primary" disabled={s.reviewed.length!==3} onClick={()=>dispatch({type:'next'})}>Continue to access security →</button></>}
     {s.stage===1&&<><p>The response team needs safer account access. Create a <strong>made-up practice passphrase of at least 15 characters</strong>. Spaces are welcome. Do not enter a password you actually use.</p><form onSubmit={submit}><label htmlFor="answer">Practice passphrase</label><input id="answer" value={answer} onChange={e=>setAnswer(e.target.value)} autoComplete="off" spellCheck={false} maxLength={128} aria-describedby="pass-help"/><p id="pass-help" className="fine">{answer.trim().length} / 15 minimum characters. This checks length only; it does not measure strength, check breached passwords or enable MFA.</p><button className="primary" type="submit">Check practice passphrase →</button></form><div className="field-note"><h3>On the job</h3><p>Use unique credentials, an approved password manager and MFA or phishing-resistant authentication. A long, predictable phrase can still be weak.</p></div></>}
     {s.stage===2&&<><p>An intercepted clue uses a Caesar shift of <strong>+3</strong>. Reverse the shift to recover the word. For example, D → A and E → B.</p><div className="cipher" aria-label="Cipher text H V F D S H">HVFDSH</div><form onSubmit={submit}><label htmlFor="answer">Decoded word</label><input id="answer" value={answer} onChange={e=>setAnswer(e.target.value)} autoComplete="off" spellCheck={false} maxLength={40}/><button className="primary" type="submit">Decode clue →</button></form><p className="field-note">This historical cipher is a puzzle mechanic. It is not suitable for protecting real data.</p></>}
     {s.stage===3&&<><p><strong>Baseline:</strong> Normal activity in this sample consists of web traffic on ports 80 and 443. No service scan is scheduled. Select a row from the source that needs investigation.</p><div className="traffic">{logs.map(([time,ip,port,event],i)=><button className="log-row" key={i} onClick={()=>respond(ip==='10.0.4.152',ip==='10.0.4.152'?'Repeated probes across multiple services warrant investigation. Fragment R recovered.':'That row matches the stated web-traffic baseline. Look for repeated probes from one source.')}><span className="log-time">{time}</span><strong>{ip}</strong><span>Port {port}</span><span>{event}</span></button>)}</div><p className="fine">Synthetic logs only. A private IP or an individual port is not evidence of malicious intent on its own.</p></>}
     {s.stage===4&&<><p>The team has isolated the simulated threat and preserved evidence. Clean backups have been validated. Combine your fragments with the recovery lead’s final fragment <strong>D</strong> to authorize the simulated restore.</p><div className="fragments" aria-label="Recovered fragments G U A R and final fragment D">{'GUARD'.split('').map((letter,i)=><span key={i}>{letter}</span>)}</div><form onSubmit={submit}><label htmlFor="answer">Recovery authorization code</label><input id="answer" value={answer} onChange={e=>setAnswer(e.target.value)} autoComplete="off" spellCheck={false} maxLength={30}/><button className="primary" type="submit">Activate recovery plan →</button></form><p className="field-note">In a real incident, follow organizational authority, evidence-handling procedures and a tested recovery plan. Do not delete evidence to “clean up.”</p></>}
    </section><aside><section className="panel telemetry"><p className="eyebrow">Mission telemetry / simulated</p><h2>{s.mode==='practice'?'Learning mode':'System integrity'}</h2>{s.mode==='challenge'?<><strong className="integrity">{s.integrity}%</strong><meter min="0" max="100" value={s.integrity} aria-label="Simulated system integrity"/></>:<p>Explore freely. Wrong answers provide feedback without ending the mission.</p>}<p>Incorrect attempts: <strong>{s.mistakes}</strong></p><p>Fragments recovered</p><div className="fragment-small" aria-label={`${'GUAR'.slice(0,s.stage)} recovered`}>{'GUAR'.split('').map((letter,i)=><span key={i}>{i<s.stage?letter:'·'}</span>)}</div></section><details className="panel"><summary>Decision log ({s.history.length})</summary><ol className="decision-log">{s.history.map((message,i)=><li key={i}>{message}</li>)}</ol></details><p className="fine">Designed by Norma DePriest<br/>An immersive cybersecurity learning experience for workforce exploration.</p></aside></div>}
   </>:<section className={`panel result ${s.stage===5?'success':'failure'}`}>
    <p className="eyebrow">Operation Blackout / Mission debrief</p><div className="hero-mark" aria-hidden="true">{s.stage===5?'✓':'↻'}</div><h1 ref={heading} tabIndex={-1}>{s.stage===5?'Mission success':'Mission ended'}</h1>
    <p className="lead">{s.stage===5?'You completed all five stages. The simulated records are restored.':s.reason}</p><div className="result-stats"><div><strong>{s.completed} / 5</strong><span>Stages complete</span></div><div><strong>{clock(s.elapsed)}</strong><span>Active play time</span></div><div><strong>{s.mistakes}</strong><span>Incorrect attempts</span></div></div>
    {s.stage===5?<><h2>Take the decisions into the workplace</h2><div className="debrief">{lessons.map(([name,lesson],i)=><article key={name}><span>0{i+1}</span><div><h3>{name}</h3><p>{lesson}</p></div></article>)}</div><p className="fine">Completion records gameplay only. This is an introductory simulation, not a certification or a validated assessment of job readiness.</p></>:<><p>Hints explain each decision. Untimed practice lets you work through the full scenario without penalties.</p><button className="primary" onClick={()=>dispatch({type:'start',mode:'practice'})}>Try untimed practice →</button></>}
    <div className="button-row"><button onClick={()=>dispatch({type:'reset'})}>New operation</button><a className="button primary" href={`${HOME}projects.html`}>Explore more experiences →</a></div>
   </section>}
  </main><footer>Operation Blackout · Created by Norma DePriest · <a href={`${HOME}cv.html`}>View CV</a> · <a href={`${HOME}contact.html`}>Contact</a></footer>
 </div>;
}
