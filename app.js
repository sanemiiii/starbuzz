// Firebase config
const firebaseConfig = {
    apiKey: "AIzaSyCn3cAWXNm5x58sed8JCcxRqMSyv5LfRBk",
    authDomain: "starbuzz-confessions.firebaseapp.com",
    projectId: "starbuzz-confessions",
    storageBucket: "starbuzz-confessions.appspot.com",
    messagingSenderId: "240429778398",
    appId: "1:240429778398:web:98665d24334b44353f894f"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// Admin UID
const ADMINS = ["HEypV73Y12bVMlM7ZVTUbxVRQc83"];
const DEFAULT_AVATAR = "images/avatar1.png";

// Elements
const authContainer = document.getElementById('auth-container');
const dashboard = document.getElementById('dashboard');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const loginBtn = document.getElementById('login-btn');
const signupBtn = document.getElementById('signup-btn');
const logoutBtn = document.getElementById('logout-btn');
const shareLinkInput = document.getElementById('share-link');
const copyBtn = document.getElementById('copy-link-btn');
const sendConfBtn = document.getElementById('send-confession-btn');
const targetLinkInput = document.getElementById('target-link');
const confessionMsgInput = document.getElementById('confession-msg');
const confessionList = document.getElementById('confession-list');

const headerAvatar = document.getElementById('header-avatar');
const dashAvatar = document.getElementById('dash-avatar');
const dashName = document.getElementById('dash-name');
const dashEmail = document.getElementById('dash-email');

const avatarOptions = document.querySelectorAll('.avatar-option');
const avatarUploadInput = document.getElementById('avatar-upload');
const displayNameInput = document.getElementById('display-name-input');
const saveProfileBtn = document.getElementById('save-profile-btn');
let selectedAvatarUrl = "";

// Shared profile
const sharedProfileDiv = document.getElementById('shared-profile');
const sharedAvatar = document.getElementById('shared-avatar');
const sharedName = document.getElementById('shared-name');

// Admin panel
const adminPanel = document.getElementById('admin-panel');
const allConfessionsList = document.getElementById('all-confessions-list');

// Avatar selection
avatarOptions.forEach(a => {
  a.addEventListener('click', () => {
    avatarOptions.forEach(x => x.classList.remove('selected'));
    a.classList.add('selected');
    selectedAvatarUrl = a.getAttribute('data-url');
  });
});

// Upload avatar
avatarUploadInput.addEventListener('change', e => {
  const file = e.target.files[0];
  if(file){
    const reader = new FileReader();
    reader.onload = evt => {
      selectedAvatarUrl = evt.target.result;
      headerAvatar.src = selectedAvatarUrl;
      dashAvatar.src = selectedAvatarUrl;
    };
    reader.readAsDataURL(file);
  }
});

// Save profile with nickname
saveProfileBtn.addEventListener('click', async () => {
  const user = auth.currentUser;
  if(!user) return alert('Sign in first');
  const displayName = displayNameInput.value.trim();
  if(!displayName) return alert('Enter a display name');

  // Prevent duplicate nickname
  const existing = await db.collection('users').where('nicknameKey','==', displayName.toLowerCase()).get();
  if(!existing.empty && existing.docs[0].id !== user.uid) return alert('Nickname already taken');

  try{
    await db.collection('users').doc(user.uid).set({
      displayName,
      photoURL: selectedAvatarUrl || null,
      nicknameKey: displayName.toLowerCase()
    }, { merge:true });
    alert('Profile saved!');
    loadAndShowUserProfile(user.uid);
  } catch(e){ console.error(e); alert(e.message); }
});

// Auth
signupBtn.addEventListener('click', () => {
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();
  if(!email || !password) return alert('Enter email & password');
  auth.createUserWithEmailAndPassword(email,password)
    .then(()=>{ emailInput.value=''; passwordInput.value=''; })
    .catch(e=>alert(e.message));
});

loginBtn.addEventListener('click', () => {
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();
  if(!email || !password) return alert('Enter email & password');
  auth.signInWithEmailAndPassword(email,password)
    .then(()=>{ emailInput.value=''; passwordInput.value=''; })
    .catch(e=>alert(e.message));
});

logoutBtn.addEventListener('click', ()=>auth.signOut());

// Load profile by UID
async function loadAndShowUserProfile(uid){
  try {
    const doc = await db.collection('users').doc(uid).get();
    const data = doc.exists ? doc.data() : {};
    const name = data.displayName || "Anonymous";
    let photo = data.photoURL || DEFAULT_AVATAR;

    headerAvatar.src = photo; headerAvatar.style.display='inline-block'; headerAvatar.onerror=()=>{headerAvatar.src=DEFAULT_AVATAR};
    dashAvatar.src = photo; dashAvatar.style.display='inline-block'; dashAvatar.onerror=()=>{dashAvatar.src=DEFAULT_AVATAR};
    selectedAvatarUrl = photo;

    dashName.textContent = name;
    dashEmail.textContent = data.email || "";
    displayNameInput.value = data.displayName || "";

    sharedAvatar.src = photo; sharedAvatar.onerror=()=>{sharedAvatar.src=DEFAULT_AVATAR};
    sharedName.textContent = name;

  } catch(e){ console.error(e); }
}

// Get UID by nickname
async function getUidByNickname(nickname){
  const query = await db.collection('users').where('nicknameKey','==',nickname.toLowerCase()).get();
  if(!query.empty) return query.docs[0].id;
  return null;
}

// Copy link
copyBtn.addEventListener('click', async ()=> {
  try { await navigator.clipboard.writeText(shareLinkInput.value); alert('Link copied!'); }
  catch(e){ alert('Failed to copy'); }
});

// Send confession
sendConfBtn.addEventListener('click', async ()=>{
  const targetUrl = targetLinkInput.value.trim();
  const message = confessionMsgInput.value.trim();
  if(!targetUrl || !message) return alert('Enter link & message');
  try{
    const url = new URL(targetUrl);
    const nickname = url.searchParams.get('user');
    const receiverId = await getUidByNickname(nickname);
    if(!receiverId) return alert('User not found');
    await db.collection('confessions').add({
      receiverId, message, timestamp: firebase.firestore.FieldValue.serverTimestamp()
    });
    confessionMsgInput.value='';
    alert('Anonymous confession sent!');
  } catch(e){ alert('Invalid link or error'); console.error(e); }
});

// Load confessions
function loadConfessions(userId){
  db.collection('confessions').where('receiverId','==',userId)
    .orderBy('timestamp','desc')
    .onSnapshot(snapshot=>{
      confessionList.innerHTML='';
      snapshot.forEach(doc=>{
        const li=document.createElement('li');
        li.textContent=doc.data().message;
        confessionList.appendChild(li);
      });
    });
}

// Load all confessions for admin
function loadAllConfessions(){
  db.collection('confessions').orderBy('timestamp','desc')
    .onSnapshot(snapshot=>{
      allConfessionsList.innerHTML='';
      snapshot.forEach(doc=>{
        const data = doc.data();
        const li = document.createElement('li');
        li.textContent = `${data.receiverId}: ${data.message}`;

        const delBtn = document.createElement('button');
        delBtn.textContent="Delete";
        delBtn.onclick=()=>{ if(confirm("Delete?")) doc.ref.delete(); };
        li.appendChild(delBtn);

        allConfessionsList.appendChild(li);
      });
    });
}

// Auth state
auth.onAuthStateChanged(async user=>{
  const urlParams = new URLSearchParams(window.location.search);
  const nickname = urlParams.get('user');

  if(user){
    authContainer.style.display='none';
    dashboard.style.display='block';

    const doc = await db.collection('users').doc(user.uid).get();
    const nick = doc.exists ? doc.data().nicknameKey || user.uid : user.uid;
    shareLinkInput.value = `${window.location.origin}${window.location.pathname}?user=${nick}`;

    await loadAndShowUserProfile(user.uid);
    loadConfessions(user.uid);

    if(ADMINS.includes(user.uid)){
      adminPanel.style.display='block';
      loadAllConfessions();
    } else adminPanel.style.display='none';

  } else if(nickname){
    authContainer.style.display='block';
    dashboard.style.display='block';

    const uid = await getUidByNickname(nickname);
    if(!uid) return alert("User not found");

    const link = `${window.location.origin}${window.location.pathname}?user=${nickname}`;
    targetLinkInput.value = link;
    confessionMsgInput.focus();

    await loadAndShowUserProfile(uid);
    loadConfessions(uid);

  } else {
    authContainer.style.display='block';
    dashboard.style.display='none';
    headerAvatar.style.display='none';
    dashAvatar.style.display='none';
    dashName.textContent='';
    dashEmail.textContent='';
    adminPanel.style.display='none';
  }
});