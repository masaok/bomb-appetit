"use client";

import { MODULES, NEEDY_MODULE_IDS, REGULAR_MODULE_IDS, type ModuleId } from "@bombappetit/engine";
import { ModuleIcon } from "@/components/module-icons";
import { suggestedTimeMs, type FreeplayConfig } from "@/lib/freeplay";

const field = "sticker rounded-xl bg-card px-3 py-2 font-bold tabular-nums";

/** The freeplay settings, shared by the solo setup page and the room lobby. */
export function FreeplayFields({
  config,
  onChange,
  disabled = false,
}: {
  config: FreeplayConfig;
  onChange: (config: FreeplayConfig) => void;
  disabled?: boolean;
}) {
  const set = (patch: Partial<FreeplayConfig>) => onChange({ ...config, ...patch });
  const togglePool = (id: ModuleId) => {
    const pool = config.modulePool.includes(id)
      ? config.modulePool.filter((m) => m !== id)
      : [...config.modulePool, id];
    if (pool.length > 0) set({ modulePool: REGULAR_MODULE_IDS.filter((m) => pool.includes(m)) });
  };

  return (
    <fieldset disabled={disabled} className="grid gap-5 disabled:opacity-70">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <label className="grid gap-1">
          <span className="text-sm font-bold">Modules</span>
          <input
            type="number"
            min={1}
            max={11}
            value={config.moduleCount}
            onChange={(e) => {
              const moduleCount = Math.min(11, Math.max(1, Number(e.target.value) || 1));
              set({ moduleCount, timeLimitMs: suggestedTimeMs(moduleCount) });
            }}
            className={field}
          />
        </label>
        <label className="grid gap-1">
          <span className="text-sm font-bold">Minutes</span>
          <input
            type="number"
            min={1}
            max={60}
            value={Math.round(config.timeLimitMs / 60_000)}
            onChange={(e) =>
              set({ timeLimitMs: Math.min(60, Math.max(1, Number(e.target.value) || 1)) * 60_000 })
            }
            className={field}
          />
        </label>
        <label className="grid gap-1">
          <span className="text-sm font-bold">Strikes allowed</span>
          <select
            value={config.strikeLimit}
            onChange={(e) => set({ strikeLimit: Number(e.target.value) })}
            className={field}
          >
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>
                {n === 1 ? "1 (no mistakes)" : n}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1">
          <span className="text-sm font-bold">Needy modules</span>
          <select
            value={config.needyCount}
            onChange={(e) => set({ needyCount: Number(e.target.value) })}
            className={field}
          >
            {[0, 1, 2, 3].map((n) => (
              <option key={n} value={n}>
                {n === 0 ? "None" : n}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div>
        <p className="text-sm font-bold">Modules in the mix</p>
        <ul className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {REGULAR_MODULE_IDS.map((id) => (
            <li key={id}>
              <label className="sticker flex cursor-pointer items-center gap-3 rounded-xl bg-card px-3 py-2 has-checked:bg-sun has-checked:text-night">
                <input
                  type="checkbox"
                  checked={config.modulePool.includes(id)}
                  onChange={() => togglePool(id)}
                  className="size-4 accent-[#221a38]"
                />
                <ModuleIcon id={id} className="size-7" />
                <span className="font-bold">{MODULES[id].name}</span>
              </label>
            </li>
          ))}
        </ul>
        {config.needyCount > 0 && (
          <p className="mt-2 text-sm text-muted">
            Needy modules are drawn from {NEEDY_MODULE_IDS.map((id) => MODULES[id].name).join(", ")}.
          </p>
        )}
      </div>

      <label className="grid max-w-xs gap-1">
        <span className="text-sm font-bold">Manual (rule seed)</span>
        <input
          type="number"
          min={1}
          max={999999}
          value={config.ruleSeed}
          onChange={(e) =>
            set({ ruleSeed: Math.min(999_999, Math.max(1, Math.floor(Number(e.target.value)) || 1)) })
          }
          className={field}
        />
        <span className="text-sm text-muted">
          1 is the standard manual. Any other number is a whole new manual.
        </span>
      </label>
    </fieldset>
  );
}
