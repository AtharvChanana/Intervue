const email = "test" + Date.now() + "@company.com";
const password = "password";

async function run() {
  await fetch("http://localhost:8080/api/auth/register", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: "Test", email, password })
  });

  const loginRes = await fetch("http://localhost:8080/api/auth/login", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });
  const loginData = await loginRes.json();
  const token = loginData.token;
  
  if (!token) throw new Error("No token");

  const startRes = await fetch("http://localhost:8080/api/interview/start", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({ jobRoleId: 1, difficulty: "MEDIUM", interviewType: "TECHNICAL" })
  });
  
  const startData = await startRes.json();
  console.log("Start Data:", startData);

  const sessionId = startData.sessionId;

  const qRes = await fetch(`http://localhost:8080/api/interview/${sessionId}/questions`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`
    }
  });

  const qText = await qRes.text();
  console.log("Questions STATUS:", qRes.status);
  console.log("Questions RESPONSE:", qText);
}
run();
