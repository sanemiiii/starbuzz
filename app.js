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

// Avatar gallery & upload
const avatarOptions = document.querySelectorAll('.avatar-option');
const avatarUploadInput = document.getElementById('avatar-upload');
const displayNameInput = document.getElementById('display-name-input');
const saveProfileBtn = document.getElementById('save-profile-btn');
let selectedAvatarUrl = "";

// Gallery selection
avatarOptions.forEach(a => {
  a.addEventListener('click', () => {
    avatarOptions.forEach(x => x.classList.remove('selected'));
    a.classList.add('selected');
    selectedAvatarUrl = a.getAttribute('data-url');
  });
});

// Upload from device
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

// Auth state
auth.onAuthStateChanged(async user => {
  if(user){
    authContainer.style.display='none';
    dashboard.style.display='block';
    // Correct share link including /starbuzz/
    shareLinkInput.value = `${window.location.origin}${window.location.pathname}?user=${user.uid}`;
    await loadAndShowUserProfile(user.uid);
    loadConfessions(user.uid);
  } else {
    authContainer.style.display='block';
    dashboard.style.display='none';
    headerAvatar.style.display='none';
    dashAvatar.style.display='none';
    dashName.textContent='';
    dashEmail.textContent='';
  }
});

// Load profile
async function loadAndShowUserProfile(uid){
  try{
    const doc = await db.collection('users').doc(uid).get();
    const data = doc.exists ? doc.data() : {};
    const name = data.displayName || (auth.currentUser.email.split('@')[0]);
    const photo = data.photoURL || '';
    if(photo){
      headerAvatar.src = photo; headerAvatar.style.display='inline-block';
      dashAvatar.src = photo; dashAvatar.style.display='inline-block';
      selectedAvatarUrl = photo;
    } else {
      headerAvatar.style.display='none';
      dashAvatar.style.display='none';
    }
    dashName.textContent = name;
    dashEmail.textContent = auth.currentUser.email;
    displayNameInput.value = data.displayName || '';
  } catch(e){ console.error(e); }
}

// Copy link
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

// Load confessions
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

// Auto-fill target link if ?user= is in URL
window.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const sharedUser = params.get('user');
  if(sharedUser){
    const link = `${window.location.origin}${window.location.pathname}?user=${sharedUser}`;
    targetLinkInput.value = link;
    confessionMsgInput.focus();
  }
});