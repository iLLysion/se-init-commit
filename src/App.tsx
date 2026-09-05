import { useEffect, useMemo, useRef, useState } from "react";
import studentsData from "./data/students.json";

type Student = {
  id: number;
  name: string;
};

type Stage = "select" | "ready" | "terminal" | "success";

type TerminalLine = {
  text: string;
  className?: string;
  typing?: boolean;
  pauseAfter?: number;
};

const students = studentsData as Student[];

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function hashFor(student: Student) {
  const alphabet = "ABCDEF0123456789";
  let seed =
    student.name.split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0) +
    student.id * 17;

  let hash = "";
  for (let i = 0; i < 7; i += 1) {
    seed = (seed * 9301 + 49297) % 233280;
    hash += alphabet[seed % alphabet.length];
  }
  return hash.toLowerCase();
}

export default function App() {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Student | null>(null);
  const [stage, setStage] = useState<Stage>("select");
  const [displayedLines, setDisplayedLines] = useState<string[]>([]);
  const [currentTyping, setCurrentTyping] = useState("");
  const [committedIds, setCommittedIds] = useState<number[]>([]);
  const animatingRef = useRef(false);

  useEffect(() => {
    const stored = localStorage.getItem("se-2026-committed");
    if (stored) {
      try {
        setCommittedIds(JSON.parse(stored));
      } catch {
        // ignore invalid local data
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("se-2026-committed", JSON.stringify(committedIds));
  }, [committedIds]);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("uk-UA");
    if (!normalized) return students;
    return students.filter((student) =>
      student.name.toLocaleLowerCase("uk-UA").includes(normalized),
    );
  }, [query]);

  const selectStudent = (student: Student) => {
    if (stage === "terminal") return;
    setSelected(student);
    setStage("ready");
    setDisplayedLines([]);
    setCurrentTyping("");
  };

  const reset = () => {
    setSelected(null);
    setStage("select");
    setQuery("");
    setDisplayedLines([]);
    setCurrentTyping("");
    animatingRef.current = false;
  };

  const runTerminal = async () => {
    if (!selected || animatingRef.current) return;

    animatingRef.current = true;
    setStage("terminal");
    setDisplayedLines([]);
    setCurrentTyping("");

    const hash = hashFor(selected);
    const lines: TerminalLine[] = [
      {
        text: "student@software-engineering:~$ git init",
        typing: true,
        pauseAfter: 450,
      },
      {
        text: "Initialized empty Git repository in /ipz-2026/.git/",
        className: "muted",
        pauseAfter: 550,
      },
      {
        text: "student@software-engineering:~$ git add .",
        typing: true,
        pauseAfter: 450,
      },
      {
        text: 'student@software-engineering:~$ git commit -m "Починаю свій шлях в Інженерії програмного забезпечення"',
        typing: true,
        pauseAfter: 650,
      },
      {
        text: `[main (root-commit) ${hash}] Починаю свій шлях в Інженерії програмного забезпечення`,
        className: "success-line",
        pauseAfter: 350,
      },
      { text: ` Author: ${selected.name}`, pauseAfter: 250 },
      { text: " 1 student enrolled", pauseAfter: 250 },
      { text: " 1 future started", pauseAfter: 700 },
      { text: "> verifying commit...", className: "muted", pauseAfter: 550 },
      {
        text: "> status: SUCCESS ✓",
        className: "success-line",
        pauseAfter: 1000,
      },
    ];

    const rendered: string[] = [];

    for (const line of lines) {
      if (line.typing) {
        setCurrentTyping("");
        for (const char of line.text) {
          setCurrentTyping((prev) => prev + char);
          await sleep(28 + Math.random() * 22);
        }
        rendered.push(line.text);
        setDisplayedLines([...rendered]);
        setCurrentTyping("");
      } else {
        rendered.push(line.text);
        setDisplayedLines([...rendered]);
      }
      await sleep(line.pauseAfter ?? 250);
    }

    setCommittedIds((prev) =>
      prev.includes(selected.id) ? prev : [...prev, selected.id],
    );
    setStage("success");
    animatingRef.current = false;
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (stage === "success") {
        if (event.key === "Enter" || event.key === "Escape") {
          event.preventDefault();
          reset();
          return;
        }
      }

      if (stage === "ready" && selected && event.key === "Enter") {
        event.preventDefault();
        void runTerminal();
        return;
      }

      if (event.key === "Escape" && stage !== "terminal") {
        event.preventDefault();
        reset();
        return;
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [stage, selected]);

  return (
    <main className="app-shell">
      {(stage === "select" || stage === "ready") && (
        <section className="selection-screen">
          <div className="brand">
            <div className="eyebrow">
              ІФНТУНГ · ІНЖЕНЕРІЯ ПРОГРАМНОГО ЗАБЕЗПЕЧЕННЯ
            </div>
            <h1>Посвята першокурсників у студенти · 2026</h1>
          </div>

          <div className="content-grid">
            <div className="student-panel">
              <input
                autoFocus
                className="search-input"
                placeholder="Пошук студента..."
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />

              <div className="student-list">
                {filtered.map((student) => {
                  const committed = committedIds.includes(student.id);
                  const active = selected?.id === student.id;

                  return (
                    <button
                      className={`student-row ${active ? "active" : ""}`}
                      key={student.id}
                      onClick={() => selectStudent(student)}
                    >
                      <span>{student.name}</span>
                      {committed && (
                        <span className="done-badge">COMMITTED ✓</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className={`ready-card ${selected ? "visible" : ""}`}>
              {selected ? (
                <>
                  <div className="ready-kicker">Вибраний студент</div>
                  <div className="selected-name">{selected.name}</div>
                  <div className="commit-copy">
                    Готові зробити перший commit у Інженерію програмного
                    забезпечення?
                  </div>
                  <button
                    className="enter-key"
                    onClick={() => void runTerminal()}
                  >
                    COMMIT
                  </button>
                  <div className="hint">Натисніть кнопку Enter</div>
                </>
              ) : (
                <div className="empty-state">Оберіть студента зі списку</div>
              )}
            </div>
          </div>
        </section>
      )}

      {stage === "terminal" && selected && (
        <section className="terminal-screen">
          <div className="terminal-window">
            <div className="terminal-topbar">
              <div className="lights">
                <span />
                <span />
                <span />
              </div>
              <div className="terminal-title">ІПЗ-2026 — initial-commit</div>
            </div>

            <div className="terminal-body">
              {displayedLines.map((line, index) => (
                <div
                  key={`${index}-${line}`}
                  className={
                    line.includes("SUCCESS") || line.includes("[main")
                      ? "terminal-line success-line"
                      : line.startsWith("Initialized") || line.startsWith(">")
                        ? "terminal-line muted"
                        : "terminal-line"
                  }
                >
                  {line}
                </div>
              ))}
              {currentTyping && (
                <div className="terminal-line">
                  {currentTyping}
                  <span className="cursor">▋</span>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {stage === "success" && selected && (
        <section className="success-screen">
          <div className="success-backdrop" />
          <div className="success-card">
            <button
              className="success-close"
              onClick={reset}
              aria-label="Закрити привітання"
            >
              ×
            </button>
            <div className="checkmark">✓</div>
            <div className="success-code">COMMIT SUCCESSFUL</div>
            <h2>Вітаємо, {selected.name}!</h2>
            <p>
              Ваш перший commit успішно створено.
              <br />
              Відтепер ви — студент{" "}
              <strong>Інженерії програмного забезпечення</strong>.
            </p>

            <div className="commit-meta">
              <span>commit {hashFor(selected)}</span>
              <span>branch main</span>
              <span>IPZ · 2026</span>
            </div>

            <div className="welcome">Ласкаво просимо до ІПЗ! 🚀</div>
          </div>
        </section>
      )}
    </main>
  );
}
