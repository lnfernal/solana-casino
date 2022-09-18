import React from 'react';
import { Component } from 'react'
import {  } from 'react-router-dom';
import { BrowserRouter as Router, Routes, Link, Switch, Route } from "react-router-dom"
import { HashRouter } from 'react-router-dom';

//Pages
import BlockBets from './BlockBets.tsx';

class App extends Component {



    render() {


  return (
    <div >
      <HashRouter>
        <Routes>
          <Route exact path="/blockbets" element={<BlockBets />}/>
        </Routes>
        </HashRouter>
    </div>  
  );
 }
}

export default App;
