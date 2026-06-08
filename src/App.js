import './App.css';
import { useEffect, useState, useRef, useCallback } from 'react';
import { db } from './firebase';
import {
  collection, onSnapshot, addDoc, updateDoc, deleteDoc,
  doc, writeBatch, serverTimestamp, query, orderBy
} from 'firebase/firestore';
import { PDFDownloadLink } from '@react-pdf/renderer';
import TicketPDF from './TicketPDF';

const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function genCode(prefix) {
  const p = (prefix || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4);
  let c = p;
  for (let i = 0; i < 10 - p.length; i++) c += CHARS[Math.floor(Math.random() * CHARS.length)];
  return c;
}

// ── STATS BAR ──────────────────────────────────────────────
function StatsBar({ tickets }) {
  const total   = tickets.length;
  const sent    = tickets.filter(t => t.status === 'sent' || t.status === 'used').length;
  const used    = tickets.filter(t => t.status === 'used').length;
  const pending = total - used;
  return (
    <div className="stats-bar">
      <div className="stat"><div className="stat-label">Gesamt</div><div className="stat-val dim">{total}</div></div>
      <div className="stat"><div className="stat-label">Verschickt</div><div className="stat-val blue">{sent}</div></div>
      <div className="stat"><div className="stat-label">Verwendet</div><div className="stat-val green">{used}</div></div>
      <div className="stat"><div className="stat-label">Ausstehend</div><div className="stat-val gold">{pending}</div></div>
    </div>
  );
}

// ── OVERVIEW TAB ───────────────────────────────────────────
function OverviewPanel({ tickets, onGenerate }) {
  const [count, setCount] = useState(10);
  const [prefix, setPrefix] = useState('');
  const [copied, setCopied] = useState(false);
  const preview = genCode(prefix);

  function handleGenerate() {
    const n = Math.min(500, Math.max(1, count));
    const existing = new Set(tickets.map(t => t.code));
    const newCodes = [];
    let tries = 0;
    while (newCodes.length < n && tries < n * 10) {
      tries++;
      const code = genCode(prefix);
      if (!existing.has(code)) { existing.add(code); newCodes.push(code); }
    }
    onGenerate(newCodes);
  }

  function exportCSV() {
    const csv = 'Code,Status\n' + tickets.map(t => t.code + ',' + t.status).join('\n');
    const a = document.createElement('a');
    a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
    a.download = 'abiball_tickets.csv';
    a.click();
  }

  function copyAll() {
    navigator.clipboard.writeText(tickets.map(t => t.code).join('\n')).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div id="panel-overview" className="panel active">
      <div className="card">
        <div className="section-label">Neue Tickets generieren</div>
        <div className="gen-grid">
          <div className="field">
            <label>Anzahl Tickets</label>
            <input type="number" value={count} min="1" max="500" onChange={e => setCount(parseInt(e.target.value) || 1)} />
          </div>
          <div className="field">
            <label>Präfix (optional)</label>
            <input type="text" value={prefix} placeholder="z.B. ABI25" maxLength={4} className="input-mono" onChange={e => setPrefix(e.target.value)} />
          </div>
        </div>
        <div className="example-code">
          Beispiel-Code: <span className="code-pill">{preview}</span>
        </div>
        <div className="action-row">
          <button className="btn btn-gold" onClick={handleGenerate}>+ Generieren</button>
          <button className="btn" onClick={exportCSV}>↓ CSV exportieren</button>
          <button className="btn" onClick={copyAll}>{copied ? '✓ Kopiert!' : '◆ Alle Codes kopieren'}</button>
        </div>
      </div>
    </div>
  );
}

// ── MANAGE TAB ─────────────────────────────────────────────
function ManagePanel({ tickets, onUpdate, onDelete }) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  const filtered = tickets.filter(t => {
    const q = search.toUpperCase().trim();
    if (q && !t.code.includes(q)) return false;
    if (filter === 'unsent') return t.status === 'unsent';
    if (filter === 'sent')   return t.status === 'sent';
    if (filter === 'used')   return t.status === 'used';
    return true;
  });

  return (
    <div id="panel-manage" className="panel active">
      <div className="search-filter">
        <input type="text" value={search} placeholder="Code suchen …" className="input-mono" onChange={e => setSearch(e.target.value)} />
        <div className="filter-group">
          {['all','unsent','sent','used'].map(f => (
            <button key={f} className={`fbtn${filter === f ? ' on' : ''}`} onClick={() => setFilter(f)}>
              {f === 'all' ? 'Alle' : f === 'unsent' ? 'Ausstehend' : f === 'sent' ? 'Verschickt' : 'Verwendet'}
            </button>
          ))}
        </div>
      </div>
      {filtered.length === 0 ? (
        <div className="empty">— keine tickets gefunden —</div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead><tr><th>Code</th><th>Status</th><th>Aktionen</th><th></th></tr></thead>
            <tbody>
              {filtered.map(t => (
                <tr key={t.id}>
                  <td className="code-cell">{t.code}</td>
                  <td>
                    {t.status === 'used'   && <span className="badge b-used">✓ Verwendet</span>}
                    {t.status === 'sent'   && <span className="badge b-sent">→ Verschickt</span>}
                    {t.status === 'unsent' && <span className="badge b-unsent">· Ausstehend</span>}
                  </td>
                  <td>
                    <div className="acts">
                      {t.status === 'unsent' && <button className="ab ab-send" onClick={() => onUpdate(t.id, 'sent')}>verschickt</button>}
                      {t.status === 'sent'   && <button className="ab ab-use"  onClick={() => onUpdate(t.id, 'used')}>verwendet</button>}
                      {t.status === 'sent'   && <button className="ab"         onClick={() => onUpdate(t.id, 'unsent')}>↩ zurück</button>}
                      {t.status === 'used'   && <button className="ab"         onClick={() => onUpdate(t.id, 'sent')}>↩ zurück</button>}
                    </div>
                  </td>
                  <td><button className="del-btn" onClick={() => onDelete(t.id)} title="Löschen">✕</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── CHECKIN TAB ────────────────────────────────────────────
function CheckinPanel({ tickets, onCheckin }) {
  const [input, setInput]       = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [highlighted, setHighlighted] = useState(-1);
  const [result, setResult]     = useState(null);
  const [log, setLog]           = useState([]);
  const inputRef = useRef(null);

  useEffect(() => {
    const q = query(collection(db, 'checkins'), orderBy('ts', 'desc'));
    const unsub = onSnapshot(q, snap => {
      setLog(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, []);

  function buildResult(code) {
    const t = tickets.find(x => x.code === code);
    if (!t)                   return { type: 'error',   msg: '✕ Code nicht gefunden' };
    if (t.status === 'used')  return { type: 'warn',    msg: '⚠ Bereits verwendet — Einlass verweigern!' };
    if (t.status === 'unsent') return { type: 'neutral', msg: '◇ Gültig, aber noch nicht als verschickt markiert' };
    return { type: 'ok', msg: '✓ Gültiges Ticket — Einlass gewähren' };
  }

  function handleInput(val) {
    setInput(val);
    setHighlighted(-1);
    setResult(null);
    const q = val.toUpperCase().trim();
    if (!q) { setSuggestions([]); return; }
    setSuggestions(tickets.filter(t => t.code.includes(q)).slice(0, 8));
  }

  function selectSuggestion(code) {
    setInput(code);
    setSuggestions([]);
    setResult(buildResult(code));
  }

  function handleKeyDown(e) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const next = Math.min(highlighted + 1, suggestions.length - 1);
      setHighlighted(next);
      if (suggestions[next]) { setInput(suggestions[next].code); setResult(buildResult(suggestions[next].code)); }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prev = Math.max(highlighted - 1, 0);
      setHighlighted(prev);
      if (suggestions[prev]) { setInput(suggestions[prev].code); setResult(buildResult(suggestions[prev].code)); }
    } else if (e.key === 'Enter') {
      setSuggestions([]);
      doCheckin();
    } else if (e.key === 'Escape') {
      setSuggestions([]);
    }
  }

  function doCheckin() {
    const code = input.toUpperCase().trim();
    const t = tickets.find(x => x.code === code);
    if (!t)                  { setResult({ type: 'error', msg: '✕ Code nicht gefunden' }); return; }
    if (t.status === 'used') { setResult({ type: 'warn',  msg: '⚠ Bereits verwendet — Einlass verweigern!' }); return; }
    onCheckin(t.id, code);
    setInput('');
    setSuggestions([]);
    setResult({ type: 'success', msg: '✦ Willkommen beim Abiball!' });
    setTimeout(() => setResult(null), 4000);
  }

  function highlightCode(code) {
    const q = input.toUpperCase().trim();
    if (!q) return code;
    const idx = code.indexOf(q);
    if (idx === -1) return code;
    return (
      <>
        {code.slice(0, idx)}
        <span className="sug-highlight">{q}</span>
        {code.slice(idx + q.length)}
      </>
    );
  }

  const statusColor = s => s === 'used' ? 'var(--red)' : s === 'sent' ? 'var(--green)' : 'var(--text3)';
  const statusIcon  = s => s === 'used' ? '✗' : s === 'sent' ? '→' : '·';

  return (
    <div id="panel-checkin" className="panel active">
      <div className="checkin-card">
        <div className="section-label">Einlasskontrolle</div>
        <div className="checkin-input-row">
          <div>
            <input
              ref={inputRef}
              type="text"
              value={input}
              placeholder="Code eingeben …"
              className="input-mono"
              style={{ width: '100%' }}
              onChange={e => handleInput(e.target.value)}
              onKeyDown={handleKeyDown}
              autoComplete="off"
            />
            {suggestions.length > 0 && (
              <div className="suggestions-box">
                {suggestions.map((t, i) => (
                  <div
                    key={t.id}
                    className={`sug-item${i === highlighted ? ' highlighted' : ''}`}
                    onMouseDown={() => selectSuggestion(t.code)}
                    onMouseEnter={() => setHighlighted(i)}
                  >
                    <span>{highlightCode(t.code)}</span>
                    <span className="sug-status" style={{ color: statusColor(t.status) }}>
                      {statusIcon(t.status)} {t.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <button className="btn btn-green" onClick={doCheckin}>✓ Einlass</button>
        </div>
        {result && (
          <div className={`checkin-result cr-${result.type}`}>{result.msg}</div>
        )}
      </div>

      <div className="log-title">Zuletzt eingecheckt</div>
      {log.length === 0 ? (
        <div className="empty" style={{ maxWidth: 520 }}>— noch keine einchecks in dieser sitzung —</div>
      ) : (
        <div className="table-wrap" style={{ maxWidth: 520 }}>
          <table>
            <thead><tr><th>Uhrzeit</th><th>Code</th></tr></thead>
            <tbody>
              {log.slice(0, 30).map(l => (
                <tr key={l.id}>
                  <td style={{ color: 'var(--text3)', fontFamily: "'DM Mono', monospace", fontSize: 12 }}>
                    {l.ts?.toDate().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) ?? '—'}
                  </td>
                  <td className="code-cell">{l.code}</td>
                  <td>
                    <button className="del-btn" onClick={() => deleteDoc(doc(db, 'checkins', l.id))} title="Löschen">✕</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── VERSAND TAB ────────────────────────────────────────────
function VersandPanel({ tickets }) {
  const [name, setName]     = useState('');
  const [count, setCount]   = useState(1);
  const [ready, setReady]   = useState(false);
  const [codes, setCodes]   = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState('');

  const unsent = tickets.filter(t => t.status === 'unsent');

  function reset() { setReady(false); setCodes([]); setName(''); setCount(1); }

  async function handlePrepare() {
    setError('');
    const n = Math.min(count, unsent.length);
    if (!name.trim())  { setError('Bitte einen Namen eingeben.'); return; }
    if (n < 1)         { setError('Keine ausstehenden Tickets verfügbar.'); return; }
    if (count > unsent.length) { setError(`Nur noch ${unsent.length} Tickets verfügbar.`); return; }

    setLoading(true);
    const selected = unsent.slice(0, n);
    const batch = writeBatch(db);
    selected.forEach(t => batch.update(doc(db, 'tickets', t.id), { status: 'sent' }));
    await batch.commit();
    setCodes(selected.map(t => t.code));
    setReady(true);
    setLoading(false);
  }

  return (
    <div className="panel active">
      {!ready ? (
        <div className="card" style={{ maxWidth: 480 }}>
          <div className="section-label">Tickets versenden</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', marginTop: '0.5rem' }}>
            <div className="field">
              <label>Name des Empfängers</label>
              <input
                type="text"
                value={name}
                placeholder="z.B. Maximilian Müller"
                onChange={e => setName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handlePrepare()}
              />
            </div>
            <div className="field">
              <label>Anzahl Tickets</label>
              <input
                type="number"
                value={count}
                min="1"
                max={unsent.length}
                onChange={e => setCount(parseInt(e.target.value) || 1)}
              />
              <div style={{ marginTop: 6, fontSize: 11, color: 'var(--text3)', fontFamily: "'DM Mono', monospace" }}>
                {unsent.length} ausstehende Tickets verfügbar
              </div>
            </div>
          </div>
          {error && (
            <div style={{ marginTop: '1rem', padding: '10px 14px', borderRadius: 'var(--radius)', background: 'var(--red-bg)', border: '1px solid rgba(179,58,42,0.2)', color: 'var(--red)', fontSize: 13 }}>
              {error}
            </div>
          )}
          <div className="action-row">
            <button className="btn btn-gold" onClick={handlePrepare} disabled={loading}>
              {loading ? '…' : '→ Tickets zuweisen & PDF erstellen'}
            </button>
          </div>
        </div>
      ) : (
        <div className="card" style={{ maxWidth: 520 }}>
          <div className="section-label">Bereit zum Versand</div>
          <div style={{ marginBottom: '1rem' }}>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.6rem', fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>
              {name}
            </div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: 'var(--text3)', letterSpacing: '0.1em' }}>
              {codes.length} {codes.length === 1 ? 'Ticket' : 'Tickets'} als verschickt markiert
            </div>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: '1.2rem' }}>
            {codes.map(code => (
              <span key={code} className="code-pill" style={{ fontSize: 13, padding: '5px 12px' }}>{code}</span>
            ))}
          </div>

          <div className="action-row">
            <PDFDownloadLink
              document={<TicketPDF name={name} codes={codes} />}
              fileName={`Abiball2026_${name.replace(/\s+/g, '_')}.pdf`}
              style={{ textDecoration: 'none' }}
            >
              {({ loading: pdfLoading }) => (
                <button className="btn btn-green">
                  {pdfLoading ? '… PDF wird erstellt' : '↓ PDF herunterladen'}
                </button>
              )}
            </PDFDownloadLink>
            <button className="btn" onClick={reset}>+ Nächste Person</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── APP ────────────────────────────────────────────────────
export default function App() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const q = query(collection(db, 'tickets'), orderBy('ts', 'asc'));
    const unsub = onSnapshot(q, snap => {
      setTickets(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return unsub;
  }, []);

  const handleGenerate = useCallback(async (codes) => {
    const batch = writeBatch(db);
    codes.forEach(code => {
      const ref = doc(collection(db, 'tickets'));
      batch.set(ref, { code, status: 'unsent', ts: serverTimestamp() });
    });
    await batch.commit();
    setActiveTab('manage');
  }, []);

  const handleUpdate = useCallback(async (id, status) => {
    await updateDoc(doc(db, 'tickets', id), { status });
  }, []);

  const handleDelete = useCallback(async (id) => {
    await deleteDoc(doc(db, 'tickets', id));
  }, []);

  const handleCheckin = useCallback(async (id, code) => {
    await updateDoc(doc(db, 'tickets', id), { status: 'used' });
    await addDoc(collection(db, 'checkins'), { code, ts: serverTimestamp() });
  }, []);

  const tabs = ['overview', 'manage', 'versand', 'checkin'];
  const tabLabels = ['■ Übersicht', '■ Tickets', '■ Versand', '■ Einlass'];

  return (
    <>
      <header>
        <div className="header-eyebrow">Einlasssystem</div>
        <h1>Abi<span>ball</span> 2026</h1>
        <div className="header-sub">Ticket · Verwaltung · Einlass</div>
      </header>

      <StatsBar tickets={tickets} />

      <div className="container">
        <div className="tabs">
          {tabs.map((t, i) => (
            <button key={t} className={`tab${activeTab === t ? ' active' : ''}`} onClick={() => setActiveTab(t)}>
              {tabLabels[i]}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="loading">lade tickets …</div>
        ) : (
          <>
            {activeTab === 'overview' && <OverviewPanel tickets={tickets} onGenerate={handleGenerate} />}
            {activeTab === 'manage'   && <ManagePanel   tickets={tickets} onUpdate={handleUpdate} onDelete={handleDelete} />}
            {activeTab === 'versand'  && <VersandPanel  tickets={tickets} />}
            {activeTab === 'checkin'  && <CheckinPanel  tickets={tickets} onCheckin={handleCheckin} />}
          </>
        )}
      </div>

      <footer>Abiball Ticket-System — Daten werden in Firebase gespeichert</footer>
    </>
  );
}
