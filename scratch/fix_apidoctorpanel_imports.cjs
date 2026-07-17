const fs = require('fs');
const path = require('path');

const dpPath = path.join(__dirname, '../src/Pages/Doctor/ApiDoctorPanel.jsx');
let lines = fs.readFileSync(dpPath, 'utf8').split('\n');

// Find the line where 'const COLORS' starts
let colorIndex = lines.findIndex(l => l.includes('const COLORS ='));

const newTop = `/**
 * Pages/Doctor/ApiDoctorPanel.jsx
 * ===============================================================
 * API-driven Doctor Portal — mirrors ALL DoctorPanel.jsx
 * functionality but uses the REST API + JitsiVideoCall.
 */
import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import DentalChart from "../../components/DentalChart";
import API from "../../services/api";
import JitsiVideoCall from "../../Components/JitsiVideoCall";
import DoctorSOSAlerts from "../../Components/DoctorSOSAlerts";
import "./DoctorPanel.css";

const fmtMoney = n => Number(n || 0).toLocaleString("fr-CM") + " XAF";
const todayStr = () => new Date().toISOString().split("T")[0];
const uid = () => Math.random().toString(36).slice(2, 10);
`;

lines.splice(0, colorIndex);
fs.writeFileSync(dpPath, newTop + '\n' + lines.join('\n'));
console.log("Fixed imports in ApiDoctorPanel.jsx");
