import { Link } from "react-router-dom";

function QuickActions() {
  return (
    <div className="dashboard-section">
      <div className="section-header">
        <div>
          <h3>Quick Actions</h3>
          <p>Common actions available to you</p>
        </div>
      </div>

      <div className="quick-actions">

        <Link to="/assets" className="quick-action">
          <span className="quick-action-icon">◆</span>
          <div>
            <strong>View Assets</strong>
            <span>Manage your digital assets</span>
          </div>
        </Link>

        <Link to="/identity" className="quick-action">
          <span className="quick-action-icon">◉</span>
          <div>
            <strong>View Identity</strong>
            <span>View your blockchain identity</span>
          </div>
        </Link>

        <Link to="/notifications" className="quick-action">
          <span className="quick-action-icon">●</span>
          <div>
            <strong>Notifications</strong>
            <span>Check recent notifications</span>
          </div>
        </Link>

      </div>
    </div>
  );
}

export default QuickActions;