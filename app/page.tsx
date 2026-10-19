"use client";

import { useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  CircleHelp,
  Code2,
  GitBranch,
  Info,
  Play,
  RotateCcw,
  Table2,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";

type Direction = "R" | "L" | "N";
type Rule = [string, Direction, string];
type Snapshot = {
  tape: string[];
  head: number;
  state: string;
  rule?: Rule;
  action?: string;
  read?: string;
  fromState?: string;
};

const BLANK = "_";
const transitions: Record<string, Rule> = {
  "q0,1": ["1", "R", "q0"],
  "q0,0": ["1", "R", "q1"],
  "q1,1": ["1", "R", "q1"],
  "q1,0": ["0", "L", "q2"],
  "q2,1": ["0", "L", "q3"],
};

function buildRun(input: string): Snapshot[] {
  // A right-edge delimiter lets q₁ detect the end before q₂ erases the final 1.
  const tape = [...input, "0"];
  let head = 0;
  let state = "q0";
  const snapshots: Snapshot[] = [{ tape: [...tape], head, state }];
  while (state !== "q3" && snapshots.length < 100) {
    const symbol = tape[head] ?? BLANK;
    const rule = transitions[`${state},${symbol}`];
    if (!rule) break;
    const [write, move, nextState] = rule;
    const fromState = state;
    tape[head] = write;
    if (move === "R") head += 1;
    if (move === "L") head -= 1;
    state = nextState;
    snapshots.push({
      tape: [...tape],
      head,
      state,
      rule,
      read: symbol,
      fromState,
      action:
        move === "L" && nextState === "q3"
          ? `В состоянии q₂ машина нашла последнюю единицу результата, стирает её записью «0» и останавливается.`
          : `Машина читает символ «${symbol}» в состоянии ${state}, записывает «${write}», затем сдвигает головку ${move === "N" ? "не изменяя положение" : move === "R" ? "вправо" : "влево"} и переходит в состояние ${nextState}.`,
    });
  }
  return snapshots;
}

function Tape({ snapshot, active }: { snapshot: Snapshot; active: boolean }) {
  const cells = Array.from(
    { length: Math.max(snapshot.tape.length + 2, 12) },
    (_, index) => snapshot.tape[index] ?? BLANK,
  );
  return (
    <div className="tape-wrap">
      <div className="tape-label">
        <span className="pulse-dot" /> ЛЕНТА · УНАРНАЯ СИСТЕМА
      </div>
      <div className="tape-scroll">
        <div className="tape">
          {cells.map((symbol, index) => (
            <div
              className={`tape-cell ${index === snapshot.head ? "head-cell" : ""} ${symbol === "0" ? "delimiter" : ""}`}
              key={index}
            >
              {index === snapshot.head && (
                <div className="head-marker">головка</div>
              )}
              <span>{symbol}</span>
              <small>{String(index).padStart(2, "0")}</small>
            </div>
          ))}
        </div>
      </div>
      <div className="tape-caption">
        <span>0</span>
        <span>1</span>
        <span>_</span>
        <span>— разделитель · ␣ пустой символ</span>
      </div>
      {active && (
        <div className="tape-status">
          {snapshot.state === "q3"
            ? "Машина остановлена"
            : "Головка готова к следующему переходу"}
        </div>
      )}
    </div>
  );
}

function RuleRow({
  from,
  symbol,
  rule,
  description,
  active,
}: {
  from: string;
  symbol: string;
  rule: Rule;
  description: string;
  active: boolean;
}) {
  return (
    <div className={`rule-row ${active ? "rule-active" : ""}`}>
      <code>
        <b>{from}</b>
      </code>
      <code>{symbol}</code>
      <code>
        <b>{rule[2]}</b>
      </code>
      <code>{rule[0]}</code>
      <code>
        {rule[1] === "R"
          ? "R (вправо)"
          : rule[1] === "L"
            ? "L (влево)"
            : "N (нет)"}
      </code>
      <span className="rule-description">{description}</span>
    </div>
  );
}

export default function Page() {
  const [first, setFirst] = useState("3");
  const [second, setSecond] = useState("2");
  const [step, setStep] = useState(0);
  const [view, setView] = useState<"table" | "graph">("table");
  const [showExplanation, setShowExplanation] = useState(true);
  const [running, setRunning] = useState(false);

  const input = `${"1".repeat(Number(first) || 0)}0${"1".repeat(Number(second) || 0)}`;
  const snapshots = useMemo(() => buildRun(input), [input]);
  const snapshot = snapshots[Math.min(step, snapshots.length - 1)];
  const halted = snapshot.state === "q3";
  const executionRead = snapshot.tape[snapshot.head] ?? BLANK;
  const executionRule = halted
    ? undefined
    : transitions[`${snapshot.state},${executionRead}`];
  const activeKey = executionRule ? `${snapshot.state},${executionRead}` : "";
  const result = halted
    ? snapshot.tape.filter((symbol) => symbol === "1").join("")
    : `${"1".repeat((Number(first) || 0) + (Number(second) || 0))}`;
  const canRun = Number(first) > 0 && Number(second) > 0;

  const reset = () => {
    setStep(0);
    setRunning(false);
  };
  const makeStep = () =>
    setStep((current) => Math.min(current + 1, snapshots.length - 1));
  const run = () => {
    if (!canRun) return;
    setRunning(true);
    setStep(0);
    let current = 0;
    const timer = window.setInterval(() => {
      current += 1;
      setStep(current);
      if (current >= snapshots.length - 1) {
        window.clearInterval(timer);
        setRunning(false);
      }
    }, 450);
  };

  return (
    <main className="simulator-shell">
      <section className="intro">
        <div>
          <p className="eyebrow">ИНТЕРАКТИВНЫЙ СИМУЛЯТОР</p>
          <h1>
            Сложение двух чисел
            <br />
            <em>на машине Тьюринга</em>
          </h1>
          <p className="lead">
            Наблюдайте, как машина обрабатывает ленту
            <br className="desktop-only" /> посимвольно и получает результат.
          </p>
        </div>
        <div className="intro-code">
          <span>01</span>
          <span>10</span>
          <span>11</span>
          <span>_</span>
          <span>01</span>
        </div>
      </section>

      <section className="workspace">
        <aside className="control-panel panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">ШАГ 01</p>
              <h2>Входные данные</h2>
            </div>
            <span className="step-count">1/4</span>
          </div>
          <p className="muted">Введите два положительных числа.</p>
          <div className="number-fields">
            <label>
              <span>ЧИСЛО A</span>
              <input
                type="number"
                min={1}
                max={7}
                value={first}
                onChange={(e) => {
                  setFirst(e.target.value);
                  reset();
                }}
              />
            </label>
            <div className="plus">+</div>
            <label>
              <span>ЧИСЛО B</span>
              <input
                type="number"
                min={1}
                max={7}
                value={second}
                onChange={(e) => {
                  setSecond(e.target.value);
                  reset();
                }}
              />
            </label>
          </div>
          <div className="encoding">
            <span>КОДИРОВКА</span>
            <strong>Унарная</strong>
            <code>
              1<small>n</small>
            </code>
          </div>
          <div className="encoded-preview">
            <div className="preview-sum">
              <span>ЛЕНТА НА ВХОДЕ</span>
              <code>{input}</code>
            </div>
            <span className="preview-arrow">→</span>
            <div className="preview-sum">
              <span>ОЖИДАЕМЫЙ РЕЗУЛЬТАТ</span>
              <strong>{Number(first || 0) + Number(second || 0)}</strong>
            </div>
          </div>
          <Button
            className="run-button"
            onClick={run}
            disabled={running || !canRun}
          >
            <Play data-icon="inline-start" />{" "}
            {running ? "Выполнение..." : "Запустить симуляцию"}
          </Button>
          <button
            className="reset-button"
            onClick={reset}
            disabled={running || !canRun}
          >
            <RotateCcw /> Сбросить
          </button>
          <div className="tip">
            <Zap />
            <p>
              <b>Подсказка</b>
              <br />
              Используйте кнопку перехода на рабочей ленте, чтобы изучить каждый
              шаг отдельно.
            </p>
          </div>
        </aside>

        <div className="simulation-column">
          <div className="panel tape-panel">
            <div className="section-heading">
              <div>
                <p className="eyebrow">ШАГ 02 · СИМУЛЯЦИЯ</p>
                <h2>Рабочая лента</h2>
              </div>
              <div className="machine-state">
                <span>СОСТОЯНИЕ</span>
                <b>{snapshot.state}</b>
              </div>
            </div>
            <Tape snapshot={snapshot} active />
            <div className="transport">
              <div className="tape_buttons">
                <Button
                  className="step-button"
                  onClick={makeStep}
                  disabled={step >= snapshots.length - 1 || running}
                  aria-label="Выполнить один переход"
                >
                  <Play />
                </Button>
                <button
                  className="reset-button"
                  onClick={reset}
                  disabled={running || !canRun}
                >
                  <RotateCcw />
                </button>
              </div>

              <div className="progress">
                <div>
                  <span>ПРОГРЕСС</span>
                  <b>
                    {String(step).padStart(2, "0")} /{" "}
                    {String(snapshots.length - 1).padStart(2, "0")}
                  </b>
                </div>
                <div className="progress-track">
                  <i
                    style={{
                      width: `${(step / Math.max(1, snapshots.length - 1)) * 100}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="panel rules-panel">
            <div className="section-heading">
              <div>
                <p className="eyebrow">ШАГ 03 · ЛОГИКА</p>
                <h2>Правила переходов</h2>
              </div>
              <div className="view-toggle">
                <button
                  className={view === "table" ? "selected" : ""}
                  onClick={() => setView("table")}
                >
                  <Table2 /> Таблица
                </button>
                <button
                  className={view === "graph" ? "selected" : ""}
                  onClick={() => setView("graph")}
                >
                  <GitBranch /> Граф
                </button>
              </div>
            </div>
            {view === "table" ? (
              <div className="rules-table">
                <div className="rule-header">
                  <span>ТЕКУЩЕЕ СОСТ.</span>
                  <span>СЧИТ. СИМВ.</span>
                  <span>НОВОЕ СОСТ.</span>
                  <span>ЗАПИС. СИМВ.</span>
                  <span>СДВИГ</span>
                  <span>ОПИСАНИЕ ШАГА</span>
                </div>
                <RuleRow
                  from="q₀"
                  symbol="1"
                  rule={transitions["q0,1"]}
                  description="Сканирование и проход единиц первого числа (x)"
                  active={activeKey === "q0,1"}
                />
                <RuleRow
                  from="q₀"
                  symbol="0"
                  rule={transitions["q0,0"]}
                  description="Замена разделительного символа '0' на '1'"
                  active={activeKey === "q0,0"}
                />
                <RuleRow
                  from="q₁"
                  symbol="1"
                  rule={transitions["q1,1"]}
                  description="Сканирование и проход единиц второго числа (y)"
                  active={activeKey === "q1,1"}
                />
                <RuleRow
                  from="q₁"
                  symbol="0"
                  rule={transitions["q1,0"]}
                  description="Обнаружение правого края цепочки, разворот"
                  active={activeKey === "q1,0"}
                />
                <RuleRow
                  from="q₂"
                  symbol="1"
                  rule={transitions["q2,1"]}
                  description="Стирание первой лишней единицы и остановка"
                  active={activeKey === "q2,1"}
                />
              </div>
            ) : (
              <div className="graph-view">
                <div className="graph-flow">
                  <div
                    className={`graph-step ${activeKey === "q0,1" || activeKey === "q0,0" ? "graph-step-active" : ""}`}
                  >
                    <div
                      className={`graph-node ${snapshot.state === "q0" ? "graph-node-active" : ""}`}
                    >
                      <b>q₀</b>
                    </div>
                    <p>
                      Начало: проход единиц первого числа и замена разделителя
                    </p>
                  </div>
                  <div
                    className={`graph-connector ${activeKey === "q0,0" ? "graph-connector-active" : ""}`}
                  >
                    <span>
                      0 → 1, вправо
                      <br />
                      <small>замена разделителя</small>
                    </span>
                    <i>→</i>
                  </div>
                  <div
                    className={`graph-connector ${activeKey === "q0,1" ? "graph-connector-active" : ""}`}
                  >
                    <span>
                      1 → 1, вправо
                      <br />
                      <small>проход единицы</small>
                    </span>
                    <i>→</i>
                  </div>
                  <div
                    className={`graph-step ${activeKey === "q1,1" || activeKey === "q1,0" ? "graph-step-active" : ""}`}
                  >
                    <div
                      className={`graph-node ${snapshot.state === "q1" ? "graph-node-active" : ""}`}
                    >
                      <b>q₁</b>
                    </div>
                    <p>Проход единиц второго числа до правого края цепочки</p>
                  </div>
                  <div className="graph-connector">
                    <span>0 → 0, влево</span>
                    <i>→</i>
                  </div>
                  <div
                    className={`graph-step ${activeKey === "q2,1" ? "graph-step-active" : ""}`}
                  >
                    <div
                      className={`graph-node ${snapshot.state === "q2" ? "graph-node-active" : ""}`}
                    >
                      <b>q₂</b>
                    </div>
                    <p>Стирание последней лишней единицы</p>
                  </div>
                  <div className="graph-connector">
                    <span>1 → 0, влево</span>
                    <i>→</i>
                  </div>
                  <div
                    className={`graph-step graph-halt ${snapshot.state === "q3" ? "graph-step-active" : ""}`}
                  >
                    <div
                      className={`graph-node ${snapshot.state === "q3" ? "graph-node-active" : ""}`}
                    >
                      <b>HALT</b>
                    </div>
                    <p>Остановка: результат готов</p>
                  </div>
                </div>
              </div>
            )}
            {showExplanation && (
              <div className="explanation">
                <Info />
                <div>
                  <b>Текущее правило перехода</b>
                  <code>
                    {snapshot.rule
                      ? `Состояние ${snapshot.fromState ?? "q₀"} · прочитан символ «${snapshot.read ?? "_"}» → записать «${snapshot.rule[0]}» · ${snapshot.rule[1] === "R" ? "сдвиг вправо" : snapshot.rule[1] === "L" ? "сдвиг влево" : "без сдвига"} · новое состояние ${snapshot.rule[2]}`
                      : "Переход ещё не выполнен"}
                  </code>
                  <p>
                    {snapshot.action ||
                      "Нажмите кнопку с треугольником, чтобы выполнить один переход машины."}
                  </p>
                </div>
                <button
                  onClick={() => setShowExplanation(false)}
                  aria-label="Скрыть объяснение"
                >
                  <ChevronDown />
                </button>
              </div>
            )}
          </div>
        </div>

        <aside className="result-panel panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">ШАГ 04 · РЕЗУЛЬТАТ</p>
              <h2>Готово</h2>
            </div>
            <span className="check">✓</span>
          </div>
          <div className="result-number">{halted ? result : "—"}</div>
          <p className="result-label">
            СУММА В ДЕСЯТИЧНОЙ СИСТЕМЕ {halted && `: ${result.length}`}
          </p>
          <div className="result-details">
            <div>
              <span>A + B</span>
              <b>
                {first} + {second}
              </b>
            </div>
            <div>
              <span>ШАГОВ</span>
              <b>
                {step >= snapshots.length - 1 ? snapshots.length - 1 : step}
              </b>
            </div>
            <div>
              <span>СОСТОЯНИЕ</span>
              <b className="green">
                {snapshot.state === "qH" ? "qH · HALT" : snapshot.state}
              </b>
            </div>
          </div>
          <div className="result-tape">
            <span>РЕЗУЛЬТАТ НА ЛЕНТЕ</span>
            <code>{halted ? result : "—"}</code>
          </div>
          <div className="completion">
            <div className="completion-icon">✓</div>
            <p>
              <b>Машина остановлена</b>
              <br />
              Результат успешно декодирован.
            </p>
          </div>
        </aside>
      </section>
      <footer>
        <span>
          АГТУ <i>·</i> ОБРАЗОВАТЕЛЬНЫЙ ИНСТРУМЕНТ
        </span>
        <span>
          Унарное сложение <i>·</i> Машина Тьюринга
        </span>
      </footer>
    </main>
  );
}
