import { Link, NavLink, useNavigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";

const base =
  "px-3 py-1 rounded text-sm transition";

const active =
  "bg-blue-600 text-white";

const idle =
  "hover:bg-blue-100 text-gray-700";

export default function Layout({ children }) {
  const nav = useNavigate();
  const token = localStorage.getItem("token");
  const logout = () => { localStorage.removeItem("token"); nav("/login"); };

  return (
    <>
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur border-b">
        <div className="max-w-5xl mx-auto px-3 py-3 flex items-center justify-between">
          <Link to="/" className="font-bold text-xl">ServiQuick</Link>

          <nav className="flex items-center gap-2">
            {token ? (
              <>
                <NavLink to="/post" className={({isActive}) => `${base} ${isActive ? active : idle}`}>Post</NavLink>
                <NavLink to="/jobs" className={({isActive}) => `${base} ${isActive ? active : idle}`}>Jobs</NavLink>
                <NavLink to="/dashboard" className={({isActive}) => `${base} ${isActive ? active : idle}`}>Dashboard</NavLink>
                <NavLink to="/my-jobs" className={({isActive}) => `${base} ${isActive ? active : idle}`}>My Jobs</NavLink>

                <button onClick={logout}className="px-3 py-1 rounded bg-red-600 hover:bg-red-700 text-white text-sm">Logout</button>

              </>
            ) : (
              <>
                <NavLink to="/login" className={({isActive}) => `${base} ${isActive ? active : idle}`}>Login</NavLink>
                <NavLink to="/signup" className={({isActive}) => `${base} ${isActive ? active : idle}`}>Sign up</NavLink>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-4">{children}</main>
      <footer className="mt-10 border-t py-6 text-center text-xs text-gray-500">
        © {new Date().getFullYear()} ServiQuick
      </footer>
      <Toaster position="top-right" />
    </>
  );
}
