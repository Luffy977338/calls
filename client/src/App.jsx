import React from "react";
import { Route, Routes } from "react-router-dom";
import Room from "./components/Room";
import Main from "./components/Main";

const App = () => {
  return (
    <div>
      <Routes>
        <Route path='/' element={<Main />} />
        <Route path='/room/:id' element={<Room />} />
      </Routes>
    </div>
  );
};

export default App;
