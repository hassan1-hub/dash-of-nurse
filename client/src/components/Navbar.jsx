import React, { useState } from 'react';
import { Link } from 'wouter';
import { Settings, Menu, X, Bell, Search, User } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  return (
    React.createElement('nav', { className: "sticky top-0 z-40 border-b border-border bg-background/95 text-foreground shadow-sm backdrop-blur-xl"  ,}
      , React.createElement('div', { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"    ,}
        , React.createElement('div', { className: "flex flex-wrap items-center justify-between gap-3 py-3 md:py-4"   ,}
          /* Logo */
          , React.createElement(Link, { href: "/",}
            , React.createElement('div', { className: "flex items-center gap-2 rounded-2xl border border-border bg-secondary px-3 py-2 text-sm font-semibold text-primary shadow-sm transition hover:border-primary/80 hover:bg-primary/5 cursor-pointer"     ,}
              , React.createElement('span', { className: "text-base font-bold text-blue-600"   ,}, "iSHMS")
            )
          )

          /* Search and links */
          , React.createElement('div', { className: "hidden md:flex min-w-[360px] flex-1 items-center gap-3"   ,}
            , React.createElement('label', { className: "relative flex-1"  ,}
              , React.createElement(Search, { className: "pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" ,} )
              , React.createElement('input', {
                type: "search",
                placeholder: "Search patients, beds, or alerts",
                className: "w-full rounded-2xl border border-border bg-background px-12 py-2 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20",
              })
            )
            , React.createElement(Link, { href: "/alerts",}
              , React.createElement('div', { className: "flex items-center gap-2 rounded-2xl border border-border bg-secondary px-4 py-2 text-sm font-medium text-foreground transition hover:border-primary/80 hover:bg-primary/5 cursor-pointer"     ,}
                , React.createElement(Bell, { size: 18,} )
                , React.createElement('span', null, "Alerts")
              )
            )
          )

          /* Actions */
          , React.createElement('div', { className: "flex items-center gap-2"   ,}
            , React.createElement(Button, {
              variant: "outline",
              onClick: toggleTheme,
              className: "hidden sm:inline-flex gap-2 rounded-2xl px-3 py-2 text-sm",
            }
              , theme === 'light' ? '🌙 Dark' : '☀️ Light'
            )
            , React.createElement('button', { className: "hidden sm:inline-flex items-center rounded-2xl border border-border bg-secondary px-3 py-2 text-muted-foreground transition hover:bg-secondary/80"    ,}
              , React.createElement(User, { size: 18,} )
              , React.createElement('span', { className: "ml-2 text-sm font-medium" ,}, "Nurse")
            )
            , React.createElement('button', { onClick: () => setIsOpen(!isOpen), className: "inline-flex md:hidden items-center justify-center rounded-2xl border border-border bg-secondary p-2 text-foreground transition hover:bg-secondary/80"    ,}
              , isOpen ? React.createElement(X, { size: 22,} ) : React.createElement(Menu, { size: 22,} )
            )
          )
        )

        /* Mobile Navigation */
        , isOpen && (
          React.createElement('div', { className: "md:hidden space-y-3 rounded-3xl border border-border bg-secondary p-4 shadow-sm"  ,}
            , React.createElement('label', { className: "relative block"  ,}
              , React.createElement(Search, { className: "pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" ,} )
              , React.createElement('input', {
                type: "search",
                placeholder: "Search patients, beds, or alerts",
                className: "w-full rounded-2xl border border-border bg-background px-12 py-2 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20",
              })
            )
            , React.createElement(Link, { href: "/alerts",}
              , React.createElement('div', { className: "flex items-center gap-2 rounded-2xl border border-border bg-background px-4 py-3 text-sm font-medium text-foreground transition hover:border-primary/80 hover:bg-primary/5 cursor-pointer"        ,}
                , React.createElement(Bell, { size: 18,} )
                , React.createElement('span', null, "Alerts")
              )
            )
            , React.createElement('button', { onClick: () => setSettingsOpen(true), className: "flex w-full items-center gap-2 rounded-2xl border border-border bg-background px-4 py-3 text-sm font-medium text-foreground transition hover:border-primary/80 hover:bg-primary/5"        ,}
              , React.createElement(Settings, { size: 18,} )
              , React.createElement('span', null, "Settings")
            )
          )
        )
      )

      /* Settings Dialog */
      , React.createElement(Dialog, { open: settingsOpen, onOpenChange: setSettingsOpen,}
        , React.createElement(DialogContent, null
          , React.createElement(DialogHeader, null
            , React.createElement(DialogTitle, null, "Settings")
          )
          , React.createElement('div', { className: "space-y-4",}
            , React.createElement('div', { className: "flex items-center justify-between"  ,}
              , React.createElement('label', { className: "text-sm font-medium" ,}, "Theme")
              , React.createElement(Button, {
                variant: "outline",
                onClick: toggleTheme,
                className: "gap-2",}

                , theme === 'light' ? '🌙 Dark Mode' : '☀️ Light Mode'
              )
            )
            , React.createElement('div', { className: "text-sm text-muted-foreground" ,}
              , React.createElement('p', null, "Current Theme: "  , React.createElement('span', { className: "font-semibold capitalize" ,}, theme))
            )
          )
        )
      )
    )
  );
}
