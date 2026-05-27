import React from "react";
import { useLocation } from 'wouter';
import { Home } from 'lucide-react';

export default function NotFound() {
  const [, setLocation] = useLocation();

  return (
    React.createElement('div', { className: "min-h-screen bg-background flex items-center justify-center px-4"     ,}
      , React.createElement('div', { className: "text-center",}
        , React.createElement('h1', { className: "text-6xl font-bold text-primary mb-4"   ,}, "404")
        , React.createElement('h2', { className: "text-3xl font-bold mb-2"  ,}, "Page Not Found"  )
        , React.createElement('p', { className: "text-muted-foreground mb-8" ,}, "Sorry, the page you are looking for does not exist."         )
        , React.createElement('button', {
          onClick: () => setLocation('/'),
          className: "px-6 py-3 bg-primary text-primary-foreground rounded-lg font-bold hover:bg-primary/90 transition-colors flex items-center justify-center space-x-2 mx-auto"            ,}

          , React.createElement(Home, { size: 20,} )
          , React.createElement('span', null, "Back to Home"  )
        )
      )
    )
  );
}
