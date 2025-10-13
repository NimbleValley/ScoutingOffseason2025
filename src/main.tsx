import * as React from "react";
import * as ReactDOM from "react-dom/client";
import {
  createBrowserRouter,
  createHashRouter,
  RouterProvider,
} from "react-router-dom";
import "./index.css";
import Tables from "./pages/Tables";
import ErrorPage from "./error-page";
import Teams from "./pages/Teams";
import Ranks from "./pages/Ranks";
import Settings from "./pages/Settings";
import CoScout from "./pages/CoScout";
import Match from "./pages/Match";
import Picklist from "./pages/Picklist";
import Sandbox from "./pages/Sandbox";

const router = createHashRouter([
  {
    path: "/",
    element: <Tables />,
    errorElement: <ErrorPage />,
  },
  {
    path: "teams",
    element: <Teams />,
  },
  {
    path: "ranks",
    element: <Ranks />,
  },
  {
    path: "settings",
    element: <Settings />,
  },
  {
    path: "coscout",
    element: <CoScout />,
  },
  {
    path: "match",
    element: <Match />,
  },
  {
    path: "picklist",
    element: <Picklist />,
  },
  {
    path: "sandbox",
    element: <Sandbox />,
  },
],
);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);