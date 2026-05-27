import React from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import Dashboard from "@/pages/Dashboard";
import PatientDetails from "@/pages/PatientDetails";
import MedicationAdmin from "@/pages/MedicationAdmin";
import Alerts from "@/pages/Alerts";
import ISBARPage from "@/pages/ISBARPage";
import VitalSignsEntry from "@/pages/VitalSignsEntry";
import Navbar from "@/components/Navbar";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";

function Router() {
  return (
    React.createElement(Switch, null
      , React.createElement(Route, { path: "/", component: Dashboard,} )
      , React.createElement(Route, { path: "/alerts", component: Alerts,} )
      , React.createElement(Route, { path: "/patient/:id", component: PatientDetails,} )
      , React.createElement(Route, { path: "/patient/:id/medication/:medicationId", component: MedicationAdmin,} )
      , React.createElement(Route, { path: "/patient/:id/isbar", component: ISBARPage,} )
      , React.createElement(Route, { path: "/patient/:id/vitals", component: VitalSignsEntry,} )
      , React.createElement(Route, { path: "/404", component: NotFound,} )
      /* Final fallback route */
      , React.createElement(Route, { component: NotFound,} )
    )
  );
}

function App() {
  return (
    React.createElement(ErrorBoundary, null
      , React.createElement(ThemeProvider, { defaultTheme: "light", switchable: true,}
        , React.createElement(TooltipProvider, null
          , React.createElement(Navbar, null )
          , React.createElement(Router, null )
          , React.createElement(Toaster, null )
        )
      )
    )
  );
}

export default App;
