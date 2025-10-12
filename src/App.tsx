// App.tsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Game from "./game/game";
import MainScreen from "./main/main_screen";

function App() {
  return (
    <BrowserRouter basename={process.env.PUBLIC_URL}>
      <Routes>
        <Route path="/" element={<MainScreen />} />
        <Route path="/game" element={<Game />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
