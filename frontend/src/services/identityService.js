const API_URL = "http://localhost:5000/api";

export async function getIdentity(identityId) {
  const token = localStorage.getItem("chaincoder_token");

  const response = await fetch(
    `${API_URL}/identities/${encodeURIComponent(identityId)}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Unable to fetch identity");
  }

  return data.identity;
}