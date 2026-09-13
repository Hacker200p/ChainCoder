import Sidebar from "../../components/layout/Sidebar";
import Topbar from "../../components/layout/Topbar";
import StatCard from "../../components/dashboard/StatCard";
import QuickActions from "../../components/dashboard/QuickActions";
import ActivityTable from "../../components/dashboard/ActivityTable";

import "../../styles/layout.css";
import "../../styles/dashboard.css";

function Dashboard() {
  return (
    <div className="app-layout">

      <Sidebar />

      <section className="main-area">

        <Topbar />

        <main className="main-content">

          <div className="dashboard-welcome">
            <h2>Welcome to ChainCoder</h2>

            <p>
              Monitor identities, digital assets, access permissions,
              and blockchain activity.
            </p>
          </div>

          <div className="stats-grid">

            <StatCard
              title="My Assets"
              value="12"
              description="Digital assets under your access"
              icon="◆"
            />

            <StatCard
              title="Active Access"
              value="8"
              description="Currently active permissions"
              icon="⇄"
            />

            <StatCard
              title="Pending Approvals"
              value="3"
              description="Requests waiting for action"
              icon="✓"
            />

            <StatCard
              title="Blockchain Events"
              value="48"
              description="Recent recorded transactions"
              icon="▤"
            />

          </div>

          <QuickActions />

          <ActivityTable />

        </main>

      </section>

    </div>
  );
}

export default Dashboard;