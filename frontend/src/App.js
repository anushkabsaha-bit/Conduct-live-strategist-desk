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

export default function App() {
  return (
    <PostsProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Shell />}>
            <Route path="/" element={<DailyDesk />} />
            <Route path="/content" element={<ContentDesk />} />
            <Route path="/stories" element={<Stories />} />
            <Route path="/campaigns" element={<Campaigns />} />
            <Route path="/radar" element={<Radar />} />
            <Route path="/agents" element={<AgentRoom />} />
            <Route path="/library" element={<Library />} />
          </Route>
        </Routes>
      </BrowserRouter>
      <Toaster position="bottom-right" toastOptions={{ className: "!rounded-none !font-mono !bg-chocolate !text-linen !border-tangelo" }} />
    </PostsProvider>
  );
}
