import { NavLink, useNavigate } from "react-router-dom";
export default function Layout({ children }){
  return(
    <div style={{display:"flex"}}>
      <div style={{width:"220px", background:"#F5F3FF", minHeight:"100vh", padding:"20px"}}>
        <h3 style={{color:"#4F6EF7"}}>HIT - Habit Tracker</h3>
        <NavLink to="/dashboard" style={({isActive})=>({background: isActive?"#4F6EF7":"", color:isActive?"white":"black", display:"block", padding:"10px", borderRadius:"8px", marginTop:"20px"})}>📊 Dashboard</NavLink>
        <NavLink to="/my-habits" style={({isActive})=>({background: isActive?"#4F6EF7":"", color:isActive?"white":"black", display:"block", padding:"10px", borderRadius:"8px", marginTop:"10px"})}>✅ My Habits</NavLink>
        <NavLink to="/calendar" style={({isActive})=>({background: isActive?"#4F6EF7":"", color:isActive?"white":"black", display:"block", padding:"10px", borderRadius:"8px", marginTop:"10px"})}>🗓️ Calendar</NavLink>
      </div>
      <div style={{flex:1}}>{children}</div>
    </div>
  )
}