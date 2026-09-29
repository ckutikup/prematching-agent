import { Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { Home } from "./pages/Home";
import { Intake } from "./pages/Intake";
import { Matches } from "./pages/Matches";
import { ProgramDetail } from "./pages/ProgramDetail";
import { Saved } from "./pages/Saved";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/intake" element={<Intake />} />
        <Route path="/matches" element={<Matches />} />
        <Route path="/program/:slug" element={<ProgramDetail />} />
        <Route path="/saved" element={<Saved />} />
      </Route>
    </Routes>
  );
}
