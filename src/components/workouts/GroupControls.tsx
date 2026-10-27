"use client";

import { useState, useTransition } from "react";
import { Check, Pencil, Plus, Trash2, X } from "lucide-react";
import { createGroupAction, deleteGroupAction, renameGroupAction } from "@/app/workouts/actions";

const inputClass = "h-9 min-w-0 flex-1 rounded-[9px] border px-2.5 text-[13px] font-semibold outline-none";
const inputStyle = { background: "var(--surface-2)", borderColor: "var(--border)", color: "var(--text)" };
const iconButton =
  "flex size-8 flex-none items-center justify-center rounded-[8px] transition-[filter] hover:brightness-125 disabled:opacity-50";

function ErrorText({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <span className="text-[11.5px] font-semibold" style={{ color: "var(--danger)" }}>
      {message}
    </span>
  );
}

/** "Nuevo grupo": a name and a button; the API rejects a name the coach already uses. */
export function NewGroupForm() {
  const [name, setName] = useState("");
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="flex flex-col items-end gap-1"
      onSubmit={(e) => {
        e.preventDefault();
        startTransition(async () => {
          const result = await createGroupAction(name);
          setError(result.error);
          if (!result.error) setName("");
        });
      }}
    >
      <div className="flex items-center gap-2">
        <input
          aria-label="Nombre del nuevo grupo"
          placeholder="Nuevo grupo"
          value={name}
          maxLength={80}
          onChange={(e) => setName(e.target.value)}
          className={`${inputClass} w-[200px]`}
          style={inputStyle}
        />
        <button
          type="submit"
          disabled={pending || !name.trim()}
          className="flex h-9 items-center gap-1.5 rounded-[10px] px-3.5 text-[13px] font-bold text-[var(--on-coral)] shadow-[var(--shadow)] transition-[filter] hover:brightness-110 disabled:opacity-60"
          style={{ background: "var(--coral)" }}
        >
          <Plus size={14} /> Crear
        </button>
      </div>
      <ErrorText message={error} />
    </form>
  );
}

/** A group's name, with rename and delete. Deleting leaves its athletes without a group. */
export function GroupTitle({ groupId, name, memberCount }: { groupId: string; name: string; memberCount: number }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(name);
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  const run = (action: () => Promise<{ error?: string }>, onSuccess?: () => void) =>
    startTransition(async () => {
      const result = await action();
      setError(result.error);
      if (!result.error) onSuccess?.();
    });

  if (editing) {
    return (
      <form
        className="flex flex-col gap-1"
        onSubmit={(e) => {
          e.preventDefault();
          run(() => renameGroupAction(groupId, draft), () => setEditing(false));
        }}
      >
        <div className="flex items-center gap-1.5">
          <input
            aria-label="Nombre del grupo"
            autoFocus
            value={draft}
            maxLength={80}
            onChange={(e) => setDraft(e.target.value)}
            className={inputClass}
            style={inputStyle}
          />
          <button type="submit" aria-label="Guardar nombre" disabled={pending || !draft.trim()} className={iconButton} style={{ color: "var(--ok)" }}>
            <Check size={16} />
          </button>
          <button
            type="button"
            aria-label="Cancelar"
            onClick={() => {
              setDraft(name);
              setError(undefined);
              setEditing(false);
            }}
            className={iconButton}
            style={{ color: "var(--text-2)" }}
          >
            <X size={16} />
          </button>
        </div>
        <ErrorText message={error} />
      </form>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1">
        <div className="min-w-0 flex-1 truncate text-[15px] font-bold">{name}</div>
        <button
          type="button"
          aria-label={`Renombrar ${name}`}
          title="Renombrar"
          onClick={() => setEditing(true)}
          className={iconButton}
          style={{ color: "var(--text-3)" }}
        >
          <Pencil size={14} />
        </button>
        <button
          type="button"
          aria-label={`Borrar ${name}`}
          title="Borrar grupo"
          disabled={pending}
          onClick={() => {
            const who = memberCount > 0 ? ` Sus ${memberCount} atletas quedarán sin grupo.` : "";
            if (window.confirm(`¿Borrar el grupo «${name}»?${who}`)) run(() => deleteGroupAction(groupId));
          }}
          className={iconButton}
          style={{ color: "var(--text-3)" }}
        >
          <Trash2 size={14} />
        </button>
      </div>
      <ErrorText message={error} />
    </div>
  );
}
