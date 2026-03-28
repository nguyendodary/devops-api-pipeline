/* ============================================================
   STATE
   ============================================================ */
const API = '';
let token = localStorage.getItem('token') || null;
let currentUser = null;
let currentPage = { tasks: 1, users: 1 };

/* ============================================================
   INIT
   ============================================================ */
document.addEventListener('DOMContentLoaded', async () => {
  if (token) {
    try {
      await fetchMe();
      showPage('dashboard');
      loadDashboard();
    } catch {
      token = null;
      localStorage.removeItem('token');
      showPage('login');
    }
  } else {
    showPage('login');
  }
  checkHealth();
  setInterval(checkHealth, 30000);
});

/* ============================================================
   NAV
   ============================================================ */
document.querySelectorAll('.nav-link[data-page]').forEach((link) => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    const page = link.dataset.page;
    if (page && !token && page !== 'login') {
      showPage('login');
      return;
    }
    showPage(page);
  });
});

function showPage(page) {
  document.querySelectorAll('.page').forEach((p) => p.classList.remove('active'));
  document.querySelectorAll('.nav-link').forEach((l) => l.classList.remove('active'));

  const el = document.getElementById(`page-${page}`);
  if (el) el.classList.add('active');

  const navLink = document.querySelector(`.nav-link[data-page="${page}"]`);
  if (navLink) navLink.classList.add('active');

  if (page === 'dashboard' && token) loadDashboard();
  if (page === 'tasks' && token) loadTasks();
  if (page === 'users' && token) loadUsers();
}

function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
}

/* ============================================================
   AUTH
   ============================================================ */
async function handleLogin(e) {
  e.preventDefault();
  const btn = document.getElementById('login-btn');
  const alert = document.getElementById('login-alert');
  btn.disabled = true;
  btn.textContent = 'Signing in...';
  alert.style.display = 'none';

  try {
    const res = await api('POST', '/api/v1/auth/login', {
      email: document.getElementById('login-email').value,
      password: document.getElementById('login-password').value,
    });
    token = res.data.accessToken;
    localStorage.setItem('token', token);
    await fetchMe();
    showPage('dashboard');
    toast('Logged in successfully', 'success');
  } catch (err) {
    alert.className = 'alert error';
    alert.textContent = err.message || 'Login failed';
    alert.style.display = 'block';
  } finally {
    btn.disabled = false;
    btn.textContent = 'Sign In';
  }
}

async function handleRegister(e) {
  e.preventDefault();
  const alert = document.getElementById('register-alert');
  alert.style.display = 'none';

  try {
    const res = await api('POST', '/api/v1/auth/register', {
      email: document.getElementById('reg-email').value,
      password: document.getElementById('reg-password').value,
      firstName: document.getElementById('reg-firstName').value,
      lastName: document.getElementById('reg-lastName').value,
    });
    token = res.data.accessToken;
    localStorage.setItem('token', token);
    await fetchMe();
    showPage('dashboard');
    toast('Account created!', 'success');
  } catch (err) {
    alert.className = 'alert error';
    alert.textContent = err.message || 'Registration failed';
    alert.style.display = 'block';
  }
}

function logout() {
  token = null;
  currentUser = null;
  localStorage.removeItem('token');
  document.getElementById('sidebar-user').style.display = 'none';
  document.getElementById('logout-btn').style.display = 'none';
  document.getElementById('user-name').textContent = 'Guest';
  document.getElementById('user-role').textContent = '—';
  document.getElementById('user-avatar').textContent = '?';
  showPage('login');
  toast('Logged out', 'info');
}

async function fetchMe() {
  const res = await api('GET', '/api/v1/auth/me');
  currentUser = res.data.user;
  document.getElementById('sidebar-user').style.display = 'flex';
  document.getElementById('logout-btn').style.display = 'block';
  document.getElementById('user-name').textContent =
    `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim() || currentUser.email;
  document.getElementById('user-role').textContent = currentUser.role;
  document.getElementById('user-avatar').textContent = (currentUser.email || '?')[0].toUpperCase();
}

/* ============================================================
   DASHBOARD
   ============================================================ */
async function loadDashboard() {
  try {
    const [health, tasksRes, usersRes] = await Promise.all([
      rawGet('/health'),
      api('GET', '/api/v1/tasks?limit=5'),
      api('GET', '/api/v1/users?limit=5'),
    ]);

    document.getElementById('stat-status').textContent =
      health.status === 'success' ? 'Healthy' : 'Down';
    document.getElementById('stat-uptime').textContent = formatUptime(health.uptime || 0);
    document.getElementById('stat-tasks').textContent = tasksRes.data?.pagination?.total ?? '—';
    document.getElementById('stat-users').textContent = usersRes.data?.pagination?.total ?? '—';

    const tasks = tasksRes.data?.tasks || [];
    const container = document.getElementById('dashboard-tasks');
    if (!tasks.length) {
      container.innerHTML = '<p class="text-muted">No tasks yet</p>';
    } else {
      container.innerHTML = tasks
        .map(
          (t) => `
        <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border)">
          <div>
            <strong>${esc(t.title)}</strong>
            <span class="small text-muted" style="margin-left:8px">${esc(t.user?.firstName || '')} ${esc(t.user?.lastName || '')}</span>
          </div>
          <div style="display:flex;gap:6px">
            <span class="status-badge status-${t.status}">${formatStatus(t.status)}</span>
            <span class="status-badge status-${t.priority}">${t.priority}</span>
          </div>
        </div>`,
        )
        .join('');
    }
  } catch (err) {
    document.getElementById('stat-status').textContent = 'Error';
  }
}

/* ============================================================
   TASKS
   ============================================================ */
async function loadTasks() {
  const page = currentPage.tasks || 1;
  const status = document.getElementById('task-filter-status').value;
  const priority = document.getElementById('task-filter-priority').value;
  let url = `/api/v1/tasks?page=${page}&limit=10`;
  if (status) url += `&status=${status}`;
  if (priority) url += `&priority=${priority}`;

  try {
    const res = await api('GET', url);
    const tasks = res.data?.tasks || [];
    const pagination = res.data?.pagination || {};
    const tbody = document.getElementById('tasks-tbody');

    if (!tasks.length) {
      tbody.innerHTML =
        '<tr><td colspan="6" class="text-center text-muted">No tasks found</td></tr>';
    } else {
      tbody.innerHTML = tasks
        .map(
          (t) => `
        <tr>
          <td><strong>${esc(t.title)}</strong>${t.description ? `<br><span class="small text-muted">${esc(t.description.substring(0, 60))}${t.description.length > 60 ? '...' : ''}</span>` : ''}</td>
          <td><span class="status-badge status-${t.status}">${formatStatus(t.status)}</span></td>
          <td><span class="status-badge status-${t.priority}">${t.priority}</span></td>
          <td class="small">${t.dueDate ? new Date(t.dueDate).toLocaleDateString() : '—'}</td>
          <td class="small">${esc(t.user?.firstName || '')} ${esc(t.user?.lastName || '')}</td>
          <td>
            <button class="btn-icon" title="Edit" onclick="editTask('${t.id}')">✏️</button>
            <button class="btn-icon" title="Delete" onclick="deleteTask('${t.id}')">🗑️</button>
          </td>
        </tr>`,
        )
        .join('');
    }
    renderPagination('tasks-pagination', pagination, (p) => {
      currentPage.tasks = p;
      loadTasks();
    });
  } catch (err) {
    document.getElementById('tasks-tbody').innerHTML =
      `<tr><td colspan="6" class="text-center text-red">${esc(err.message)}</td></tr>`;
  }
}

function openTaskModal(task) {
  document.getElementById('task-modal').style.display = 'flex';
  document.getElementById('task-alert').style.display = 'none';
  document.getElementById('task-form').reset();
  document.getElementById('task-id').value = '';

  if (task) {
    document.getElementById('task-modal-title').textContent = 'Edit Task';
    document.getElementById('task-submit-btn').textContent = 'Update';
    document.getElementById('task-id').value = task.id;
    document.getElementById('task-title').value = task.title;
    document.getElementById('task-description').value = task.description || '';
    document.getElementById('task-status').value = task.status;
    document.getElementById('task-priority').value = task.priority;
    if (task.dueDate) {
      document.getElementById('task-dueDate').value = new Date(task.dueDate)
        .toISOString()
        .slice(0, 16);
    }
  } else {
    document.getElementById('task-modal-title').textContent = 'New Task';
    document.getElementById('task-submit-btn').textContent = 'Create';
  }
}

function closeTaskModal() {
  document.getElementById('task-modal').style.display = 'none';
}

async function handleTaskSubmit(e) {
  e.preventDefault();
  const id = document.getElementById('task-id').value;
  const body = {
    title: document.getElementById('task-title').value,
    description: document.getElementById('task-description').value || undefined,
    status: document.getElementById('task-status').value,
    priority: document.getElementById('task-priority').value,
    dueDate: document.getElementById('task-dueDate').value
      ? new Date(document.getElementById('task-dueDate').value).toISOString()
      : undefined,
  };

  try {
    if (id) {
      await api('PATCH', `/api/v1/tasks/${id}`, body);
      toast('Task updated', 'success');
    } else {
      await api('POST', '/api/v1/tasks', body);
      toast('Task created', 'success');
    }
    closeTaskModal();
    loadTasks();
    loadDashboard();
  } catch (err) {
    const alert = document.getElementById('task-alert');
    alert.className = 'alert error';
    alert.textContent = err.message || 'Failed to save task';
    alert.style.display = 'block';
  }
}

async function editTask(id) {
  try {
    const res = await api('GET', `/api/v1/tasks/${id}`);
    openTaskModal(res.data.task);
  } catch (err) {
    toast(err.message, 'error');
  }
}

async function deleteTask(id) {
  if (!confirm('Delete this task?')) return;
  try {
    await api('DELETE', `/api/v1/tasks/${id}`);
    toast('Task deleted', 'success');
    loadTasks();
    loadDashboard();
  } catch (err) {
    toast(err.message, 'error');
  }
}

/* ============================================================
   USERS
   ============================================================ */
async function loadUsers() {
  const page = currentPage.users || 1;
  const search = document.getElementById('user-filter-search').value;
  const role = document.getElementById('user-filter-role').value;
  let url = `/api/v1/users?page=${page}&limit=10`;
  if (search) url += `&search=${encodeURIComponent(search)}`;
  if (role) url += `&role=${role}`;

  try {
    const res = await api('GET', url);
    const users = res.data?.users || [];
    const pagination = res.data?.pagination || {};
    const tbody = document.getElementById('users-tbody');

    if (!users.length) {
      tbody.innerHTML =
        '<tr><td colspan="7" class="text-center text-muted">No users found</td></tr>';
    } else {
      tbody.innerHTML = users
        .map(
          (u) => `
        <tr>
          <td style="display:flex;align-items:center;gap:10px">
            <div class="user-avatar" style="width:32px;height:32px;font-size:.75rem">${(u.email || '?')[0].toUpperCase()}</div>
            <span>${esc(u.firstName)} ${esc(u.lastName)}</span>
          </td>
          <td class="small">${esc(u.email)}</td>
          <td><span class="status-badge role-${u.role}">${u.role}</span></td>
          <td><span class="status-badge ${u.isActive ? 'status-COMPLETED' : 'status-CANCELLED'}">${u.isActive ? 'Active' : 'Inactive'}</span></td>
          <td class="small">${u._count?.tasks || 0}</td>
          <td class="small">${new Date(u.createdAt).toLocaleDateString()}</td>
          <td>
            <button class="btn-icon" title="View" onclick="viewUser('${u.id}')">👁️</button>
          </td>
        </tr>`,
        )
        .join('');
    }
    renderPagination('users-pagination', pagination, (p) => {
      currentPage.users = p;
      loadUsers();
    });
  } catch (err) {
    document.getElementById('users-tbody').innerHTML =
      `<tr><td colspan="7" class="text-center text-red">${esc(err.message)}</td></tr>`;
  }
}

async function viewUser(id) {
  try {
    const res = await api('GET', `/api/v1/users/${id}`);
    const u = res.data.user;
    alert(
      `User: ${u.firstName} ${u.lastName}\n` +
        `Email: ${u.email}\n` +
        `Role: ${u.role}\n` +
        `Tasks: ${u.tasks?.length || 0}\n` +
        `Joined: ${new Date(u.createdAt).toLocaleDateString()}`,
    );
  } catch (err) {
    toast(err.message, 'error');
  }
}

/* ============================================================
   HEALTH TEST
   ============================================================ */
async function testHealth() {
  try {
    const res = await rawGet('/health');
    document.getElementById('test-result').textContent = JSON.stringify(res, null, 2);
  } catch (err) {
    document.getElementById('test-result').textContent = `Error: ${err.message}`;
  }
}

async function testRoot() {
  try {
    const res = await rawGet('/');
    document.getElementById('test-result').textContent = JSON.stringify(res, null, 2);
  } catch (err) {
    document.getElementById('test-result').textContent = `Error: ${err.message}`;
  }
}

async function checkHealth() {
  try {
    const res = await rawGet('/health');
    const badge = document.getElementById('connection-badge');
    if (res.status === 'success') {
      badge.textContent = '● Online';
      badge.className = 'badge online';
    } else {
      badge.textContent = '● Degraded';
      badge.className = 'badge';
    }
  } catch {
    document.getElementById('connection-badge').textContent = '● Offline';
    document.getElementById('connection-badge').className = 'badge';
  }
}

/* ============================================================
   API HELPER
   ============================================================ */
async function api(method, url, body) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (token) opts.headers['Authorization'] = `Bearer ${token}`;
  if (body) opts.body = JSON.stringify(body);

  const res = await fetch(API + url, opts);
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    if (res.status === 401 && token) {
      logout();
      throw new Error('Session expired. Please login again.');
    }
    throw new Error(data.message || `Request failed (${res.status})`);
  }
  return data;
}

async function rawGet(url) {
  const res = await fetch(API + url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

/* ============================================================
   PAGINATION
   ============================================================ */
function renderPagination(containerId, pagination, onClick) {
  const container = document.getElementById(containerId);
  const { page, pages } = pagination;
  if (pages <= 1) {
    container.innerHTML = '';
    return;
  }

  let html = '';
  if (page > 1) html += `<button onclick="(${onClick})(${page - 1})">‹ Prev</button>`;
  for (let i = 1; i <= pages; i++) {
    html += `<button class="${i === page ? 'active' : ''}" onclick="(${onClick})(${i})">${i}</button>`;
  }
  if (page < pages) html += `<button onclick="(${onClick})(${page + 1})">Next ›</button>`;
  container.innerHTML = html;
}

/* ============================================================
   UTILS
   ============================================================ */
function esc(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function formatStatus(s) {
  return (s || '').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatUptime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

function debounce(fn, ms) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), ms);
  };
}

function toast(msg, type = 'info') {
  const container = document.getElementById('toast-container');
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.textContent = msg;
  container.appendChild(el);
  setTimeout(() => el.remove(), 3500);
}
