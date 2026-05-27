import React from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { Streamdown } from 'streamdown';

/**
 * All content in this page are only for example, replace with your own feature implementation
 * When building pages, remember your instructions in Frontend Best Practices, Design Guide and Common Pitfalls
 */
export default function Home() {
  // If theme is switchable in App.tsx, we can implement theme toggling like this:
  // const { theme, toggleTheme } = useTheme();

  return (
    React.createElement('div', { className: "min-h-screen flex flex-col"  ,}
      , React.createElement('main', null
        /* Example: lucide-react for icons */
        , React.createElement(Loader2, { className: "animate-spin",} ), "Example Page"

        /* Example: Streamdown for markdown rendering */
        , React.createElement(Streamdown, null, "Any **markdown** content"  )
        , React.createElement(Button, { variant: "default",}, "Example Button" )
      )
    )
  );
}
