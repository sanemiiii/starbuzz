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

// Default avatar
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

// Shared profile elements
const sharedProfileDiv = document.getElementById('shared-profile');
const sharedAvatar = document.getElementById('shared-avatar');
const sharedName = document.getElementById('shared-name');

// Admin elements
const adminPanel = document.getElementById('admin-panel');
const allConfessionsList = document.getElementById('all-confessions-list');

// Avatar gallery selection
avatarOptions.forEach(a => {
  a.addEventListener('click', () => {
    avatarOptions.forEach(x => x.classList.remove('selected'));
    a.classList.add('selected');
    selectedAvatarUrl = a.getAttribute('data-url');
  });
});

// Upload avatar
avatarUploadInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if(file){
    const reader = new FileReader();
    reader.onload = function(evt){
      selectedAvatarUrl = evt.target.result;
      headerAvatar.src = selectedAvatarUrl;
      dashAvatar.src = selectedAvatarUrl;
    };
    reader.readAsDataURL(file);
  }
});

// Save profile
saveProfileBtn.addEventListener('click', async () => {
  const user = auth.currentUser;
  if(!user){ alert('Sign in first'); return; }
  const displayName = displayNameInput.value.trim();
  try{
    await db.collection('users').doc(user.uid).set({
      displayName,
      photoURL: selectedAvatarUrl || null
    }, { merge: true });
    alert('Profile saved!');
    loadAndShowUserProfile(user.uid);
  } catch(e){ console.error(e); alert(e.message); }
});

// Auth actions
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

// Load user profile
async function loadAndShowUserProfile(uid){
  try{
    const doc = await db.collection('users').doc(uid).get();
    const data = doc.exists ? doc.data() : {};
    const name = data.displayName || uid;
    let photo = data.photoURL || DEFAULT_AVATAR;

    const testImage = new Image();
    testImage.src = photo;
    testImage.onerror = () => { 
      photo = DEFAULT_AVATAR;
      db.collection('users').doc(uid).set({ photoURL: DEFAULT_AVATAR }, { merge:true });
    };

    // Header
    headerAvatar.src = photo;
    headerAvatar.onerror = () => { headerAvatar.src = DEFAULT_AVATAR; };
    headerAvatar.style.display='inline-block';

    // Dashboard
    dashAvatar.src = photo;
    dashAvatar.onerror = () => { dashAvatar.src = DEFAULT_AVATAR; };
    dashAvatar.style.display='inline-block';

    selectedAvatarUrl = photo;
    dashName.textContent = name;
    dashEmail.textContent = data.email || "";
    displayNameInput.value = data.displayName || '';

    // Shared mini profile (if applicable)
    sharedAvatar.src = photo;
    sharedAvatar.onerror = () => { sharedAvatar.src = DEFAULT_AVATAR; };
    sharedName.textContent = name;

  } catch(e){ console.error(e); }
}

// Copy share link
copyBtn.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(shareLinkInput.value);
    alert('Link copied!');
  } catch(e){
    alert('Failed to copy link');
  }
});

// Send confession
sendConfBtn.addEventListener('click', async ()=>{
  const targetUrl = targetLinkInput.value.trim();
  const message = confessionMsgInput.value.trim();
  if(!targetUrl || !message) return alert('Enter link & message');
  try{
    const url = new URL(targetUrl);
    const receiverId = url.searchParams.get('user');
    if(!receiverId) return alert('Invalid link');
    await db.collection('confessions').add({
      receiverId, message, timestamp: firebase.firestore.FieldValue.serverTimestamp()
    });
    confessionMsgInput.value='';
    alert('Anonymous confession sent!');
  } catch(e){ alert('Invalid link or error'); console.error(e); }
});

// Load confessions for current user
function loadConfessions(userId){
  db.collection('confessions')
    .where('receiverId','==',userId)
    .orderBy('timestamp','desc')
    .onSnapshot(snapshot=>{
      confessionList.innerHTML='';
      snapshot.forEach(doc=>{
        const li=document.createElement('li');
        li.style.background='#fff0f5';
        li.style.borderRadius='14px';
        li.style.padding='10px';
        li.style.margin='8px 0';
        li.textContent=doc.data().message;
        confessionList.appendChild(li);
      });
    }, err=>console.error(err));
}

// Load all confessions for admin
function loadAllConfessions(){
  db.collection('confessions')
    .orderBy('timestamp','desc')
    .onSnapshot(snapshot=>{
      allConfessionsList.innerHTML='';
      snapshot.forEach(doc=>{
        const data = doc.data();
        const li = document.createElement('li');
        li.style.background = "#ffe6e6";
        li.style.borderRadius = "10px";
        li.style.padding = "10px";
        li.style.margin = "6px 0";
        li.textContent = `${data.receiverId}: ${data.message}`;

        const delBtn = document.createElement('button');
        delBtn.textContent = "Delete";
        delBtn.style.marginLeft = "10px";
        delBtn.onclick = () => { if(confirm("Delete this confession?")) doc.ref.delete(); };
        li.appendChild(delBtn);

        allConfessionsList.appendChild(li);
      });
    });
}

// Auth state
auth.onAuthStateChanged(async user => {
  const urlParams = new URLSearchParams(window.location.search);
  const sharedUser = urlParams.get('user');

  if(user){
    authContainer.style.display='none';
    dashboard.style.display='block';
    shareLinkInput.value = `${window.location.origin}${window.location.pathname}?user=${user.uid}`;
    await loadAndShowUserProfile(user.uid);
    loadConfessions(user.uid);

    // Admin panel
    if(ADMINS.includes(user.uid)){
      adminPanel.style.display = "block";
      loadAllConfessions();
    } else {
      adminPanel.style.display = "none";
    }

  } else if(sharedUser){
    authContainer.style.display='block';
    dashboard.style.display='block';

    const link = `${window.location.origin}${window.location.pathname}?user=${sharedUser}`;
    targetLinkInput.value = link;
    confessionMsgInput.focus();

    await loadAndShowUserProfile(sharedUser);
  } else {
    authContainer.style.display='block';
    dashboard.style.display='none';
    headerAvatar.style.display='none';
    dashAvatar.style.display='none';
    dashName.textContent='';
    dashEmail.textContent='';
    adminPanel.style.display = "none";
  }
});