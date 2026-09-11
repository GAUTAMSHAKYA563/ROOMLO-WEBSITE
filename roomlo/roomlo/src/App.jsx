import { useState, useEffect, useRef } from "react";
import {
  sendOtp as fbSendOtp,
  confirmOtp as fbConfirmOtp,
  logout as fbLogout,
  watchAuthState,
  createUserProfile,
  getUserProfile,
  saveRoomForUser,
  unsaveRoomForUser,
  getAllRooms,
  addRoom as fbAddRoom,
  updateRoom as fbUpdateRoom,
  deleteRoomDoc,
  getAllUsers,
  setUserBanned,
  deleteUserDoc,
  getChatMessages,
  saveChatMessages,
  isChatUnlocked,
  unlockChat,
} from "./firebase-backend";

// ══════════════════════════════════════════
// DATA
// ══════════════════════════════════════════
const INITIAL_ROOMS = [
  { id:1, title:"Premium Studio Apartment",   area:"Koramangala, Bangalore", rent:12000, type:"Studio",      gender:"Any",    furnished:"Fully Furnished", rating:4.8, reviews:34, verified:true,  ownerVerified:true,  amenities:["AC","WiFi","Attached Bath","Parking","Food"], badge:"Top Rated", img:"https://images.unsplash.com/photo-1540518614846-7eded433c457?w=600&q=80", owner:"Rajesh Kumar",  distance:"0.3km from Metro" },
  { id:2, title:"Spacious 1BHK near IT Park", area:"Whitefield, Bangalore",  rent:18000, type:"1BHK",        gender:"Male",   furnished:"Semi Furnished",  rating:4.5, reviews:21, verified:true,  ownerVerified:true,  amenities:["WiFi","Attached Bath","Parking"],             badge:"Trending",  img:"https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&q=80", owner:"Priya Sharma",  distance:"0.5km from Wipro" },
  { id:3, title:"Girls PG with Food",         area:"Baner, Pune",            rent:8500,  type:"PG",          gender:"Female", furnished:"Fully Furnished", rating:4.9, reviews:58, verified:true,  ownerVerified:true,  amenities:["AC","WiFi","Food","Laundry"],                  badge:"New",       img:"https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=600&q=80", owner:"Sunita Joshi",  distance:"1.2km from Symbiosis" },
  { id:4, title:"Luxury 2BHK Family Flat",    area:"Andheri West, Mumbai",   rent:32000, type:"2BHK",        gender:"Family", furnished:"Fully Furnished", rating:4.7, reviews:12, verified:true,  ownerVerified:true,  amenities:["AC","WiFi","Attached Bath","Parking","Gym"],   badge:"Premium",   img:"https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600&q=80", owner:"Amit Patel",    distance:"0.8km from Metro" },
  { id:5, title:"Budget Room near University",area:"Laxmi Nagar, Delhi",     rent:5500,  type:"Single Room", gender:"Male",   furnished:"Semi Furnished",  rating:4.2, reviews:9,  verified:false, ownerVerified:true,  amenities:["WiFi","Common Bath"],                          badge:null,        img:"https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=600&q=80", owner:"Mohit Verma",   distance:"0.2km from DU Gate" },
  { id:6, title:"Modern Co-living Space",     area:"HSR Layout, Bangalore",  rent:9800,  type:"Co-living",   gender:"Any",    furnished:"Fully Furnished", rating:4.6, reviews:44, verified:true,  ownerVerified:true,  amenities:["AC","WiFi","Food","Gym","Rooftop"],             badge:"Hot Deal",  img:"https://images.unsplash.com/photo-1484154218962-a197022b5858?w=600&q=80", owner:"Deepika Singh", distance:"2km from Silk Board" },
];

const A_ICONS = {"AC":"❄️","WiFi":"📶","Attached Bath":"🚿","Parking":"🚗","Food":"🍽️","Laundry":"👔","Gym":"💪","Rooftop":"🏙️","Common Bath":"🚽"};
const BADGE_GRAD = {"Top Rated":"from-amber-400 to-orange-500","Trending":"from-pink-500 to-rose-500","New":"from-emerald-400 to-teal-500","Premium":"from-violet-500 to-purple-600","Hot Deal":"from-red-500 to-pink-500"};
const SUGGESTIONS = ["Room near Infosys campus","PG under ₹7000 in Pune","1BHK near metro","Girls PG with food Bangalore","Bachelor room near IT Park"];
const TYPES = ["All","Studio","1BHK","2BHK","PG","Single Room","Co-living"];
const FURNISHED_OPTIONS = ["Fully Furnished","Semi Furnished","Unfurnished"];
const GENDER_OPTIONS = ["Any","Male","Female","Family"];

// ── SUPER ADMIN CREDENTIALS (hardcoded) ──
const ADMIN_CREDS = { username:"roomlo_admin", password:"Admin@2026#" };

// ══════════════════════════════════════════
// ROOMLO LOGO
// ══════════════════════════════════════════
function RoomloLogo({ size="md" }) {
  const big = size === "lg";
  return (
    <div className="flex items-center select-none">
      <img
        src="/logo.png"
        alt="Roomlo"
        className={`object-contain ${big ? "h-16 w-auto" : "h-10 w-auto"}`}
        style={{filter:"drop-shadow(0 2px 8px rgba(0,0,0,0.18))"}}
        onError={e=>{
          // fallback to text logo if image fails
          e.target.style.display="none";
          e.target.nextSibling.style.display="flex";
        }}
      />
      {/* Fallback text logo */}
      <div className="items-center gap-2.5" style={{display:"none"}}>
        <div className={`${big?"w-12 h-12":"w-9 h-9"} rounded-xl flex items-center justify-center shadow-lg`} style={{background:"linear-gradient(135deg,#2563EB,#06B6D4)"}}>
          <svg width={big?28:22} height={big?28:22} viewBox="0 0 22 22" fill="none">
            <path d="M3 10.5L11 3L19 10.5V19H14V14H8V19H3V10.5Z" fill="white" fillOpacity="0.95"/>
          </svg>
        </div>
        <div className="flex flex-col leading-none">
          <span className={`${big?"text-2xl":"text-xl"} font-black tracking-tight`} style={{fontFamily:"'Sora',sans-serif",background:"linear-gradient(135deg,#1d4ed8,#0891b2)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>roomlo</span>
          <span className="text-[9px] font-semibold text-slate-400 uppercase" style={{letterSpacing:"0.18em"}}>Brokerage Free Room Rental</span>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════
// TOAST
// ══════════════════════════════════════════
function Toast({msg, type, onDone}) {
  useEffect(()=>{const t=setTimeout(onDone,2800);return()=>clearTimeout(t);},[]);
  const bg = type==="error"?"bg-red-500":type==="warn"?"bg-amber-500":type==="info"?"bg-blue-500":"bg-emerald-500";
  const icon = type==="error"?"❌":type==="warn"?"⚠️":type==="info"?"ℹ️":"✅";
  return (
    <div className={`fixed top-5 left-1/2 -translate-x-1/2 z-[999] px-5 py-3 rounded-2xl shadow-2xl text-white text-sm font-bold flex items-center gap-2 whitespace-nowrap ${bg}`}>
      {icon} {msg}
    </div>
  );
}

// ══════════════════════════════════════════
// VERIFIED BADGE
// ══════════════════════════════════════════
function VerifiedBadge({type}){
  return(
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${type==="room"?"bg-blue-50 text-blue-700":"bg-emerald-50 text-emerald-700"}`}>
      ✓ {type==="room"?"Verified Room":"Verified Owner"}
    </span>
  );
}

// ══════════════════════════════════════════
// OTP INPUT
// ══════════════════════════════════════════
function OtpInput({value, onChange}) {
  const inputs = useRef([]);
  const digits = (value+"      ").slice(0,6).split("");
  const handleKey = (i,e) => {
    if(e.key==="Backspace"){
      const nv = value.slice(0,i)+value.slice(i+1);
      onChange(nv);
      if(i>0) inputs.current[i-1]?.focus();
    }
  };
  const handleChange = (i,e) => {
    const ch = e.target.value.replace(/\D/g,"").slice(-1);
    const arr = digits.map(d=>d.trim()||"");
    arr[i]=ch;
    const nv = arr.join("").slice(0,6);
    onChange(nv);
    if(ch && i<5) inputs.current[i+1]?.focus();
  };
  return (
    <div className="flex gap-2 justify-center">
      {digits.map((d,i)=>(
        <input key={i} ref={el=>inputs.current[i]=el}
          type="text" inputMode="numeric" maxLength={1}
          value={d.trim()}
          onChange={e=>handleChange(i,e)}
          onKeyDown={e=>handleKey(i,e)}
          className="w-11 text-center text-xl font-extrabold border-2 rounded-xl focus:outline-none transition-all"
          style={{height:"52px",borderColor:d.trim()?"#2563EB":"#e2e8f0",background:d.trim()?"#eff6ff":"white",color:"#1e40af"}}
        />
      ))}
    </div>
  );
}

// ══════════════════════════════════════════
// AUTH MODAL (Sign Up / Sign In)
// ══════════════════════════════════════════
function AuthModal({onClose, onSuccess, initialMode="signup"}) {
  const [mode, setMode] = useState(initialMode);
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [role, setRole] = useState("renter");
  const [otp, setOtp] = useState("");
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [timer, setTimer] = useState(0);
  const timerRef = useRef(null);

  useEffect(()=>{
    if(timer>0){ timerRef.current=setTimeout(()=>setTimer(t=>t-1),1000); }
    return()=>clearTimeout(timerRef.current);
  },[timer]);

  const switchMode = () => { setMode(m=>m==="signup"?"signin":"signup"); setStep(1); setError(""); setOtp(""); setName(""); setMobile(""); };

  // Step 1 — send a real OTP via Firebase Phone Auth
  const sendOtp = async () => {
    setError("");
    if(mode==="signup" && name.trim().length<2){ setError("Poora naam daalein"); return; }
    if(!/^[6-9]\d{9}$/.test(mobile)){ setError("Valid 10-digit mobile number daalein"); return; }
    setLoading(true);
    try {
      const result = await fbSendOtp(mobile);
      setConfirmationResult(result);
      setStep(2); setTimer(30);
    } catch (err) {
      console.error(err);
      setError(err?.message?.includes("too-many-requests") ? "Bahut zyada attempts. Thodi der baad try karein." : "OTP bhejne mein dikkat hui. Number check karke dobara try karein.");
    }
    setLoading(false);
  };

  // Step 2 — confirm the OTP the user typed, then create/fetch their Firestore profile
  const verifyOtp = async () => {
    setError("");
    if(otp.length!==6){ setError("6-digit OTP daalein"); return; }
    setLoading(true);
    try {
      const fbUser = await fbConfirmOtp(confirmationResult, otp);
      let profile = await getUserProfile(fbUser.uid);
      if(mode==="signup"){
        if(!profile){
          await createUserProfile(fbUser.uid, { name: name.trim(), mobile, role });
          profile = await getUserProfile(fbUser.uid);
        }
        onSuccess(profile, "signup");
      } else {
        if(!profile){ setError("Account nahi mila. Pehle Sign Up karein."); setLoading(false); return; }
        onSuccess(profile, "signin");
      }
    } catch (err) {
      console.error(err);
      setError("OTP galat hai ya expire ho gaya. Dobara check karein.");
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden" onClick={e=>e.stopPropagation()}>
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-slate-100">
          <div className="flex justify-between items-center mb-1">
            <RoomloLogo/>
            <button onClick={onClose} className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-200 text-sm">✕</button>
          </div>
        </div>

        <div className="p-6">
          {/* Step dots */}
          <div className="flex items-center gap-2 mb-5">
            {[1,2].map(s=>(
              <div key={s} className="flex items-center gap-2">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${step>=s?"text-white":"bg-slate-100 text-slate-400"}`} style={step>=s?{background:"linear-gradient(135deg,#2563EB,#06B6D4)"}:{}}>
                  {step>s?"✓":s}
                </div>
                {s<2 && <div className={`h-0.5 w-6 rounded ${step>s?"bg-blue-500":"bg-slate-200"}`}/>}
              </div>
            ))}
            <span className="text-xs text-slate-400 ml-1">{step===1?"Details":"OTP verify"}</span>
          </div>

          {step===1 && (
            <>
              <h2 className="text-xl font-extrabold text-slate-800 mb-1" style={{fontFamily:"'Sora',sans-serif"}}>
                {mode==="signup"?"Account Banao 🏠":"Wapas Aao 👋"}
              </h2>
              <p className="text-slate-400 text-xs mb-5">{mode==="signup"?"Free account — 1 minute ka kaam":"Mobile se OTP login"}</p>

              {mode==="signup" && (
                <div className="flex bg-slate-100 rounded-xl p-1 mb-4 gap-1">
                  {[{v:"renter",icon:"🏠",label:"Room Dhundhna"},{v:"owner",icon:"🔑",label:"Room List Karna"}].map(r=>(
                    <button key={r.v} onClick={()=>setRole(r.v)} className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-bold transition-all ${role===r.v?"text-white shadow":"text-slate-500"}`} style={role===r.v?{background:"linear-gradient(135deg,#2563EB,#06B6D4)"}:{}}>
                      {r.icon} {r.label}
                    </button>
                  ))}
                </div>
              )}

              <div className="space-y-3">
                {mode==="signup" && (
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">👤</span>
                    <input value={name} onChange={e=>setName(e.target.value)} placeholder="Poora naam" className="w-full pl-9 pr-4 py-3 border-2 border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-400 transition-colors"/>
                  </div>
                )}
                <div className="relative flex items-center">
                  <span className="absolute left-3.5 text-xs font-bold text-slate-500">+91</span>
                  <div className="absolute left-12 w-px h-5 bg-slate-200"/>
                  <input value={mobile} onChange={e=>setMobile(e.target.value.replace(/\D/g,"").slice(0,10))} placeholder="98765 43210" type="tel" inputMode="numeric"
                    className="w-full pl-14 pr-4 py-3 border-2 border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-400 transition-colors font-medium tracking-wider"
                    onKeyDown={e=>e.key==="Enter"&&sendOtp()}/>
                </div>
                {error && <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-xs font-semibold px-3 py-2.5 rounded-xl">⚠️ {error}</div>}
                <button onClick={sendOtp} disabled={loading} className="w-full py-3.5 rounded-2xl text-white font-bold text-sm hover:opacity-90 transition disabled:opacity-50" style={{background:"linear-gradient(135deg,#2563EB,#06B6D4)"}}>
                  {loading ? <span className="flex items-center justify-center gap-2"><svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="4"/><path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Bhej rahe hain...</span> : "OTP Bhejo →"}
                </button>
              </div>
              <p className="text-center text-xs text-slate-400 mt-4">
                {mode==="signup"?"Account hai? ":"Naya account? "}
                <button onClick={switchMode} className="font-bold text-blue-600 hover:underline">{mode==="signup"?"Sign In":"Sign Up"}</button>
              </p>
            </>
          )}

          {step===2 && (
            <>
              <div className="text-center mb-5">
                <div className="w-14 h-14 rounded-2xl mx-auto mb-3 flex items-center justify-center text-3xl bg-blue-50">📱</div>
                <h2 className="text-lg font-extrabold text-slate-800 mb-1">OTP Daalein</h2>
                <p className="text-slate-400 text-xs">+91 {mobile} pe bheja gaya</p>
              </div>
              <div className="mb-4"><OtpInput value={otp} onChange={setOtp}/></div>
              {error && <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-xs font-semibold px-3 py-2.5 rounded-xl mb-3">⚠️ {error}</div>}
              <button onClick={verifyOtp} disabled={loading||otp.length!==6} className="w-full py-3.5 rounded-2xl text-white font-bold text-sm hover:opacity-90 transition disabled:opacity-40" style={{background:"linear-gradient(135deg,#2563EB,#06B6D4)"}}>
                {loading ? <span className="flex items-center justify-center gap-2"><svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="4"/><path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Verify ho raha hai...</span> : "✓ Verify & Login"}
              </button>
              <div className="flex justify-between mt-3">
                <button onClick={()=>{setStep(1);setOtp("");setError("");}} className="text-xs text-slate-400 hover:text-slate-600 font-medium">← Wapas</button>
                {timer>0 ? <span className="text-xs text-slate-400">{timer}s mein resend</span>
                  : <button onClick={sendOtp} className="text-xs font-bold text-blue-600 hover:underline">Dobara Bhejo</button>}
              </div>
            </>
          )}
        </div>
      </div>
      {/* Invisible reCAPTCHA required by Firebase Phone Auth */}
      <div id="recaptcha-container"></div>
    </div>
  );
}

// ══════════════════════════════════════════
// DASHBOARD MODAL
// ══════════════════════════════════════════
function DashboardModal({user, onClose, onLogout, savedIds, rooms}) {
  const [tab, setTab] = useState("overview");
  const savedRooms = rooms.filter(r=>savedIds.includes(r.id));
  const joinDate = new Date(user.joinedAt).toLocaleDateString("en-IN",{year:"numeric",month:"short",day:"numeric"});
  const daysSince = Math.max(1,Math.floor((Date.now()-new Date(user.joinedAt))/(1000*60*60*24)));

  const stats = [
    {label:"Saved Rooms", value:savedRooms.length, icon:"❤️", color:"#ef4444"},
    {label:"Days Active",  value:daysSince,         icon:"📅", color:"#10b981"},
    {label:"Rooms Viewed", value:12,                icon:"👁️", color:"#3b82f6"},
    {label:"Inquiries",    value:3,                 icon:"💬", color:"#8b5cf6"},
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[88vh] overflow-y-auto" onClick={e=>e.stopPropagation()}>
        {/* Banner */}
        <div className="relative px-6 pt-6 pb-5 rounded-t-3xl overflow-hidden" style={{background:"linear-gradient(135deg,#1e3a8a,#0e7490)"}}>
          <div className="absolute right-0 top-0 w-40 h-40 rounded-full opacity-10 bg-white" style={{transform:"translate(30%,-30%)"}}/>
          <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 text-white flex items-center justify-center text-sm hover:bg-white/30">✕</button>
          <div className="flex items-center gap-3 mb-4 relative z-10">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-lg" style={{background:"rgba(255,255,255,0.2)"}}>
              {user.name[0].toUpperCase()}
            </div>
            <div>
              <p className="text-white font-extrabold text-lg leading-tight">{user.name}</p>
              <p className="text-blue-200 text-xs">+91 {user.mobile}</p>
              <span className={`inline-block text-xs font-bold px-2 py-0.5 rounded-full mt-1 ${user.role==="owner"?"bg-amber-400/30 text-amber-200":"bg-blue-400/30 text-blue-100"}`}>
                {user.role==="owner"?"🔑 Room Owner":"🏠 Renter"}
              </span>
            </div>
          </div>
          <p className="text-blue-300 text-xs relative z-10">Member since {joinDate}</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-0 border-b border-slate-100">
          {stats.map(s=>(
            <div key={s.label} className="text-center py-4 border-r border-slate-100 last:border-r-0">
              <div className="text-xl mb-1">{s.icon}</div>
              <div className="text-lg font-extrabold text-slate-800">{s.value}</div>
              <div className="text-[10px] text-slate-400 font-medium leading-tight px-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex bg-slate-50 border-b border-slate-100">
          {[{v:"overview",label:"Overview"},{v:"saved",label:`Saved (${savedRooms.length})`},{v:"profile",label:"Profile"}].map(t=>(
            <button key={t.v} onClick={()=>setTab(t.v)} className={`flex-1 py-3 text-xs font-bold transition-all border-b-2 ${tab===t.v?"border-blue-600 text-blue-600 bg-white":"border-transparent text-slate-500"}`}>
              {t.label}
            </button>
          ))}
        </div>

        <div className="p-5">
          {/* Overview tab */}
          {tab==="overview" && (
            <div className="space-y-3">
              <h3 className="font-extrabold text-slate-700 text-sm">Recent Activity</h3>
              {[
                {icon:"🔍",text:"PG near Infosys search kiya",time:"2 ghante pehle"},
                {icon:"❤️",text:"Premium Studio save kiya",time:"3 ghante pehle"},
                {icon:"✅",text:"Account banaya",time:joinDate},
              ].map((a,i)=>(
                <div key={i} className="flex items-center gap-3 bg-slate-50 rounded-xl px-4 py-3">
                  <span className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-base shadow-sm">{a.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-700 truncate">{a.text}</p>
                    <p className="text-xs text-slate-400">{a.time}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Saved tab */}
          {tab==="saved" && (
            <div className="space-y-3">
              {savedRooms.length===0 ? (
                <div className="text-center py-10">
                  <div className="text-4xl mb-2">🤍</div>
                  <p className="text-slate-400 text-sm font-medium">Koi saved room nahi</p>
                  <p className="text-slate-300 text-xs mt-1">Room pe ❤️ tap karo</p>
                </div>
              ) : savedRooms.map(r=>(
                <div key={r.id} className="flex gap-3 bg-slate-50 rounded-2xl p-3 border border-slate-100">
                  <img src={r.img} alt={r.title} className="w-18 h-14 rounded-xl object-cover shrink-0 w-16" onError={e=>e.target.src="https://images.unsplash.com/photo-1484154218962-a197022b5858?w=600"}/>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-800 text-sm truncate">{r.title}</p>
                    <p className="text-xs text-slate-400 truncate">📍 {r.area}</p>
                    <p className="text-blue-600 font-extrabold text-sm">₹{r.rent.toLocaleString()}<span className="text-slate-400 font-normal text-xs">/mo</span></p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Profile tab */}
          {tab==="profile" && (
            <div className="space-y-3">
              {[
                {icon:"👤",label:"Naam",value:user.name},
                {icon:"📱",label:"Mobile",value:"+91 "+user.mobile},
                {icon:"🏷️",label:"Role",value:user.role==="owner"?"Room Owner":"Room Seeker"},
                {icon:"📅",label:"Joined",value:joinDate},
                {icon:"🔐",label:"User ID",value:"#"+user.id.slice(-6)},
              ].map(f=>(
                <div key={f.label} className="flex items-center gap-3 bg-slate-50 rounded-xl px-4 py-3">
                  <span className="text-lg w-7 text-center">{f.icon}</span>
                  <div>
                    <p className="text-xs text-slate-400">{f.label}</p>
                    <p className="text-sm font-bold text-slate-700">{f.value}</p>
                  </div>
                </div>
              ))}
              <button onClick={()=>{onLogout();onClose();}} className="w-full mt-2 py-3.5 rounded-2xl border-2 border-red-200 text-red-500 font-bold text-sm hover:bg-red-50 transition flex items-center justify-center gap-2">
                🚪 Logout Karein
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════
// ROOM CARD
// ══════════════════════════════════════════
function RoomCard({room, onClick, savedIds, onToggleSave}) {
  const saved = savedIds.includes(room.id);
  return (
    <div onClick={()=>onClick(room)} className="group relative bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 cursor-pointer border border-slate-100 hover:-translate-y-1">
      <div className="relative overflow-hidden h-52">
        <img src={room.img} alt={room.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" onError={e=>e.target.src="https://images.unsplash.com/photo-1484154218962-a197022b5858?w=600"}/>
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"/>
        {room.badge&&<span className={`absolute top-3 left-3 text-white text-xs font-bold px-2.5 py-1 rounded-full bg-gradient-to-r ${BADGE_GRAD[room.badge]||"from-blue-500 to-cyan-500"} shadow-lg`}>{room.badge}</span>}
        <button onClick={e=>{e.stopPropagation();onToggleSave(room.id);}} className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 backdrop-blur flex items-center justify-center shadow hover:scale-110 transition-transform">
          {saved?"❤️":"🤍"}
        </button>
        <div className="absolute bottom-3 left-3 flex gap-1.5 flex-wrap">
          {room.verified&&<VerifiedBadge type="room"/>}
          {room.ownerVerified&&<VerifiedBadge type="owner"/>}
        </div>
      </div>
      <div className="p-4">
        <div className="flex justify-between items-start mb-1">
          <h3 className="font-bold text-slate-800 text-base leading-tight flex-1 mr-2">{room.title}</h3>
          <div className="text-right shrink-0"><div className="text-lg font-extrabold text-blue-600">₹{room.rent.toLocaleString()}</div><div className="text-xs text-slate-400">/month</div></div>
        </div>
        <p className="text-slate-500 text-sm mb-1">📍 {room.area}</p>
        <p className="text-xs text-slate-400 mb-2">{room.distance}</p>
        <div className="flex flex-wrap gap-1.5 mb-3">
          {room.amenities.slice(0,4).map(a=><span key={a} className="text-xs bg-slate-50 text-slate-600 px-2 py-0.5 rounded-full border border-slate-200">{A_ICONS[a]||"•"} {a}</span>)}
          {room.amenities.length>4&&<span className="text-xs text-blue-500">+{room.amenities.length-4} more</span>}
        </div>
        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-cyan-400 flex items-center justify-center text-white text-xs font-bold">{room.owner[0]}</div>
            <span className="text-xs text-slate-600 font-medium">{room.owner}</span>
          </div>
          <span className="text-amber-500 text-sm font-bold">★ {room.rating} <span className="text-slate-400 font-normal">({room.reviews})</span></span>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════
// ADD ROOM MODAL
// ══════════════════════════════════════════
function AddRoomModal({onClose, onSave}) {
  const [form, setForm] = useState({title:"",area:"",rent:"",type:"Studio",gender:"Any",furnished:"Fully Furnished",amenities:[],img:"",owner:"",distance:""});
  const [loading, setLoading] = useState(false);
  const set = (k,v) => setForm(f=>({...f,[k]:v}));
  const toggleA = (a) => set("amenities", form.amenities.includes(a)?form.amenities.filter(x=>x!==a):[...form.amenities,a]);

  const handleSave = async () => {
    if(!form.title||!form.area||!form.rent||!form.owner) return;
    setLoading(true);
    const newRoom = {...form, rent:parseInt(form.rent)||0, id:String(Date.now()), rating:4.0, reviews:0, verified:false, ownerVerified:true, badge:"New",
      img:form.img||"https://images.unsplash.com/photo-1484154218962-a197022b5858?w=600&q=80", distance:form.distance||"Location TBD"};
    await onSave(newRoom);
    setLoading(false); onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={e=>e.stopPropagation()}>
        <div className="p-6 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white rounded-t-3xl z-10">
          <div><h2 className="text-lg font-extrabold text-slate-800">🏠 Apna Room List Karo</h2><p className="text-xs text-slate-400">Data save hoga — refresh ke baad bhi dikhega</p></div>
          <button onClick={onClose} className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-500">✕</button>
        </div>
        <div className="p-6 space-y-4">
          <div><label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Room Title *</label>
            <input value={form.title} onChange={e=>set("title",e.target.value)} placeholder="e.g. Spacious Studio near Metro" className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400"/></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Area / City *</label>
              <input value={form.area} onChange={e=>set("area",e.target.value)} placeholder="e.g. Koramangala, Bangalore" className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400"/></div>
            <div><label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Rent (₹) *</label>
              <input value={form.rent} onChange={e=>set("rent",e.target.value)} type="number" placeholder="8000" className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400"/></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Room Type</label>
              <select value={form.type} onChange={e=>set("type",e.target.value)} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400 bg-white">
                {TYPES.filter(t=>t!=="All").map(t=><option key={t}>{t}</option>)}</select></div>
            <div><label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Gender</label>
              <select value={form.gender} onChange={e=>set("gender",e.target.value)} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400 bg-white">
                {GENDER_OPTIONS.map(g=><option key={g}>{g}</option>)}</select></div>
          </div>
          <div><label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Furnishing</label>
            <div className="flex gap-2">
              {FURNISHED_OPTIONS.map(f=>(
                <button key={f} onClick={()=>set("furnished",f)} className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${form.furnished===f?"text-white border-transparent":"bg-white text-slate-500 border-slate-200"}`} style={form.furnished===f?{background:"linear-gradient(135deg,#2563EB,#06B6D4)"}:{}}>
                  {f.replace(" Furnished","").replace("Unfurnished","Bare")}</button>))}</div></div>
          <div><label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Amenities</label>
            <div className="flex flex-wrap gap-2">
              {Object.keys(A_ICONS).map(a=>(
                <button key={a} onClick={()=>toggleA(a)} className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${form.amenities.includes(a)?"text-white border-transparent":"bg-white text-slate-500 border-slate-200"}`} style={form.amenities.includes(a)?{background:"linear-gradient(135deg,#2563EB,#06B6D4)"}:{}}>
                  {A_ICONS[a]} {a}</button>))}</div></div>
          <div><label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Owner Name *</label>
            <input value={form.owner} onChange={e=>set("owner",e.target.value)} placeholder="Aapka naam" className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400"/></div>
          <div><label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Nearby Landmark</label>
            <input value={form.distance} onChange={e=>set("distance",e.target.value)} placeholder="e.g. 0.5km from Metro" className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400"/></div>
          <div><label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Image URL (optional)</label>
            <input value={form.img} onChange={e=>set("img",e.target.value)} placeholder="https://..." className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400"/></div>
          <button onClick={handleSave} disabled={loading||!form.title||!form.area||!form.rent||!form.owner} className="w-full py-4 rounded-2xl text-white font-bold text-sm hover:opacity-90 transition disabled:opacity-40" style={{background:"linear-gradient(135deg,#2563EB,#06B6D4)"}}>
            {loading?"Saving...":"💾 Room List Karo & Save Karo"}</button>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════
// PAYMENT MODAL (₹20 to unlock chat)
// ══════════════════════════════════════════
function PaymentModal({room, user, onClose, onSuccess}) {
  const [step, setStep] = useState("checkout"); // checkout | processing | done
  const [method, setMethod] = useState("upi");
  const [upiId, setUpiId] = useState("");
  const [cardNo, setCardNo] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [error, setError] = useState("");

  const handlePay = async () => {
    setError("");
    if(method==="upi" && !upiId.includes("@")){ setError("Valid UPI ID daalein (e.g. name@upi)"); return; }
    if(method==="card"){
      if(cardNo.replace(/\s/g,"").length!==16){ setError("16-digit card number daalein"); return; }
      if(!expiry.match(/^\d{2}\/\d{2}$/)){ setError("Expiry MM/YY format mein daalein"); return; }
      if(cvv.length!==3){ setError("3-digit CVV daalein"); return; }
    }
    setStep("processing");
    await new Promise(r=>setTimeout(r,2000));
    setStep("done");
  };

  const formatCard = (v) => v.replace(/\D/g,"").slice(0,16).replace(/(.{4})/g,"$1 ").trim();
  const formatExpiry = (v) => { const d=v.replace(/\D/g,"").slice(0,4); return d.length>2?d.slice(0,2)+"/"+d.slice(2):d; };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={step!=="processing"?onClose:null}>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden" onClick={e=>e.stopPropagation()}>

        {/* Processing */}
        {step==="processing" && (
          <div className="p-10 text-center">
            <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{background:"linear-gradient(135deg,#2563EB,#06B6D4)"}}>
              <svg className="animate-spin w-8 h-8 text-white" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="4"/><path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
            </div>
            <h3 className="text-lg font-extrabold text-slate-800 mb-1">Payment Process Ho Raha Hai</h3>
            <p className="text-slate-400 text-sm">Thoda wait karein...</p>
          </div>
        )}

        {/* Success */}
        {step==="done" && (
          <div className="p-10 text-center">
            <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center bg-emerald-100 text-4xl">✅</div>
            <h3 className="text-xl font-black text-slate-800 mb-1" style={{fontFamily:"'Sora',sans-serif"}}>Payment Successful!</h3>
            <p className="text-slate-500 text-sm mb-1">₹20 payment ho gayi</p>
            <p className="text-emerald-600 font-bold text-sm mb-6">Ab aap {room.owner} se chat kar sakte hain!</p>
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl px-4 py-3 mb-5 text-left">
              <p className="text-xs text-emerald-600 font-semibold mb-1">Transaction ID</p>
              <p className="font-mono text-sm font-bold text-slate-700">TXN{Date.now().toString().slice(-10)}</p>
            </div>
            <button onClick={onSuccess} className="w-full py-4 rounded-2xl text-white font-bold text-sm" style={{background:"linear-gradient(135deg,#059669,#0d9488)"}}>
              💬 Chat Kholein →
            </button>
          </div>
        )}

        {/* Checkout */}
        {step==="checkout" && (
          <>
            <div className="px-6 pt-6 pb-4 border-b border-slate-100">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-extrabold text-slate-800">💬 Chat Unlock Karein</h2>
                <button onClick={onClose} className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-400">✕</button>
              </div>
            </div>

            {/* Order summary */}
            <div className="mx-5 mt-4 bg-blue-50 border border-blue-100 rounded-2xl p-4 flex items-center gap-3">
              <img src={room.img} className="w-12 h-12 rounded-xl object-cover shrink-0" onError={e=>e.target.src="https://images.unsplash.com/photo-1484154218962-a197022b5858?w=100"}/>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-slate-800 text-sm truncate">{room.title}</p>
                <p className="text-xs text-slate-500">Owner: {room.owner}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xl font-black text-blue-600">₹20</p>
                <p className="text-xs text-slate-400">one-time</p>
              </div>
            </div>

            <div className="p-5 space-y-4">
              {/* Payment method tabs */}
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Payment Method</p>
                <div className="flex gap-2">
                  {[{v:"upi",icon:"📱",label:"UPI"},{v:"card",icon:"💳",label:"Card"},{v:"netbanking",icon:"🏦",label:"Net Banking"}].map(m=>(
                    <button key={m.v} onClick={()=>setMethod(m.v)} className={`flex-1 flex flex-col items-center py-2.5 rounded-xl border-2 text-xs font-bold transition-all ${method===m.v?"border-blue-500 text-blue-600 bg-blue-50":"border-slate-200 text-slate-500 hover:border-blue-200"}`}>
                      <span className="text-lg mb-0.5">{m.icon}</span>{m.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* UPI */}
              {method==="upi" && (
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">UPI ID</label>
                  <input value={upiId} onChange={e=>setUpiId(e.target.value)} placeholder="yourname@upi" className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400 transition"/>
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {["@okaxis","@paytm","@ybl","@ibl"].map(s=>(
                      <button key={s} onClick={()=>setUpiId(upiId.split("@")[0]+s)} className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full hover:bg-blue-50 hover:text-blue-600 transition font-medium">{s}</button>
                    ))}
                  </div>
                </div>
              )}

              {/* Card */}
              {method==="card" && (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Card Number</label>
                    <input value={cardNo} onChange={e=>setCardNo(formatCard(e.target.value))} placeholder="1234 5678 9012 3456" maxLength={19} className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400 font-mono tracking-wider transition"/>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Expiry</label>
                      <input value={expiry} onChange={e=>setExpiry(formatExpiry(e.target.value))} placeholder="MM/YY" maxLength={5} className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400 transition"/>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">CVV</label>
                      <input value={cvv} onChange={e=>setCvv(e.target.value.replace(/\D/g,"").slice(0,3))} placeholder="•••" type="password" maxLength={3} className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400 transition"/>
                    </div>
                  </div>
                </div>
              )}

              {/* Net Banking */}
              {method==="netbanking" && (
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Bank Select Karein</label>
                  <div className="grid grid-cols-2 gap-2">
                    {["SBI","HDFC","ICICI","Axis","Kotak","PNB"].map(b=>(
                      <button key={b} className="border-2 border-slate-200 hover:border-blue-400 hover:bg-blue-50 rounded-xl py-2.5 text-sm font-bold text-slate-600 transition">{b}</button>
                    ))}
                  </div>
                </div>
              )}

              {error && <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-xs font-semibold px-3 py-2.5 rounded-xl">⚠️ {error}</div>}

              <button onClick={handlePay} className="w-full py-4 rounded-2xl text-white font-bold text-sm hover:opacity-90 transition flex items-center justify-center gap-2" style={{background:"linear-gradient(135deg,#2563EB,#06B6D4)"}}>
                🔒 ₹20 Pay Karein & Chat Kholein
              </button>
              <p className="text-center text-xs text-slate-400">🔐 Secure payment · One-time charge · Instant unlock</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════
// CHAT MODAL (unlocked after payment)
// ══════════════════════════════════════════
function ChatModal({room, user, onClose}) {
  const [messages, setMessages] = useState([
    {from:"owner", text:`Namaste! Main ${room.owner} hoon. Aapka room ke baare mein koi sawaal?`, time:"10:30 AM"},
    {from:"owner", text:`${room.title} abhi available hai. Kab dekhna chahenge?`, time:"10:31 AM"},
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef(null);
  const chatUid = user?.id || "guest";

  useEffect(()=>{
    (async()=>{
      try {
        const saved = await getChatMessages(room.id, chatUid);
        if(saved?.length) setMessages(saved);
      } catch (err) { console.error(err); }
    })();
  },[]);

  useEffect(()=>{ bottomRef.current?.scrollIntoView({behavior:"smooth"}); },[messages, typing]);

  const ownerReplies = [
    "Haan bilkul! Room July 1st se available hai.",
    "Visit ke liye koi bhi weekday ya weekend theek hai.",
    "Advance sirf 2 mahine ka hai, baaki monthly dena hoga.",
    "Bijli aur paani included hai rent mein.",
    "Parking ka extra charge nahi hai.",
    "Near metro station hai, sirf 5 minute walk.",
    "AC aur WiFi dono included hain.",
    "Baki tenants bahut cooperative hain, koi problem nahi hogi.",
  ];

  const sendMsg = async () => {
    if(!input.trim()) return;
    const now = new Date().toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"});
    const userMsg = {from:"user", text:input.trim(), time:now};
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput("");
    setTyping(true);
    await saveChatMessages(room.id, chatUid, updated);

    // Simulate owner reply
    await new Promise(r=>setTimeout(r, 1200+Math.random()*800));
    const reply = {from:"owner", text:ownerReplies[Math.floor(Math.random()*ownerReplies.length)], time:new Date().toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"})};
    const final = [...updated, reply];
    setMessages(final);
    setTyping(false);
    await saveChatMessages(room.id, chatUid, final);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden" style={{height:"85vh",maxHeight:"600px"}} onClick={e=>e.stopPropagation()}>

        {/* Chat Header */}
        <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-3 shrink-0" style={{background:"linear-gradient(135deg,#2563EB,#06B6D4)"}}>
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white font-black text-lg shrink-0">{room.owner[0]}</div>
          <div className="flex-1 min-w-0">
            <p className="font-extrabold text-white text-sm leading-none">{room.owner}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <div className="w-2 h-2 rounded-full bg-emerald-400"/>
              <p className="text-blue-100 text-xs">Online · Room Owner</p>
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="text-white/80 text-xs font-medium truncate max-w-24">{room.title}</p>
            <p className="text-blue-200 text-xs">💰 ₹{room.rent?.toLocaleString()}/mo</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/20 text-white flex items-center justify-center hover:bg-white/30 shrink-0 ml-1">✕</button>
        </div>

        {/* Unlock badge */}
        <div className="mx-4 mt-3 mb-1 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2 flex items-center gap-2 shrink-0">
          <span className="text-emerald-600">🔓</span>
          <p className="text-xs text-emerald-700 font-semibold">Chat unlocked hai — ₹20 payment verified</p>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 bg-slate-50">
          {messages.map((m,i)=>(
            <div key={i} className={`flex ${m.from==="user"?"justify-end":"justify-start"}`}>
              {m.from==="owner" && (
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-cyan-400 flex items-center justify-center text-white text-xs font-bold mr-2 mt-1 shrink-0">{room.owner[0]}</div>
              )}
              <div className={`max-w-[75%] ${m.from==="user"?"":"mr-2"}`}>
                <div className={`px-4 py-2.5 rounded-2xl text-sm ${m.from==="user"?"text-white rounded-tr-sm":"bg-white text-slate-800 shadow-sm rounded-tl-sm border border-slate-100"}`} style={m.from==="user"?{background:"linear-gradient(135deg,#2563EB,#06B6D4)"}:{}}>
                  {m.text}
                </div>
                <p className={`text-xs text-slate-400 mt-0.5 ${m.from==="user"?"text-right":"text-left"}`}>{m.time}</p>
              </div>
            </div>
          ))}
          {typing && (
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-cyan-400 flex items-center justify-center text-white text-xs font-bold shrink-0">{room.owner[0]}</div>
              <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm border border-slate-100 flex gap-1">
                {[0,1,2].map(i=><div key={i} className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{animationDelay:`${i*0.15}s`}}/>)}
              </div>
            </div>
          )}
          <div ref={bottomRef}/>
        </div>

        {/* Quick replies */}
        <div className="px-4 pt-2 flex gap-2 overflow-x-auto shrink-0 bg-white">
          {["Room kab available hai?","Advance kitna lagega?","Visit schedule karein","Parking available hai?"].map(q=>(
            <button key={q} onClick={()=>setInput(q)} className="shrink-0 text-xs bg-blue-50 text-blue-600 border border-blue-200 px-3 py-1.5 rounded-full hover:bg-blue-100 transition font-medium whitespace-nowrap">{q}</button>
          ))}
        </div>

        {/* Input */}
        <div className="px-4 py-3 border-t border-slate-100 flex gap-2 items-center bg-white shrink-0">
          <input
            value={input} onChange={e=>setInput(e.target.value)}
            onKeyDown={e=>e.key==="Enter"&&sendMsg()}
            placeholder="Message likhein..."
            className="flex-1 bg-slate-100 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 transition"
          />
          <button onClick={sendMsg} disabled={!input.trim()} className="w-11 h-11 rounded-2xl flex items-center justify-center text-white transition disabled:opacity-40 shrink-0" style={{background:"linear-gradient(135deg,#2563EB,#06B6D4)"}}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════
// SAVED ROOMS MODAL
// ══════════════════════════════════════════
function SavedModal({rooms, savedIds, onClose, onToggleSave, onView}) {
  const saved = rooms.filter(r=>savedIds.includes(r.id));
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto" onClick={e=>e.stopPropagation()}>
        <div className="p-5 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white rounded-t-3xl">
          <div><h2 className="text-lg font-extrabold text-slate-800">❤️ Saved Rooms</h2><p className="text-xs text-slate-400">{saved.length} saved</p></div>
          <button onClick={onClose} className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-500">✕</button>
        </div>
        <div className="p-4 space-y-3">
          {saved.length===0?(
            <div className="text-center py-14"><div className="text-5xl mb-3">🤍</div><p className="text-slate-400 font-medium">Koi room save nahi kiya</p></div>
          ):saved.map(r=>(
            <div key={r.id} className="flex gap-3 bg-slate-50 rounded-2xl p-3 border border-slate-100">
              <img src={r.img} alt={r.title} className="w-20 h-16 rounded-xl object-cover shrink-0" onError={e=>e.target.src="https://images.unsplash.com/photo-1484154218962-a197022b5858?w=600"}/>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-slate-800 text-sm truncate">{r.title}</p>
                <p className="text-slate-400 text-xs truncate">📍 {r.area}</p>
                <p className="text-blue-600 font-extrabold text-sm">₹{r.rent.toLocaleString()}<span className="text-slate-400 font-normal text-xs">/mo</span></p>
              </div>
              <div className="flex flex-col gap-1.5 shrink-0">
                <button onClick={()=>{onView(r);onClose();}} className="px-3 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-lg">View</button>
                <button onClick={()=>onToggleSave(r.id)} className="px-3 py-1.5 bg-red-50 text-red-500 text-xs font-bold rounded-lg">Remove</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════
// ROOM DETAIL MODAL
// ══════════════════════════════════════════
function RoomModal({room, onClose, savedIds, onToggleSave, user}) {
  const [tab,setTab]=useState("details");
  const [showPayment, setShowPayment] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [chatUnlocked, setChatUnlocked] = useState(false);

  useEffect(()=>{
    if(!room) return;
    (async()=>{
      try {
        const unlocked = await isChatUnlocked(room.id, user?.id||"guest");
        if(unlocked) setChatUnlocked(true);
      } catch (err) { console.error(err); }
    })();
  },[room]);

  const handlePaymentSuccess = async () => {
    await unlockChat(room.id, user?.id||"guest");
    setChatUnlocked(true);
    setShowPayment(false);
    setShowChat(true);
  };

  if(!room) return null;
  const saved = savedIds.includes(room.id);
  return(
    <>
    {showPayment && <PaymentModal room={room} user={user} onClose={()=>setShowPayment(false)} onSuccess={handlePaymentSuccess}/>}
    {showChat && <ChatModal room={room} user={user} onClose={()=>setShowChat(false)}/>}
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={e=>e.stopPropagation()}>
        <div className="relative h-64 rounded-t-3xl overflow-hidden">
          <img src={room.img} alt={room.title} className="w-full h-full object-cover" onError={e=>e.target.src="https://images.unsplash.com/photo-1484154218962-a197022b5858?w=600"}/>
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"/>
          <button onClick={onClose} className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/20 backdrop-blur text-white flex items-center justify-center text-lg">✕</button>
          <button onClick={()=>onToggleSave(room.id)} className="absolute top-4 right-16 w-9 h-9 rounded-full bg-white/20 backdrop-blur text-white flex items-center justify-center text-lg">{saved?"❤️":"🤍"}</button>
          {room.badge&&<span className={`absolute top-4 left-4 text-white text-xs font-bold px-2.5 py-1 rounded-full bg-gradient-to-r ${BADGE_GRAD[room.badge]||"from-blue-500 to-cyan-500"}`}>{room.badge}</span>}
        </div>
        <div className="p-6">
          <div className="flex justify-between items-start mb-3">
            <div><h2 className="text-xl font-extrabold text-slate-800 mb-1">{room.title}</h2><p className="text-slate-500 text-sm">📍 {room.area} · {room.distance}</p></div>
            <div className="text-right"><div className="text-2xl font-extrabold text-blue-600">₹{room.rent.toLocaleString()}</div><div className="text-xs text-slate-400">/month</div></div>
          </div>
          <div className="flex gap-2 flex-wrap mb-4">
            {room.verified&&<VerifiedBadge type="room"/>}{room.ownerVerified&&<VerifiedBadge type="owner"/>}
            <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{room.type}</span>
            <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{room.gender}</span>
            <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{room.furnished}</span>
          </div>
          <div className="flex border-b border-slate-200 mb-5 gap-6">
            {["details","amenities","reviews"].map(t=>(
              <button key={t} onClick={()=>setTab(t)} className={`pb-2 text-sm font-semibold capitalize border-b-2 transition-all ${tab===t?"border-blue-600 text-blue-600":"border-transparent text-slate-500"}`}>{t}</button>
            ))}
          </div>
          {tab==="details"&&(<div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {[["Room Type",room.type],["For",room.gender],["Furnished",room.furnished],["Distance",room.distance]].map(([k,v])=>(
                <div key={k} className="bg-slate-50 rounded-xl p-3"><div className="text-xs text-slate-400 mb-0.5">{k}</div><div className="text-sm font-bold text-slate-700">{v}</div></div>
              ))}
            </div>
            <div className="bg-blue-50 rounded-xl p-4">
              <div className="text-xs font-bold text-blue-700 mb-2 uppercase tracking-wider">Owner Details</div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-cyan-400 flex items-center justify-center text-white font-bold text-lg">{room.owner[0]}</div>
                <div><div className="font-bold text-slate-800">{room.owner}</div>
                  {chatUnlocked
                    ? <div className="text-sm text-emerald-600 font-semibold">🔓 Chat unlocked hai!</div>
                    : <div className="text-sm text-slate-500">📱 Number hidden <span className="text-xs text-blue-500">(Chat unlock karo)</span></div>}
                </div>
              </div>
            </div>
          </div>)}
          {tab==="amenities"&&(<div className="grid grid-cols-3 gap-3">
            {room.amenities.map(a=>(
              <div key={a} className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
                <div className="text-2xl mb-1">{A_ICONS[a]||"•"}</div><div className="text-xs font-semibold text-slate-600">{a}</div>
              </div>
            ))}
          </div>)}
          {tab==="reviews"&&(<div className="space-y-3">
            {[{n:"Arjun M.",t:"Bahut achha room, saaf suthra!",s:5},{n:"Sneha P.",t:"Location badhiya, thoda shor hai.",s:4},{n:"Rahul K.",t:"Paise wasool! Recommend karunga.",s:5}].map((r,i)=>(
              <div key={i} className="bg-slate-50 rounded-xl p-4">
                <div className="flex justify-between mb-1"><span className="font-bold text-slate-700 text-sm">{r.n}</span><span className="text-amber-500">{"★".repeat(r.s)}</span></div>
                <p className="text-slate-500 text-sm">{r.t}</p>
              </div>
            ))}
          </div>)}

          {/* Chat unlock banner */}
          {!chatUnlocked && (
            <div className="mt-5 bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-2xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white text-xl shrink-0">💬</div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-slate-800 text-sm">Owner se seedha baat karein</p>
                <p className="text-xs text-slate-500">Sirf ₹20 mein chat unlock — ek baar ki payment</p>
              </div>
              <span className="text-blue-600 font-black text-lg shrink-0">₹20</span>
            </div>
          )}
          {chatUnlocked && (
            <div className="mt-5 bg-emerald-50 border border-emerald-200 rounded-2xl p-3 flex items-center gap-2">
              <span className="text-emerald-600">🔓</span>
              <p className="text-sm font-semibold text-emerald-700">Chat already unlocked hai — {room.owner} se baat karein!</p>
            </div>
          )}

          <div className="flex gap-3 mt-4">
            <button className="flex-1 py-3.5 rounded-2xl font-bold text-white text-sm" style={{background:"linear-gradient(135deg,#2563EB,#06B6D4)"}}>📅 Book Now</button>
            {chatUnlocked ? (
              <button onClick={()=>setShowChat(true)} className="flex-1 py-3.5 rounded-2xl font-bold text-white text-sm" style={{background:"linear-gradient(135deg,#059669,#0d9488)"}}>💬 Chat Kholein</button>
            ) : (
              <button onClick={()=>setShowPayment(true)} className="flex-1 py-3.5 rounded-2xl font-bold text-sm border-2 border-blue-200 text-blue-600 hover:bg-blue-50 transition flex items-center justify-center gap-1.5">
                🔒 Chat — ₹20
              </button>
            )}
            <button onClick={()=>onToggleSave(room.id)} className={`px-4 py-3.5 rounded-2xl font-bold text-sm border-2 transition ${saved?"border-red-200 text-red-500":"border-slate-200 text-slate-500"}`}>{saved?"💔":"❤️"}</button>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}

// ══════════════════════════════════════════
// ADMIN LOGIN MODAL
// ══════════════════════════════════════════
function AdminLoginModal({onClose, onSuccess}) {
  const [uname, setUname] = useState("");
  const [pass, setPass] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError("");
    if(!uname||!pass){ setError("Dono fields bharo"); return; }
    setLoading(true);
    await new Promise(r=>setTimeout(r,700));
    if(uname===ADMIN_CREDS.username && pass===ADMIN_CREDS.password){
      onSuccess();
    } else {
      setError("Galat username ya password!");
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden" onClick={e=>e.stopPropagation()}>
        <div className="px-6 pt-7 pb-5 text-center" style={{background:"linear-gradient(135deg,#0f172a,#1e3a5f)"}}>
          <div className="w-14 h-14 rounded-2xl mx-auto mb-3 flex items-center justify-center text-3xl" style={{background:"rgba(255,255,255,0.1)"}}>🛡️</div>
          <h2 className="text-xl font-black text-white mb-1" style={{fontFamily:"'Sora',sans-serif"}}>Super Admin Login</h2>
          <p className="text-slate-400 text-xs">Sirf authorized personnel ke liye</p>
        </div>
        <div className="p-6 space-y-3">
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Username</label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">👤</span>
              <input value={uname} onChange={e=>setUname(e.target.value)} placeholder="admin username" className="w-full pl-9 pr-4 py-3 border-2 border-slate-200 rounded-xl text-sm focus:outline-none focus:border-slate-500 transition-colors" onKeyDown={e=>e.key==="Enter"&&handleLogin()}/>
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Password</label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">🔒</span>
              <input value={pass} onChange={e=>setPass(e.target.value)} type={showPass?"text":"password"} placeholder="••••••••••" className="w-full pl-9 pr-10 py-3 border-2 border-slate-200 rounded-xl text-sm focus:outline-none focus:border-slate-500 transition-colors" onKeyDown={e=>e.key==="Enter"&&handleLogin()}/>
              <button onClick={()=>setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">{showPass?"🙈":"👁️"}</button>
            </div>
          </div>
          {error && <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-xs font-semibold px-3 py-2.5 rounded-xl">⚠️ {error}</div>}
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5 text-xs text-amber-700 font-medium">
            💡 Demo: <span className="font-mono font-bold">roomlo_admin</span> / <span className="font-mono font-bold">Admin@2026#</span>
          </div>
          <button onClick={handleLogin} disabled={loading} className="w-full py-3.5 rounded-2xl text-white font-bold text-sm hover:opacity-90 transition disabled:opacity-50" style={{background:"linear-gradient(135deg,#0f172a,#1e3a5f)"}}>
            {loading?<span className="flex items-center justify-center gap-2"><svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="4"/><path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Verify ho raha hai...</span>:"🛡️ Admin Login Karein"}
          </button>
          <button onClick={onClose} className="w-full py-2.5 text-xs text-slate-400 hover:text-slate-600 font-medium">Wapas jaao</button>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════
// SUPER ADMIN PANEL (full page)
// ══════════════════════════════════════════
function AdminPanel({onExit, rooms, setRooms}) {
  const [tab, setTab] = useState("dashboard");
  const [users, setUsers] = useState([]);
  const [allRooms, setAllRooms] = useState(rooms);
  const [toast, setToast] = useState(null);
  const showToast = (msg,type="success") => setToast({msg,type});

  useEffect(()=>{
    (async()=>{
      try {
        const u = await getAllUsers();
        setUsers(u);
      } catch (err) { console.error(err); }
      setAllRooms(rooms);
    })();
  },[rooms]);

  // ── Verify / Unverify room ──
  // (demo rooms baked into the app don't exist as Firestore docs, so the
  // update call is best-effort — local state always updates regardless)
  const toggleRoomVerify = async (id) => {
    const target = allRooms.find(r=>r.id===id);
    const nextVerified = !target?.verified;
    const updated = allRooms.map(r=>r.id===id?{...r,verified:nextVerified}:r);
    setAllRooms(updated);
    setRooms(prev=>prev.map(r=>r.id===id?{...r,verified:nextVerified}:r));
    try { await fbUpdateRoom(id, {verified:nextVerified}); } catch (err) { console.error(err); }
    showToast("Room verification update ho gaya");
  };

  // ── Delete room ──
  const deleteRoom = async (id) => {
    const updated = allRooms.filter(r=>r.id!==id);
    setAllRooms(updated);
    setRooms(prev=>prev.filter(r=>r.id!==id));
    try { await deleteRoomDoc(id); } catch (err) { console.error(err); }
    showToast("Room delete ho gaya","warn");
  };

  // ── Ban/Unban user ──
  const toggleBanUser = async (userId) => {
    const target = users.find(u=>u.id===userId);
    const nextBanned = !target?.banned;
    const updated = users.map(u=>u.id===userId?{...u,banned:nextBanned}:u);
    setUsers(updated);
    try { await setUserBanned(userId, nextBanned); } catch (err) { console.error(err); }
    showToast(nextBanned?"User ban ho gaya 🚫":"User unban ho gaya ✅", nextBanned?"warn":"success");
  };

  // ── Delete user ──
  const deleteUser = async (userId) => {
    const updated = users.filter(u=>u.id!==userId);
    setUsers(updated);
    try { await deleteUserDoc(userId); } catch (err) { console.error(err); }
    showToast("User delete ho gaya","warn");
  };

  const verifiedRooms = allRooms.filter(r=>r.verified).length;
  const pendingRooms  = allRooms.filter(r=>!r.verified).length;
  const bannedUsers   = users.filter(u=>u.banned).length;

  const TABS = [
    {v:"dashboard", icon:"📊", label:"Dashboard"},
    {v:"rooms",     icon:"🏠", label:`Rooms (${allRooms.length})`},
    {v:"users",     icon:"👥", label:`Users (${users.length})`},
    {v:"verify",    icon:"✅", label:`Pending (${pendingRooms})`},
  ];

  return (
    <div className="min-h-screen bg-slate-900" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
      {toast && <Toast msg={toast.msg} type={toast.type} onDone={()=>setToast(null)}/>}

      {/* Admin Navbar */}
      <nav className="bg-slate-800 border-b border-slate-700 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-600 flex items-center justify-center text-white text-lg font-black">🛡️</div>
            <div>
              <p className="text-white font-black text-base leading-none" style={{fontFamily:"'Sora',sans-serif"}}>Roomlo Admin</p>
              <p className="text-slate-400 text-xs">Super Admin Panel</p>
            </div>
          </div>
          <button onClick={onExit} className="flex items-center gap-2 bg-red-600/20 hover:bg-red-600/40 text-red-400 px-4 py-2 rounded-xl text-xs font-bold transition">
            🚪 Exit Admin
          </button>
        </div>
      </nav>

      {/* Tab bar */}
      <div className="bg-slate-800 border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 flex gap-1 overflow-x-auto">
          {TABS.map(t=>(
            <button key={t.v} onClick={()=>setTab(t.v)} className={`flex items-center gap-1.5 px-4 py-3 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${tab===t.v?"border-blue-500 text-blue-400":"border-transparent text-slate-400 hover:text-slate-200"}`}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">

        {/* ── DASHBOARD TAB ── */}
        {tab==="dashboard" && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                {label:"Total Rooms",   value:allRooms.length, icon:"🏠", color:"from-blue-600 to-cyan-600"},
                {label:"Verified",      value:verifiedRooms,   icon:"✅", color:"from-emerald-600 to-teal-600"},
                {label:"Pending",       value:pendingRooms,    icon:"⏳", color:"from-amber-600 to-orange-600"},
                {label:"Total Users",   value:users.length,    icon:"👥", color:"from-violet-600 to-purple-600"},
              ].map(s=>(
                <div key={s.label} className="bg-slate-800 rounded-2xl p-5 border border-slate-700">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center text-xl mb-3`}>{s.icon}</div>
                  <div className="text-2xl font-extrabold text-white">{s.value}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              {/* Recent Users */}
              <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-700 flex justify-between items-center">
                  <h3 className="font-extrabold text-white text-sm">👥 Recent Users</h3>
                  <button onClick={()=>setTab("users")} className="text-xs text-blue-400 font-bold">Sab dekho →</button>
                </div>
                {users.length===0 ? <div className="p-6 text-center text-slate-500 text-sm">Koi user nahi abhi</div> :
                  users.slice(-4).reverse().map(u=>(
                    <div key={u.id} className="flex items-center gap-3 px-5 py-3 border-b border-slate-700/50 last:border-0">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold text-sm">{u.name[0]}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-white truncate">{u.name}</p>
                        <p className="text-xs text-slate-400">+91 {u.mobile} · {u.role}</p>
                      </div>
                      {u.banned && <span className="text-xs bg-red-900/50 text-red-400 px-2 py-0.5 rounded-full font-bold">Banned</span>}
                    </div>
                  ))
                }
              </div>
              {/* Pending verification */}
              <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-700 flex justify-between items-center">
                  <h3 className="font-extrabold text-white text-sm">⏳ Pending Verification</h3>
                  <button onClick={()=>setTab("verify")} className="text-xs text-amber-400 font-bold">Sab dekho →</button>
                </div>
                {allRooms.filter(r=>!r.verified).length===0 ? <div className="p-6 text-center text-slate-500 text-sm">Sab rooms verified hain! ✅</div> :
                  allRooms.filter(r=>!r.verified).slice(0,3).map(r=>(
                    <div key={r.id} className="flex items-center gap-3 px-5 py-3 border-b border-slate-700/50 last:border-0">
                      <img src={r.img} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0" onError={e=>e.target.src="https://images.unsplash.com/photo-1484154218962-a197022b5858?w=100"}/>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-white truncate">{r.title}</p>
                        <p className="text-xs text-slate-400 truncate">📍 {r.area}</p>
                      </div>
                      <button onClick={()=>toggleRoomVerify(r.id)} className="text-xs bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-400 px-3 py-1.5 rounded-lg font-bold transition">Verify</button>
                    </div>
                  ))
                }
              </div>
            </div>
          </div>
        )}

        {/* ── ROOMS TAB ── */}
        {tab==="rooms" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-white font-extrabold">🏠 All Rooms ({allRooms.length})</h2>
            </div>
            {allRooms.map(r=>(
              <div key={r.id} className="bg-slate-800 rounded-2xl border border-slate-700 p-4 flex gap-4 items-center">
                <img src={r.img} alt="" className="w-16 h-14 rounded-xl object-cover shrink-0" onError={e=>e.target.src="https://images.unsplash.com/photo-1484154218962-a197022b5858?w=100"}/>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-sm font-extrabold text-white truncate">{r.title}</p>
                    {r.verified
                      ? <span className="shrink-0 text-xs bg-emerald-900/60 text-emerald-400 px-2 py-0.5 rounded-full font-bold">✓ Verified</span>
                      : <span className="shrink-0 text-xs bg-amber-900/60 text-amber-400 px-2 py-0.5 rounded-full font-bold">⏳ Pending</span>}
                  </div>
                  <p className="text-xs text-slate-400 truncate">📍 {r.area} · ₹{r.rent?.toLocaleString()}/mo · {r.type}</p>
                  <p className="text-xs text-slate-500">Owner: {r.owner}</p>
                </div>
                <div className="flex flex-col gap-1.5 shrink-0">
                  <button onClick={()=>toggleRoomVerify(r.id)} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${r.verified?"bg-amber-900/40 text-amber-400 hover:bg-amber-900/60":"bg-emerald-900/40 text-emerald-400 hover:bg-emerald-900/60"}`}>
                    {r.verified?"Unverify":"✓ Verify"}
                  </button>
                  <button onClick={()=>deleteRoom(r.id)} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-red-900/40 text-red-400 hover:bg-red-900/60 transition">🗑️ Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── USERS TAB ── */}
        {tab==="users" && (
          <div className="space-y-3">
            <h2 className="text-white font-extrabold mb-2">👥 All Users ({users.length})</h2>
            {users.length===0 ? (
              <div className="text-center py-16 bg-slate-800 rounded-2xl border border-slate-700">
                <div className="text-4xl mb-3">👤</div>
                <p className="text-slate-400">Koi registered user nahi abhi</p>
              </div>
            ) : users.map(u=>(
              <div key={u.id} className="bg-slate-800 rounded-2xl border border-slate-700 p-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-lg shrink-0" style={{background:"linear-gradient(135deg,#2563EB,#06B6D4)"}}>{u.name[0].toUpperCase()}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-sm font-extrabold text-white">{u.name}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${u.role==="owner"?"bg-amber-900/50 text-amber-400":"bg-blue-900/50 text-blue-400"}`}>{u.role==="owner"?"Owner":"Renter"}</span>
                    {u.banned && <span className="text-xs bg-red-900/60 text-red-400 px-2 py-0.5 rounded-full font-bold">🚫 Banned</span>}
                  </div>
                  <p className="text-xs text-slate-400">📱 +91 {u.mobile}</p>
                  <p className="text-xs text-slate-500">ID: #{u.id?.slice(-6)} · Joined: {new Date(u.joinedAt).toLocaleDateString("en-IN")}</p>
                </div>
                <div className="flex flex-col gap-1.5 shrink-0">
                  <button onClick={()=>toggleBanUser(u.id)} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${u.banned?"bg-emerald-900/40 text-emerald-400 hover:bg-emerald-900/60":"bg-amber-900/40 text-amber-400 hover:bg-amber-900/60"}`}>
                    {u.banned?"✅ Unban":"🚫 Ban"}
                  </button>
                  <button onClick={()=>deleteUser(u.id)} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-red-900/40 text-red-400 hover:bg-red-900/60 transition">🗑️ Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── VERIFY TAB ── */}
        {tab==="verify" && (
          <div className="space-y-3">
            <h2 className="text-white font-extrabold mb-2">⏳ Pending Room Verifications ({pendingRooms})</h2>
            {allRooms.filter(r=>!r.verified).length===0 ? (
              <div className="text-center py-16 bg-slate-800 rounded-2xl border border-slate-700">
                <div className="text-4xl mb-3">✅</div>
                <p className="text-slate-300 font-bold">Sab rooms verified hain!</p>
                <p className="text-slate-500 text-sm mt-1">Koi pending verification nahi</p>
              </div>
            ) : allRooms.filter(r=>!r.verified).map(r=>(
              <div key={r.id} className="bg-slate-800 rounded-2xl border border-amber-800/40 p-5">
                <div className="flex gap-4">
                  <img src={r.img} alt="" className="w-20 h-16 rounded-xl object-cover shrink-0" onError={e=>e.target.src="https://images.unsplash.com/photo-1484154218962-a197022b5858?w=100"}/>
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-extrabold text-white mb-1">{r.title}</p>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-xs text-slate-400 mb-3">
                      <span>📍 {r.area}</span>
                      <span>💰 ₹{r.rent?.toLocaleString()}/mo</span>
                      <span>🏷️ {r.type} · {r.gender}</span>
                      <span>👤 {r.owner}</span>
                    </div>
                    <div className="flex flex-wrap gap-1 mb-3">
                      {r.amenities?.slice(0,4).map(a=><span key={a} className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full">{A_ICONS[a]||"•"} {a}</span>)}
                    </div>
                    <div className="flex gap-2">
                      <button onClick={()=>toggleRoomVerify(r.id)} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition" style={{background:"linear-gradient(135deg,#059669,#0d9488)"}}>
                        ✅ Verify Karein
                      </button>
                      <button onClick={()=>deleteRoom(r.id)} className="px-4 py-2.5 rounded-xl text-sm font-bold bg-red-900/40 text-red-400 hover:bg-red-900/60 transition">
                        🗑️ Reject
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}

// ══════════════════════════════════════════
// SEARCH BAR
// ══════════════════════════════════════════
function SearchBar({value,onChange,onSearch}){
  const [open,setOpen]=useState(false);
  return(
    <div className="relative w-full max-w-3xl mx-auto">
      <div className="flex items-center bg-white rounded-2xl shadow-2xl overflow-hidden border-2 border-blue-100">
        <span className="pl-5 text-xl">🔍</span>
        <input className="flex-1 px-4 py-4 text-base outline-none placeholder-slate-400 font-medium" placeholder='Try "PG near Infosys Pune" or "Room under ₹8000"'
          value={value} onChange={e=>{onChange(e.target.value);setOpen(true);}} onFocus={()=>setOpen(true)} onBlur={()=>setTimeout(()=>setOpen(false),150)}/>
        <button onClick={()=>{onSearch(value);setOpen(false);}} className="m-2 px-6 py-3 rounded-xl text-white font-bold text-sm hover:opacity-90" style={{background:"linear-gradient(135deg,#2563EB,#06B6D4)"}}>Search</button>
      </div>
      {open&&(
        <div className="absolute top-full mt-2 w-full bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 overflow-hidden">
          <div className="px-4 pt-3 pb-1 text-xs font-semibold text-slate-400 uppercase tracking-wider">Popular Searches</div>
          {SUGGESTIONS.map((s,i)=>(
            <button key={i} onClick={()=>{onChange(s);setOpen(false);}} className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-blue-50 flex items-center gap-3">
              <span className="text-blue-400">🔎</span>{s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════
// PROFILE FAB
// ══════════════════════════════════════════
function ProfileFAB({user, onAddRoom, onSavedRooms, onAuthOpen, onDashOpen, onLogout, onAdminOpen, savedCount}) {
  const [open,setOpen]=useState(false);
  return (
    <div className="fixed bottom-6 right-6 z-40">
      {open&&(
        <div className="absolute bottom-16 right-0 bg-white rounded-2xl shadow-2xl border border-slate-100 w-60 overflow-hidden mb-2">
          {user ? (
            <>
              <div className="px-4 py-3 border-b border-slate-100" style={{background:"linear-gradient(135deg,#eff6ff,#ecfeff)"}}>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm" style={{background:"linear-gradient(135deg,#2563EB,#06B6D4)"}}>{user.name[0].toUpperCase()}</div>
                  <div><p className="text-sm font-bold text-slate-800 leading-none">{user.name}</p><p className="text-xs text-slate-400 mt-0.5">{user.role==="owner"?"Room Owner":"Renter"}</p></div>
                </div>
              </div>
              {[
                {icon:"👤",label:"My Dashboard",action:()=>{setOpen(false);onDashOpen();}},
                {icon:"❤️",label:`Saved Rooms (${savedCount})`,action:()=>{setOpen(false);onSavedRooms();}},
                {icon:"🔑",label:"List My Room",action:()=>{setOpen(false);onAddRoom();}},
              ].map(item=>(
                <button key={item.label} onClick={item.action} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-700 hover:bg-blue-50 transition-colors text-left">
                  <span>{item.icon}</span><span className="font-medium">{item.label}</span>
                </button>
              ))}
              <div className="border-t border-slate-100">
                <button onClick={()=>{setOpen(false);onLogout();}} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-500 hover:bg-red-50 transition-colors">
                  <span>🚪</span><span className="font-medium">Logout</span>
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
                <p className="text-xs text-slate-400 font-medium">Login karein</p>
                <p className="text-sm font-bold text-slate-700">Apna account access karein</p>
              </div>
              <button onClick={()=>{setOpen(false);onAuthOpen("signup");}} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-700 hover:bg-blue-50 transition-colors">
                <span>✨</span><span className="font-medium">Sign Up — Free</span>
              </button>
              <button onClick={()=>{setOpen(false);onAuthOpen("signin");}} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-700 hover:bg-blue-50 transition-colors">
                <span>🔑</span><span className="font-medium">Sign In</span>
              </button>
              <div className="border-t border-slate-100">
                <button onClick={()=>{setOpen(false);onAdminOpen();}} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-500 hover:bg-slate-50 transition-colors">
                  <span>🛡️</span><span className="font-medium text-xs">Super Admin</span>
                </button>
              </div>
            </>
          )}
        </div>
      )}
      <button onClick={()=>setOpen(!open)} className="w-14 h-14 rounded-full shadow-2xl flex items-center justify-center text-white relative transition-transform hover:scale-105 active:scale-95" style={{background:"linear-gradient(135deg,#2563EB,#06B6D4)"}}>
        {open ? <span className="text-xl font-bold">✕</span> : user ? (
          <span className="text-xl font-black">{user.name[0].toUpperCase()}</span>
        ) : (
          <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
            <circle cx="13" cy="9" r="5" fill="white" fillOpacity="0.9"/>
            <path d="M3 22c0-5.523 4.477-10 10-10s10 4.477 10 10" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none"/>
          </svg>
        )}
        {savedCount>0&&!open&&<span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">{savedCount}</span>}
      </button>
    </div>
  );
}

// ══════════════════════════════════════════
// MAIN APP
// ══════════════════════════════════════════
export default function App() {
  const [rooms, setRooms] = useState(INITIAL_ROOMS);
  const [savedIds, setSavedIds] = useState([]);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("All");
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [showAddRoom, setShowAddRoom] = useState(false);
  const [showSaved, setShowSaved] = useState(false);
  const [showAuth, setShowAuth] = useState(null); // "signup" | "signin" | null
  const [showDash, setShowDash] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [toast, setToast] = useState(null);
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  // Load room listings from Firestore (merged with the built-in demo rooms) once on mount
  useEffect(()=>{
    (async()=>{
      try {
        const listed = await getAllRooms();
        if(listed?.length) setRooms([...INITIAL_ROOMS, ...listed]);
      } catch (err) { console.error(err); }
    })();
  },[]);

  // Track Firebase Auth state; when logged in, pull the matching Firestore profile
  useEffect(()=>{
    const unsub = watchAuthState(async (fbUser)=>{
      if(fbUser){
        try {
          const profile = await getUserProfile(fbUser.uid);
          setUser(profile);
          setSavedIds(profile?.savedRoomIds || []);
        } catch (err) { console.error(err); }
      } else {
        setUser(null);
        setSavedIds([]);
      }
      setReady(true);
    });
    return unsub;
  },[]);

  const showToast = (msg,type="success") => setToast({msg,type});

  const handleToggleSave = async (id) => {
    const wasSaved = savedIds.includes(id);
    const newIds = wasSaved?savedIds.filter(x=>x!==id):[...savedIds,id];
    setSavedIds(newIds);
    if(user){
      try {
        if(wasSaved) await unsaveRoomForUser(user.id, id);
        else await saveRoomForUser(user.id, id);
      } catch (err) { console.error(err); }
    }
    showToast(wasSaved?"Room unsave ho gaya":"❤️ Room saved!", wasSaved?"warn":"success");
    if(!user) showToast("Login karein taaki saved rooms har jagah dikhein","info");
  };

  const handleAddRoom = async (newRoom) => {
    try {
      await fbAddRoom(String(newRoom.id), newRoom, user?.id || "guest");
    } catch (err) { console.error(err); }
    setRooms(prev=>[...prev,newRoom]);
    showToast("✅ Room list ho gaya! Refresh ke baad bhi dikhega.");
  };

  const handleAuthSuccess = (u, mode) => {
    setUser(u);
    setSavedIds(u?.savedRoomIds || []);
    setShowAuth(null);
    showToast(mode==="signup"?`Welcome ${u.name.split(" ")[0]}! 🎉 Account ban gaya`:`Wapas aao ${u.name.split(" ")[0]}! 👋`, "success");
  };

  const handleLogout = async () => {
    try { await fbLogout(); } catch (err) { console.error(err); }
    setUser(null);
    setSavedIds([]);
    showToast("Logout ho gaye. Phir milenge! 👋","info");
  };

  const filtered = rooms.filter(r=>{
    const matchType = filterType==="All"||r.type===filterType;
    const q = search.toLowerCase();
    const matchSearch = !q||r.title.toLowerCase().includes(q)||r.area.toLowerCase().includes(q)||r.type.toLowerCase().includes(q);
    return matchType && matchSearch;
  });

  // Show full admin panel if logged in as admin
  if(isAdmin) return <AdminPanel onExit={()=>setIsAdmin(false)} rooms={rooms} setRooms={setRooms}/>;

  return (
    <div className="min-h-screen bg-slate-50" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
      {toast && <Toast msg={toast.msg} type={toast.type} onDone={()=>setToast(null)}/>}
      {showAdminLogin && <AdminLoginModal onClose={()=>setShowAdminLogin(false)} onSuccess={()=>{setShowAdminLogin(false);setIsAdmin(true);}}/>}

      {/* NAVBAR */}
      <nav className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-slate-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <RoomloLogo/>
          <div className="flex items-center gap-2">
            {user ? (
              <button onClick={()=>setShowDash(true)} className="flex items-center gap-2 hover:bg-slate-50 rounded-2xl px-3 py-1.5 transition">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-black text-sm shadow" style={{background:"linear-gradient(135deg,#2563EB,#06B6D4)"}}>{user.name[0].toUpperCase()}</div>
                <div className="hidden sm:block text-left leading-none">
                  <p className="text-xs font-bold text-slate-800">{user.name.split(" ")[0]}</p>
                  <p className="text-[10px] text-slate-400">{user.role==="owner"?"Owner":"Renter"}</p>
                </div>
              </button>
            ) : (
              <>
                <button onClick={()=>setShowAuth("signin")} className="text-sm font-bold text-slate-600 hover:text-blue-600 px-3 py-2 rounded-xl hover:bg-blue-50 transition hidden sm:block">Sign In</button>
                <button onClick={()=>setShowAuth("signup")} className="text-sm font-bold text-white px-4 py-2 rounded-xl hover:opacity-90 transition shadow" style={{background:"linear-gradient(135deg,#2563EB,#06B6D4)"}}>Sign Up</button>
              </>
            )}
            <button onClick={()=>setShowAddRoom(true)} className="text-sm font-bold text-blue-600 border-2 border-blue-200 px-3 py-2 rounded-xl hover:bg-blue-50 transition hidden sm:block">+ List Room</button>
            <button onClick={()=>setShowAdminLogin(true)} className="text-xs font-bold text-slate-500 border border-slate-200 px-3 py-2 rounded-xl hover:bg-slate-100 transition hidden sm:flex items-center gap-1">🛡️ Admin</button>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <div className="relative py-14 px-4 text-center overflow-hidden" style={{background:"linear-gradient(135deg,#eff6ff 0%,#ecfeff 60%,#f0fdf4 100%)"}}>
        <div className="absolute top-0 left-1/4 w-64 h-64 bg-blue-200 rounded-full opacity-20 blur-3xl"/>
        <div className="absolute bottom-0 right-1/4 w-56 h-56 bg-cyan-200 rounded-full opacity-20 blur-3xl"/>
        <div className="relative z-10">
          {user ? (
            <div className="inline-flex items-center gap-2 bg-white/80 text-blue-700 text-xs font-bold px-4 py-1.5 rounded-full shadow mb-4 border border-blue-100">
              👋 Namaste, {user.name.split(" ")[0]}! Aaj kaun sa room dhundhna hai?
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 bg-white/80 text-blue-700 text-xs font-bold px-4 py-1.5 rounded-full shadow mb-4 border border-blue-100">
              🏠 1 Lakh+ Verified Rooms Across India
            </div>
          )}
          <h1 className="text-3xl sm:text-4xl font-black text-slate-800 mb-3 leading-tight" style={{fontFamily:"'Sora',sans-serif"}}>
            Apna Perfect Room<br/>
            <span style={{background:"linear-gradient(135deg,#2563EB,#06B6D4)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>
              Sirf 2 Minutes Mein Dhundo
            </span>
          </h1>
          <p className="text-slate-500 mb-8 text-base">Bina broker. Bina commission. Direct owner se.</p>
          <SearchBar value={search} onChange={setSearch} onSearch={setSearch}/>
          <div className="flex flex-wrap justify-center gap-2 mt-4">
            {["Bangalore","Mumbai","Pune","Delhi","Hyderabad"].map(c=>(
              <button key={c} onClick={()=>setSearch(c)} className="text-xs font-semibold text-blue-600 bg-white border border-blue-100 px-3 py-1.5 rounded-full hover:bg-blue-50 transition shadow-sm">📍 {c}</button>
            ))}
          </div>
        </div>
      </div>

      {/* STATS */}
      <div className="bg-white border-y border-slate-100">
        <div className="max-w-4xl mx-auto px-4 py-5 grid grid-cols-4 gap-4 text-center">
          {[["1L+","Verified Rooms"],["50K+","Happy Renters"],["25K+","Active Owners"],["4.8★","Avg Rating"]].map(([n,l])=>(
            <div key={l}><div className="text-lg font-extrabold text-blue-600">{n}</div><div className="text-xs text-slate-400 font-medium">{l}</div></div>
          ))}
        </div>
      </div>

      {/* FILTERS */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-7 pb-2">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {TYPES.map(t=>(
            <button key={t} onClick={()=>setFilterType(t)} className={`shrink-0 px-4 py-2 rounded-full text-sm font-bold border transition-all ${filterType===t?"text-white border-transparent shadow-md":"bg-white text-slate-600 border-slate-200 hover:border-blue-300"}`} style={filterType===t?{background:"linear-gradient(135deg,#2563EB,#06B6D4)"}:{}}>{t}</button>
          ))}
        </div>
      </div>

      {/* GRID */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 pb-28">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-extrabold text-slate-800">{filtered.length} Rooms Found</h2>
          <select className="text-sm border border-slate-200 rounded-xl px-3 py-2 text-slate-600 focus:outline-none bg-white">
            <option>Sort: Relevance</option><option>Price: Low to High</option><option>Price: High to Low</option><option>Top Rated</option>
          </select>
        </div>
        {filtered.length===0?(
          <div className="text-center py-20"><div className="text-5xl mb-4">🏠</div><p className="text-slate-400 font-medium">Koi room nahi mila. Search change karein.</p></div>
        ):(
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map(r=><RoomCard key={r.id} room={r} onClick={setSelectedRoom} savedIds={savedIds} onToggleSave={handleToggleSave}/>)}
          </div>
        )}
      </div>

      {/* MODALS */}
      {selectedRoom && <RoomModal room={selectedRoom} onClose={()=>setSelectedRoom(null)} savedIds={savedIds} onToggleSave={handleToggleSave} user={user}/>}
      {showAddRoom && <AddRoomModal onClose={()=>setShowAddRoom(false)} onSave={handleAddRoom}/>}
      {showSaved && <SavedModal rooms={rooms} savedIds={savedIds} onClose={()=>setShowSaved(false)} onToggleSave={handleToggleSave} onView={setSelectedRoom}/>}
      {showAuth && <AuthModal initialMode={showAuth} onClose={()=>setShowAuth(null)} onSuccess={handleAuthSuccess}/>}
      {showDash && user && <DashboardModal user={user} onClose={()=>setShowDash(false)} onLogout={handleLogout} savedIds={savedIds} rooms={rooms}/>}

      {/* PROFILE FAB */}
      <ProfileFAB
        user={user}
        onAddRoom={()=>setShowAddRoom(true)}
        onSavedRooms={()=>setShowSaved(true)}
        onAuthOpen={setShowAuth}
        onDashOpen={()=>setShowDash(true)}
        onLogout={handleLogout}
        onAdminOpen={()=>setShowAdminLogin(true)}
        savedCount={savedIds.length}
      />
    </div>
  );
}
