export async function fetchRepoHealth() {
  const res = await fetch("/api/repo-health");
  if (!res.ok) throw new Error(`Repo health API error: ${res.status}`);
  return res.json();
}
