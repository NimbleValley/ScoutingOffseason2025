import * as React from "react";
import * as ReactDOM from "react-dom/client";
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";
import "./index.css";
import Tables from "./pages/Tables";
import ErrorPage from "./error-page";
import Teams from "./pages/Teams";
import Ranks from "./pages/Ranks";
import Settings from "./pages/Settings";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Tables/>,
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
]);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);