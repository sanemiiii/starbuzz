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
const avatarUrlInput = document.getElementById('avatar-url-input');
const displayNameInput = document.getElementById('display-name-input');
const saveProfileBtn = document.getElementById('save-profile-btn');
let selectedAvatarUrl = "";
avatarOptions.forEach(a => {
    a.addEventListener('click', () => {
        avatarOptions.forEach(x => x.classList.remove('selected'));
        a.classList.add('selected');
        selectedAvatarUrl = a.getAttribute('data-url');
        avatarUrlInput.value = selectedAvatarUrl;
    });
});
saveProfileBtn.addEventListener('click', async () => {
    const user = auth.currentUser;
    if(!user) { alert('Sign in first'); return; }
    const displayName = displayNameInput.value.trim();
    const photoURL = avatarUrlInput.value.trim() || '';
    try {
        await db.collection('users').doc(user.uid).set({ displayName, photoURL }, { merge:true });
        alert('Profile saved!');
        loadAndShowUserProfile(user.uid);
    } catch(e) { console.error(e); alert(e.message); }
});
signupBtn.addEventListener('click', () => {
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();
    if(!email || !password) return alert('Enter email & password');
    auth.createUserWithEmailAndPassword(email,password)
        .then(() => { emailInput.value=''; passwordInput.value=''; })
        .catch(e=>alert(e.message));
});
loginBtn.addEventListener('click', () => {
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();
    if(!email || !password) return alert('Enter email & password');
    auth.signInWithEmailAndPassword(email,password)
        .then(() => { emailInput.value=''; passwordInput.value=''; })
        .catch(e=>alert(e.message));
});
logoutBtn.addEventListener('click', ()=>auth.signOut());
auth.onAuthStateChanged(async user => {
    if(user){
        authContainer.style.display='none';
        dashboard.style.display='block';
        shareLinkInput.value = `${window.location.origin}?user=${user.uid}`;
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
async function loadAndShowUserProfile(uid){
    try{
        const doc = await db.collection('users').doc(uid).get();
        const data = doc.exists ? doc.data() : {};
        const name = data.displayName || (auth.currentUser.email.split('@')[0]);
        const photo = data.photoURL || '';
        if(photo){ headerAvatar.src=photo; headerAvatar.style.display='inline-block';
                     dashAvatar.src=photo; dashAvatar.style.display='inline-block'; }
        else{ headerAvatar.style.display='none'; dashAvatar.style.display='none'; }
        dashName.textContent=name;
        dashEmail.textContent=auth.currentUser.email;
        displayNameInput.value=data.displayName||'';
        avatarUrlInput.value=data.photoURL||'';
    } catch(e){ console.error(e); }
}
copyBtn.addEventListener('click', ()=>{ shareLinkInput.select(); document.execCommand('copy'); alert('Link copied!'); });
sendConfBtn.addEventListener('click', async ()=>{
    const targetUrl = targetLinkInput.value.trim();
    const message = confessionMsgInput.value.trim();
    if(!targetUrl || !message) return alert('Enter link & message');
    try{
        const url = new URL(targetUrl);
        const receiverId = url.searchParams.get('user');
        if(!receiverId) return alert('Invalid link');
        await db.collection('confessions').add({ receiverId, message, timestamp: firebase.firestore.FieldValue.serverTimestamp() });
        confessionMsgInput.value='';
        alert('Anonymous confession sent!');
    } catch(e){ alert('Invalid link or error'); console.error(e); }
});
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
