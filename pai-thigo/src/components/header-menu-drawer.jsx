"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronRight, Menu, X } from "lucide-react";

import { ActiveLink } from "@/components/active-link";
import { NotificationCountBadge } from "@/components/notification-count-badge";

export function HeaderMenuDrawer({ items = [] }) {
  const rootRef = useRef(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const pointerHandler = (event) => {
      if (rootRef.current && !rootRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    const keyHandler = (event) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("pointerdown", pointerHandler);
    document.addEventListener("keydown", keyHandler);

    return () => {
      document.removeEventListener("pointerdown", pointerHandler);
      document.removeEventListener("keydown", keyHandler);
    };
  }, [open]);

  return (
    <div className="header-menu-drawer" ref={rootRef}>
      <button
        type="button"
        className={`header-menu-trigger ${open ? "header-menu-trigger-active" : ""}`}
        onClick={() => setOpen((currentValue) => !currentValue)}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label="Abrir menu de navegacao"
      >
        <Menu size={17} />
        <span>Menu</span>
      </button>

      {open ? (
        <div className="header-menu-panel" role="dialog" aria-label="Menu da equipe">
          <div className="header-menu-panel-head">
            <p className="header-menu-panel-title">Abas principais</p>
            <button
              type="button"
              className="header-menu-panel-close"
              onClick={() => setOpen(false)}
              aria-label="Fechar menu"
            >
              <X size={14} />
            </button>
          </div>

          <div className="header-menu-list">
            {items.map((item) => (
              <ActiveLink
                key={item.href}
                href={item.href}
                exact={item.exact}
                className="header-menu-item"
                activeClassName="header-menu-item-active"
                onClick={() => setOpen(false)}
              >
                <span className="header-menu-item-copy">
                  <span className="header-menu-item-label">{item.label}</span>
                  {item.badgeCount && item.badgeKind ? (
                    <NotificationCountBadge
                      count={item.badgeCount}
                      latestAt={item.badgeLatestAt}
                      kind={item.badgeKind}
                      staffSession
                      className="header-menu-item-badge"
                      ariaLabel={`${item.badgeCount} notificacoes`}
                    />
                  ) : null}
                </span>
                <ChevronRight size={15} />
              </ActiveLink>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

