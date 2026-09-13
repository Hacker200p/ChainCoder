function AssetStatus({ status }) {
  const value = status || "UNKNOWN";

  let className = "asset-status-badge";

  if (value === "ACTIVE") {
    className += " asset-status-active";
  } else if (value === "REVOKED") {
    className += " asset-status-revoked";
  } else if (value === "TRANSFERRED") {
    className += " asset-status-transferred";
  }

  return (
    <span className={className}>
      ● {value}
    </span>
  );
}

export default AssetStatus;
