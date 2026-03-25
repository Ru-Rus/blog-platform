// Use global supabaseClient from index.html, do not redeclare

let editingPostId = null;
let showingArchived = false;


function getCurrentUserId() {
  // Try to get from supabaseClient.auth
  const user = supabaseClient.auth && supabaseClient.auth.user ? supabaseClient.auth.user() : (window.currentUser || null);
  return user && user.id ? user.id : null;
}

async function createPost(title, content) {
  const user_id = getCurrentUserId();
  return await supabaseClient.from('posts').insert([{ title, content, user_id }]);
}

async function getPosts(archived = false) {
  const user_id = getCurrentUserId();
  let query = supabaseClient
    .from('posts')
    .select('*')
    .eq('is_archived', archived);
  if (user_id) query = query.eq('user_id', user_id);
  return await query.order('created_at', { ascending: false });
}

async function updatePost(id, title, content) {
  return await supabaseClient.from('posts').update({ title, content }).eq('id', id);
}

async function archivePost(id) {
  return await supabaseClient.from('posts').update({ is_archived: true }).eq('id', id);
}


// Rename DB function to avoid recursion
async function unarchivePostDb(id) {
  return await supabaseClient.from('posts').update({ is_archived: false }).eq('id', id);
}

async function hardDeletePost(id) {
  return await supabaseClient.from('posts').delete().eq('id', id);
}

window.logout = async function logout() {
  await supabaseClient.auth.signOut();
  localStorage.removeItem('sb-session');
  window.location = 'auth.html';
}

window.addPost = async function addPost() {
  const title = document.getElementById('title').value;
  const content = document.getElementById('content').value;
  if (!title || !content) {
    alert('Please enter both title and content.');
    return;
  }
  if (editingPostId) {
    const { error } = await updatePost(editingPostId, title, content);
    if (error) alert('Error updating post: ' + error.message);
    editingPostId = null;
    document.getElementById('submitBtn').textContent = 'Add Post';
    document.getElementById('cancelEditBtn').style.display = 'none';
  } else {
    const { error } = await createPost(title, content);
    if (error) alert('Error adding post: ' + error.message);
  }
  document.getElementById('title').value = '';
  document.getElementById('content').value = '';
  showPosts();
}

window.editPost = function editPost(id, title, content) {
  editingPostId = id;
  document.getElementById('title').value = decodeHTMLEntities(title);
  document.getElementById('content').value = decodeHTMLEntities(content);
  document.getElementById('submitBtn').textContent = 'Save';
  document.getElementById('cancelEditBtn').style.display = '';
  document.getElementById('title').focus();
}

window.cancelEdit = function cancelEdit() {
  editingPostId = null;
  document.getElementById('title').value = '';
  document.getElementById('content').value = '';
  document.getElementById('submitBtn').textContent = 'Add Post';
  document.getElementById('cancelEditBtn').style.display = 'none';
}

window.deletePost = async function deletePost(id) {
  if (showingArchived) {
    if (confirm('Are you sure you want to permanently delete this post? This cannot be undone.')) {
      await hardDeletePost(id);
      showPosts();
    }
  } else {
    if (confirm('Are you sure you want to archive this post?')) {
      await archivePost(id);
      showPosts();
    }
  }
}

window.unarchivePost = async function(id) {
  if (confirm('Unarchive this post?')) {
    await unarchivePostDb(id);
    showPosts();
  }
}

window.toggleShowArchived = function toggleShowArchived() {
  showingArchived = !showingArchived;
  showPosts();
}

function decodeHTMLEntities(text) {
  const txt = document.createElement('textarea');
  txt.innerHTML = text;
  return txt.value;
}

window.showPosts = async function showPosts() {
  const postsDiv = document.getElementById('posts');
  postsDiv.innerHTML = 'Loading...';
  const { data, error } = await getPosts(showingArchived);
  if (error) {
    postsDiv.innerHTML = 'Error loading posts: ' + error.message;
    return;
  }
  let html = '';
  if (!data || data.length === 0) {
    html = '<br><em>No posts found.</em>';
  } else {
    const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    html = data.map(post => {
      if (showingArchived) {
        return `
          <div style="border:1px solid #ccc; margin:10px 0; padding:10px; border-radius:6px; background:#f5f5f5; position:relative;">
            <h3 style="margin:0 0 8px 0;">${esc(post.title)}</h3>
            <p style="margin:0 0 8px 0;">${esc(post.content)}</p>
            <small style="color:#888;">Created: ${new Date(post.created_at).toLocaleString()}</small>
            <div style="position:absolute; top:10px; right:10px;">
              <button onclick="unarchivePost(${post.id})" style="margin-right:6px;">Unarchive</button>
              <button onclick="deletePost(${post.id})" style="color:#b00;">Delete</button>
            </div>
          </div>
        `;
      } else {
        return `
          <div style="border:1px solid #ccc; margin:10px 0; padding:10px; border-radius:6px; background:#fafbfc; position:relative;">
            <h3 style="margin:0 0 8px 0;">${esc(post.title)}</h3>
            <p style="margin:0 0 8px 0;">${esc(post.content)}</p>
            <small style="color:#888;">Created: ${new Date(post.created_at).toLocaleString()}</small>
            <div style="position:absolute; top:10px; right:10px;">
              <button onclick="editPost(${post.id}, '${esc(post.title)}', '${esc(post.content)}')" style="margin-right:6px;">Edit</button>
              <button onclick="deletePost(${post.id})" style="color:#b00;">Archive</button>
            </div>
          </div>
        `;
      }
    }).join('');
  }
  // Add show/hide archived button
  html = `<button onclick="toggleShowArchived()" style="margin-bottom:16px;">${showingArchived ? 'Back to All Posts' : 'Show Archived'}</button>` + html;
  postsDiv.innerHTML = html;
}


showPosts();
