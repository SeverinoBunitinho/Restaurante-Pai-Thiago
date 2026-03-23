"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, Sparkles, X } from "lucide-react";
import { startTransition, useEffect, useMemo, useRef, useState } from "react";

function groupResults(items) {
  const groups = new Map();

  for (const item of items) {
    const groupName = item.group || "Resultados";
    const currentItems = groups.get(groupName) ?? [];
    currentItems.push(item);
    groups.set(groupName, currentItems);
  }

  return Array.from(groups.entries());
}

export function HeaderSearch({ staffSession = false }) {
  const pathname = usePathname();
  const panelRef = useRef(null);
  const inputRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const pointerHandler = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    const escapeHandler = (event) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("pointerdown", pointerHandler);
    document.addEventListener("keydown", escapeHandler);

    return () => {
      document.removeEventListener("pointerdown", pointerHandler);
      document.removeEventListener("keydown", escapeHandler);
    };
  }, [open]);

  useEffect(() => {
    const shortcutHandler = (event) => {
      const key = event.key.toLowerCase();

      if ((event.metaKey || event.ctrlKey) && key === "k") {
        event.preventDefault();
        setOpen(true);
        startTransition(() => {
          inputRef.current?.focus();
        });
      }
    };

    document.addEventListener("keydown", shortcutHandler);

    return () => {
      document.removeEventListener("keydown", shortcutHandler);
    };
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const abortController = new AbortController();
    const debounce = setTimeout(async () => {
      setLoading(true);
      setErrorMessage("");

      try {
        const searchParams = new URLSearchParams();

        if (query.trim()) {
          searchParams.set("q", query.trim());
        }

        searchParams.set("limit", "14");

        const response = await fetch(`/api/search?${searchParams.toString()}`, {
          method: "GET",
          signal: abortController.signal,
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Nao foi possivel carregar os resultados.");
        }

        const payload = await response.json();
        setResults(Array.isArray(payload?.items) ? payload.items : []);
      } catch (error) {
        if (error.name === "AbortError") {
          return;
        }

        setResults([]);
        setErrorMessage("Busca indisponivel no momento. Tente novamente.");
      } finally {
        setLoading(false);
      }
    }, 180);

    return () => {
      clearTimeout(debounce);
      abortController.abort();
    };
  }, [open, query, pathname]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 0);

    return () => {
      clearTimeout(timer);
    };
  }, [open]);

  const groupedResults = useMemo(() => groupResults(results), [results]);

  return (
    <div className="header-search" ref={panelRef}>
      <button
        type="button"
        className={`header-search-trigger ${open ? "header-search-trigger-active" : ""}`}
        onClick={() => setOpen((currentValue) => !currentValue)}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label="Abrir busca global"
      >
        <Search size={16} />
        <span className="header-search-trigger-text">Pesquisar</span>
        <span className="header-search-trigger-shortcut">Ctrl+K</span>
      </button>

      {open ? (
        <div className="header-search-panel" role="dialog" aria-label="Busca global do site">
          <div className="header-search-input-shell">
            <Search size={16} />
            <input
              ref={inputRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={
                staffSession
                  ? "Buscar modulo, prato, mesa, pedido ou reserva"
                  : "Buscar pagina, prato, pedido ou reserva"
              }
              className="header-search-input"
            />
            <button
              type="button"
              className="header-search-clear"
              onClick={() => setQuery("")}
              aria-label="Limpar pesquisa"
            >
              <X size={14} />
            </button>
          </div>

          <div className="header-search-meta">
            <span className="header-search-meta-pill">
              <Sparkles size={12} />
              Busca inteligente por perfil
            </span>
            <span className="header-search-meta-info">
              {loading ? "Carregando..." : `${results.length} resultado(s)`}
            </span>
          </div>

          <div className="header-search-feed">
            {errorMessage ? (
              <p className="header-search-empty">{errorMessage}</p>
            ) : null}

            {!errorMessage && !loading && !results.length ? (
              <p className="header-search-empty">
                Nenhum resultado encontrado. Tente outro termo.
              </p>
            ) : null}

            {!errorMessage && groupedResults.length
              ? groupedResults.map(([groupName, groupItems]) => (
                  <section key={groupName} className="header-search-group">
                    <p className="header-search-group-title">{groupName}</p>
                    <div className="header-search-group-list">
                      {groupItems.map((item) => (
                        <Link
                          key={item.id}
                          href={item.href}
                          className="header-search-item"
                          onClick={() => setOpen(false)}
                        >
                          <div className="header-search-item-copy">
                            <p className="header-search-item-title">{item.title}</p>
                            <p className="header-search-item-description">
                              {item.description}
                            </p>
                          </div>
                          <span className="header-search-item-action">Abrir</span>
                        </Link>
                      ))}
                    </div>
                  </section>
                ))
              : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
