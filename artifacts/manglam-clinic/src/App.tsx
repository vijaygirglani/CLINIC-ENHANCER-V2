import { useEffect } from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { migrateLegacyPatientsKey, repairMalformedPatients } from "@/lib/store";
import { initTheme } from "@/lib/theme";
import { Splash } from "@/components/Splash";

import Home from "@/pages/Home";
import Reception from "@/pages/Reception";
import Display from "@/pages/Display";
import DailyRegister from "@/pages/DailyRegister";
import AyurvedicRegister from "@/pages/AyurvedicRegister";
import ComplaintCodes from "@/pages/ComplaintCodes";
import AdviceCodes from "@/pages/AdviceCodes";
import Broadcast from "@/pages/Broadcast";
import PathyaApathya from "@/pages/PathyaApathya";
import Inventory from "@/pages/Inventory";
import Expenses from "@/pages/Expenses";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { refetchOnWindowFocus: false, staleTime: 5 * 60 * 1000, retry: 1 },
  },
});

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/queue" component={Reception} />
      {/* No Layout — this one goes on a TV in the waiting room. */}
      <Route path="/display" component={Display} />
      <Route path="/daily-register" component={DailyRegister} />
      <Route path="/ayurvedic-register" component={AyurvedicRegister} />
      <Route path="/complaint-codes" component={ComplaintCodes} />
      <Route path="/advice-codes" component={AdviceCodes} />
      <Route path="/broadcast" component={Broadcast} />
      <Route path="/pathya-apathya" component={PathyaApathya} />
      <Route path="/inventory" component={Inventory} />
      <Route path="/expenses" component={Expenses} />
      <Route component={NotFound} />
    </Switch>
  );
}

/**
 * The waiting-room screen opens in a second window. Asking the server for
 * "/display" only works if the host is configured to send every path to
 * index.html — and when it is not, you get a 404 page on the TV.
 *
 * "/?display=1" asks for the root, which every host serves, so the window
 * can never 404: not on Vercel, not from a local build, not offline.
 * The /display route still works for anyone who types it.
 */
const wantsDisplay = (() => {
  try {
    return new URLSearchParams(window.location.search).get("display") === "1";
  } catch {
    return false;
  }
})();

function App() {
  useEffect(() => { repairMalformedPatients(); migrateLegacyPatientsKey(); }, []);
  // Theme init lives here rather than in main.tsx, so this set of files never
  // has to replace main.tsx — which on your machine also starts the offline
  // persistence layer. Nothing here runs unless a theme has been chosen.
  useEffect(() => initTheme(), []);

  // The waiting-room window, served from the root path so it cannot 404.
  if (wantsDisplay) {
    return (
      <TooltipProvider>
        <Display />
      </TooltipProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        {/* Opening animation. Not reached by the display screen above, which
            is opened once and left running on a wall. Shows once per browser
            session, skips on any key or click, silent in Lite mode. */}
        <Splash />
        <WouterRouter base="">
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
