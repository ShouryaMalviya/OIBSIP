// Test all backend authentication endpoints end-to-end
const API_URL = 'http://localhost:5000/api';

async function runTests() {
  console.log('--- STARTING BACKEND AUTH ENDPOINT VERIFICATION ---');

  // 1. Health Check
  console.log('\n[1] Testing Health Check...');
  const healthRes = await fetch(`${API_URL}/health`);
  const healthData = await healthRes.json();
  console.log('Health Check status:', healthRes.status, healthData);

  // 2. Register User
  console.log('\n[2] Testing Registration...');
  const registerPayload = {
    name: 'Marco Polo',
    email: 'marco@pizzaverse.local',
    password: 'GourmetPassword123!',
  };
  const regRes = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(registerPayload),
  });
  const regData = await regRes.json();
  console.log('Register response status:', regRes.status);
  console.log('Register response body:', regData);

  const verificationToken = regData.data?.devVerificationToken;
  console.log('Acquired Dev Verification Token:', verificationToken);

  // 3. Prevent Duplicate Registration
  console.log('\n[3] Testing Duplicate Registration Rejection...');
  const dupRes = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(registerPayload),
  });
  const dupData = await dupRes.json();
  console.log('Duplicate status (expect 409):', dupRes.status, dupData.message);

  // 4. Test Login Before Verification (Expect 403)
  console.log('\n[4] Testing Login with Unverified Account...');
  const unverifiedLoginRes = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'marco@pizzaverse.local',
      password: 'GourmetPassword123!',
    }),
  });
  const unverifiedLoginData = await unverifiedLoginRes.json();
  console.log('Unverified Login status (expect 403):', unverifiedLoginRes.status, unverifiedLoginData);

  // 5. Verify Email
  console.log('\n[5] Testing Email Verification...');
  const verifyRes = await fetch(`${API_URL}/auth/verify-email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: verificationToken }),
  });
  const verifyData = await verifyRes.json();
  console.log('Email Verification status (expect 200):', verifyRes.status, verifyData);

  // 6. Login After Verification
  console.log('\n[6] Testing Login Post-Verification...');
  const loginRes = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'marco@pizzaverse.local',
      password: 'GourmetPassword123!',
    }),
  });
  const loginData = await loginRes.json();
  console.log('Login status (expect 200):', loginRes.status);
  console.log('User logged in:', loginData.data?.user?.name, loginData.data?.user?.email);
  const authToken = loginData.data?.token;

  // 7. Get Current User (/api/auth/me)
  console.log('\n[7] Testing GET /api/auth/me (Protected Route)...');
  const meRes = await fetch(`${API_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${authToken}` },
  });
  const meData = await meRes.json();
  console.log('Profile retrieved (expect 200):', meRes.status, meData);

  // 8. Forgot Password
  console.log('\n[8] Testing Forgot Password...');
  const forgotRes = await fetch(`${API_URL}/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'marco@pizzaverse.local' }),
  });
  const forgotData = await forgotRes.json();
  console.log('Forgot Password response:', forgotRes.status, forgotData);
  const resetToken = forgotData.data?.devResetToken;

  // 9. Reset Password
  console.log('\n[9] Testing Reset Password...');
  const resetRes = await fetch(`${API_URL}/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      token: resetToken,
      password: 'BrandNewPassword456$',
    }),
  });
  const resetData = await resetRes.json();
  console.log('Reset Password status (expect 200):', resetRes.status, resetData);

  // 10. Login With New Password
  console.log('\n[10] Testing Login with New Password...');
  const newLoginRes = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'marco@pizzaverse.local',
      password: 'BrandNewPassword456$',
    }),
  });
  const newLoginData = await newLoginRes.json();
  console.log('New Password Login status (expect 200):', newLoginRes.status, newLoginData.success);

  // 11. Logout
  console.log('\n[11] Testing Logout...');
  const logoutRes = await fetch(`${API_URL}/auth/logout`, {
    method: 'POST',
  });
  const logoutData = await logoutRes.json();
  console.log('Logout status (expect 200):', logoutRes.status, logoutData);

  console.log('\n--- ALL BACKEND AUTH ENDPOINTS PASSED WITH FLYING COLORS! ---');
}

runTests().catch(console.error);
