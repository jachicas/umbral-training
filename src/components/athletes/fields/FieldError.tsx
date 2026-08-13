export function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="text-[12.5px] font-medium" style={{ color: "var(--danger)" }}>
      {message}
    </p>
  );
}
