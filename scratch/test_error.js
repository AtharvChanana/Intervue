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
  const token = loginData.accessToken;
  
  const startRes = await fetch("http://localhost:8080/api/interview/start", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({ jobRoleId: 1, difficulty: "MEDIUM", interviewType: "TECHNICAL", numberOfQuestions: 5 })
  });
  
  if (startRes.status !== 200) {
    console.log("Start Session Failed:", startRes.status, await startRes.text());
    return;
  }
  const sessionData = await startRes.json();
  console.log("Session Data:", sessionData);
  
  const qRes = await fetch(`http://localhost:8080/api/interview/${sessionData.sessionId}/questions`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`
    }
  });
  
  console.log("Questions Status:", qRes.status);
  console.log("Questions Body:", await qRes.text());
}
run();
