import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./index.css";
import HomePage from "./pages/Homepage";
import Poll from "./pages/Poll";

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage/>}/>
        <Route path="/poll/:token" element={<Poll/>}/>
        <Route path="*" element={<Navigate to="/" replace/>}/>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
