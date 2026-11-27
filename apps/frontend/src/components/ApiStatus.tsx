import { useEffect, useState } from "react";
import { API_BASE_URL, getApiStatus, onApiStatus } from "../services/api";

export function ApiStatus() {
  const [s, setS] = useState<boolean | null>(null);
  useEffect(() => {
    setS(getApiStatus());
    return onApiStatus(setS);
  }, []);
  if (s === null) return null;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
        s ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
      }`}
      title={API_BASE_URL}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${s ? "bg-emerald-600" : "bg-amber-500"}`} />
      {s ? "API conectada" : "API offline · dados de demonstração"}
    </span>
  );
}