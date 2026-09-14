import React from "react";
import ReactDOM from "react-dom/client";
import "./styles/tokens.css";
import "./styles/components.css";
import "./styles/layout.css";
import "./styles/pages.css";
import App from "./App";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
