import React from "react";
import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "./components/ui/sonner";
import Shell from "./components/Shell";
import { PostsProvider } from "./components/Output";
import DailyDesk from "./pages/DailyDesk";
import ContentDesk from "./pages/ContentDesk";
import Stories from "./pages/Stories";
import Campaigns from "./pages/Campaigns";
import Radar from "./pages/Radar";
import AgentRoom from "./pages/AgentRoom";
import Library from "./pages/Library";
import Home from "./pages/Home";
import Writing from "./pages/strategy/Writing";
import FilmPage from "./pages/strategy/Film";
import BriefPage from "./pages/strategy/Brief";
import StrategyOverview from "./pages/strategy/Overview";
import NarrativePage from "./pages/strategy/Narrative";
import MeasurePage from "./pages/strategy/Measure";
import ScorePage from "./pages/strategy/Score";
import { NarrativeRoom, FounderRoom, LaunchRoom, PeopleRoom, MediaRoom, ImpactRoom } from "./pages/Rooms";

export default function App() {
  return (
    <PostsProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Shell />}>
            <Route path="/" element={<Home />} />
            <Route path="/desk" element={<DailyDesk />} />
            <Route path="/writing" element={<Writing />} />
            <Route path="/strategy/film" element={<FilmPage />} />
            <Route path="/strategy/brief" element={<BriefPage />} />
            <Route path="/content" element={<ContentDesk />} />
            <Route path="/stories" element={<Stories />} />
            <Route path="/campaigns" element={<Campaigns />} />
            <Route path="/radar" element={<Radar />} />
            <Route path="/agents" element={<AgentRoom />} />
            <Route path="/library" element={<Library />} />
            <Route path="/narrative" element={<NarrativeRoom />} />
            <Route path="/founder" element={<FounderRoom />} />
            <Route path="/launch" element={<LaunchRoom />} />
            <Route path="/people" element={<PeopleRoom />} />
            <Route path="/media" element={<MediaRoom />} />
            <Route path="/impact" element={<ImpactRoom />} />
            <Route path="/strategy" element={<StrategyOverview />} />
            <Route path="/strategy/narrative" element={<NarrativePage />} />
            <Route path="/strategy/measure" element={<MeasurePage />} />
          </Route>
          <Route path="/score" element={<ScorePage />} />
        </Routes>
      </BrowserRouter>
      <Toaster position="bottom-right" toastOptions={{ className: "!rounded-none !font-mono !bg-chocolate !text-linen !border-tangelo" }} />
    </PostsProvider>
  );
}
