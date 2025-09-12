/*
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import DetailTodo from "./Routes/DetailTodo";
import Detail from "./Routes/Detail";
import Home from "./Routes/Home";
import LandingPage from "./Routes/LandingPage";
import SignupPage from "./Routes/SignupPage";
import LoginPage from "./Routes/LoginPage";
import Store from "./Routes/Store";
import ProjectManage from "./Routes/ProjectManage"

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/home" element={<Home />} />
        <Route path="/store" element={<Store />} />
        <Route path="/manage" element={<ProjectManage />}/>
        <Route path="/project/:id" element={<Detail />}/>
        <Route path="/project/:id/:id2" element={<DetailTodo />}/>
      </Routes>
    </Router>
  );
}

export default App;

*/

import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import DetailTodo from "./Routes/DetailTodo";
import Detail from "./Routes/Detail";
import Home from "./Routes/Home";
import LandingPage from "./Routes/LandingPage";
import SignupPage from "./Routes/SignupPage";
import LoginPage from "./Routes/LoginPage";
import Store from "./Routes/Store";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/home" element={<Home />} />
        <Route path="/store" element={<Store />} />
        <Route path="/project/:id" element={<Detail />}/>
        <Route path="/project/:id/:id2" element={<DetailTodo />}/>
      </Routes>
    </Router>
  );
}

export default App;