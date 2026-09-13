import { useAuth } from "../../context/AuthContext";

function Topbar() {
  const { user } = useAuth();

  return (
    <header className="topbar">

      <div className="topbar-left">
        <div>
          <h1>Dashboard</h1>
          <p>Overview of your ChainCoder activity</p>
        </div>
      </div>

      <div className="topbar-right">

        <button className="topbar-icon" title="Notifications">
          🔔
        </button>

        <div className="topbar-divider"></div>

        <div className="topbar-user">
          <div className="topbar-avatar">
            {user?.name?.charAt(0) || "U"}
          </div>

          <div className="topbar-user-info">
            <strong>{user?.name}</strong>
            <span>
              {user?.organization} · {user?.role}
            </span>
          </div>
        </div>

      </div>

    </header>
  );
}

export default Topbar;