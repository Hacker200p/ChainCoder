function StatCard({ title, value, description, icon }) {
    return (
      <div className="stat-card">
        <div className="stat-card-top">
          <span className="stat-card-title">{title}</span>
          <span className="stat-card-icon">{icon}</span>
        </div>
  
        <div className="stat-card-value">
          {value}
        </div>
  
        <div className="stat-card-description">
          {description}
        </div>
      </div>
    );
  }
  
  export default StatCard;