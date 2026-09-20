import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import AppLayout from "./layouts/AppLayout";
import AuthLayout from "./layouts/AuthLayout";
import ErrorBoundary from "./components/ErrorBoundary";
import PageStub from "./components/PageStub";

// Auth flow — small, loaded eagerly since it's the first thing anyone sees
import Onboarding from "./pages/Onboarding";
import SignIn from "./pages/SignIn";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

// Everything past auth is lazy-loaded so the initial bundle stays small
const Home = lazy(() => import("./pages/Home"));
const DebateDetail = lazy(() => import("./pages/DebateDetail"));
const CreateDebate = lazy(() => import("./pages/CreateDebate"));
const Search = lazy(() => import("./pages/Search"));
const Category = lazy(() => import("./pages/Category"));
const Profile = lazy(() => import("./pages/Profile"));
const EditProfile = lazy(() => import("./pages/EditProfile"));
const UserList = lazy(() => import("./pages/UserList"));
const Notifications = lazy(() => import("./pages/Notifications"));
const Messages = lazy(() => import("./pages/Messages"));
const Chat = lazy(() => import("./pages/Chat"));
const ChatSettings = lazy(() => import("./pages/ChatSettings"));
const BusinessDashboard = lazy(() => import("./pages/BusinessDashboard"));
const Admin = lazy(() => import("./pages/Admin"));

function PageFallback() {
  return <div className="skeleton" style={{ height: 200, marginTop: 20 }} />;
}

export default function App() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<PageFallback />}>
        <Routes>
          <Route element={<AuthLayout />}>
            <Route path="/" element={<Onboarding />} />
            <Route path="/signin" element={<SignIn />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
          </Route>

          <Route element={<AppLayout />}>
            <Route path="/home" element={<Home />} />
            <Route path="/debate/:id" element={<DebateDetail />} />
            <Route path="/create-debate" element={<CreateDebate />} />
            <Route path="/search" element={<Search />} />
            <Route path="/category/:id" element={<Category />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/profile/:id" element={<Profile />} />
            <Route path="/edit-profile" element={<EditProfile />} />
            <Route path="/user-list" element={<UserList />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/messages" element={<Messages />} />
            <Route path="/chat/:peerId" element={<Chat />} />
            <Route path="/chat-settings" element={<ChatSettings />} />
            <Route path="/business-dashboard" element={<BusinessDashboard />} />
            <Route path="/admin" element={<Admin />} />
          </Route>

          <Route path="*" element={<PageStub title="Not found" />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
}
