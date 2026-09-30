import { useEffect, useState } from "react";

const KEY = "actes-corporate-mode";
const EVENT = "actes-corporate-change";

function apply(on: boolean) {
  document.documentElement.classList.toggle("corporate", on);
}

export function useCorporateMode() {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const read = () => {
      const v = localStorage.getItem(KEY) === "1";
      setOn(v);
      apply(v);
    };
    read();
    window.addEventListener(EVENT, read);
    return () => window.removeEventListener(EVENT, read);
  }, []);
  const toggle = () => {
    const next = !on;
    localStorage.setItem(KEY, next ? "1" : "0");
    apply(next);
    window.dispatchEvent(new Event(EVENT));
  };
  return [on, toggle] as const;
}
