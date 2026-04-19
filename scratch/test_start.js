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
  console.log("Login data:", loginData);
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
  
  const text = await startRes.text();
  console.log("STATUS:", startRes.status);
  console.log("RESPONSE:", text);
}
run();
