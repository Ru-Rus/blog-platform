const supabaseClient = supabase.createClient(VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY);

function showError(msg) {
  document.getElementById('error').textContent = msg || '';
}

function switchToRegister() {
  document.getElementById('formTitle').textContent = 'Register';
  document.getElementById('loginBtn').style.display = 'none';
  document.getElementById('registerBtn').style.display = '';
  document.getElementById('switchToRegister').style.display = 'none';
  document.getElementById('switchToLogin').style.display = '';
  showError('');
}

function switchToLogin() {
  document.getElementById('formTitle').textContent = 'Login';
  document.getElementById('loginBtn').style.display = '';
  document.getElementById('registerBtn').style.display = 'none';
  document.getElementById('switchToRegister').style.display = '';
  document.getElementById('switchToLogin').style.display = 'none';
  showError('');
}

async function login() {
  showError('');
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const { error, user, session } = await supabaseClient.auth.signInWithPassword({ email, password });
  if (error) {
    showError(error.message);
    return;
  }
  // Save session to localStorage
  localStorage.setItem('sb-session', JSON.stringify(session));
  window.location = 'index.html';
}

async function register() {
  showError('');
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const { error, data } = await supabaseClient.auth.signUp({ email, password });
  if (error) {
    showError(error.message);
    return;
  }
  alert('Registration successful! Please check your email for confirmation.');
  switchToLogin();
}

// If already logged in, redirect to index.html
supabaseClient.auth.getSession().then(({ data: { session } }) => {
  if (session) window.location = 'index.html';
});
