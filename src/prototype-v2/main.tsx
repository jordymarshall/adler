// One isolated V2 concept: does a goal becoming a path make Adler clearer?
// Sample interactions stay in memory; the original application is independent.
import React, { useEffect } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Link, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { Landing } from "./Landing";
import { Calendar, Coach, DemoProvider, GoalDetail, Goals, NewGoal, Today, WorkspaceShell } from "./Workspace";
import "./styles.css";

function ScrollReset(){const {pathname,hash}=useLocation();useEffect(()=>{if(hash){requestAnimationFrame(()=>document.querySelector(hash)?.scrollIntoView());}else window.scrollTo({top:0,behavior:"instant"});},[pathname,hash]);return null;}
function Preview(){return <><a className="skip-link-v2" href="#main-content">Skip to content</a><ScrollReset/><Routes><Route path="/" element={<Landing/>}/><Route path="/app" element={<WorkspaceShell/>}><Route index element={<Navigate to="today" replace/>}/><Route path="today" element={<Today/>}/><Route path="goals" element={<Goals/>}/><Route path="goals/:goalId" element={<GoalDetail/>}/><Route path="calendar" element={<Calendar/>}/><Route path="coach" element={<Coach/>}/><Route path="new" element={<NewGoal/>}/></Route><Route path="*" element={<div className="empty-preview"><h1>A different way forward.</h1><Link className="btn dark" to="/">Back to Adler</Link></div>}/></Routes></>;}
ReactDOM.createRoot(document.getElementById("root")!).render(<React.StrictMode><BrowserRouter><DemoProvider><Preview/></DemoProvider></BrowserRouter></React.StrictMode>);
