import { Link } from "react-router-dom";
import AssetStatus from "./AssetStatus";

function AssetCard({ asset }) {
  if (!asset) {
    return null;
  }

  return (
    <div className="asset-card">
      <div className="asset-card-header">
        <span className="asset-card-id">{asset.assetId}</span>
        <AssetStatus status={asset.status} />
      </div>

      <div className="asset-card-name">
        {asset.name || "Digital Asset"}
      </div>

      <div className="asset-card-type">
        {asset.assetType || "—"}
      </div>

      <div className="asset-card-field">
        <span className="asset-card-label">Owner</span>
        <span className="asset-card-value">{asset.owner || "—"}</span>
      </div>

      <div className="asset-card-field">
        <span className="asset-card-label">Document</span>
        <span className="asset-card-value">
          {asset.documentCID
            ? "✓ Attached"
            : "No document"}
        </span>
      </div>

      <Link
        to={`/assets/${encodeURIComponent(asset.assetId)}`}
        className="asset-card-button"
      >
        View Details
      </Link>
    </div>
  );
}

export default AssetCard;
