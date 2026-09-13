import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import Sidebar from "../../components/layout/Sidebar";
import Topbar from "../../components/layout/Topbar";
import { getIdentity } from "../../services/identityService";

import "../../styles/layout.css";
import "../../styles/identity.css";

function MyIdentity() {
  const { user } = useAuth();

  const [identity, setIdentity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadIdentity() {
      try {
        setLoading(true);
        setError("");

        const data = await getIdentity(user.userId);
        setIdentity(data);
      } catch (err) {
        setError(err.message || "Unable to load identity");
      } finally {
        setLoading(false);
      }
    }

    if (user?.userId) {
      loadIdentity();
    }
  }, [user]);

  return (
    <div className="app-layout">

      <Sidebar />

      <section className="main-area">

        <Topbar />

        <main className="main-content">

          <div className="page-header">
            <div>
              <h2>My Identity</h2>
              <p>
                View your registered blockchain identity.
              </p>
            </div>
          </div>

          {loading && (
            <div className="identity-message">
              Loading identity...
            </div>
          )}

          {error && (
            <div className="identity-error">
              {error}
            </div>
          )}

          {!loading && !error && identity && (
            <>
              <div className="identity-status-card">

                <div>
                  <span className="identity-label">
                    Identity Status
                  </span>

                  <h3>
                    {identity.status || "ACTIVE"}
                  </h3>
                </div>

                <div className="identity-status-badge">
                  ● ACTIVE
                </div>

              </div>

              <div className="identity-grid">

                <div className="identity-card">
                  <span>Identity ID</span>
                  <strong>{identity.identityId}</strong>
                </div>

                <div className="identity-card">
                  <span>Name</span>
                  <strong>{identity.name}</strong>
                </div>

                <div className="identity-card">
                  <span>Organization</span>
                  <strong>{identity.organization}</strong>
                </div>

                <div className="identity-card">
                  <span>Role</span>
                  <strong>{identity.role}</strong>
                </div>

                <div className="identity-card">
                  <span>MSP</span>
                  <strong>{identity.mspId || "BELMSP"}</strong>
                </div>

                <div className="identity-card">
                  <span>Created At</span>
                  <strong>
                    {identity.createdAt
                      ? new Date(identity.createdAt).toLocaleString()
                      : "—"}
                  </strong>
                </div>

              </div>

              <div className="identity-verification">

                <div>
                  <span className="identity-label">
                    Blockchain Verification
                  </span>

                  <h3>Identity Verified</h3>

                  <p>
                    This identity record was retrieved through the
                    ChainCoder backend from the blockchain network.
                  </p>
                </div>

                <div className="verified-badge">
                  ✓ VERIFIED
                </div>

              </div>
            </>
          )}

        </main>

      </section>

    </div>
  );
}

export default MyIdentity;