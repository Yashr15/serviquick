import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import PostJob from "./pages/PostJob";
import JobsFeed from "./pages/JobsFeed";
import MyJobs from "./pages/MyJobs";
import JobProposals from "./pages/JobProposals";
import RateProvider from "./pages/RateProvider";
import ProviderProfile from "./pages/ProviderProfile";
import Profile from "./pages/Profile";
import Notifications from "./pages/Notifications";
import NotFound from "./pages/NotFound";



function Private({ children }) {
  const token = localStorage.getItem("token");
  return token ? children : <Navigate to="/login" />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          <Route path="/dashboard" element={<Private><Dashboard /></Private>} />
          <Route path="/post" element={<Private><PostJob /></Private>} />
          <Route path="/jobs" element={<Private><JobsFeed /></Private>} />

          <Route path="/my-jobs" element={<Private><MyJobs /></Private>} />
          <Route path="/jobs/:id/proposals" element={<Private><JobProposals /></Private>} />
          <Route path="/rate/:id" element={<Private><RateProvider /></Private>} />
          <Route path="/provider/:id" element={<Private><ProviderProfile /></Private>} />

          <Route path="/profile" element={<Private><Profile /></Private>} />
          <Route path="/notifications" element={<Private><Notifications /></Private>} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}