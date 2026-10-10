import {BrowserRouter, Routes,Route,Link} from "react-router-dom";

import Login  from "./Login"
import Register  from "./Register"

function App()
{
	
	return(
	<>
	<h1 align="center">Habit and Intention Tracker</h1>
	<BrowserRouter>
	  <Link  to="/login">Login</Link>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
	  <Link  to="/Register">signup</Link>
	  
	<Routes>
	  <Route path="/login"  element={<Login />} />
	   <Route path="/register"  element={<Register />} />
	</Routes>
	</BrowserRouter>
	
	</>
	)
	
}
export  default App;