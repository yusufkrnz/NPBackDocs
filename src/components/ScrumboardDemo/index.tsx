import { useState, type DragEvent, type ReactNode } from 'react';
import clsx from 'clsx';
import styles from './styles.module.css';

type Status = 'todo' | 'doing' | 'done';
type Version = 'v0.1' | 'v0.2';

type Task = {
  id: string;
  title: string;
  status: Status;
  previousStatus: Status | null;
};

type LogEntry = {
  id: number;
  icon: string;
  text: string;
  tone: 'info' | 'ok' | 'warn' | 'db';
};

const COLUMNS: { key: Status; label: string; icon: string }[] = [
  { key: 'todo', label: 'Yapılacak', icon: '📋' },
  { key: 'doing', label: 'Devam Ediyor', icon: '🚧' },
  { key: 'done', label: 'Bitti', icon: '✅' },
];

const INITIAL_TASKS: Task[] = [
  { id: 't1', title: 'Login sayfası tasarımı', status: 'todo', previousStatus: null },
  { id: 't2', title: 'API auth entegrasyonu', status: 'doing', previousStatus: null },
  { id: 't3', title: 'Test yaz', status: 'todo', previousStatus: null },
  { id: 't4', title: 'Deploy scripti', status: 'done', previousStatus: null },
];

const VERSION_BLURB: Record<Version, string> = {
  'v0.1': 'İlk düşündüğümüz sistem — LLM her istekte HTML\'i sıfırdan üretiyor, hiçbir değişiklik kalıcı değil.',
  'v0.2': 'Şu anki tasarım — event kataloğu + dinamik tablo, her değişiklik Mongo\'ya yazılıyor ve geri alınabiliyor.',
};

let logSeq = 0;

export default function ScrumboardDemo(): ReactNode {
  const [version, setVersion] = useState<Version>('v0.2');
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [lastMoved, setLastMoved] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);

  function pushLogs(entries: Array<Omit<LogEntry, 'id'>>) {
    setLogs((prev) => [...entries.map((e) => ({ ...e, id: logSeq++ })).reverse(), ...prev].slice(0, 10));
  }

  function moveTask(id: string, newStatus: Status, isUndo = false) {
    const task = tasks.find((t) => t.id === id);
    if (!task || task.status === newStatus) return;
    const fromStatus = task.status;

    setTasks((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, status: newStatus, previousStatus: isUndo ? null : fromStatus } : t
      )
    );

    if (version === 'v0.1') {
      pushLogs([
        { icon: '🎨', text: `LLM tüm dashboard HTML'ini sıfırdan yeniden üretti ("${task.title}" → ${newStatus})`, tone: 'info' },
        { icon: '⚠️', text: `Hiçbir event/DB çağrısı yok — değişiklik sadece bu sekmenin JS belleğinde`, tone: 'warn' },
        { icon: '🔄', text: `Sayfa yenilenirse (F5) kart eski konumuna döner`, tone: 'warn' },
      ]);
      setLastMoved(null);
    } else {
      pushLogs([
        { icon: '📤', text: `postMessage → {event:"update_row", table_id:"tasks", row_id:"${id}", patch:{status:"${newStatus}"}}`, tone: 'info' },
        { icon: '🔐', text: `table_id tenant'a ait mi? ✅`, tone: 'ok' },
        { icon: '🔐', text: `"status" alanı dashboard_tables.columns'ta mı? ✅`, tone: 'ok' },
        {
          icon: '🗄️',
          text: isUndo
            ? `Mongo: data.status = "${newStatus}" — önceki değer "previous"tan geri yüklendi`
            : `Mongo: data.status = "${newStatus}", previous = "${fromStatus}" olarak saklandı`,
          tone: 'db',
        },
        { icon: '📥', text: `event_result alındı → DOM güncellendi`, tone: 'ok' },
      ]);
      setLastMoved(isUndo ? null : id);
    }
  }

  function handleUndo() {
    if (!lastMoved) return;
    const task = tasks.find((t) => t.id === lastMoved);
    if (!task?.previousStatus) return;
    moveTask(lastMoved, task.previousStatus, true);
  }

  function handleDrop(e: DragEvent<HTMLDivElement>, status: Status) {
    e.preventDefault();
    if (dragId) moveTask(dragId, status);
    setDragId(null);
  }

  const movedTask = lastMoved ? tasks.find((t) => t.id === lastMoved) : null;

  return (
    <div className={styles.wrap}>
      <div className={styles.versionRow}>
        <div className={styles.versionToggle}>
          {(['v0.1', 'v0.2'] as Version[]).map((v) => (
            <button
              key={v}
              type="button"
              className={clsx(styles.versionBtn, v === version && styles.versionBtnActive)}
              onClick={() => {
                setVersion(v);
                setLogs([]);
                setLastMoved(null);
              }}
            >
              {v}
            </button>
          ))}
        </div>
        <p className={styles.blurb}>{VERSION_BLURB[version]}</p>
      </div>

      <div className={styles.layout}>
        <div className={styles.board}>
          {COLUMNS.map((col) => (
            <div
              key={col.key}
              className={clsx(styles.column, styles[`col_${col.key}`], dragId && styles.columnDropReady)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => handleDrop(e, col.key)}
            >
              <div className={styles.columnHeader}>
                <span>
                  <span className={styles.columnIcon}>{col.icon}</span> {col.label}
                </span>
                <span className={styles.count}>{tasks.filter((t) => t.status === col.key).length}</span>
              </div>
              <div className={styles.columnBody}>
                {tasks
                  .filter((t) => t.status === col.key)
                  .map((t) => (
                    <div
                      key={t.id}
                      className={clsx(
                        styles.card,
                        t.id === lastMoved && styles.cardMoved,
                        t.id === dragId && styles.cardDragging
                      )}
                      draggable
                      onDragStart={() => setDragId(t.id)}
                      onDragEnd={() => setDragId(null)}
                    >
                      <span className={styles.grip}>⠿</span>
                      {t.title}
                    </div>
                  ))}
                {tasks.filter((t) => t.status === col.key).length === 0 && (
                  <div className={styles.columnEmpty}>bırakmak için buraya sürükle</div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className={styles.side}>
          <div className={styles.dbPanel}>
            <div className={styles.dbPanelTitle}>🗄️ DB belgesi <span className={styles.dbPanelSub}>dashboard_table_rows</span></div>
            {version === 'v0.1' || !movedTask ? (
              <div className={styles.dbEmpty}>
                {version === 'v0.1' ? '— hiçbir şey yazılmadı (hafızada değil)' : 'bir kart taşı, buraya dolsun'}
              </div>
            ) : (
              <pre className={styles.dbJson}>
{`{
  "table_id": "tasks",
  "row_id": "${movedTask.id}",
  "data": { "status": "${movedTask.status}" },
  "previous": ${movedTask.previousStatus ? `{ "status": "${movedTask.previousStatus}" }` : 'null'}
}`}
              </pre>
            )}
            {version === 'v0.2' && movedTask?.previousStatus && (
              <button type="button" className={styles.undoBtn} onClick={handleUndo}>
                ↩️ Geri Al
              </button>
            )}
          </div>

          <div className={styles.logPanel}>
            <div className={styles.dbPanelTitle}>⚡ Servis akışı</div>
            {logs.length === 0 && <div className={styles.dbEmpty}>bir kartı sürükleyip bırak, akış burada görünsün</div>}
            <div className={styles.logList}>
              {logs.map((l) => (
                <div key={l.id} className={clsx(styles.logEntry, styles[`tone_${l.tone}`])}>
                  <span className={styles.logIcon}>{l.icon}</span>
                  <span className={styles.logText}>{l.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
