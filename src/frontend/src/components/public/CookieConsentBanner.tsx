import { Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";

const STORAGE_KEY = "cookie_consent";
const EXPIRY_MS = 365 * 24 * 60 * 60 * 1000;

type ConsentChoice = "accepted" | "declined";

interface StoredConsent {
  choice: ConsentChoice;
  timestamp: number;
}

function getStoredConsent(): StoredConsent | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: StoredConsent = JSON.parse(raw);
    if (Date.now() - parsed.timestamp > EXPIRY_MS) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function saveConsent(choice: ConsentChoice) {
  const data: StoredConsent = { choice, timestamp: Date.now() };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function CookieConsentBanner() {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const bannerRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (getStoredConsent()) return;
    setMounted(true);
    const t = setTimeout(() => setVisible(true), 16);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!visible) return;
    const el = bannerRef.current?.querySelector<HTMLElement>(
      "button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])",
    );
    el?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") dismiss("declined");
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [visible]);

  function dismiss(choice: ConsentChoice) {
    saveConsent(choice);
    setVisible(false);
    setTimeout(() => setMounted(false), 320);
  }

  if (!mounted) return null;

  return (
    <dialog
      ref={bannerRef}
      aria-label="Consentimiento de cookies"
      open
      data-ocid="cookie_consent.dialog"
      className="fixed bottom-4 sm:bottom-6 left-0 right-0 mx-auto z-50 w-[90%] sm:w-auto max-w-[800px] p-0 bg-transparent border-0 outline-none"
      style={{
        transition:
          "opacity 300ms cubic-bezier(0.4, 0, 0.2, 1), transform 300ms cubic-bezier(0.4, 0, 0.2, 1)",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(20px)",
      }}
    >
      <div
        className="bg-white/95 backdrop-blur-sm rounded-xl sm:rounded-2xl border border-white/20 px-4 py-4 sm:px-6 sm:py-4"
        style={{
          boxShadow:
            "0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.02)",
        }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
          <p className="text-[15px] text-gray-700 flex-1">
            🍪 Utilizamos cookies para mejorar tu experiencia. Consulta nuestra{" "}
            <Link
              to="/privacidad"
              className="text-blue-600 font-medium hover:underline"
            >
              Política de Privacidad
            </Link>
            .
          </p>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 flex-shrink-0 w-full sm:w-auto">
            <button
              type="button"
              data-ocid="cookie_consent.cancel_button"
              onClick={() => dismiss("declined")}
              className="bg-transparent text-gray-600 border border-gray-200 hover:bg-gray-50 hover:border-gray-300 px-5 py-2 rounded-full text-[14px] font-medium transition-all duration-200 w-full sm:w-auto"
            >
              Declinar
            </button>
            <button
              type="button"
              data-ocid="cookie_consent.confirm_button"
              onClick={() => dismiss("accepted")}
              className="bg-blue-500 hover:bg-blue-600 text-white px-5 py-2 rounded-full text-[14px] font-medium transition-all duration-200 w-full sm:w-auto"
            >
              Aceptar
            </button>
          </div>
        </div>
      </div>
    </dialog>
  );
}
