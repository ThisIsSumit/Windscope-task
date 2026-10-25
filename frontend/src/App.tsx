import { BrowserRouter, Routes, Route } from "react-router-dom";
import { MotionConfig } from "framer-motion";
import { LandingPage, NotFound } from "./Landing";
import AppShell from "./app/AppShell"; import Overview from "./app/Overview"; import Analysis from "./app/Analysis"; import Replay from "./app/Replay";
export default function App() {
  return <BrowserRouter><MotionConfig reducedMotion="user"><Routes>
    <Route path="/" element={<LandingPage />} />
    <Route path="/app" element={<AppShell />}><Route index element={<Overview />} /><Route path="analysis" element={<Analysis />} /><Route path="replay" element={<Replay />} /></Route>
    <Route path="*" element={<NotFound />} /></Routes></MotionConfig></BrowserRouter>;
}
