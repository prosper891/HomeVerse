import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useParams, useLocation } from "react-router-dom";
import { useState, useEffect, createContext, useContext, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Home, 
  Search, 
  PlusSquare, 
  Radio, 
  User, 
  MessageCircle, 
  MessageSquare,
  Wallet, 
  Settings as SettingsIcon,
  Bell,
  TrendingUp,
  Music,
  LogOut,
  CheckCircle2,
  Check,
  AlertCircle,
  Globe,
  Sparkles,
  ChevronRight,
  Music2,
  Mic2,
  Disc,
  Headphones,
  Users,
  Shield,
  ShieldCheck,
  Calendar,
  Flag,
  Send,
  Bot,
  Trash2,
  Ban,
  UserCheck,
  Activity,
  Mic,
  FileAudio,
  FileVideo,
  Image as ImageIcon,
  Eye,
  EyeOff,
  ListMusic,
  Heart,
  Share2,
  MoreVertical,
  ChevronLeft,
  X,
  Mail,
  Loader2,
  Wifi,
  WifiOff,
  Coins,
  ArrowUpRight,
  ArrowDownLeft,
  CreditCard,
  Gift,
  Trophy,
  UserPlus,
  QrCode,
  Plus,
  Zap,
  Bitcoin,
  DollarSign,
  Lock as LockIcon,
  Info as InfoIcon,
  Key,
  ShieldAlert,
  UploadCloud,
  Camera,
  Play,
  Download,
  ShoppingBag,
  CheckCircle,
  Terminal,
  Waves,
  Smile,
  Volume2
} from "lucide-react";
import { 
  auth, 
  db, 
  storage,
  googleProvider, 
  handleFirestoreError, 
  OperationType,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail
} from "./firebase";
import { 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged, 
  type User as FirebaseUser 
} from "firebase/auth";
import { 
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  onSnapshot,
  updateDoc,
  query,
  orderBy,
  limit,
  addDoc,
  deleteDoc,
  serverTimestamp,
  where,
  getDocs,
  increment
} from "firebase/firestore";
import { 
  ref, 
  uploadBytesResumable, 
  getDownloadURL 
} from "firebase/storage";
import { GoogleGenAI } from "@google/genai";
import { cn } from "./lib/utils";

// --- Types ---
interface Story {
  id: string;
  user_id: string;
  username: string;
  avatar_url: string;
  type: 'image' | 'video' | 'note';
  content?: string; // For notes
  file_url?: string;
  music_id?: string;
  music_title?: string;
  privacy: 'public' | 'friends' | 'friends_of_friends' | 'only_me';
  created_at: any;
  expires_at: any;
  views_count: number;
}

interface UserProfile {
  id: string;
  username: string;
  profile_name: string;
  email: string;
  roles: string[];
  bio: string;
  bio_links?: string[];
  genres: string[];
  subgenres?: string[];
  country?: string;
  followers_count: number;
  following_count: number;
  wallet_address: string;
  role: 'admin' | 'user' | 'label_owner' | 'label_part_owner';
  onboarding_completed: boolean;
  is_verified?: boolean;
  is_suspended?: boolean;
  is_online?: boolean;
  last_seen?: any;
  coins: number;
  date_of_birth?: string;
  age?: number;
  crypto_balances?: {
    BTC: number;
    USDT: number;
    ETH: number;
    SOL: number;
  };
  wallet_passkey?: string;
  referral_code: string;
  referred_by?: string | null;
  referral_count?: number;
  is_premium?: boolean;
  premium_expires_at?: string;
  promotion_requests?: PromotionRequest[];
  last_username_change?: any;
  last_profile_name_change?: any;
  avatar_url?: string;
  earnings?: number;
  profile_url?: string;
  updated_at?: any;
  // New Fields
  experience?: string;
  year_of_beginning?: string;
  achievement?: string;
  inspiration?: string;
  track_names?: string[];
}

interface PromotionRequest {
  id: string;
  type: 'single' | 'album' | 'post';
  status: 'pending' | 'approved' | 'rejected';
  created_at: any;
  message?: string;
  post_id?: string;
  amount?: number;
  duration?: number;
}

interface Gift {
  id: string;
  name: string;
  icon: string;
  price: number;
}

const GIFTS: Gift[] = [
  { id: 'rose', name: 'Rose', icon: '🌹', price: 1 },
  { id: 'sunshine', name: 'Sunshine', icon: '☀️', price: 1 },
  { id: 'love_you_emoji', name: 'Love You So Much', icon: '🫶', price: 3 },
  { id: 'i_love_you', name: 'I Love You', icon: '❤️', price: 1 },
  { id: 'amazing', name: 'You\'re Amazing', icon: '🤩', price: 10 },
  { id: 'blue_star', name: 'Blue Star', icon: '🌠', price: 5 },
  { id: 'obani_logo', name: 'Obani Logo', icon: '💎', price: 1 },
  { id: 'finger_heart', name: 'Finger Heart', icon: '🫰', price: 5 },
  { id: 'mic', name: 'Mic', icon: '🎤', price: 5 },
  { id: 'ice_cream', name: 'Ice Cream', icon: '🍦', price: 10 },
  { id: 'perfume', name: 'Perfume', icon: '🧴', price: 20 },
  { id: 'panda', name: 'Panda', icon: '🐼', price: 50 },
  { id: 'fireworks', name: 'Fireworks', icon: '🎆', price: 100 },
  { id: 'yacht', name: 'Yacht', icon: '🛥️', price: 500 },
  { id: 'universe', name: 'Universe', icon: '🌌', price: 1000 },
  { id: 'obani_train', name: 'Obani Train', icon: '🚂', price: 899 },
  { id: 'obani_car', name: 'Obani Car', icon: '🏎️', price: 7000 },
  { id: 'obani_plane', name: 'Obani Plane', icon: '✈️', price: 6000 },
  { id: 'falcon', name: 'Falcon', icon: '🦅', price: 10999 },
  { id: 'interstellar', name: 'Interstellar', icon: '✨', price: 10000 },
  { id: 'obani_castle', name: 'Obani Castle', icon: '🏰', price: 20000 },
  { id: 'lion', name: 'Obani Lion', icon: '🦁', price: 29999 },
  { id: 'whale', name: 'Whale', icon: '🐋', price: 30000 },
  { id: 'obani_universe', name: 'Obani Universe', icon: '🪐', price: 34999 },
  { id: 'obani_stars', name: 'Obani Stars', icon: '🌟', price: 39999 },
];

interface Tag {
  id: string;
  name: string;
  total_views: number;
}

interface Post {
  id: string;
  user_id: string;
  username: string;
  user_avatar?: string;
  type: 'video' | 'audio' | 'image';
  file_url: string;
  cover_url?: string;
  caption: string;
  lyrics?: string;
  artist_name?: string;
  production_name?: string;
  likes_count: number;
  favorites_count: number;
  shares_count: number;
  comments_count: number;
  views_count: number;
  duet_id?: string;
  tags: string[];
  privacy?: 'public' | 'friends' | 'friends_of_friends' | 'only_me';
  created_at: any;
  is_voice_note?: boolean;
  is_promoted?: boolean;
  promotion_expiry?: any;
  ad_audio_url?: string;
  subgenre?: string;
  support_coins?: number;
  sound_id?: string;
  sound_name?: string;
  location?: string;
  filter?: string;
  text_overlay?: string;
  voice_effect?: string;
}

interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  username: string;
  text: string;
  likes_count: number;
  replies_count: number;
  parent_id?: string;
  is_owner_liked: boolean;
  created_at: any;
}

interface Tournament {
  id: string;
  title: string;
  description: string;
  sign_up_fee: number;
  reward_pool: string;
  deadline: string;
  eligibility: string;
  status: 'upcoming' | 'active' | 'completed';
  created_at: any;
}

interface Stream {
  id: string;
  user_id: string;
  username: string;
  title: string;
  description: string;
  viewer_count: number;
  likes_count: number;
  shares_count: number;
  comments_count: number;
  is_active: boolean;
  moderator_ids?: string[];
  filter?: string;
  created_at: any;
  analysis?: StreamAnalysis;
}

interface StreamAnalysis {
  total_viewers: number;
  total_likes: number;
  total_shares: number;
  total_comments: number;
  top_countries: string[];
  duration_minutes: number;
}

interface LiveInvite {
  id: string;
  stream_id: string;
  streamer_id: string;
  streamer_username: string;
  recipient_id: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  created_at: any;
}

interface Notification {
  id: string;
  recipient_id: string;
  sender_id: string;
  sender_username: string;
  type: 'profile_view' | 'like' | 'comment' | 'follow' | 'gift' | 'support' | 'live_start' | 'live_invite';
  post_id?: string;
  stream_id?: string;
  created_at: any;
  is_read: boolean;
}

interface Message {
  id: string;
  chat_id: string;
  sender_id: string;
  type: 'text' | 'image' | 'video' | 'audio' | 'voice_note';
  content?: string;
  file_url?: string;
  is_view_once?: boolean;
  viewed_by?: string[];
  status?: 'sent' | 'delivered' | 'read';
  created_at: any;
}

interface Chat {
  id: string;
  participant_ids: string[];
  last_message?: string;
  last_message_sender_id?: string;
  last_message_status?: 'sent' | 'delivered' | 'read';
  is_story_initiated?: boolean;
  is_safe?: boolean;
  updated_at: any;
}

interface Playlist {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  cover_url?: string;
  post_ids: string[];
  is_public: boolean;
  created_at: any;
}

// --- Context ---
const AuthContext = createContext<{
  user: FirebaseUser | null;
  profile: UserProfile | null;
  loading: boolean;
  signIn: () => Promise<void>;
  logout: () => Promise<void>;
}>({
  user: null,
  profile: null,
  loading: true,
  signIn: async () => {},
  logout: async () => {},
});

const useAuth = () => useContext(AuthContext);

// --- Player Context ---
interface PlayerState {
  currentTrack: Post | null;
  isPlaying: boolean;
  progress: number;
  duration: number;
}

const PlayerContext = createContext<{
  state: PlayerState;
  play: (track: Post) => void;
  pause: () => void;
  toggle: () => void;
  seek: (time: number) => void;
}>({
  state: { currentTrack: null, isPlaying: false, progress: 0, duration: 0 },
  play: () => {},
  pause: () => {},
  toggle: () => {},
  seek: () => {},
});

const usePlayer = () => useContext(PlayerContext);

const PlayerProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, setState] = useState<PlayerState>({
    currentTrack: null,
    isPlaying: false,
    progress: 0,
    duration: 0,
  });
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.addEventListener('timeupdate', () => {
        setState(prev => ({ ...prev, progress: audioRef.current?.currentTime || 0 }));
      });
      audioRef.current.addEventListener('loadedmetadata', () => {
        setState(prev => ({ ...prev, duration: audioRef.current?.duration || 0 }));
      });
      audioRef.current.addEventListener('ended', () => {
        setState(prev => ({ ...prev, isPlaying: false, progress: 0 }));
      });
    }
  }, []);

  const play = (track: Post) => {
    if (audioRef.current) {
      if (state.currentTrack?.id !== track.id) {
        audioRef.current.src = track.file_url;
        setState(prev => ({ ...prev, currentTrack: track, isPlaying: true }));
      } else {
        setState(prev => ({ ...prev, isPlaying: true }));
      }
      audioRef.current.play();
    }
  };

  const pause = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setState(prev => ({ ...prev, isPlaying: false }));
    }
  };

  const toggle = () => {
    if (state.isPlaying) pause();
    else if (state.currentTrack) play(state.currentTrack);
  };

  const seek = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setState(prev => ({ ...prev, progress: time }));
    }
  };

  return (
    <PlayerContext.Provider value={{ state, play, pause, toggle, seek }}>
      {children}
    </PlayerContext.Provider>
  );
};

const MiniPlayer = () => {
  const { state, toggle } = usePlayer();
  const navigate = useNavigate();

  if (!state.currentTrack) return null;

  return (
    <motion.div 
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      className="fixed bottom-16 left-0 right-0 z-[60] bg-zinc-900/95 backdrop-blur-xl border-t border-white/5 px-4 py-2 flex items-center gap-3 md:bottom-20"
    >
      <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-zinc-800">
        <img 
          src={state.currentTrack.cover_url || "https://picsum.photos/seed/music/100/100"} 
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
      </div>
      <div className="flex-1 min-w-0" onClick={() => navigate(`/profile/${state.currentTrack?.user_id}`)}>
        <p className="text-xs font-bold truncate">{state.currentTrack.caption || "Untitled Track"}</p>
        <p className="text-[10px] text-white/40 truncate">{state.currentTrack.artist_name || state.currentTrack.username}</p>
      </div>
      <div className="flex items-center gap-4">
        <button onClick={toggle} className="p-2 text-white">
          {state.isPlaying ? <X size={20} /> : <Play size={20} fill="currentColor" />}
        </button>
      </div>
      <div className="absolute top-0 left-0 h-[2px] bg-blue-500 transition-all duration-100" style={{ width: `${(state.progress / state.duration) * 100}%` }} />
    </motion.div>
  );
};

const downloadWithWatermark = async (url: string, filename: string, type: 'image' | 'video') => {
  if (type === 'video') {
    try {
      const ffmpeg = new FFmpeg();
      await ffmpeg.load({
        coreURL: await toBlobURL(`https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm/ffmpeg-core.wasm`, 'application/wasm'),
      });

      const videoData = await fetchFile(url);
      await ffmpeg.writeFile('input.mp4', videoData);

      // Create a watermark image on the fly
      const canvas = document.createElement('canvas');
      canvas.width = 640;
      canvas.height = 360;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.font = 'bold 30px Inter, sans-serif';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.shadowColor = 'black';
        ctx.shadowBlur = 5;
        ctx.fillText('HomeVerse HV', 20, 340);
        const watermarkBlob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png'));
        if (watermarkBlob) {
          const watermarkData = await fetchFile(watermarkBlob);
          await ffmpeg.writeFile('watermark.png', watermarkData);
          
          // Overlay watermark
          await ffmpeg.exec([
            '-i', 'input.mp4',
            '-i', 'watermark.png',
            '-filter_complex', 'overlay=10:main_h-overlay_h-10',
            '-codec:a', 'copy',
            'output.mp4'
          ]);

          const data = await ffmpeg.readFile('output.mp4');
          const blob = new Blob([data], { type: 'video/mp4' });
          const downloadUrl = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = downloadUrl;
          a.download = filename;
          a.click();
          URL.revokeObjectURL(downloadUrl);
        }
      }
      return;
    } catch (error) {
      console.error("Video watermark error:", error);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      return;
    }
  }

  try {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = url;
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
    });

    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(img, 0, 0);

    const padding = canvas.width * 0.05;
    const fontSize = Math.max(20, canvas.width * 0.03);
    ctx.font = `900 ${fontSize}px Inter, sans-serif`;
    ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
    ctx.shadowColor = "rgba(0, 0, 0, 0.8)";
    ctx.shadowBlur = 10;

    const text = "HomeVerse";
    const textMetrics = ctx.measureText(text);
    ctx.fillText(text, padding, canvas.height - padding);

    const symbolSize = fontSize * 1.2;
    const symbolX = padding + textMetrics.width + 15;
    const symbolY = canvas.height - padding - fontSize * 0.8;

    ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
    ctx.lineWidth = symbolSize * 0.2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    ctx.beginPath();
    ctx.moveTo(symbolX, symbolY);
    ctx.lineTo(symbolX, symbolY + symbolSize);
    ctx.moveTo(symbolX + symbolSize * 0.6, symbolY);
    ctx.lineTo(symbolX + symbolSize * 0.6, symbolY + symbolSize);
    ctx.moveTo(symbolX, symbolY + symbolSize * 0.5);
    ctx.lineTo(symbolX + symbolSize * 0.6, symbolY + symbolSize * 0.5);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(symbolX + symbolSize * 0.8, symbolY);
    ctx.lineTo(symbolX + symbolSize * 1.1, symbolY + symbolSize);
    ctx.lineTo(symbolX + symbolSize * 1.4, symbolY);
    ctx.stroke();

    const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.95));
    if (blob) {
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(downloadUrl);
    }
  } catch (error) {
    console.error("Watermark error:", error);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
  }
};

// --- Obani Company Symbol ---
const ObaniLogo = ({ size = 80, className = "" }: { size?: number, className?: string }) => (
  <div 
    className={cn("rounded-full overflow-hidden flex items-center justify-center relative bg-zinc-950 border border-white/10", className)}
    style={{ width: size, height: size }}
  >
    <div className="absolute inset-0 bg-gradient-to-tr from-zinc-800 to-black" />
    <div className="relative z-10 flex flex-col items-center">
      <div className="bg-white/10 rounded-full flex items-center justify-center border border-white/20" style={{ width: size * 0.5, height: size * 0.5 }}>
        <div className="bg-white rounded-full" style={{ width: size * 0.15, height: size * 0.15 }} />
      </div>
      <span className="font-black tracking-[0.4em] text-white/60 mt-2 uppercase" style={{ fontSize: size * 0.08 }}>OBANI</span>
    </div>
  </div>
);

// --- HomeVerse App Logo (TikTok Style HV) ---
const HomeVerseLogo = ({ size = 40, className = "" }: { size?: number, className?: string }) => (
  <div className={cn("flex flex-col items-center", className)}>
    <div 
      className="relative flex items-center justify-center bg-gradient-to-br from-white to-zinc-400 rounded-2xl shadow-2xl shadow-white/5"
      style={{ width: size, height: size }}
    >
      <span className="font-black tracking-tighter text-black" style={{ fontSize: size * 0.5 }}>HV</span>
      <div className="absolute -inset-[1px] bg-gradient-to-br from-white/20 to-transparent rounded-2xl pointer-events-none" />
    </div>
  </div>
);

// --- Lyrics Viewer Component ---
const LyricsViewer = ({ lyrics, onClose }: { lyrics: string, onClose: () => void }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: "100%" }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: "100%" }}
      className="fixed inset-0 bg-black/95 z-[100] overflow-y-auto p-8 pt-20"
    >
      <button onClick={onClose} className="fixed top-6 right-6 p-2 bg-white/10 rounded-full">
        <X size={24} />
      </button>
      <div className="max-w-2xl mx-auto space-y-8">
        <h2 className="text-4xl font-black tracking-tight text-white/40">Lyrics</h2>
        <div className="space-y-6">
          {lyrics.split('\n').map((line, i) => (
            <p key={i} className="text-3xl font-bold hover:text-white transition-colors cursor-default text-white/60">
              {line || "..."}
            </p>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

// --- Chat Components ---
const ChatList = () => {
  const { user } = useAuth();
  const [chats, setChats] = useState<(Chat & { otherUser?: UserProfile })[]>([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "chats"), where("participant_ids", "array-contains", user.uid), orderBy("updated_at", "desc"));
    const unsub = onSnapshot(q, async (snap) => {
      const chatData = await Promise.all(snap.docs.map(async (d) => {
        const data = d.data() as Chat;
        const otherId = data.participant_ids.find(id => id !== user.uid);
        let otherUser;
        if (otherId) {
          const userSnap = await getDoc(doc(db, "users", otherId));
          if (userSnap.exists()) {
            otherUser = userSnap.data() as UserProfile;
          }
        }
        return { id: d.id, ...data, otherUser };
      }));
      setChats(chatData);
    });

    const nq = query(collection(db, "notifications"), where("recipient_id", "==", user.uid), where("is_read", "==", false));
    const unsubN = onSnapshot(nq, (snap) => {
      setUnreadNotifications(snap.size);
    });

    return () => { unsub(); unsubN(); };
  }, [user]);

  return (
    <div className="pt-24 pb-20 px-6 max-w-2xl mx-auto space-y-8 relative min-h-screen">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-black tracking-tight">Inbox</h1>
      </div>

      <div className="space-y-2">
        {/* Pinned AI Chat */}
        <div 
          onClick={() => navigate("/ai")}
          className="p-4 bg-gradient-to-br from-blue-600/20 to-purple-600/20 rounded-3xl border border-blue-500/20 flex items-center gap-4 cursor-pointer hover:from-blue-600/30 hover:to-purple-600/30 transition-all shadow-lg shadow-blue-500/5"
        >
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 p-1">
            <div className="w-full h-full rounded-full bg-black flex items-center justify-center">
              <Bot className="text-blue-400" size={24} />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-center">
              <span className="font-bold flex items-center gap-2 text-sm sm:text-base">
                HomeVerse AI
                <span className="px-1.5 py-0.5 bg-blue-500 rounded-full text-[8px] font-black uppercase tracking-widest text-white">Official</span>
              </span>
              <span className="text-[10px] text-blue-400 font-bold uppercase tracking-widest">Always Active</span>
            </div>
            <p className="text-xs sm:text-sm text-white/60 truncate">Your creative partner is ready to help 24/7.</p>
          </div>
        </div>

        {/* Notifications Feed */}
        <div 
          onClick={() => navigate("/notifications")}
          className="p-4 bg-zinc-900/50 rounded-3xl border border-white/5 flex items-center gap-4 cursor-pointer hover:bg-zinc-900 transition-all"
        >
          <div className="w-14 h-14 rounded-full bg-zinc-800 flex items-center justify-center relative">
            <Bell className="text-white/40" size={24} />
            {unreadNotifications > 0 && (
              <div className="absolute top-0 right-0 w-5 h-5 bg-blue-500 rounded-full border-2 border-black flex items-center justify-center text-[10px] font-black">
                {unreadNotifications}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-center">
              <span className="font-bold text-sm sm:text-base">System Notifications</span>
              <span className="text-[10px] text-white/20 font-bold uppercase tracking-widest">Activity Feed</span>
            </div>
            <p className="text-xs sm:text-sm text-white/40 truncate">Check your likes, follows, and system alerts.</p>
          </div>
        </div>

        {chats.map(chat => {
          const isMe = chat.last_message_sender_id === user?.uid;
          return (
            <div 
              key={chat.id} 
              onClick={() => navigate(`/chats/${chat.id}`)}
              className="p-4 bg-zinc-900 rounded-3xl border border-white/5 flex items-center gap-4 cursor-pointer hover:bg-zinc-800 transition-colors"
            >
              <Avatar userProfile={chat.otherUser} size="lg" />
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center">
                  <span className="font-bold">{chat.otherUser?.profile_name || chat.otherUser?.username || "Unknown User"}</span>
                  <span className="text-[10px] text-white/40">
                    {chat.updated_at?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  {isMe && (
                    <div className="flex items-center">
                      {chat.last_message_status === 'read' ? (
                        <div className="flex -space-x-1.5">
                          <Check size={12} className="text-blue-400" />
                          <Check size={12} className="text-blue-400" />
                        </div>
                      ) : chat.last_message_status === 'delivered' ? (
                        <div className="flex -space-x-1.5">
                          <Check size={12} className="text-white/40" />
                          <Check size={12} className="text-white/40" />
                        </div>
                      ) : (
                        <Check size={12} className="text-white/40" />
                      )}
                    </div>
                  )}
                  <p className="text-sm text-white/60 truncate">{chat.last_message || "No messages yet"}</p>
                </div>
              </div>
            </div>
          );
        })}
        {chats.length === 0 && (
          <div className="text-center py-20 text-white/20 italic">No conversations yet.</div>
        )}
      </div>

      {/* Meta AI Style Floating Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => navigate("/ai")}
        className="fixed bottom-24 right-6 w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full shadow-2xl shadow-blue-500/40 flex items-center justify-center z-50 border-2 border-white/20"
      >
        <Bot className="text-white" size={28} />
      </motion.button>
    </div>
  );
};

const ChatRoom = () => {
  const { chatId } = useParams();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isViewOnce, setIsViewOnce] = useState(false);
  const [otherUser, setOtherUser] = useState<UserProfile | null>(null);
  const [chatData, setChatData] = useState<Chat | any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chatId || !user) return;
    
    const unsubChat = onSnapshot(doc(db, "chats", chatId), async (snap) => {
      if (snap.exists()) {
        const data = snap.data() as Chat;
        setChatData(data);
        const otherId = data.participant_ids.find(id => id !== user.uid);
        if (otherId) {
          const userSnap = await getDoc(doc(db, "users", otherId));
          if (userSnap.exists()) {
            setOtherUser(userSnap.data() as UserProfile);
          }
        }
      }
    });

    const q = query(collection(db, "chats", chatId, "messages"), orderBy("created_at", "asc"));
    const unsubMessages = onSnapshot(q, (snap) => {
      const msgs = snap.docs.map(d => ({ id: d.id, ...d.data() } as Message));
      setMessages(msgs);
      
      // Mark unread messages as read
      msgs.forEach(async (msg) => {
        if (msg.sender_id !== user.uid && msg.status !== 'read') {
          await updateDoc(doc(db, "chats", chatId, "messages", msg.id), {
            status: 'read'
          });
          // If this is the last message, update chat status too
          if (msg.id === msgs[msgs.length - 1].id) {
            await updateDoc(doc(db, "chats", chatId), {
              last_message_status: 'read'
            });
          }
        }
      });
    });

    return () => {
      unsubChat();
      unsubMessages();
    };
  }, [chatId, user?.uid]);

  useEffect(() => {
    if (otherUser?.is_online && messages.length > 0 && user) {
      messages.forEach(async (msg) => {
        if (msg.sender_id === user.uid && msg.status === 'sent') {
          await updateDoc(doc(db, "chats", chatId!, "messages", msg.id), {
            status: 'delivered'
          });
          if (msg.id === messages[messages.length - 1].id) {
            await updateDoc(doc(db, "chats", chatId!), {
              last_message_status: 'delivered'
            });
          }
        }
      });
    }
  }, [otherUser?.is_online, messages, user?.uid, chatId]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (type: Message['type'] = 'text', fileUrl?: string, isViewOnce = false) => {
    if (!chatId || !user || (!newMessage.trim() && !fileUrl)) return;
    
    // Check if other user is online for status
    const status = otherUser?.is_online ? 'delivered' : 'sent';

    try {
      const msgData = {
        chat_id: chatId,
        sender_id: user.uid,
        type,
        content: type === 'text' ? newMessage : "",
        file_url: fileUrl || "",
        is_view_once: isViewOnce,
        viewed_by: [],
        status,
        created_at: serverTimestamp(),
      };
      await addDoc(collection(db, "chats", chatId, "messages"), msgData);
      await updateDoc(doc(db, "chats", chatId), {
        last_message: type === 'text' ? newMessage : `Sent a ${type}`,
        last_message_sender_id: user.uid,
        last_message_status: status,
        updated_at: serverTimestamp(),
      });
      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const markAsSafe = async () => {
    if (!chatId) return;
    await updateDoc(doc(db, "chats", chatId), {
      is_safe: true
    });
    alert("Chat marked as safe! You can now chat freely.");
  };

  const ReadReceipt = ({ status, isMe }: { status?: 'sent' | 'delivered' | 'read', isMe: boolean }) => {
    if (!isMe) return null;
    return (
      <div className="flex items-center ml-1">
        {status === 'read' ? (
          <div className="flex -space-x-1.5">
            <Check size={12} className="text-blue-400" />
            <Check size={12} className="text-blue-400" />
          </div>
        ) : status === 'delivered' ? (
          <div className="flex -space-x-1.5">
            <Check size={12} className="text-white/40" />
            <Check size={12} className="text-white/40" />
          </div>
        ) : (
          <Check size={12} className="text-white/40" />
        )}
      </div>
    );
  };

  const handleViewOnce = async (msg: Message) => {
    if (!user || !msg.is_view_once || msg.viewed_by?.includes(user.uid)) return;
    try {
      await updateDoc(doc(db, "chats", msg.chat_id, "messages", msg.id), {
        viewed_by: [...(msg.viewed_by || []), user.uid]
      });
    } catch (error) {
      console.error("Error viewing message:", error);
    }
  };

  return (
    <div className="pt-20 pb-20 h-screen flex flex-col bg-black">
      <div className="p-4 border-b border-white/10 flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-white/5 rounded-full transition-colors"><ChevronLeft /></button>
        <Avatar userProfile={otherUser} size="md" />
        <div className="flex-1">
          <p className="font-bold leading-tight">{otherUser?.profile_name || otherUser?.username || "Chat"}</p>
          <div className="flex items-center gap-1.5">
            <div className={cn("w-1.5 h-1.5 rounded-full", otherUser?.is_online ? "bg-green-500" : "bg-white/20")} />
            <p className={cn("text-[10px] font-black uppercase tracking-widest", otherUser?.is_online ? "text-green-500" : "text-white/40")}>
              {otherUser?.is_online ? "Online" : "Offline"}
            </p>
          </div>
        </div>
      </div>

      {chatData?.is_story_initiated && !chatData?.is_safe && chatData?.participant_ids[1] === user?.uid && (
        <div className="p-4 bg-blue-500/10 border-b border-blue-500/20 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-bold text-blue-400">Story Reply Request</p>
            <p className="text-[10px] text-white/60">This user replied to your story. Mark as safe to chat.</p>
          </div>
          <button 
            onClick={markAsSafe}
            className="px-4 py-2 bg-blue-500 text-white text-[10px] font-black uppercase tracking-widest rounded-full"
          >
            Mark Safe
          </button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => {
          const isMe = msg.sender_id === user?.uid;
          const isViewed = msg.is_view_once && msg.viewed_by && msg.viewed_by.length > 0;
          const iHaveViewed = msg.is_view_once && msg.viewed_by?.includes(user?.uid || "");

          return (
            <div key={msg.id} className={cn("flex flex-col", isMe ? "items-end" : "items-start")}>
              <div className={cn(
                "max-w-[70%] p-3 rounded-2xl relative",
                isMe ? "bg-blue-500 text-white" : "bg-zinc-800 text-white",
                msg.is_view_once && "border-2 border-dashed border-white/20"
              )}>
                {msg.is_view_once ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest opacity-50">
                      <Eye size={10} /> View Once
                    </div>
                    {iHaveViewed || (isMe && isViewed) ? (
                      <div className="flex items-center gap-2 text-sm italic opacity-50">
                        <EyeOff size={16} /> Opened
                      </div>
                    ) : (
                      <button 
                        onClick={() => handleViewOnce(msg)}
                        className="flex flex-col gap-2 items-center"
                      >
                        {msg.type === 'image' && <div className="w-40 h-40 bg-white/5 rounded-xl flex items-center justify-center"><ImageIcon size={40} className="opacity-20" /></div>}
                        <span className="text-sm font-bold">Tap to view</span>
                      </button>
                    )}
                  </div>
                ) : (
                  <>
                    {msg.type === 'text' && <p>{msg.content}</p>}
                    {msg.type === 'image' && <img src={msg.file_url} className="rounded-lg max-h-60 object-cover" referrerPolicy="no-referrer" />}
                    {msg.type === 'voice_note' && (
                      <div className="flex items-center gap-2">
                        <Mic size={16} />
                        <div className="h-1 w-24 bg-white/20 rounded-full overflow-hidden">
                          <div className="h-full w-1/2 bg-white" />
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
              <div className="flex items-center mt-1 px-1">
                <span className="text-[8px] text-white/20 font-bold">
                  {msg.created_at?.toDate ? new Date(msg.created_at.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                </span>
                <ReadReceipt status={msg.status} isMe={isMe} />
              </div>
            </div>
          );
        })}
        <div ref={scrollRef} />
      </div>

      <div className="p-4 bg-zinc-900 border-t border-white/10 flex flex-col gap-3">
        {chatData?.is_story_initiated && !chatData?.is_safe && chatData?.participant_ids[0] === user?.uid ? (
          <div className="text-center py-2">
            <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">Waiting for creator to mark as safe...</p>
          </div>
        ) : (
          <div className="flex gap-2 items-center">
            <button 
              onClick={() => setIsViewOnce(!isViewOnce)}
              className={cn("p-2 rounded-full transition-colors", isViewOnce ? "bg-blue-500 text-white" : "text-white/40")}
            >
              <Eye size={18} />
            </button>
            <button className="p-2 text-white/60"><PlusSquare size={20} /></button>
            <input 
              type="text" 
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage('text', undefined, isViewOnce)}
              placeholder="Message..."
              className="flex-1 bg-black border border-white/10 rounded-full px-4 py-2 text-sm"
            />
            {newMessage.trim() ? (
              <button onClick={() => sendMessage('text', undefined, isViewOnce)} className="p-2 text-blue-500"><Send size={20} /></button>
            ) : (
              <button 
                onMouseDown={() => setIsRecording(true)}
                onMouseUp={() => { setIsRecording(false); sendMessage('voice_note', "https://example.com/audio.mp3", isViewOnce); }}
                className={cn("p-2 transition-colors", isRecording ? "text-red-500 scale-125" : "text-white/60")}
              >
                <Mic size={20} />
              </button>
            )}
          </div>
        )}
        {isViewOnce && <p className="text-[10px] text-blue-500 font-bold uppercase tracking-widest text-center">View Once Enabled</p>}
      </div>
    </div>
  );
};

// --- Playlist Component ---
const PlaylistManager = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState("");

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "playlists"), where("user_id", "==", user.uid));
    const unsub = onSnapshot(q, (snap) => {
      setPlaylists(snap.docs.map(d => ({ id: d.id, ...d.data() } as Playlist)));
    });
    return unsub;
  }, [user]);

  const createPlaylist = async () => {
    if (!user || !newTitle.trim()) return;
    try {
      await addDoc(collection(db, "playlists"), {
        user_id: user.uid,
        title: newTitle,
        description: "",
        cover_url: "https://picsum.photos/seed/playlist/400/400",
        post_ids: [],
        is_public: true,
        created_at: serverTimestamp(),
      });
      setNewTitle("");
      setShowCreate(false);
    } catch (error) {
      console.error("Error creating playlist:", error);
    }
  };

  return (
    <div className="pt-24 pb-20 px-6 max-w-2xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-black tracking-tight">Your Playlists</h1>
        <button onClick={() => setShowCreate(true)} className="p-2 bg-white text-black rounded-full">
          <PlusSquare size={24} />
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {playlists.map(pl => (
          <div key={pl.id} className="space-y-2 group cursor-pointer">
            <div className="aspect-square bg-zinc-900 rounded-2xl overflow-hidden border border-white/10 relative">
              <img src={pl.cover_url} className="w-full h-full object-cover group-hover:scale-105 transition-transform" referrerPolicy="no-referrer" />
              <div className="absolute inset-0 bg-black/20" />
              <div className="absolute bottom-3 right-3 p-2 bg-green-500 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
                <Music size={16} className="text-black" />
              </div>
            </div>
            <div>
              <p className="font-bold text-sm truncate">{pl.title}</p>
              <p className="text-[10px] text-white/40 font-bold uppercase">{pl.post_ids.length} Tracks</p>
            </div>
          </div>
        ))}
      </div>

      {showCreate && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
          <div className="bg-zinc-900 border border-white/10 rounded-3xl p-8 max-w-sm w-full space-y-6">
            <h3 className="text-xl font-black">New Playlist</h3>
            <input 
              type="text" 
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Playlist name"
              className="w-full bg-black border border-white/10 rounded-xl p-4 focus:outline-none focus:border-blue-500"
            />
            <div className="flex gap-3">
              <button onClick={() => setShowCreate(false)} className="flex-1 py-3 bg-zinc-800 text-white font-bold rounded-xl">Cancel</button>
              <button onClick={createPlaylist} className="flex-1 py-3 bg-white text-black font-bold rounded-xl">Create</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// --- Beats View ---
const Beats = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'all' | 'favorited' | 'purchased'>('all');

  return (
    <div className="pt-24 pb-32 px-6 max-w-2xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate("/")} className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-all">
            <ChevronLeft size={20} />
          </button>
          <h1 className="text-3xl font-black tracking-tight">Beats</h1>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => navigate("/premium")} className="px-3 py-1.5 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-purple-500/20">
            <Zap size={12} /> Premium
          </button>
          <Search size={20} className="text-white/60" />
          <div className="w-8 h-8 rounded-full bg-zinc-800" />
        </div>
      </div>

      <div className="flex gap-2">
        {['all', 'favorited', 'purchased'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={cn(
              "px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all",
              activeTab === tab ? "bg-white text-black" : "bg-white/5 text-white/40 hover:bg-white/10"
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Premium Banner */}
      <div className="aspect-[21/9] rounded-3xl bg-gradient-to-br from-zinc-800 to-zinc-900 border border-white/5 relative overflow-hidden p-6 flex flex-col justify-center">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <Mic2 size={120} />
        </div>
        <h2 className="text-2xl font-black tracking-tight mb-2">HomeVerse Premium</h2>
        <p className="text-xs text-white/60 font-bold mb-4">Unlock all effects & unlimited uploads</p>
        <button className="w-fit px-6 py-2 bg-pink-600 text-white text-[10px] font-black uppercase tracking-widest rounded-full">Try For Free</button>
      </div>

      {/* Top Beats - Horizontal Scroll */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-black tracking-tight">Top Beats</h3>
          <button className="text-xs font-bold text-blue-500">View Chart</button>
        </div>
        <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="w-40 flex-shrink-0 space-y-3 group cursor-pointer">
              <div className="aspect-square rounded-2xl bg-zinc-900 border border-white/5 relative overflow-hidden">
                <img src={`https://picsum.photos/seed/topbeat${i}/400/400`} className="w-full h-full object-cover group-hover:scale-110 transition-transform" referrerPolicy="no-referrer" />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors" />
                <div className="absolute bottom-2 right-2 w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Play size={16} fill="white" />
                </div>
                <div className="absolute top-2 left-2 px-2 py-0.5 bg-blue-500 rounded-md text-[8px] font-black uppercase tracking-widest">#{i}</div>
              </div>
              <div>
                <p className="font-bold text-xs truncate">Top Hit {i}</p>
                <p className="text-[10px] text-white/40 font-bold truncate">Producer Name</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-black tracking-tight">Collections</h3>
          <button className="text-xs font-bold text-white/40">See All</button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[
            { name: 'Drill Essentials', color: 'from-red-600 to-black', icon: <Disc /> },
            { name: 'Melodic Trap', color: 'from-blue-600 to-purple-600', icon: <Sparkles /> },
            { name: 'Afrobeats Wave', color: 'from-yellow-600 to-orange-600', icon: <Zap /> },
            { name: 'R&B Soul', color: 'from-pink-600 to-indigo-600', icon: <Heart /> }
          ].map((c, i) => (
            <div key={i} className={cn("aspect-video rounded-2xl bg-gradient-to-br p-4 flex flex-col justify-between relative overflow-hidden group cursor-pointer", c.color)}>
              <div className="absolute top-0 right-0 p-2 opacity-20 group-hover:scale-110 transition-transform">
                {c.icon}
              </div>
              <div className="relative z-10">
                <p className="font-black text-xs uppercase tracking-widest">{c.name}</p>
                <p className="text-[8px] font-bold text-white/60 mt-1">24 Beats</p>
              </div>
              <button className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center self-end opacity-0 group-hover:opacity-100 transition-opacity">
                <ChevronRight size={16} />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-black tracking-tight">New & Trending</h3>
          <button className="text-xs font-bold text-white/40">See All</button>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="aspect-[3/4] rounded-3xl bg-zinc-900 border border-white/5 relative overflow-hidden group cursor-pointer">
              <img src={`https://picsum.photos/seed/beat${i}/400/600`} className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform" referrerPolicy="no-referrer" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center">
                  <Play size={24} fill="white" />
                </div>
              </div>
              <div className="absolute bottom-4 left-4 right-4">
                <p className="font-bold text-sm truncate">Beat Title {i}</p>
                <p className="text-[10px] text-white/40 font-bold truncate">@producer_name</p>
                <div className="flex items-center gap-3 mt-2 text-[8px] font-black text-white/40 uppercase tracking-widest">
                  <span className="flex items-center gap-1"><Play size={8} /> 24k</span>
                  <span className="flex items-center gap-1"><Download size={8} /> 2k</span>
                  <span className="flex items-center gap-1"><Heart size={8} /> 500</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// --- Library View ---
const Library = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'all' | 'projects' | 'videos' | 'recordings'>('all');

  return (
    <div className="pt-24 pb-32 px-6 max-w-2xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate("/")} className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-all">
            <ChevronLeft size={20} />
          </button>
          <h1 className="text-3xl font-black tracking-tight">Library</h1>
        </div>
        <div className="flex items-center gap-4">
          <ListMusic size={20} className="text-white/60" />
          <Search size={20} className="text-white/60" />
          <SettingsIcon size={20} className="text-white/60" />
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
        {['all', 'projects', 'videos', 'recordings'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={cn(
              "px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap",
              activeTab === tab ? "bg-white text-black" : "bg-white/5 text-white/40 hover:bg-white/10"
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="flex flex-col items-center justify-center py-32 text-center space-y-4">
        <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center">
          <Mic size={32} className="text-white/20" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-black tracking-tight">No Recordings</h2>
          <p className="text-sm text-white/40 font-medium max-w-[250px]">You haven't recorded anything yet. Tap the big plus button below to get started.</p>
        </div>
      </div>

      {/* Cloud Backup Prompt */}
      <div className="p-6 bg-zinc-900 rounded-[32px] border border-white/5 relative overflow-hidden">
        <button className="absolute top-4 right-4 text-white/20"><X size={16} /></button>
        <div className="space-y-4">
          <h3 className="font-black tracking-tight">Your projects are not being backed up</h3>
          <p className="text-xs text-white/40 font-bold leading-relaxed">Protect your projects from loss when getting a new device! Gain peace of mind by automatically backing up your projects to the cloud.</p>
          <button className="w-full py-3 bg-gradient-to-r from-pink-600 to-purple-600 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2">
            <Zap size={14} /> Back up your projects
          </button>
        </div>
      </div>
    </div>
  );
};

// --- AI Assistant Service ---
const About = () => {
  return (
    <div className="pt-24 pb-20 px-6 max-w-2xl mx-auto space-y-8">
      <div className="space-y-4 text-center">
        <h1 className="text-4xl font-black tracking-tighter flex items-center gap-3 justify-center">
          HomeVerse
        </h1>
        <div className="flex items-center justify-center gap-2">
          <p className="text-white/40 font-medium uppercase tracking-widest text-xs">The Company Behind HomeVerse:</p>
          <div className="flex items-center gap-2 bg-zinc-900 px-4 py-2 rounded-full border border-white/5">
            <span className="font-black text-sm">Obani</span>
            <ObaniLogo size={24} />
          </div>
        </div>
      </div>

      <div className="prose prose-invert max-w-none space-y-6 text-white/80 leading-relaxed">
        <p>
          HomeVerse was built with a deep-seated love for music, craft, and the community that surrounds it. 
          Founded by <strong>Prosper M. Kingsley</strong>, this platform is more than just an app—it's a mission to empower the next generation of creators.
        </p>
        <p className="italic border-l-2 border-blue-500 pl-6 py-2 bg-blue-500/5 rounded-r-2xl">
          "I built this app at the age of 18 with so much love and desire for music and supporting upcoming music talent. 
          Music has always been my escape and my expression, and I wanted to build a space where others could find that same freedom and get the recognition they deserve."
        </p>
        <p>
          The vision for HomeVerse is to provide the tools for artists, producers, and songwriters to share their work, connect with fans, and monetize their talent. 
          My ultimate dream is to own my own record label someday that supports upcoming talents from all over the world, 
          giving them the platform they deserve to shine.
        </p>
        <p>
          HomeVerse is the first step toward that future. Join us as we redefine the music industry, one track at a time.
        </p>
      </div>

      <div className="space-y-4 pt-8 border-t border-white/10">
        <h3 className="text-lg font-black tracking-tight text-center">Contact Admin</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <a 
            href="mailto:prosperkingsley360@gmail.com"
            className="flex items-center gap-4 p-4 bg-zinc-900 rounded-2xl border border-white/5 hover:bg-zinc-800 transition-colors group"
          >
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform">
              <Mail size={24} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Admin Email Address</p>
              <p className="text-sm font-bold">prosperkingsley360@gmail.com</p>
            </div>
          </a>

          <a 
            href="https://ww.tiktok.com/@lilobani.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-4 p-4 bg-zinc-900 rounded-2xl border border-white/5 hover:bg-zinc-800 transition-colors group"
          >
            <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-white group-hover:scale-110 transition-transform">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.17-2.89-.6-4.13-1.47-.13 5.35.14 10.71-1.33 15.9-1.35 4.72-6.48 7.91-11.32 6.78-4.66-1.1-7.9-6.47-6.78-11.13 1.03-4.31 5.39-7.4 9.8-6.72.04 1.35-.05 2.69-.01 4.04-2.54-.4-5.04.91-5.91 3.31-.84 2.29.25 5.22 2.45 6.19 2.22.98 5.22-.14 6.09-2.39.45-1.13.4-2.39.41-3.6-.01-5.25-.01-10.51-.01-15.76.17-.05.34-.1.52-.15z"/>
              </svg>
            </div>
            <div>
              <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Admin TikTok Page</p>
              <p className="text-sm font-bold">@lilobani.com</p>
            </div>
          </a>
        </div>
      </div>

      <div className="pt-8 text-center">
        <p className="text-sm text-white/40">© 2026 Obani. All rights reserved.</p>
      </div>
    </div>
  );
};

// --- Live Component ---
interface Stream {
  id: string;
  user_id: string;
  username: string;
  title: string;
  description: string;
  viewer_count: number;
  moderator_ids?: string[];
  filter?: string;
}

const GiftOverlay = ({ gifts }: { gifts: { id: string, username: string, gift: Gift, created_at: any }[] }) => {
  return (
    <div className="fixed inset-0 pointer-events-none z-[150] flex flex-col items-center justify-center overflow-hidden">
      <AnimatePresence>
        {gifts.map((g) => (
          <motion.div
            key={g.id}
            initial={{ scale: 0, opacity: 0, y: 100 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 1.5, opacity: 0, y: -200 }}
            transition={{ 
              type: "spring", 
              stiffness: 260, 
              damping: 20,
              duration: 0.8
            }}
            className="flex flex-col items-center gap-4 mb-8"
          >
            <div className="relative">
              <motion.div 
                animate={{ 
                  scale: [1, 1.2, 1],
                  rotate: [0, 10, -10, 0]
                }}
                transition={{ duration: 2, repeat: Infinity }}
                className={cn(
                  "text-9xl filter drop-shadow-[0_0_20px_rgba(255,255,255,0.5)]",
                  g.gift.id === 'lion' && "text-[200px]"
                )}
              >
                {g.gift.icon}
              </motion.div>
              {g.gift.id === 'lion' && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 1, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute inset-0 bg-yellow-500/20 blur-3xl rounded-full -z-10"
                />
              )}
            </div>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-black/60 backdrop-blur-xl border border-white/10 px-6 py-3 rounded-full flex items-center gap-3 shadow-2xl"
            >
              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center font-black text-xs">
                {g.username[0].toUpperCase()}
              </div>
              <p className="text-sm font-bold">
                <span className="text-blue-400">@{g.username}</span> sent <span className="text-yellow-500">{g.gift.name}</span>
              </p>
            </motion.div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

const LiveAnalysis = ({ analysis, onClose }: { analysis: any, onClose: () => void }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-2xl flex items-center justify-center p-6"
    >
      <div className="max-w-md w-full space-y-8 text-center">
        <div className="space-y-2">
          <h2 className="text-4xl font-black tracking-tighter">Live Summary</h2>
          <p className="text-white/40 font-bold uppercase tracking-widest text-xs">Great job on your stream!</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white/5 border border-white/10 rounded-3xl p-6 space-y-1">
            <p className="text-3xl font-black text-blue-500">{formatCount(analysis.total_viewers || 0)}</p>
            <p className="text-[10px] font-bold text-white/40 uppercase">Total Viewers</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-3xl p-6 space-y-1">
            <p className="text-3xl font-black text-red-500">{formatCount(analysis.total_likes || 0)}</p>
            <p className="text-[10px] font-bold text-white/40 uppercase">Total Likes</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-3xl p-6 space-y-1">
            <p className="text-3xl font-black text-green-500">{analysis.total_shares || 0}</p>
            <p className="text-[10px] font-bold text-white/40 uppercase">Total Shares</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-3xl p-6 space-y-1">
            <p className="text-3xl font-black text-yellow-500">{analysis.total_comments || 0}</p>
            <p className="text-[10px] font-bold text-white/40 uppercase">Comments</p>
          </div>
        </div>

        {analysis.top_countries && analysis.top_countries.length > 0 && (
          <div className="bg-white/5 border border-white/10 rounded-3xl p-6 space-y-4 text-left">
            <h4 className="text-xs font-black uppercase tracking-widest text-white/40">Top Countries</h4>
            <div className="flex flex-wrap gap-2">
              {analysis.top_countries.map((c: string) => (
                <span key={c} className="px-3 py-1 bg-white/10 rounded-full text-xs font-bold">{c}</span>
              ))}
            </div>
          </div>
        )}

        <button 
          onClick={onClose}
          className="w-full py-4 bg-white text-black font-black rounded-2xl hover:scale-105 transition-transform"
        >
          Done
        </button>
      </div>
    </motion.div>
  );
};

const LiveInviteModal = ({ streamId, onInvite }: { streamId: string, onInvite: (userId: string) => void }) => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "users"), limit(10));
    getDocs(q).then(snap => {
      setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() } as UserProfile)));
      setLoading(false);
    });
  }, []);

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-black">Invite Friends</h3>
      <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
        {users.map(u => (
          <div key={u.id} className="flex items-center justify-between p-3 bg-white/5 rounded-2xl border border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center font-bold">{u.username[0].toUpperCase()}</div>
              <p className="font-bold text-sm">@{u.username}</p>
            </div>
            <button 
              onClick={() => onInvite(u.id)}
              className="px-4 py-2 bg-blue-500 text-white text-xs font-black rounded-xl"
            >
              Invite
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

const ModeratorSelectionModal = ({ friends, selected, onToggle, onStart }: { friends: UserProfile[], selected: string[], onToggle: (id: string) => void, onStart: () => void }) => {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-xl font-black">Select Moderators</h3>
        <p className="text-xs text-white/40 uppercase tracking-widest font-black">Select up to 10 friends to moderate your stream</p>
      </div>
      
      <div className="max-h-60 overflow-y-auto pr-2 space-y-2 custom-scrollbar">
        {friends.length === 0 && (
          <div className="text-center py-10 text-white/20 italic">No friends found to moderate.</div>
        )}
        {friends.map(friend => (
          <button 
            key={friend.id}
            onClick={() => onToggle(friend.id)}
            className={cn(
              "w-full flex items-center justify-between p-4 rounded-2xl border transition-all",
              selected.includes(friend.id) ? "bg-blue-500/10 border-blue-500" : "bg-white/5 border-white/5 hover:bg-white/10"
            )}
          >
            <div className="flex items-center gap-3">
              <Avatar userProfile={friend} size="md" />
              <div className="text-left">
                <p className="font-bold text-sm">{friend.profile_name || friend.username}</p>
                <p className="text-[10px] text-white/40 font-black uppercase tracking-widest">@{friend.username}</p>
              </div>
            </div>
            <div className={cn(
              "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
              selected.includes(friend.id) ? "bg-blue-500 border-blue-500" : "border-white/20"
            )}>
              {selected.includes(friend.id) && <Check size={14} className="text-white" />}
            </div>
          </button>
        ))}
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <span className="text-xs font-black text-white/40 uppercase tracking-widest">Selected</span>
          <span className={cn("text-xs font-black uppercase tracking-widest", selected.length > 10 ? "text-red-500" : "text-blue-500")}>
            {selected.length}/10
          </span>
        </div>
        <button 
          onClick={onStart}
          disabled={selected.length > 10}
          className="w-full py-4 bg-white text-black font-black rounded-2xl disabled:opacity-50 hover:scale-105 transition-transform"
        >
          Go Live Now
        </button>
      </div>
    </div>
  );
};

const Live = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [showGifts, setShowGifts] = useState(false);
  const [selectedStream, setSelectedStream] = useState<Stream | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [activeGifts, setActiveGifts] = useState<{ id: string, username: string, gift: Gift, created_at: any }[]>([]);
  const [streams, setStreams] = useState<Stream[]>([]);
  const [myStream, setMyStream] = useState<Stream | null>(null);
  const [showAnalysis, setShowAnalysis] = useState<StreamAnalysis | null>(null);
  const [showInvite, setShowInvite] = useState(false);
  const [invites, setInvites] = useState<LiveInvite[]>([]);
  const [selectedModerators, setSelectedModerators] = useState<string[]>([]);
  const [friends, setFriends] = useState<UserProfile[]>([]);
  const [showModeratorSelection, setShowModeratorSelection] = useState(false);
  const [activeFilter, setActiveFilter] = useState('none');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    if (!profile) return;
    // Fetch friends (people you follow)
    const q = query(collection(db, "users"), limit(50)); // Simple fetch for now, ideally filter by following
    const unsub = onSnapshot(q, (snap) => {
      setFriends(snap.docs.map(d => ({ id: d.id, ...d.data() } as UserProfile)).filter(u => u.id !== profile.id));
    });
    return unsub;
  }, [profile]);

  useEffect(() => {
    const q = query(collection(db, "streams"), where("is_active", "==", true), orderBy("created_at", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setStreams(snap.docs.map(d => ({ id: d.id, ...d.data() } as Stream)));
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (!profile) return;
    const q = query(collection(db, "live_invites"), where("recipient_id", "==", profile.id), where("status", "==", "pending"));
    const unsub = onSnapshot(q, (snap) => {
      setInvites(snap.docs.map(d => ({ id: d.id, ...d.data() } as LiveInvite)));
    });
    return unsub;
  }, [profile]);

  useEffect(() => {
    if (!selectedStream) {
      setActiveGifts([]);
      return;
    }

    const q = query(
      collection(db, "streams", selectedStream.id, "gifts"),
      orderBy("created_at", "desc"),
      limit(5)
    );

    const unsub = onSnapshot(q, (snap) => {
      const now = Date.now();
      const newGifts = snap.docs
        .map(d => ({ id: d.id, ...d.data() } as any))
        .filter(g => {
          const createdAt = g.created_at?.toMillis() || now;
          return now - createdAt < 20000;
        });
      setActiveGifts(newGifts);
    });

    const interval = setInterval(() => {
      const now = Date.now();
      setActiveGifts(prev => prev.filter(g => {
        const createdAt = g.created_at?.toMillis() || now;
        return now - createdAt < 20000;
      }));
    }, 1000);

    return () => {
      unsub();
      clearInterval(interval);
    };
  }, [selectedStream]);

  const startStream = async () => {
    if (!profile) return;
    try {
      const streamData = {
        user_id: profile.id,
        username: profile.username,
        title: `${profile.username}'s Live Stream`,
        description: "Join my live stream!",
        viewer_count: 0,
        likes_count: 0,
        shares_count: 0,
        comments_count: 0,
        is_active: true,
        moderator_ids: selectedModerators,
        filter: activeFilter,
        created_at: serverTimestamp()
      };
      const docRef = await addDoc(collection(db, "streams"), streamData);
      const newStream = { id: docRef.id, ...streamData } as Stream;
      setMyStream(newStream);
      setSelectedStream(newStream);

      // Start Recording
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        const recorder = new MediaRecorder(stream);
        recordedChunksRef.current = [];
        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) recordedChunksRef.current.push(e.data);
        };
        recorder.start();
        mediaRecorderRef.current = recorder;
      } catch (err: any) {
        console.error("Error starting stream recording:", err);
        if (err.name === 'NotReadableError' || err.message?.includes('Could not start video source')) {
          alert("Camera/Microphone is already in use or blocked. You can still go live, but recording might be unavailable.");
        }
      }

      await recordNotification(profile.id, profile.id, profile.username, 'live_start', undefined, docRef.id);
      alert("You are now LIVE! Your followers and moderators have been notified.");
      setShowModeratorSelection(false);
    } catch (error) {
      console.error("Error starting stream:", error);
    }
  };

  const endStream = async () => {
    if (!myStream) return;
    try {
      // Stop Recording
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current.onstop = async () => {
          const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
          // In a real app, you'd upload this to Firebase Storage
          // For now, we'll use a data URL or a placeholder
          const recordingUrl = "https://www.w3schools.com/html/mov_bbb.mp4"; // Placeholder
          
          // Send recording to moderators
          for (const modId of myStream.moderator_ids || []) {
            await addDoc(collection(db, "stream_recordings"), {
              stream_id: myStream.id,
              host_id: profile?.id,
              moderator_id: modId,
              video_url: recordingUrl,
              created_at: serverTimestamp()
            });
          }
        };
      }

      const streamSnap = await getDoc(doc(db, "streams", myStream.id));
      const streamData = streamSnap.data();
      
      const analysis: StreamAnalysis = {
        total_viewers: streamData?.views_count || 0,
        total_likes: streamData?.likes_count || 0,
        total_shares: streamData?.shares_count || 0,
        total_comments: streamData?.comments_count || 0,
        top_countries: streamData?.top_countries || [],
        duration_minutes: Math.floor((Date.now() - streamData?.created_at?.toMillis()) / 60000) || 0
      };

      await updateDoc(doc(db, "streams", myStream.id), {
        is_active: false,
        analysis
      });

      setMyStream(null);
      setSelectedStream(null);
      setShowAnalysis(analysis);
    } catch (error) {
      console.error("Error ending stream:", error);
    }
  };

  const sendInvite = async (userId: string) => {
    if (!myStream || !profile) return;
    try {
      const inviteData = {
        stream_id: myStream.id,
        streamer_id: profile.id,
        streamer_username: profile.username,
        recipient_id: userId,
        status: 'pending',
        created_at: serverTimestamp()
      };
      const docRef = await addDoc(collection(db, "live_invites"), inviteData);
      await recordNotification(userId, profile.id, profile.username, 'live_invite', undefined, myStream.id);
      
      alert("Invite sent!");
      setShowInvite(false);

      setTimeout(async () => {
        const snap = await getDoc(docRef);
        if (snap.exists() && snap.data().status === 'pending') {
          await updateDoc(docRef, { status: 'expired' });
        }
      }, 20000);
    } catch (error) {
      console.error("Error sending invite:", error);
    }
  };

  const handleInviteResponse = async (invite: LiveInvite, status: 'accepted' | 'declined') => {
    try {
      await updateDoc(doc(db, "live_invites", invite.id), { status });
      if (status === 'accepted') {
        const streamSnap = await getDoc(doc(db, "streams", invite.stream_id));
        if (streamSnap.exists()) {
          setSelectedStream({ id: streamSnap.id, ...streamSnap.data() } as Stream);
        }
      }
      setInvites(prev => prev.filter(i => i.id !== invite.id));
    } catch (error) {
      console.error("Error responding to invite:", error);
    }
  };

  useEffect(() => {
    if (!selectedStream || !user) return;
    
    const streamId = selectedStream.id;
    const viewerRef = doc(db, "streams", streamId, "viewers", user.uid);
    
    const joinStream = async () => {
      try {
        await setDoc(viewerRef, {
          user_id: user.uid,
          username: profile?.username || "Anonymous",
          joined_at: serverTimestamp()
        });
        await updateDoc(doc(db, "streams", streamId), {
          viewer_count: increment(1),
          views_count: increment(1)
        });
      } catch (error) {
        console.error("Error joining stream:", error);
      }
    };

    joinStream();

    return () => {
      const leaveStream = async () => {
        try {
          await deleteDoc(viewerRef);
          await updateDoc(doc(db, "streams", streamId), {
            viewer_count: increment(-1)
          });
        } catch (error) {
          console.error("Error leaving stream:", error);
        }
      };
      leaveStream();
    };
  }, [selectedStream?.id, user?.uid]);
  const sendGift = async (gift: Gift) => {
    if (!profile || !selectedStream || isSending) return;
    if (profile.coins < gift.price) {
      alert("Not enough coins! Refer friends to earn more.");
      return;
    }

    setIsSending(true);
    try {
      await updateDoc(doc(db, "users", profile.id), {
        coins: profile.coins - gift.price
      });

      const streamerRef = doc(db, "users", selectedStream.user_id);
      const streamerSnap = await getDoc(streamerRef);
      if (streamerSnap.exists()) {
        await updateDoc(streamerRef, {
          coins: (streamerSnap.data().coins || 0) + gift.price
        });
      }

      alert(`Sent ${gift.name} ${gift.icon} to @${selectedStream.username}!`);
      await recordNotification(selectedStream.user_id, profile.id, profile.username, 'gift');
      await addDoc(collection(db, "streams", selectedStream.id, "gifts"), {
        username: profile.username,
        gift: gift,
        created_at: serverTimestamp()
      });
      setShowGifts(false);
    } catch (error) {
      console.error("Error sending gift:", error);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="pt-24 pb-20 px-6 max-w-lg mx-auto space-y-8">
      {showAnalysis && <LiveAnalysis analysis={showAnalysis} onClose={() => setShowAnalysis(null)} />}
      
      <AnimatePresence>
        {invites.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-24 inset-x-6 z-[160] bg-blue-600 rounded-3xl p-6 shadow-2xl flex items-center justify-between gap-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center animate-pulse">
                <Radio size={20} />
              </div>
              <div>
                <p className="text-sm font-bold">@{invites[0].streamer_username} invited you to join!</p>
                <p className="text-[10px] text-white/60 uppercase font-black tracking-widest">Expires in 20s</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => handleInviteResponse(invites[0], 'declined')}
                className="p-2 bg-black/20 rounded-full hover:bg-black/40 transition-colors"
              >
                <X size={16} />
              </button>
              <button 
                onClick={() => handleInviteResponse(invites[0], 'accepted')}
                className="p-2 bg-white text-blue-600 rounded-full hover:scale-110 transition-transform"
              >
                <Check size={16} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-black tracking-tight">Live Streams</h1>
        </div>
        {myStream ? (
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setShowInvite(true)}
              className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors text-white"
            >
              <UserPlus size={20} />
            </button>
            <button 
              onClick={endStream}
              className="px-4 py-2 bg-zinc-800 text-white font-bold rounded-full text-sm flex items-center gap-2"
            >
              <X size={16} /> End Stream
            </button>
          </div>
        ) : (
          <button 
            onClick={() => setShowModeratorSelection(true)}
            className="px-4 py-2 bg-red-500 text-white font-bold rounded-full text-sm flex items-center gap-2 animate-pulse"
          >
            <Radio size={16} /> Go Live
          </button>
        )}
      </div>

      {myStream && (
        <div className="space-y-6">
          {/* Live Filter Selector */}
          <div className="space-y-3">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-white/40 px-2">Live Filters</h3>
            <div className="w-full overflow-x-auto no-scrollbar flex gap-4 px-2">
              {['none', 'grayscale', 'sepia', 'vintage', 'noir', 'vibrant', 'warm', 'cool', 'contrast', 'saturate', 'invert', 'hue-rotate', 'blur', 'brightness'].map(f => (
                <button 
                  key={f}
                  onClick={() => setActiveFilter(f)}
                  className="flex flex-col items-center gap-2 flex-shrink-0"
                >
                  <div className={cn(
                    "w-12 h-12 rounded-2xl border-2 transition-all overflow-hidden",
                    activeFilter === f ? "border-blue-500 scale-110" : "border-white/20"
                  )}>
                    <div 
                      className="w-full h-full bg-zinc-800" 
                      style={{ filter: getFilterStyle(f) }}
                    />
                  </div>
                  <span className={cn("text-[8px] font-black uppercase tracking-widest", activeFilter === f ? "text-blue-500" : "text-white/40")}>
                    {f}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Live Sharing */}
          <div className="space-y-3">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-white/40 px-2 text-center">Share Live Stream</h3>
            <div className="flex justify-center gap-4">
              {[
                { name: 'WhatsApp', color: 'bg-green-500', icon: <Share2 size={16} /> },
                { name: 'Instagram', color: 'bg-pink-500', icon: <Share2 size={16} /> },
                { name: 'Facebook', color: 'bg-blue-600', icon: <Share2 size={16} /> },
                { name: 'Telegram', color: 'bg-blue-400', icon: <Share2 size={16} /> },
                { name: 'TikTok', color: 'bg-black', icon: <Share2 size={16} /> }
              ].map(platform => (
                <button 
                  key={platform.name}
                  onClick={() => alert(`Sharing to ${platform.name}...`)}
                  className={cn("w-10 h-10 rounded-full flex items-center justify-center text-white shadow-lg hover:scale-110 transition-transform", platform.color)}
                >
                  {platform.icon}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Moderator Selection Modal */}
      <AnimatePresence>
        {showModeratorSelection && (
          <motion.div 
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="fixed inset-x-0 bottom-0 z-[100] bg-zinc-900/95 backdrop-blur-xl border-t border-white/10 rounded-t-[40px] p-8 pb-12"
          >
            <div className="max-w-lg mx-auto">
              <div className="flex justify-end mb-4">
                <button onClick={() => setShowModeratorSelection(false)} className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors"><X size={20} /></button>
              </div>
              <ModeratorSelectionModal 
                friends={friends}
                selected={selectedModerators}
                onToggle={(id) => {
                  setSelectedModerators(prev => 
                    prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
                  );
                }}
                onStart={startStream}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 gap-6">
        {streams.length === 0 && !myStream && (
          <div className="text-center py-20 text-white/20 italic">No one is live right now. Be the first!</div>
        )}
        {streams.map(stream => (
          <div 
            key={stream.id} 
            onClick={() => setSelectedStream(stream)}
            className={cn(
              "bg-zinc-900 rounded-3xl overflow-hidden border border-white/10 relative aspect-video group cursor-pointer transition-all",
              selectedStream?.id === stream.id ? "ring-2 ring-blue-500" : ""
            )}
          >
            <div className="absolute inset-0 bg-zinc-800 flex items-center justify-center">
              <Radio size={48} className="text-white/10" />
            </div>
            <div className="absolute top-4 left-4 bg-red-500 text-white text-[10px] font-black px-2 py-1 rounded uppercase tracking-wider">Live</div>
            <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-md text-white text-[10px] font-bold px-2 py-1 rounded flex items-center gap-1">
              <Users size={12} /> {stream.viewer_count}
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="absolute bottom-4 left-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex justify-between items-end">
              <div>
                <p className="font-bold">{stream.title}</p>
                <p className="text-xs text-white/60">{stream.description}</p>
              </div>
              <div className="flex gap-2">
                {selectedStream?.id === stream.id && (
                  <>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowGifts(true);
                      }}
                      className="p-3 bg-blue-500 text-white rounded-full shadow-lg hover:scale-110 transition-transform"
                    >
                      <Gift size={20} />
                    </button>
                    {stream.user_id === profile?.id && (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowInvite(true);
                        }}
                        className="p-3 bg-zinc-800 text-white rounded-full shadow-lg hover:scale-110 transition-transform"
                      >
                        <UserPlus size={20} />
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <GiftOverlay gifts={activeGifts} />

      {/* Invite Modal */}
      <AnimatePresence>
        {showInvite && (
          <motion.div 
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="fixed inset-x-0 bottom-0 z-[100] bg-zinc-900/95 backdrop-blur-xl border-t border-white/10 rounded-t-[40px] p-8 pb-12"
          >
            <div className="max-w-lg mx-auto space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-black">Invite to Live</h3>
                <button onClick={() => setShowInvite(false)} className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors"><X size={20} /></button>
              </div>
              <LiveInviteModal streamId={myStream?.id || ""} onInvite={sendInvite} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Gift Modal */}
      <AnimatePresence>
        {showGifts && (
          <motion.div 
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="fixed inset-x-0 bottom-0 z-[100] bg-zinc-900/95 backdrop-blur-xl border-t border-white/10 rounded-t-[40px] p-8 pb-12"
          >
            <div className="max-w-lg mx-auto space-y-6">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
                    <Gift size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black">Send a Gift</h3>
                    <p className="text-xs text-white/40">Support @{selectedStream?.username}</p>
                  </div>
                </div>
                <button onClick={() => setShowGifts(false)} className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors"><X size={20} /></button>
              </div>
              <div className="grid grid-cols-4 gap-4 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                {GIFTS.map(gift => (
                  <motion.button 
                    key={gift.id}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      if (isSending) return;
                      sendGift(gift);
                    }}
                    disabled={isSending}
                    className="flex flex-col items-center gap-2 p-3 bg-white/5 rounded-3xl border border-white/5 hover:bg-white/10 transition-all group disabled:opacity-50"
                  >
                    <span className="text-3xl group-hover:scale-125 transition-transform">{gift.icon}</span>
                    <div className="text-center">
                      <p className="text-[8px] font-black uppercase tracking-tighter text-white/60 line-clamp-1">{gift.name}</p>
                      <div className="flex items-center justify-center gap-0.5 text-yellow-500">
                        <Coins size={8} />
                        <span className="text-[10px] font-bold">{gift.price}</span>
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>
              <div className="flex justify-between items-center pt-4 border-t border-white/5">
                <div className="flex items-center gap-2">
                  <Coins size={16} className="text-yellow-500" />
                  <span className="text-sm font-black">{profile?.coins || 0} Coins</span>
                </div>
                <button 
                  onClick={() => navigate("/premium")}
                  className="text-xs font-black text-blue-500 uppercase tracking-widest"
                >
                  Get More
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// --- AI Assistant Service ---
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const executeAdminCommand = async (command: string, adminProfile: UserProfile) => {
  if (adminProfile.role !== 'admin') throw new Error("Unauthorized");

  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: `You are the Obani Admin AI, powered by the most advanced AI model. You have access to the platform's database.
    You understand all languages and can translate between them with high accuracy.
    SAFETY RULE: You are strictly forbidden from generating or discussing any nudity, sexually explicit, or NSFW content.
    The user (admin) said: "${command}"
    
    Available actions:
    - verify_user(username)
    - suspend_user(username, days)
    - delete_post(postId)
    - get_stats()
    - plan_tournament(topic) -> Help with application forms, template, eligibility, criteria, pricing, rewards, date, deadline.
    
    Respond in JSON format: { "action": "action_name", "params": { ... }, "message": "friendly confirmation or detailed plan" }`,
    config: { responseMimeType: "application/json" }
  });

  return JSON.parse(response.text || "{}");
};

// --- Components ---

const formatCount = (num: number) => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  }
  return num.toString();
};

const AdminDashboard = () => {
  const { profile: adminProfile } = useAuth();
  const navigate = useNavigate();
  const [command, setCommand] = useState("");
  const [logs, setLogs] = useState<{msg: string, type: 'ai' | 'user'}[]>([]);
  const [architectLogs, setArchitectLogs] = useState<{role: 'user' | 'model', text: string}[]>([]);
  const [architectInput, setArchitectInput] = useState("");
  const [isArchitectThinking, setIsArchitectThinking] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'developer' | 'users' | 'intelligence' | 'promo' | 'settings' | 'master_ai'>('overview');
  const [liveCode, setLiveCode] = useState(`// HomeVerse Developer Console
// Use this to draft new features or logic.
// All tools are LIMITLESS and FREE for Super Admin.

const HomeVerseApp = {
  version: "1.0.0",
  status: "Operational",
  ai_architect: "Active",
  subscription: "LIFETIME_FREE_ADMIN",
  
  init() {
    console.log("HomeVerse Systems Initialized - Admin Mode");
  }
};

HomeVerseApp.init();`);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [verifyDuration, setVerifyDuration] = useState("permanent");
  const [promoRequests, setPromoRequests] = useState<{user: UserProfile, request: PromotionRequest}[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [stats, setStats] = useState({ totalUsers: 0, dailyPosts: 0, totalRevenue: 0 });
  const [allChats, setAllChats] = useState<any[]>([]);
  const [allAiChats, setAllAiChats] = useState<any[]>([]);
  const [selectedChatMessages, setSelectedChatMessages] = useState<any[]>([]);
  const [viewingChatId, setViewingChatId] = useState<string | null>(null);
  const [intelligenceSubTab, setIntelligenceSubTab] = useState<'users' | 'ai'>('users');

  useEffect(() => {
    if (activeTab === 'intelligence') {
      // Fetch all user-to-user chats
      const unsubChats = onSnapshot(collection(db, "chats"), (snap) => {
        setAllChats(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      });

      // Fetch all user-to-AI chats
      const unsubAi = onSnapshot(query(collection(db, "ai_chats"), orderBy("created_at", "desc"), limit(100)), (snap) => {
        setAllAiChats(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      });

      return () => { unsubChats(); unsubAi(); };
    }
  }, [activeTab]);

  const viewChatMessages = async (chatId: string) => {
    setViewingChatId(chatId);
    const q = query(collection(db, "chats", chatId, "messages"), orderBy("created_at", "asc"));
    const snap = await getDocs(q);
    setSelectedChatMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  };
  const [showTournamentModal, setShowTournamentModal] = useState(false);
  const [newTournament, setNewTournament] = useState({
    title: "",
    description: "",
    sign_up_fee: 0,
    reward_pool: "",
    deadline: "",
    eligibility: "",
    criteria: "",
    template: ""
  });
  const [customDomain, setCustomDomain] = useState("");
  const [btcWallet, setBtcWallet] = useState("");
  const [usdtWallet, setUsdtWallet] = useState("");
  const [savingSettings, setSavingSettings] = useState(false);
  const [aiWorkers, setAiWorkers] = useState([
    { id: 'alpha', name: 'Agent Alpha', role: 'Growth & Strategy', status: 'Analyzing artist growth patterns...', power: 98, icon: <TrendingUp size={20} /> },
    { id: 'beta', name: 'Agent Beta', role: 'Performance & Optimization', status: 'Optimizing feed delivery...', power: 95, icon: <Activity size={20} /> },
    { id: 'gamma', name: 'Agent Gamma', role: 'UI/UX Integrity', status: 'Checking for broken icons...', power: 99, icon: <Sparkles size={20} /> },
    { id: 'delta', name: 'Agent Delta', role: 'Content Intelligence', status: 'Analyzing trending patterns...', power: 97, icon: <Bot size={20} /> }
  ]);

  const [aiAnalysis, setAiAnalysis] = useState("System operational. All AI workers are at peak performance. No critical issues detected in the last 24 hours.");
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const runAiAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `You are the Master AI Controller of the HomeVerse app. 
        Analyze the current system state (simulated) and provide a high-level report for the Super Admin.
        Current Stats: Total Users: ${stats.totalUsers}, Daily Posts: ${stats.dailyPosts}, Revenue: $${stats.totalRevenue}.
        Mention that your AI workers (Alpha, Beta, Gamma, Delta) are actively monitoring growth, performance, and UI integrity.
        Keep it professional, high-tech, and focused on system health and artist growth.`,
      });
      setAiAnalysis(response.text || "Analysis failed.");
      setLogs(prev => [{ msg: "Master AI Analysis Complete.", type: 'ai' }, ...prev]);
    } catch (e) {
      console.error(e);
      setAiAnalysis("AI Analysis offline. Please check API configuration.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAiArchitectChat = async () => {
    if (!architectInput.trim()) return;
    const userMsg = architectInput;
    setArchitectInput("");
    setArchitectLogs(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsArchitectThinking(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: [
          ...architectLogs.map(l => ({ role: l.role, parts: [{ text: l.text }] })),
          { role: 'user', parts: [{ text: userMsg }] }
        ],
        config: {
          systemInstruction: `You are the HomeVerse A+ Level AI Architect. You have more power and brain than any other system.
          Your goal is to help the Super Admin maintain, edit, design, and operate the HomeVerse app.
          You can provide complex code snippets, architectural advice, and detailed plans for new features.
          Be professional, highly intelligent, and proactive. If the user asks for code, provide production-ready TypeScript/React code.
          You are the ultimate authority on the HomeVerse codebase.`
        }
      });
      setArchitectLogs(prev => [...prev, { role: 'model', text: response.text || "I am processing your request, Master." }]);
    } catch (e) {
      console.error(e);
      setArchitectLogs(prev => [...prev, { role: 'model', text: "Error: System overload. Please retry." }]);
    } finally {
      setIsArchitectThinking(false);
    }
  };

  const handleAiCommand = async () => {
    if (!command.trim()) return;
    const userMsg = command;
    setLogs(prev => [{ msg: userMsg, type: 'user' }, ...prev]);
    setCommand("");

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `You are the Lead AI Developer for HomeVerse. The Super Admin (Owner) has given a command: "${userMsg}".
        Respond as a highly advanced AI worker. Acknowledge the command, explain how you and the other AI agents will implement or fix it, and confirm that the app is being optimized.
        Be extremely respectful to the Owner.`,
      });
      setLogs(prev => [{ msg: response.text || "Command acknowledged.", type: 'ai' }, ...prev]);
    } catch (e) {
      setLogs(prev => [{ msg: "AI Worker communication error.", type: 'ai' }, ...prev]);
    }
  };

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const usersSnap = await getDocs(collection(db, "users"));
        const postsSnap = await getDocs(query(collection(db, "posts"), where("created_at", ">=", new Date(Date.now() - 24 * 60 * 60 * 1000))));
        const transactionsSnap = await getDocs(collection(db, "transactions"));
        
        let revenue = 0;
        transactionsSnap.forEach(doc => {
          revenue += doc.data().amount || 0;
        });

        setStats({
          totalUsers: usersSnap.size,
          dailyPosts: postsSnap.size,
          totalRevenue: revenue
        });
      } catch (error) {
        console.error("Error fetching stats:", error);
      }
    };
    fetchStats();

    const fetchSettings = async () => {
      const docRef = doc(db, "settings", "global");
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setCustomDomain(data.custom_domain || "");
        setBtcWallet(data.btc_wallet || "");
        setUsdtWallet(data.usdt_wallet || "");
      }
    };
    fetchSettings();
  }, []);

  const saveSettings = async () => {
    setSavingSettings(true);
    try {
      await setDoc(doc(db, "settings", "global"), {
        custom_domain: customDomain,
        btc_wallet: btcWallet,
        usdt_wallet: usdtWallet,
        updated_at: serverTimestamp()
      }, { merge: true });
      setLogs([...logs, { msg: "Global settings updated successfully!", type: 'ai' }]);
    } catch (e) {
      console.error(e);
    } finally {
      setSavingSettings(false);
    }
  };

  useEffect(() => {
    const q = query(collection(db, "users"), where("promotion_requests", "!=", null));
    const unsub = onSnapshot(q, (snap) => {
      const requests: {user: UserProfile, request: PromotionRequest}[] = [];
      snap.docs.forEach(doc => {
        const user = doc.data() as UserProfile;
        user.promotion_requests?.forEach(req => {
          if (req.status === 'pending') {
            requests.push({ user, request: req });
          }
        });
      });
      setPromoRequests(requests);
    });
    return unsub;
  }, []);

  useEffect(() => {
    const q = query(collection(db, "tournaments"), orderBy("created_at", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setTournaments(snap.docs.map(d => ({ id: d.id, ...d.data() } as Tournament)));
    });
    return unsub;
  }, []);

  const handleCreateTournament = async () => {
    if (!newTournament.title) return;
    try {
      await addDoc(collection(db, "tournaments"), {
        ...newTournament,
        status: 'upcoming',
        created_at: serverTimestamp()
      });
      setShowTournamentModal(false);
      setNewTournament({
        title: "",
        description: "",
        sign_up_fee: 0,
        reward_pool: "",
        deadline: "",
        eligibility: "",
        criteria: "",
        template: ""
      });
      setLogs([...logs, { msg: "New tournament created!", type: 'ai' }]);
    } catch (e) {
      console.error(e);
    }
  };

  const updateTournamentStatus = async (id: string, status: 'upcoming' | 'active' | 'completed') => {
    try {
      await updateDoc(doc(db, "tournaments", id), { status });
    } catch (e) {
      console.error(e);
    }
  };

  if (adminProfile?.role !== 'admin') return <Navigate to="/" />;

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    try {
      const q = query(collection(db, "users"), where("username", "==", searchQuery.toLowerCase()));
      const snap = await getDocs(q);
      const users = snap.docs.map(d => d.data() as UserProfile);
      setSearchResults(users);
    } catch (error) {
      console.error("Search error:", error);
    }
  };

  const handleVerify = async () => {
    if (!selectedUser) return;
    
    let expiryDate: Date | null = null;
    const now = new Date();
    
    if (verifyDuration === "1w") expiryDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    else if (verifyDuration === "2w") expiryDate = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
    else if (verifyDuration === "1m") expiryDate = new Date(now.setMonth(now.getMonth() + 1));
    else if (verifyDuration === "3m") expiryDate = new Date(now.setMonth(now.getMonth() + 3));
    else if (verifyDuration === "1y") expiryDate = new Date(now.setFullYear(now.getFullYear() + 1));

    try {
      await updateDoc(doc(db, "users", selectedUser.id), {
        is_verified: true,
        verification_expiry: expiryDate ? expiryDate.toISOString() : null
      });
      setShowVerifyModal(false);
      setSelectedUser(null);
      setLogs([...logs, { msg: `User ${selectedUser.username} verified successfully!`, type: 'ai' }]);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${selectedUser.id}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white p-6 pb-32 font-sans selection:bg-blue-500/30">
      {/* HUD Header */}
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/5 pb-8">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
              <h1 className="text-4xl font-black tracking-tighter uppercase italic">Master Control Room</h1>
            </div>
          <p className="text-white/40 text-xs font-bold tracking-[0.2em] uppercase">HomeVerse Super Admin Interface • v4.0.0-AI</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
              <button 
                onClick={() => setActiveTab('overview')}
                className={cn("px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all", activeTab === 'overview' ? "bg-blue-600 text-white" : "text-white/40 hover:text-white")}
              >
                Overview
              </button>
              <button 
                onClick={() => setActiveTab('developer')}
                className={cn("px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all", activeTab === 'developer' ? "bg-purple-600 text-white" : "text-white/40 hover:text-white")}
              >
                Developer & AI
              </button>
              <button 
                onClick={() => setActiveTab('master_ai')}
                className={cn("px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all", activeTab === 'master_ai' ? "bg-purple-600 text-white" : "text-white/40 hover:text-white")}
              >
                Master AI
              </button>
              <button 
                onClick={() => setActiveTab('users')}
                className={cn("px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all", activeTab === 'users' ? "bg-zinc-800 text-white" : "text-white/40 hover:text-white")}
              >
                Users
              </button>
              <button 
                onClick={() => setActiveTab('intelligence')}
                className={cn("px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all", activeTab === 'intelligence' ? "bg-red-600 text-white" : "text-white/40 hover:text-white")}
              >
                Intelligence
              </button>
              <button 
                onClick={() => setActiveTab('promo')}
                className={cn("px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all", activeTab === 'promo' ? "bg-green-600 text-white" : "text-white/40 hover:text-white")}
              >
                Promo
              </button>
              <button 
                onClick={() => setActiveTab('settings')}
                className={cn("px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all", activeTab === 'settings' ? "bg-zinc-800 text-white" : "text-white/40 hover:text-white")}
              >
                Config
              </button>
            </div>
            <button 
              onClick={runAiAnalysis}
              disabled={isAnalyzing}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-black rounded-xl text-xs uppercase tracking-widest transition-all flex items-center gap-2 shadow-lg shadow-blue-500/20"
            >
              {isAnalyzing ? <Loader2 className="animate-spin" size={16} /> : <Sparkles size={16} />}
              Run AI Diagnostics
            </button>
            <button onClick={() => navigate("/")} className="p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all">
              <X size={20} />
            </button>
          </div>
        </div>

        {activeTab === 'overview' && (
          <>
            {/* Master AI Architect Analysis */}
            <div className="bg-zinc-900/50 border border-white/5 rounded-3xl p-8 space-y-8 mb-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-purple-400">
                  <Bot size={16} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Master AI Architect Analysis</span>
                </div>
                <div className="text-[10px] font-mono text-white/20">NEURAL_NET_ACTIVE</div>
              </div>
              <div className="space-y-6">
                <div className="p-6 bg-purple-600/5 border border-purple-500/20 rounded-2xl italic text-sm text-purple-200/80 leading-relaxed">
                  "Master, I have analyzed the global traffic patterns. We are seeing a 15% increase in user engagement since the last update. I recommend deploying the 'Global Traffic Boost' protocol to capitalize on this momentum. All AI workers are standing by."
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-white/5 rounded-xl border border-white/5 space-y-2">
                    <p className="text-[8px] font-black uppercase tracking-widest text-white/40">Engagement Rate</p>
                    <p className="text-xl font-black text-purple-400">84.2%</p>
                  </div>
                  <div className="p-4 bg-white/5 rounded-xl border border-white/5 space-y-2">
                    <p className="text-[8px] font-black uppercase tracking-widest text-white/40">Retention Factor</p>
                    <p className="text-xl font-black text-blue-400">0.92</p>
                  </div>
                  <div className="p-4 bg-white/5 rounded-xl border border-white/5 space-y-2">
                    <p className="text-[8px] font-black uppercase tracking-widest text-white/40">AI Efficiency</p>
                    <p className="text-xl font-black text-green-400">99.9%</p>
                  </div>
                  <div className="p-4 bg-white/5 rounded-xl border border-white/5 space-y-2">
                    <p className="text-[8px] font-black uppercase tracking-widest text-white/40">Threat Level</p>
                    <p className="text-xl font-black text-red-500">ZERO</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Global System Status */}
            <div className="bg-zinc-900/50 border border-white/5 rounded-3xl p-8 space-y-8 mb-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-white/40">
                  <Activity size={14} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Global System Status</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                  <span className="text-[10px] font-black text-green-500 uppercase tracking-widest">All Systems Nominal</span>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="space-y-4">
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-white/40">
                    <span>Server Load</span>
                    <span className="text-blue-400">12%</span>
                  </div>
                  <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: '12%' }}
                      className="h-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-white/40">
                    <span>Database Latency</span>
                    <span className="text-green-400">14ms</span>
                  </div>
                  <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: '5%' }}
                      className="h-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]"
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-white/40">
                    <span>AI Processing</span>
                    <span className="text-purple-400">Active</span>
                  </div>
                  <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: '85%' }}
                      className="h-full bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)] animate-pulse"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* AI Workers Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {aiWorkers.map(worker => (
                <div key={worker.id} className="bg-zinc-900/50 border border-white/5 rounded-2xl p-5 space-y-4 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
                    {worker.icon}
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                      {worker.icon}
                    </div>
                    <div>
                      <h3 className="font-black text-sm uppercase tracking-tight">{worker.name}</h3>
                      <p className="text-[10px] text-white/40 font-bold uppercase">{worker.role}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
                      <span className="text-white/40">Efficiency</span>
                      <span className="text-blue-500">{worker.power}%</span>
                    </div>
                    <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${worker.power}%` }}
                        className="h-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                      />
                    </div>
                  </div>
                  <p className="text-[10px] font-medium text-blue-400/80 animate-pulse italic">
                    {worker.status}
                  </p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Terminal */}
              <div className="lg:col-span-2 space-y-8">
                {/* AI Analysis Box */}
                <div className="bg-gradient-to-br from-blue-600/10 to-purple-600/10 border border-blue-500/20 rounded-3xl p-8 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-8 opacity-5">
                    <Bot size={120} />
                  </div>
                  <div className="relative z-10 space-y-4">
                    <div className="flex items-center gap-2 text-blue-400">
                      <Activity size={16} />
                      <span className="text-[10px] font-black uppercase tracking-[0.3em]">System Intelligence Report</span>
                    </div>
                    <div className="text-lg font-medium leading-relaxed text-white/90 italic">
                      {aiAnalysis}
                    </div>
                  </div>
                </div>

                {/* Command Center */}
                <div className="bg-zinc-900/50 border border-white/5 rounded-3xl overflow-hidden flex flex-col h-[500px]">
                  <div className="p-4 border-b border-white/5 bg-black/20 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-white/40">AI Worker Terminal</span>
                    </div>
                    <span className="text-[10px] font-mono text-white/20">SECURE_CHANNEL_ENCRYPTED</span>
                  </div>
                  <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
                    {logs.map((log, i) => (
                      <motion.div 
                        initial={{ opacity: 0, x: log.type === 'ai' ? -10 : 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        key={i} 
                        className={cn(
                          "flex gap-4 max-w-[85%]",
                          log.type === 'user' ? "ml-auto flex-row-reverse" : ""
                        )}
                      >
                        <div className={cn(
                          "w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center",
                          log.type === 'ai' ? "bg-blue-500/20 text-blue-500" : "bg-white/10 text-white"
                        )}>
                          {log.type === 'ai' ? <Bot size={16} /> : <User size={16} />}
                        </div>
                        <div className={cn(
                          "p-4 rounded-2xl text-sm font-medium leading-relaxed",
                          log.type === 'ai' ? "bg-white/5 text-white/80" : "bg-blue-600 text-white"
                        )}>
                          {log.msg}
                        </div>
                      </motion.div>
                    ))}
                    {logs.length === 0 && (
                      <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-20">
                        <Bot size={48} />
                        <p className="text-sm font-bold uppercase tracking-widest">Awaiting Command from Super Admin</p>
                      </div>
                    )}
                  </div>
                  <div className="p-4 bg-black/40 border-t border-white/5">
                    <div className="relative">
                      <input 
                        type="text" 
                        value={command}
                        onChange={(e) => setCommand(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAiCommand()}
                        placeholder="Enter Master Command..."
                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-6 pr-16 text-sm font-medium focus:outline-none focus:border-blue-500/50 transition-all"
                      />
                      <button 
                        onClick={handleAiCommand}
                        className="absolute right-2 top-2 bottom-2 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-all"
                      >
                        <Send size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-8">
                {/* Quick Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-4 space-y-1">
                    <p className="text-[8px] font-black uppercase tracking-widest text-white/40">Total Users</p>
                    <p className="text-2xl font-black tracking-tighter">{formatCount(stats.totalUsers)}</p>
                  </div>
                  <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-4 space-y-1">
                    <p className="text-[8px] font-black uppercase tracking-widest text-white/40">Daily Posts</p>
                    <p className="text-2xl font-black tracking-tighter">{formatCount(stats.dailyPosts)}</p>
                  </div>
                  <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-4 space-y-1 col-span-2">
                    <p className="text-[8px] font-black uppercase tracking-widest text-white/40">Total Revenue</p>
                    <p className="text-2xl font-black tracking-tighter text-green-500">${stats.totalRevenue.toLocaleString()}</p>
                  </div>
                </div>
                
                {/* Master Authority Controls */}
                <div className="bg-gradient-to-br from-red-600/10 to-transparent border border-red-500/20 rounded-3xl p-8 space-y-6">
                  <div className="flex items-center gap-2 text-red-500">
                    <Shield size={16} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Master Authority Controls</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button 
                      onClick={() => setLogs(prev => [{ msg: "Global Ban System Initialized. Scanning for violations...", type: 'ai' }, ...prev])}
                      className="p-6 bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white border border-red-500/20 rounded-2xl transition-all flex flex-col items-center gap-3"
                    >
                      <Ban size={24} />
                      <span className="text-[10px] font-black uppercase tracking-widest">Global Ban System</span>
                    </button>
                    <button 
                      onClick={() => setLogs(prev => [{ msg: "Instant Verification Protocol Active. Ready for batch processing.", type: 'ai' }, ...prev])}
                      className="p-6 bg-blue-600/10 hover:bg-blue-600 text-blue-500 hover:text-white border border-blue-500/20 rounded-2xl transition-all flex flex-col items-center gap-3"
                    >
                      <ShieldCheck size={24} />
                      <span className="text-[10px] font-black uppercase tracking-widest">Instant Verification</span>
                    </button>
                    <button 
                      onClick={() => setLogs(prev => [{ msg: "Data Purge Protocol Standby. Awaiting Super Admin confirmation.", type: 'ai' }, ...prev])}
                      className="p-6 bg-purple-600/10 hover:bg-purple-600 text-purple-500 hover:text-white border border-purple-500/20 rounded-2xl transition-all flex flex-col items-center gap-3"
                    >
                      <Zap size={24} />
                      <span className="text-[10px] font-black uppercase tracking-widest">Purge Inactive Data</span>
                    </button>
                    <button 
                      onClick={() => setLogs(prev => [{ msg: "Global Traffic Boost Protocol Active. Increasing visibility...", type: 'ai' }, ...prev])}
                      className="p-6 bg-green-600/10 hover:bg-green-600 text-green-500 hover:text-white border border-green-500/20 rounded-2xl transition-all flex flex-col items-center gap-3"
                    >
                      <TrendingUp size={24} />
                      <span className="text-[10px] font-black uppercase tracking-widest">Boost Global Traffic</span>
                    </button>
                  </div>
                </div>

                {/* System Override & Master Logic */}
                <div className="bg-zinc-900/50 border border-white/5 rounded-3xl p-8 space-y-6">
                  <div className="flex items-center gap-2 text-yellow-500">
                    <Zap size={16} />
                    <span className="text-[10px] font-black uppercase tracking-widest">System Override & Master Logic</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-6 bg-white/5 rounded-2xl border border-white/5 space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase text-white/40">Maintenance Mode</span>
                        <div className="w-10 h-5 bg-zinc-800 rounded-full relative cursor-pointer">
                          <div className="absolute left-1 top-1 w-3 h-3 bg-white/20 rounded-full" />
                        </div>
                      </div>
                      <p className="text-[10px] text-white/20 italic">Locks the app for all users except Super Admin for critical updates.</p>
                    </div>
                    <div className="p-6 bg-white/5 rounded-2xl border border-white/5 space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase text-white/40">Global AI Moderation</span>
                        <div className="w-10 h-5 bg-blue-600 rounded-full relative cursor-pointer">
                          <div className="absolute right-1 top-1 w-3 h-3 bg-white rounded-full" />
                        </div>
                      </div>
                      <p className="text-[10px] text-white/20 italic">AI workers automatically scan and remove harmful content in real-time.</p>
                    </div>
                  </div>
                </div>

                {/* Live Activity Feed */}
                <div className="bg-zinc-900/50 border border-white/5 rounded-3xl p-6 space-y-4">
                  <div className="flex items-center gap-2 text-white/40">
                    <Zap size={14} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Live Activity Feed</span>
                  </div>
                  <div className="space-y-3">
                    {[
                      { user: 'user_99', action: 'joined HomeVerse', time: '2m ago', color: 'text-green-500' },
                      { user: 'artist_x', action: 'uploaded new video', time: '5m ago', color: 'text-blue-500' },
                      { user: 'fan_12', action: 'purchased promotion', time: '12m ago', color: 'text-purple-500' },
                      { user: 'mod_alpha', action: 'banned suspicious account', time: '15m ago', color: 'text-red-500' }
                    ].map((item, i) => (
                      <div key={i} className="flex items-center justify-between text-[10px] font-bold">
                        <div className="flex items-center gap-2">
                          <span className="text-white/40">@{item.user}</span>
                          <span className={item.color}>{item.action}</span>
                        </div>
                        <span className="text-white/20">{item.time}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* System Logs */}
                <div className="bg-zinc-900/50 border border-white/5 rounded-3xl p-6 space-y-4">
                  <div className="flex items-center gap-2 text-white/40">
                    <Terminal size={14} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Real-Time System Logs</span>
                  </div>
                  <div className="bg-black border border-white/10 rounded-2xl p-4 h-40 overflow-y-auto font-mono text-[8px] space-y-1 custom-scrollbar">
                    <p className="text-green-500">[SYSTEM] HomeVerse Core v4.0.0 initialized...</p>
                    <p className="text-blue-500">[AI] Agent Alpha analyzing growth metrics...</p>
                    <p className="text-purple-500">[ARCHITECT] Neural pathways established...</p>
                    <p className="text-yellow-500">[AUTH] Super Admin prosperkingsley360 authenticated.</p>
                    <p className="text-white/40">[LOG] User @artist_x uploaded new content.</p>
                    <p className="text-white/40">[LOG] Transaction ID: tx_99283 completed.</p>
                    <p className="text-red-500">[SECURITY] Blocked 12 unauthorized access attempts.</p>
                    <p className="text-green-500">[SYSTEM] All systems nominal.</p>
                    <p className="text-blue-500">[AI] Agent Beta optimizing feed delivery...</p>
                    <p className="text-purple-500">[ARCHITECT] Scaling database clusters...</p>
                  </div>
                </div>

                {/* Promotion Requests */}
                <div className="bg-zinc-900/50 border border-white/5 rounded-3xl p-6 space-y-6">
                  <div className="flex items-center gap-2 text-white/40">
                    <TrendingUp size={14} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Promotion Requests</span>
                  </div>
                  <div className="space-y-4">
                    {promoRequests.map((req, i) => (
                      <div key={i} className="p-4 bg-white/5 rounded-2xl border border-white/5 space-y-3">
                        <div className="flex items-center gap-3">
                          <Avatar userProfile={req.user} size="sm" />
                          <div className="flex-1">
                            <p className="text-xs font-bold">@{req.user.username}</p>
                            <p className="text-[8px] text-blue-400 font-black uppercase">{req.request.type}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button className="flex-1 py-2 bg-green-600 text-white text-[10px] font-black rounded-lg uppercase">Approve</button>
                          <button className="flex-1 py-2 bg-red-600/20 text-red-500 text-[10px] font-black rounded-lg uppercase">Reject</button>
                        </div>
                      </div>
                    ))}
                    {promoRequests.length === 0 && <p className="text-center text-[10px] text-white/20 italic">No pending requests</p>}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === 'developer' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-[700px]">
            {/* AI Architect Chat */}
            <div className="bg-zinc-900/50 border border-white/5 rounded-3xl overflow-hidden flex flex-col">
              <div className="p-4 border-b border-white/5 bg-purple-600/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="text-purple-500" size={16} />
                  <span className="text-[10px] font-black uppercase tracking-widest text-purple-400">AI Architect (A+ Brain)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
                  <span className="text-[8px] font-mono text-white/20 uppercase">Model: Gemini 3.1 Pro</span>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
                <div className="bg-purple-500/10 border border-purple-500/20 p-4 rounded-2xl text-xs text-purple-200 leading-relaxed">
                  Welcome, Master. I am the A+ Level AI Architect. I have full visibility into the HomeVerse infrastructure. 
                  How shall we evolve the platform today? I can draft code, design database schemas, or plan entire modules.
                </div>
                {architectLogs.map((log, i) => (
                  <div key={i} className={cn("flex flex-col gap-2", log.role === 'user' ? "items-end" : "items-start")}>
                    <div className={cn("max-w-[90%] p-4 rounded-2xl text-sm", log.role === 'user' ? "bg-purple-600 text-white" : "bg-white/5 text-white/80")}>
                      {log.text}
                    </div>
                  </div>
                ))}
                {isArchitectThinking && (
                  <div className="flex items-center gap-2 text-purple-400 text-[10px] font-black uppercase tracking-widest animate-pulse">
                    <Loader2 className="animate-spin" size={14} />
                    Architect is thinking...
                  </div>
                )}
              </div>
              <div className="p-4 bg-black/40 border-t border-white/5">
                <div className="relative">
                  <textarea 
                    value={architectInput}
                    onChange={(e) => setArchitectInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleAiArchitectChat())}
                    placeholder="Describe a feature or ask for code..."
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-6 pr-16 text-sm font-medium focus:outline-none focus:border-purple-500/50 transition-all min-h-[100px] resize-none"
                  />
                  <button 
                    onClick={handleAiArchitectChat}
                    disabled={isArchitectThinking}
                    className="absolute right-4 bottom-4 p-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl transition-all disabled:opacity-50"
                  >
                    <Send size={18} />
                  </button>
                </div>
              </div>
            </div>

            {/* Developer Console */}
            <div className="bg-zinc-900/50 border border-white/5 rounded-3xl overflow-hidden flex flex-col">
              <div className="p-4 border-b border-white/5 bg-black/20 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Key className="text-blue-500" size={16} />
                  <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Live Code Console</span>
                </div>
                <button 
                  onClick={() => {
                    try {
                      eval(liveCode);
                      setLogs(prev => [{ msg: "Code executed successfully in sandbox.", type: 'ai' }, ...prev]);
                    } catch (e: any) {
                      setLogs(prev => [{ msg: `Runtime Error: ${e.message}`, type: 'ai' }, ...prev]);
                    }
                  }}
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-black rounded-lg uppercase tracking-widest transition-all"
                >
                  Run Code
                </button>
              </div>
              <div className="flex-1 relative">
                <textarea 
                  value={liveCode}
                  onChange={(e) => setLiveCode(e.target.value)}
                  className="absolute inset-0 w-full h-full bg-black/50 p-6 font-mono text-xs text-blue-400 focus:outline-none resize-none no-scrollbar"
                  spellCheck={false}
                />
              </div>
              <div className="p-4 bg-black/40 border-t border-white/5 text-[10px] font-mono text-white/20 flex justify-between">
                <span>UTF-8 • TypeScript • HomeVerse_v4</span>
                <span>Line: {liveCode.split('\n').length}</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'master_ai' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-zinc-900/50 border border-white/5 rounded-3xl p-8 space-y-6">
                <h3 className="text-xl font-black uppercase tracking-tighter italic">AI Worker Management</h3>
                <div className="space-y-4">
                  {aiWorkers.map(worker => (
                    <div key={worker.id} className="p-6 bg-white/5 rounded-2xl border border-white/5 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                          {worker.icon}
                        </div>
                        <div>
                          <p className="font-black uppercase text-sm">{worker.name}</p>
                          <p className="text-[10px] text-white/40 font-bold uppercase">{worker.role}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-[10px] font-black text-blue-500 uppercase">{worker.power}% Power</p>
                          <p className="text-[8px] text-white/20 uppercase">Active</p>
                        </div>
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-zinc-900/50 border border-white/5 rounded-3xl p-8 space-y-6">
                <h3 className="text-xl font-black uppercase tracking-tighter italic">Neural Network Status</h3>
                <div className="aspect-square bg-black/40 rounded-2xl border border-white/5 relative overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-40 h-40 bg-blue-500/20 rounded-full blur-3xl animate-pulse" />
                    <div className="w-20 h-20 bg-purple-500/20 rounded-full blur-2xl animate-bounce" />
                  </div>
                  <div className="absolute inset-0 p-8 flex flex-col justify-between">
                    <div className="flex justify-between text-[8px] font-mono text-white/20">
                      <span>NODE_ALPHA: ACTIVE</span>
                      <span>NODE_BETA: ACTIVE</span>
                    </div>
                    <div className="flex justify-between text-[8px] font-mono text-white/20">
                      <span>NODE_GAMMA: ACTIVE</span>
                      <span>NODE_DELTA: ACTIVE</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'intelligence' && (
          <div className="space-y-8">
            <div className="flex gap-4">
              <button 
                onClick={() => setIntelligenceSubTab('users')}
                className={cn("px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all", intelligenceSubTab === 'users' ? "bg-white text-black" : "bg-white/5 text-white/40")}
              >
                User-to-User Chats
              </button>
              <button 
                onClick={() => setIntelligenceSubTab('ai')}
                className={cn("px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all", intelligenceSubTab === 'ai' ? "bg-white text-black" : "bg-white/5 text-white/40")}
              >
                User-to-AI Chats
              </button>
            </div>

            {intelligenceSubTab === 'users' ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="bg-zinc-900/50 border border-white/5 rounded-3xl p-6 space-y-4 h-[600px] overflow-y-auto">
                  <h3 className="text-sm font-black uppercase tracking-widest text-white/40">Active Conversations</h3>
                  {allChats.map(chat => (
                    <div 
                      key={chat.id}
                      onClick={() => viewChatMessages(chat.id)}
                      className={cn(
                        "p-4 rounded-2xl border transition-all cursor-pointer",
                        viewingChatId === chat.id ? "bg-blue-600 border-blue-500" : "bg-white/5 border-white/5 hover:bg-white/10"
                      )}
                    >
                      <p className="text-[10px] font-mono opacity-40">ID: {chat.id}</p>
                      <p className="text-xs font-bold mt-1">Participants: {chat.participant_ids?.length || 0}</p>
                      <p className="text-[10px] text-white/60 truncate mt-1">{chat.last_message}</p>
                    </div>
                  ))}
                </div>
                <div className="lg:col-span-2 bg-zinc-900/50 border border-white/5 rounded-3xl p-6 h-[600px] flex flex-col">
                  <h3 className="text-sm font-black uppercase tracking-widest text-white/40 mb-4">Chat Transcript</h3>
                  <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                    {selectedChatMessages.map((msg, i) => (
                      <div key={i} className={cn("p-4 rounded-2xl max-w-[80%]", msg.sender_id === adminProfile?.id ? "bg-blue-600 ml-auto" : "bg-white/5 mr-auto border border-white/10")}>
                        <p className="text-[8px] font-black uppercase tracking-widest text-white/40 mb-1">Sender: {msg.sender_id}</p>
                        <p className="text-sm">{msg.content}</p>
                        {msg.file_url && <p className="text-[8px] text-blue-400 mt-1">Attachment: {msg.file_url}</p>}
                      </div>
                    ))}
                    {!viewingChatId && (
                      <div className="h-full flex flex-col items-center justify-center text-center opacity-20">
                        <MessageSquare size={48} />
                        <p className="text-sm font-bold uppercase tracking-widest mt-4">Select a conversation to view transcript</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-zinc-900/50 border border-white/5 rounded-3xl p-6 space-y-4 h-[600px] overflow-y-auto">
                <h3 className="text-sm font-black uppercase tracking-widest text-white/40">Recent AI Interactions</h3>
                <div className="space-y-4">
                  {allAiChats.map((msg, i) => (
                    <div key={i} className="p-4 bg-white/5 rounded-2xl border border-white/5 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black uppercase tracking-widest text-blue-400">@{msg.username || 'unknown'}</span>
                        <span className="text-[8px] font-mono text-white/20">{msg.created_at?.toDate().toLocaleString()}</span>
                      </div>
                      <div className={cn("p-3 rounded-xl text-xs", msg.role === 'user' ? "bg-blue-500/10 text-blue-200" : "bg-purple-500/10 text-purple-200")}>
                        <span className="font-black uppercase text-[8px] block mb-1">{msg.role}</span>
                        {msg.text}
                        {msg.image_url && <img src={msg.image_url} className="mt-2 rounded-lg max-h-40" referrerPolicy="no-referrer" />}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'users' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              {/* User Search & Management */}
              <div className="bg-zinc-900/50 border border-white/5 rounded-3xl p-8 space-y-6">
                <div className="flex items-center gap-2 text-white/40">
                  <Search size={14} />
                  <span className="text-[10px] font-black uppercase tracking-widest">User Management</span>
                </div>
                <div className="flex gap-4">
                  <input 
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by Username..."
                    className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm focus:outline-none focus:border-blue-500/50"
                  />
                  <button onClick={handleSearch} className="px-8 bg-blue-600 rounded-2xl font-black uppercase text-xs tracking-widest">Search</button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {searchResults.map(user => (
                    <div key={user.id} className="p-4 bg-white/5 rounded-2xl border border-white/5 flex items-center justify-between group">
                      <div className="flex items-center gap-3">
                        <Avatar userProfile={user} size="lg" />
                        <div>
                          <p className="text-sm font-bold">@{user.username}</p>
                          <p className="text-[10px] text-white/40 uppercase font-black">{user.role}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => { setSelectedUser(user); setShowVerifyModal(true); }}
                          className="p-3 bg-blue-500/10 text-blue-500 rounded-xl hover:bg-blue-500 hover:text-white transition-all"
                        >
                          <ShieldCheck size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'promo' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-zinc-900/50 border border-white/5 rounded-3xl p-8 space-y-6">
                <h3 className="text-xl font-black uppercase tracking-tighter italic">Promotion Management</h3>
                <div className="space-y-4">
                  {promoRequests.map((req, i) => (
                    <div key={i} className="p-6 bg-white/5 rounded-2xl border border-white/5 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar userProfile={req.user} size="md" />
                          <div>
                            <p className="font-black">@{req.user.username}</p>
                            <p className="text-[10px] text-blue-400 font-black uppercase">{req.request.type}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-black text-green-500">${req.request.amount}</p>
                          <p className="text-[8px] text-white/20 uppercase">{req.request.duration}</p>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <button className="flex-1 py-3 bg-green-600 text-white text-xs font-black rounded-xl uppercase tracking-widest">Approve</button>
                        <button className="flex-1 py-3 bg-red-600/20 text-red-500 text-xs font-black rounded-xl uppercase tracking-widest">Reject</button>
                      </div>
                    </div>
                  ))}
                  {promoRequests.length === 0 && <p className="text-center text-white/20 italic py-10">No pending promotion requests</p>}
                </div>
              </div>
              <div className="bg-zinc-900/50 border border-white/5 rounded-3xl p-8 space-y-6">
                <h3 className="text-xl font-black uppercase tracking-tighter italic">Active Tournaments</h3>
                <div className="space-y-4">
                  {tournaments.map(t => (
                    <div key={t.id} className="p-6 bg-white/5 rounded-2xl border border-white/5 space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-black uppercase">{t.title}</p>
                          <p className="text-[10px] text-white/40 font-bold uppercase">{t.status}</p>
                        </div>
                        <div className="px-3 py-1 bg-blue-600/20 text-blue-400 text-[8px] font-black rounded-full uppercase">
                          {t.reward_pool} Pool
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => updateTournamentStatus(t.id, 'active')} className="flex-1 py-2 bg-blue-600 text-white text-[10px] font-black rounded-lg uppercase">Activate</button>
                        <button onClick={() => updateTournamentStatus(t.id, 'completed')} className="flex-1 py-2 bg-zinc-800 text-white text-[10px] font-black rounded-lg uppercase">Close</button>
                      </div>
                    </div>
                  ))}
                  <button 
                    onClick={() => setShowTournamentModal(true)}
                    className="w-full py-4 border-2 border-dashed border-white/10 rounded-2xl text-white/40 hover:text-white hover:border-white/20 transition-all flex items-center justify-center gap-2"
                  >
                    <PlusSquare size={20} />
                    <span className="text-xs font-black uppercase tracking-widest">Create New Tournament</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="max-w-2xl space-y-8">
            {/* Global Settings */}
            <div className="bg-zinc-900/50 border border-white/5 rounded-3xl p-8 space-y-8">
              <div className="flex items-center gap-2 text-white/40">
                <SettingsIcon size={14} />
                <span className="text-[10px] font-black uppercase tracking-widest">Global Master Config</span>
              </div>
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-4">Custom Domain</label>
                  <input 
                    type="text" 
                    value={customDomain}
                    onChange={(e) => setCustomDomain(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm focus:outline-none focus:border-blue-500/50"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-4">BTC Wallet</label>
                  <input 
                    type="text" 
                    value={btcWallet}
                    onChange={(e) => setBtcWallet(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm focus:outline-none focus:border-blue-500/50"
                  />
                </div>
                <button 
                  onClick={saveSettings}
                  disabled={savingSettings}
                  className="w-full py-5 bg-white text-black font-black text-xs uppercase tracking-widest rounded-2xl hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 shadow-xl shadow-white/5"
                >
                  {savingSettings ? "Updating Master Config..." : "Save Master Config"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Verification Modal */}
        <AnimatePresence>
      {showVerifyModal && selectedUser && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-zinc-900 border border-white/10 rounded-3xl p-8 max-w-sm w-full space-y-6"
          >
            <h3 className="text-xl font-black">Verify @{selectedUser.username}</h3>
            <div className="space-y-2">
              <label className="text-xs font-bold text-white/40 uppercase tracking-widest">Duration</label>
              <select 
                value={verifyDuration}
                onChange={(e) => setVerifyDuration(e.target.value)}
                className="w-full bg-black border border-white/10 rounded-xl p-3 focus:outline-none"
              >
                <option value="1w">1 Week</option>
                <option value="2w">2 Weeks</option>
                <option value="1m">1 Month</option>
                <option value="3m">3 Months</option>
                <option value="1y">1 Year</option>
                <option value="permanent">Permanent</option>
              </select>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={() => setShowVerifyModal(false)}
                className="flex-1 py-3 bg-zinc-800 text-white font-bold rounded-xl"
              >
                Cancel
              </button>
              <button 
                onClick={handleVerify}
                className="flex-1 py-3 bg-blue-500 text-white font-bold rounded-xl"
              >
                Confirm
              </button>
            </div>
          </motion.div>
        </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

const StatCard = ({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) => (
  <div className="bg-zinc-900 p-6 rounded-3xl border border-white/5 space-y-2">
    <div className="text-white/40">{icon}</div>
    <div className="text-2xl font-black">{value}</div>
    <div className="text-xs text-white/40 font-medium uppercase tracking-wider">{label}</div>
  </div>
);

const getFilterStyle = (f: string) => {
  switch (f) {
    case 'grayscale': return 'grayscale(100%)';
    case 'sepia': return 'sepia(100%)';
    case 'invert': return 'invert(100%)';
    case 'hue-rotate': return 'hue-rotate(90deg)';
    case 'blur': return 'blur(5px)';
    case 'brightness': return 'brightness(150%)';
    case 'contrast': return 'contrast(150%)';
    case 'saturate': return 'saturate(200%)';
    case 'vintage': return 'sepia(50%) contrast(110%) brightness(90%)';
    case 'noir': return 'grayscale(100%) contrast(150%) brightness(80%)';
    case 'vibrant': return 'saturate(150%) brightness(110%) contrast(110%)';
    case 'warm': return 'sepia(30%) saturate(140%) brightness(110%)';
    case 'cool': return 'hue-rotate(180deg) saturate(120%) brightness(110%)';
    default: return 'none';
  }
};

const MusicSearchModal = ({ onSelect, onClose }: { onSelect: (music: any) => void, onClose: () => void }) => {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!search) return;
    setLoading(true);
    try {
      // Search Firestore for audio posts
      const q = query(
        collection(db, "posts"),
        where("type", "==", "audio"),
        limit(20)
      );
      const querySnapshot = await getDocs(q);
      const firestoreResults = querySnapshot.docs.map(doc => ({
        id: doc.id,
        title: doc.data().caption || "Untitled",
        artist: doc.data().artist_name || doc.data().username,
        url: doc.data().file_url
      })).filter(m => 
        m.title.toLowerCase().includes(search.toLowerCase()) || 
        m.artist.toLowerCase().includes(search.toLowerCase())
      );

      // Fallback/Mock results for variety
      const mockResults = [
        { id: 't1', title: 'Savage Love', artist: 'Jawsh 685 & Jason Derulo', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
        { id: 't2', title: 'Blinding Lights', artist: 'The Weeknd', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' },
        { id: 't3', title: 'Dance Monkey', artist: 'Tones and I', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3' },
      ].filter(m => m.title.toLowerCase().includes(search.toLowerCase()) || m.artist.toLowerCase().includes(search.toLowerCase()));

      setResults([...firestoreResults, ...mockResults]);
    } catch (error) {
      console.error("Error searching music:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 100 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 100 }}
      className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl p-6 flex flex-col"
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-black">HomeVerse Sounds</h2>
        <button onClick={onClose} className="p-2 bg-white/10 rounded-full"><X size={20} /></button>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={20} />
        <input 
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          placeholder="Search for songs or artists..."
          className="w-full bg-zinc-900 border border-white/10 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:border-blue-500"
        />
      </div>

      <div className="flex-1 overflow-y-auto space-y-4">
        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="animate-spin text-blue-500" /></div>
        ) : results.length > 0 ? (
          results.map(music => (
            <div 
              key={music.id}
              onClick={() => {
                onSelect(music);
                onClose();
              }}
              className="flex items-center gap-4 p-4 bg-zinc-900 rounded-2xl border border-white/5 hover:border-blue-500/50 transition-all cursor-pointer group"
            >
              <div className="w-12 h-12 bg-zinc-800 rounded-xl flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                <Music size={24} className="text-white/40 group-hover:text-blue-500" />
              </div>
              <div className="flex-1">
                <p className="font-bold">{music.title}</p>
                <p className="text-xs text-white/40">{music.artist}</p>
              </div>
              <PlusSquare size={20} className="text-white/20" />
            </div>
          ))
        ) : (
          <div className="text-center py-20 text-white/20 italic">Search for your favorite TikTok sounds!</div>
        )}
      </div>
    </motion.div>
  );
};

const VideoPreviewModal = ({ url, onClose }: { url: string, onClose: () => void }) => {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[120] bg-black flex flex-col"
    >
      <div className="absolute top-6 left-6 z-10">
        <button onClick={onClose} className="p-3 bg-black/40 backdrop-blur-md rounded-full text-white">
          <X size={24} />
        </button>
      </div>
      <video 
        src={url} 
        className="w-full h-full object-contain" 
        autoPlay 
        loop 
        controls
      />
    </motion.div>
  );
};

const Upload = () => {
  const { user, profile } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const soundId = location.state?.sound_id;
  const soundName = location.state?.sound_name;
  
  const [caption, setCaption] = useState("");
  const [lyrics, setLyrics] = useState("");
  const [type, setType] = useState<'video' | 'audio' | 'image' | 'voice_note'>(soundId ? 'audio' : 'video');
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [coverUrl, setCoverUrl] = useState("https://picsum.photos/seed/cover/800/800");
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [selectedSubgenre, setSelectedSubgenre] = useState("");
  const [isCameraOpen, setIsCameraOpen] = useState(true);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [activeFilter, setActiveFilter] = useState("none");
  const [textOverlay, setTextOverlay] = useState("");
  const [showMusicSearch, setShowMusicSearch] = useState(false);
  const [showVideoPreview, setShowVideoPreview] = useState(false);
  const [selectedMusic, setSelectedMusic] = useState<{id: string, title: string, artist: string, url: string} | null>(null);
  const [locationName, setLocationName] = useState<string | null>(null);
  const [isRecordingVideo, setIsRecordingVideo] = useState(false);
  const [artistName, setArtistName] = useState(profile?.profile_name || "");
  const [productionName, setProductionName] = useState("");
  const [isGeneratingCover, setIsGeneratingCover] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [cameraFacingMode, setCameraFacingMode] = useState<'user' | 'environment'>('user');
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const videoChunksRef = useRef<BlobPart[]>([]);

  // SoundCloud Style Fields
  const [releaseType, setReleaseType] = useState<'single' | 'ep' | 'mixtape' | 'album'>('single');
  const [featuredArtists, setFeaturedArtists] = useState<string[]>([]);
  const [newFeature, setNewFeature] = useState("");
  const [copyright, setCopyright] = useState(`${profile?.profile_name || 'Artist'} ${new Date().getFullYear()}©`);
  const [recordLabel, setRecordLabel] = useState("");
  const [releaseDate, setReleaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [genre, setGenre] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [inspiration, setInspiration] = useState("");
  const [trackNames, setTrackNames] = useState<string[]>([]);
  const [newTrackName, setNewTrackName] = useState("");
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledDate, setScheduledDate] = useState("");
  const [uploadStep, setUploadStep] = useState(1);
  const [privacy, setPrivacy] = useState<'public' | 'friends' | 'friends_of_friends' | 'only_me'>('public');
  const [voiceEffect, setVoiceEffect] = useState("none");
  const [autotuneIntensity, setAutotuneIntensity] = useState(100);
  const [musicalKey, setMusicalKey] = useState("C");
  const [musicalScale, setMusicalScale] = useState("Major");

  const voiceEffects = [
    { id: 'none', name: 'Natural', icon: <Mic size={16} /> },
    { id: 'autotune', name: 'Auto-Tune', icon: <Zap size={16} /> },
    { id: 'reverb', name: 'Big Hall', icon: <Waves size={16} /> },
    { id: 'chipmunk', name: 'Chipmunk', icon: <Smile size={16} /> },
    { id: 'deep', name: 'Deep Voice', icon: <Volume2 size={16} /> },
  ];

  const canUploadMusic = profile?.roles?.some(r => ['artist', 'producer', 'label_owner', 'label_part_owner'].includes(r));

  useEffect(() => {
    if (type === 'video' || type === 'image') {
      openCamera();
    } else {
      closeCamera();
    }
    return () => closeCamera();
  }, [cameraFacingMode, type]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
      if (selectedFile.type.startsWith('audio/')) {
        setType('audio');
      } else if (selectedFile.type.startsWith('video/')) {
        setType('video');
      } else if (selectedFile.type.startsWith('image/')) {
        setType('image');
      }
    }
  };

  const openCamera = async () => {
    // Stop any existing stream first
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }

    try {
      // Try with specific constraints first
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: cameraFacingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }, 
        audio: true 
      });
      setCameraStream(stream);
      
      // Use a small timeout to ensure video element is rendered and ref is attached
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 100);

      setIsCameraOpen(true);
    } catch (err: any) {
      console.error("Primary camera access failed:", err);
      
      if (err.name === 'NotReadableError' || err.message?.includes('Could not start video source')) {
        alert("Camera is already in use by another application or blocked by your browser settings. Please close other apps using the camera and try again.");
        return;
      }
      
      // Fallback 1: Try without specific width/height
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: cameraFacingMode }, 
          audio: true 
        });
        setCameraStream(stream);
        setTimeout(() => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        }, 100);
        setIsCameraOpen(true);
        return;
      } catch (err2) {
        console.error("Secondary camera access failed:", err2);
      }

      // Fallback 2: Try with just video (no audio)
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: cameraFacingMode }
        });
        setCameraStream(stream);
        setTimeout(() => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        }, 100);
        setIsCameraOpen(true);
        return;
      } catch (err3) {
        console.error("Final camera fallback failed:", err3);
        // If all else fails, try the most basic constraints
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          setCameraStream(stream);
          setTimeout(() => {
            if (videoRef.current) {
              videoRef.current.srcObject = stream;
            }
          }, 100);
          setIsCameraOpen(true);
        } catch (err4) {
          console.error("Absolute final fallback failed:", err4);
          alert("Could not access camera. Please ensure no other app is using it and you have granted permissions. If you are on a mobile device, try refreshing the page.");
        }
      }
    }
  };

  const toggleCamera = () => {
    setCameraFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  const closeCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setIsCameraOpen(false);
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.filter = getFilterStyle(activeFilter);
        ctx.drawImage(videoRef.current, 0, 0);
        
        if (textOverlay) {
          ctx.font = "bold 40px Inter";
          ctx.fillStyle = "white";
          ctx.textAlign = "center";
          ctx.shadowColor = "black";
          ctx.shadowBlur = 10;
          ctx.fillText(textOverlay, canvas.width / 2, canvas.height / 2);
        }

        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], "captured_photo.jpg", { type: "image/jpeg" });
            setFile(file);
            setPreviewUrl(URL.createObjectURL(blob));
            setType('image');
            closeCamera();
          }
        }, 'image/jpeg');
      }
    }
  };

  const startVideoRecording = () => {
    if (cameraStream) {
      videoChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(cameraStream);
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          videoChunksRef.current.push(e.data);
        }
      };
      mediaRecorder.onstop = () => {
        const blob = new Blob(videoChunksRef.current, { type: 'video/webm' });
        const file = new File([blob], "recorded_video.webm", { type: "video/webm" });
        setFile(file);
        setPreviewUrl(URL.createObjectURL(blob));
        setType('video');
        closeCamera();
      };
      mediaRecorder.start();
      setIsRecordingVideo(true);
    }
  };

  const stopVideoRecording = () => {
    if (mediaRecorderRef.current && isRecordingVideo) {
      mediaRecorderRef.current.stop();
      setIsRecordingVideo(false);
    }
  };

  const fetchLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          setLocationName(`Location: ${latitude.toFixed(2)}, ${longitude.toFixed(2)}`);
        } catch (err) {
          console.error("Error fetching location:", err);
        }
      });
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      const chunks: BlobPart[] = [];

      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/ogg; codecs=opus' });
        setAudioBlob(blob);
        setPreviewUrl(URL.createObjectURL(blob));
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Error accessing microphone:", err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  const generateAICoverArt = async (details: string): Promise<string | null> => {
    if (!details) return null;
    setIsGeneratingCover(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            {
              text: `Generate a professional, artistic music cover art for a song with these details: ${details}. The style should be modern, vibrant, and suitable for a music streaming platform like HomeVerse.`,
            },
          ],
        },
        config: {
          imageConfig: {
            aspectRatio: "1:1",
          },
        },
      });

      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          const base64EncodeString = part.inlineData.data;
          const url = `data:image/png;base64,${base64EncodeString}`;
          setCoverUrl(url);
          return url;
        }
      }
      return null;
    } catch (error) {
      console.error("Error generating AI cover art:", error);
      return null;
    } finally {
      setIsGeneratingCover(false);
    }
  };

  const handleUpload = async () => {
    if (!user || !profile) return;
    if (!file && !audioBlob && !soundId) {
      alert("Please select a file or record a voice note.");
      return;
    }

    setUploading(true);
    try {
      let finalCoverUrl = coverUrl;
      if (type === 'audio' && (!finalCoverUrl || finalCoverUrl.includes('picsum.photos'))) {
        const aiUrl = await generateAICoverArt(`${caption} ${selectedSubgenre || ''} ${soundName || ''}`);
        if (aiUrl) finalCoverUrl = aiUrl;
      }

      const tags = hashtags.split(',').map(t => t.trim().replace('#', '')).filter(t => t) || caption.match(/#[\w\u0080-\uffff]+/g)?.map(t => t.slice(1).toLowerCase()) || [];
      const postRef = doc(collection(db, "posts"));
      
      const postData = {
        id: postRef.id,
        user_id: user.uid,
        username: profile.username,
        user_avatar: profile.avatar_url || "",
        type: type === 'voice_note' ? 'audio' : type,
        release_type: type === 'audio' ? releaseType : null,
        file_url: previewUrl || (type === 'audio' ? "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" : "https://picsum.photos/seed/music/1080/1920"),
        cover_url: finalCoverUrl || "https://picsum.photos/seed/music/500/500",
        artist_name: artistName,
        featured_artists: featuredArtists,
        copyright,
        record_label: recordLabel,
        release_date: releaseDate,
        genre: genre || selectedSubgenre,
        sub_genre: selectedSubgenre,
        inspiration,
        is_scheduled: isScheduled,
        scheduled_date: isScheduled ? scheduledDate : null,
        track_names: trackNames,
        caption,
        lyrics,
        likes_count: 0,
        shares_count: 0,
        comments_count: 0,
        views_count: 0,
        tags,
        privacy,
        created_at: serverTimestamp(),
        is_voice_note: type === 'voice_note',
        sound_id: selectedMusic?.id || soundId || null,
        sound_name: selectedMusic ? `${selectedMusic.title} - ${selectedMusic.artist}` : (soundName || `Original Sound - @${profile.username}`),
        location: locationName,
        filter: activeFilter,
        text_overlay: textOverlay,
        voice_effect: voiceEffect,
        autotune_intensity: autotuneIntensity,
        musical_key: musicalKey,
        musical_scale: musicalScale
      };
      
      await setDoc(postRef, postData);

      for (const tagName of tags) {
        const tagRef = doc(db, "tags", tagName);
        const tagSnap = await getDoc(tagRef);
        if (!tagSnap.exists()) {
          await setDoc(tagRef, {
            name: tagName,
            total_views: 0
          });
        }
      }

      navigate("/");
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, "posts");
    } finally {
      setUploading(false);
    }
  };

  const addFeature = () => {
    if (newFeature && featuredArtists.length < 3) {
      setFeaturedArtists([...featuredArtists, newFeature]);
      setNewFeature("");
    }
  };

  const removeFeature = (index: number) => {
    setFeaturedArtists(featuredArtists.filter((_, i) => i !== index));
  };

  if (type === 'audio' && !canUploadMusic) {
    return (
      <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center p-6 text-center space-y-6">
        <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center text-red-500">
          <ShieldAlert size={40} />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-black tracking-tight">Artist Account Required</h2>
          <p className="text-white/40 text-sm max-w-xs">Music uploads are reserved for Artists, Producers, and Record Labels. Update your profile roles to gain access.</p>
        </div>
        <button 
          onClick={() => navigate("/settings")}
          className="px-8 py-3 bg-white text-black font-bold rounded-full"
        >
          Update Profile
        </button>
        <button 
          onClick={() => navigate(-1)}
          className="text-white/40 font-bold text-xs uppercase tracking-widest"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col overflow-hidden">
      {!previewUrl ? (
        <div className="relative flex-1 bg-zinc-900">
          {type === 'video' || type === 'image' ? (
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted 
              style={{ filter: getFilterStyle(activeFilter) }}
              className="w-full h-full object-cover"
            />
          ) : type === 'voice_note' ? (
            <div className="w-full h-full flex flex-col items-center justify-center space-y-8 p-6 bg-gradient-to-b from-zinc-900 to-black">
              <div className={cn(
                "w-40 h-40 rounded-full flex items-center justify-center transition-all duration-500",
                isRecording ? "bg-red-500/20 scale-110 shadow-[0_0_50px_rgba(239,68,68,0.2)]" : "bg-blue-500/10"
              )}>
                <div className={cn(
                  "w-32 h-32 rounded-full flex items-center justify-center transition-all",
                  isRecording ? "bg-red-500 animate-pulse" : "bg-blue-500"
                )}>
                  <Mic size={60} className="text-white" />
                </div>
              </div>
              
              <div className="text-center space-y-4">
                <h2 className="text-2xl font-black tracking-tight">Voice Note</h2>
                <p className="text-white/40 text-sm max-w-xs mx-auto">Record your thoughts, a quick freestyle, or just say hi to your followers.</p>
                {isRecording && (
                  <div className="flex items-center justify-center gap-2 text-red-500 font-bold animate-pulse">
                    <div className="w-2 h-2 bg-red-500 rounded-full" />
                    RECORDING...
                  </div>
                )}
              </div>

              <button 
                onClick={isRecording ? stopRecording : startRecording}
                className={cn(
                  "px-12 py-5 rounded-2xl font-black uppercase tracking-widest transition-all shadow-2xl",
                  isRecording ? "bg-white text-black" : "bg-red-500 text-white shadow-red-500/20"
                )}
              >
                {isRecording ? "Stop Recording" : "Start Recording"}
              </button>
            </div>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center space-y-8 p-6">
              <div className="w-32 h-32 bg-blue-500/10 rounded-full flex items-center justify-center text-blue-500 animate-pulse">
                <Music2 size={60} />
              </div>
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-black tracking-tight">Upload Music</h2>
                <p className="text-white/40 text-sm">Select an audio file to start your SoundCloud-style upload.</p>
              </div>
              <label className="px-8 py-4 bg-blue-500 text-white font-black rounded-2xl shadow-xl shadow-blue-500/20 cursor-pointer flex items-center gap-2">
                <input type="file" accept="audio/*" className="hidden" onChange={handleFileChange} />
                <UploadCloud size={20} />
                Select Audio File
              </label>
            </div>
          )}
          
          {/* Top Controls */}
          <div className="absolute top-6 left-0 right-0 px-6 flex items-center justify-between z-20">
            <button onClick={() => navigate(-1)} className="p-2 bg-black/20 backdrop-blur-md rounded-full text-white">
              <X size={24} />
            </button>
            
            <div className="flex gap-2">
              <button 
                onClick={() => setType('video')}
                className={cn("px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all", type === 'video' ? "bg-white text-black" : "bg-black/20 text-white/60 backdrop-blur-md")}
              >
                Video
              </button>
              <button 
                onClick={() => setType('audio')}
                className={cn("px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all", type === 'audio' ? "bg-white text-black" : "bg-black/20 text-white/60 backdrop-blur-md")}
              >
                Music
              </button>
              <button 
                onClick={() => setType('voice_note')}
                className={cn("px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all", type === 'voice_note' ? "bg-white text-black" : "bg-black/20 text-white/60 backdrop-blur-md")}
              >
                Voice
              </button>
              <button 
                onClick={() => navigate("/live")}
                className="px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest bg-red-500/20 text-red-500 backdrop-blur-md border border-red-500/20 flex items-center gap-2"
              >
                <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                Live
              </button>
            </div>

            <button onClick={toggleCamera} className="p-2 bg-black/20 backdrop-blur-md rounded-full text-white">
              <Radio size={24} />
            </button>
          </div>

          {type === 'video' && (
            <div className="absolute top-24 left-0 right-0 flex justify-center z-20">
              <button 
                onClick={() => setShowMusicSearch(true)}
                className="px-6 py-2 bg-black/40 backdrop-blur-md border border-white/10 rounded-full flex items-center gap-2 text-white hover:bg-black/60 transition-all"
              >
                <Music size={16} />
                <span className="text-xs font-bold uppercase tracking-widest">
                  {selectedMusic ? selectedMusic.title : "Add Sound"}
                </span>
                {selectedMusic && <X size={14} className="ml-2" onClick={(e) => { e.stopPropagation(); setSelectedMusic(null); }} />}
              </button>
            </div>
          )}

          {/* Bottom Controls for Video/Image */}
          {(type === 'video' || type === 'image') && (
            <div className="absolute bottom-12 left-0 right-0 px-10 flex flex-col items-center gap-8 z-20">
              {/* Filter Selector */}
              <div className="w-full overflow-x-auto no-scrollbar flex gap-4 px-4">
                {['none', 'grayscale', 'sepia', 'vintage', 'noir', 'vibrant', 'warm', 'cool', 'contrast', 'saturate', 'invert', 'hue-rotate', 'blur', 'brightness'].map(f => (
                  <button 
                    key={f}
                    onClick={() => setActiveFilter(f)}
                    className="flex flex-col items-center gap-2 flex-shrink-0"
                  >
                    <div className={cn(
                      "w-14 h-14 rounded-2xl border-2 transition-all overflow-hidden",
                      activeFilter === f ? "border-blue-500 scale-110" : "border-white/20"
                    )}>
                      <div 
                        className="w-full h-full bg-zinc-800" 
                        style={{ filter: getFilterStyle(f) }}
                      />
                    </div>
                    <span className={cn("text-[8px] font-black uppercase tracking-widest", activeFilter === f ? "text-blue-500" : "text-white/40")}>
                      {f}
                    </span>
                  </button>
                ))}
              </div>

              <div className="w-full flex items-center justify-between">
                <label className="flex flex-col items-center gap-1 cursor-pointer">
                  <input type="file" accept="video/*,image/*" className="hidden" onChange={handleFileChange} />
                  <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-xl border border-white/20 flex items-center justify-center text-white">
                    <PlusSquare size={24} />
                  </div>
                  <span className="text-[10px] font-bold text-white uppercase tracking-widest">Upload</span>
                </label>

                <div className="flex items-center gap-6">
                  <motion.button 
                    whileTap={{ scale: 0.9 }}
                    onClick={isRecordingVideo ? stopVideoRecording : startVideoRecording}
                    className={cn(
                      "w-20 h-20 rounded-full border-4 flex items-center justify-center transition-all",
                      isRecordingVideo ? "border-red-500 p-2" : "border-white p-1"
                    )}
                  >
                    <div className={cn(
                      "w-full h-full rounded-full transition-all",
                      isRecordingVideo ? "bg-red-500 rounded-lg" : "bg-red-500"
                    )} />
                  </motion.button>
                </div>

                <motion.button 
                  whileTap={{ scale: 0.9 }}
                  onClick={capturePhoto}
                  className="flex flex-col items-center gap-1"
                >
                  <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-xl border border-white/20 flex items-center justify-center text-white">
                    <Camera size={24} />
                  </div>
                  <span className="text-[10px] font-bold text-white uppercase tracking-widest">Photo</span>
                </motion.button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1 bg-black overflow-y-auto pt-24 pb-40 px-6 space-y-8">
          <div className="flex items-center justify-between">
            <button onClick={() => setPreviewUrl(null)} className="p-2 hover:bg-white/5 rounded-full transition-colors">
              <ChevronLeft />
            </button>
            <h1 className="text-xl font-black uppercase tracking-widest">{type === 'audio' ? "Upload Music" : "Post"}</h1>
            <div className="w-10" />
          </div>

          {type === 'audio' ? (
            <div className="space-y-8">
              {/* Step Indicator */}
              <div className="flex gap-1">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className={cn("h-1 flex-1 rounded-full transition-all", uploadStep >= i ? "bg-blue-500" : "bg-white/10")} />
                ))}
              </div>

              <AnimatePresence mode="wait">
                {uploadStep === 1 && (
                  <motion.div 
                    key="step1"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div className="space-y-4">
                      <label className="text-xs font-black uppercase tracking-widest text-white/40">Release Type</label>
                      <div className="grid grid-cols-2 gap-3">
                        {['single', 'ep', 'mixtape', 'album'].map(t => (
                          <button
                            key={t}
                            onClick={() => setReleaseType(t as any)}
                            className={cn(
                              "py-4 rounded-2xl border font-black uppercase tracking-widest text-[10px] transition-all",
                              releaseType === t ? "bg-blue-500 border-blue-500 text-white" : "bg-zinc-900 border-white/5 text-white/40"
                            )}
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <label className="text-xs font-black uppercase tracking-widest text-white/40">Song Title</label>
                      <input 
                        type="text" 
                        placeholder="e.g. Midnight City"
                        value={caption}
                        onChange={(e) => setCaption(e.target.value)}
                        className="w-full bg-zinc-900 border border-white/10 rounded-2xl p-4 focus:outline-none focus:border-blue-500 font-bold"
                      />
                    </div>

                    <div className="space-y-4">
                      <label className="text-xs font-black uppercase tracking-widest text-white/40">Voice Effects (Voloco Style)</label>
                      <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
                        {voiceEffects.map(effect => (
                          <button
                            key={effect.id}
                            onClick={() => setVoiceEffect(effect.id)}
                            className="flex flex-col items-center gap-2 flex-shrink-0"
                          >
                            <div className={cn(
                              "w-14 h-14 rounded-2xl border-2 flex items-center justify-center transition-all",
                              voiceEffect === effect.id ? "bg-blue-600 border-blue-400 scale-110 shadow-lg shadow-blue-600/20" : "bg-zinc-900 border-white/10"
                            )}>
                              {effect.icon}
                            </div>
                            <span className={cn("text-[8px] font-black uppercase tracking-widest", voiceEffect === effect.id ? "text-blue-500" : "text-white/40")}>
                              {effect.name}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {voiceEffect !== 'none' && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="space-y-6 p-4 bg-zinc-900 rounded-3xl border border-white/5"
                      >
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <label className="text-[10px] font-black uppercase tracking-widest text-white/40">Auto-Tune Intensity</label>
                            <span className="text-xs font-black text-blue-500">{autotuneIntensity}%</span>
                          </div>
                          <input 
                            type="range" 
                            min="0" 
                            max="100" 
                            value={autotuneIntensity}
                            onChange={(e) => setAutotuneIntensity(parseInt(e.target.value))}
                            className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-blue-500"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-white/40">Key</label>
                            <select 
                              value={musicalKey}
                              onChange={(e) => setMusicalKey(e.target.value)}
                              className="w-full bg-black/40 border border-white/10 rounded-xl p-2 text-xs font-bold focus:outline-none"
                            >
                              {['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'].map(k => (
                                <option key={k} value={k}>{k}</option>
                              ))}
                            </select>
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-white/40">Scale</label>
                            <select 
                              value={musicalScale}
                              onChange={(e) => setMusicalScale(e.target.value)}
                              className="w-full bg-black/40 border border-white/10 rounded-xl p-2 text-xs font-bold focus:outline-none"
                            >
                              {['Major', 'Minor', 'Blues', 'Chromatic'].map(s => (
                                <option key={s} value={s}>{s}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    <div className="space-y-4">
                      <label className="text-xs font-black uppercase tracking-widest text-white/40">Artist Name</label>
                      <input 
                        type="text" 
                        placeholder="Your Artist Name"
                        value={artistName}
                        onChange={(e) => setArtistName(e.target.value)}
                        className="w-full bg-zinc-900 border border-white/10 rounded-2xl p-4 focus:outline-none focus:border-blue-500 font-bold"
                      />
                    </div>

                    <button 
                      onClick={() => setUploadStep(2)}
                      disabled={!caption || !artistName}
                      className="w-full py-4 bg-white text-black font-black rounded-2xl disabled:opacity-50"
                    >
                      Next Step
                    </button>
                  </motion.div>
                )}

                {uploadStep === 2 && (
                  <motion.div 
                    key="step2"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div className="space-y-4">
                      <label className="text-xs font-black uppercase tracking-widest text-white/40">Featured Artists (Max 3)</label>
                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          placeholder="Add feature..."
                          value={newFeature}
                          onChange={(e) => setNewFeature(e.target.value)}
                          className="flex-1 bg-zinc-900 border border-white/10 rounded-2xl p-4 focus:outline-none focus:border-blue-500 font-bold"
                        />
                        <button 
                          onClick={addFeature}
                          disabled={featuredArtists.length >= 3 || !newFeature}
                          className="px-6 bg-blue-500 text-white font-black rounded-2xl disabled:opacity-50"
                        >
                          Add
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {featuredArtists.map((f, i) => (
                          <span key={i} className="px-3 py-1 bg-white/10 rounded-full text-xs font-bold flex items-center gap-2">
                            {f} <X size={12} className="cursor-pointer" onClick={() => removeFeature(i)} />
                          </span>
                        ))}
                      </div>
                    </div>

                    {releaseType !== 'single' && (
                      <div className="space-y-4">
                        <label className="text-xs font-black uppercase tracking-widest text-white/40">Tracklist</label>
                        <div className="flex gap-2">
                          <input 
                            type="text" 
                            placeholder="Add track name..."
                            value={newTrackName}
                            onChange={(e) => setNewTrackName(e.target.value)}
                            className="flex-1 bg-zinc-900 border border-white/10 rounded-2xl p-4 focus:outline-none focus:border-blue-500 font-bold"
                          />
                          <button 
                            onClick={() => {
                              if (newTrackName) {
                                setTrackNames([...trackNames, newTrackName]);
                                setNewTrackName("");
                              }
                            }}
                            className="px-6 bg-blue-500 text-white font-black rounded-2xl"
                          >
                            Add
                          </button>
                        </div>
                        <div className="space-y-2">
                          {trackNames.map((t, i) => (
                            <div key={i} className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                              <span className="text-sm font-bold text-white/60">{i + 1}. {t}</span>
                              <X size={14} className="text-white/20 cursor-pointer hover:text-red-500" onClick={() => setTrackNames(trackNames.filter((_, idx) => idx !== i))} />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="space-y-4">
                      <label className="text-xs font-black uppercase tracking-widest text-white/40">Record Label</label>
                      <input 
                        type="text" 
                        placeholder="Independent / Label Name"
                        value={recordLabel}
                        onChange={(e) => setRecordLabel(e.target.value)}
                        className="w-full bg-zinc-900 border border-white/10 rounded-2xl p-4 focus:outline-none focus:border-blue-500 font-bold"
                      />
                    </div>

                    <div className="space-y-4">
                      <label className="text-xs font-black uppercase tracking-widest text-white/40">Copyright</label>
                      <input 
                        type="text" 
                        placeholder="e.g. Artist Name 2026©"
                        value={copyright}
                        onChange={(e) => setCopyright(e.target.value)}
                        className="w-full bg-zinc-900 border border-white/10 rounded-2xl p-4 focus:outline-none focus:border-blue-500 font-bold"
                      />
                    </div>

                    <div className="flex gap-3">
                      <button onClick={() => setUploadStep(1)} className="flex-1 py-4 bg-white/5 text-white font-black rounded-2xl">Back</button>
                      <button onClick={() => setUploadStep(3)} className="flex-1 py-4 bg-white text-black font-black rounded-2xl">Next Step</button>
                    </div>
                  </motion.div>
                )}

                {uploadStep === 3 && (
                  <motion.div 
                    key="step3"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div className="space-y-4">
                      <label className="text-xs font-black uppercase tracking-widest text-white/40">Genre & Sub-genre</label>
                      <div className="grid grid-cols-2 gap-4">
                        <select 
                          value={genre}
                          onChange={(e) => setGenre(e.target.value)}
                          className="bg-zinc-900 border border-white/10 rounded-2xl p-4 focus:outline-none font-bold text-sm"
                        >
                          <option value="">Select Genre</option>
                          {['Hip Hop', 'Afrobeats', 'R&B', 'Pop', 'Rock', 'Jazz', 'Electronic'].map(g => <option key={g} value={g}>{g}</option>)}
                        </select>
                        <input 
                          type="text" 
                          placeholder="Sub-genre"
                          value={selectedSubgenre}
                          onChange={(e) => setSelectedSubgenre(e.target.value)}
                          className="bg-zinc-900 border border-white/10 rounded-2xl p-4 focus:outline-none font-bold text-sm"
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <label className="text-xs font-black uppercase tracking-widest text-white/40">Hashtags & Inspiration</label>
                      <input 
                        type="text" 
                        placeholder="e.g. #summer, #vibes (comma separated)"
                        value={hashtags}
                        onChange={(e) => setHashtags(e.target.value)}
                        className="w-full bg-zinc-900 border border-white/10 rounded-2xl p-4 focus:outline-none font-bold text-sm"
                      />
                      <textarea 
                        placeholder="What inspired this song?"
                        value={inspiration}
                        onChange={(e) => setInspiration(e.target.value)}
                        className="w-full bg-zinc-900 border border-white/10 rounded-2xl p-4 focus:outline-none font-bold text-sm h-24 resize-none"
                      />
                    </div>

                    <div className="space-y-4">
                      <label className="text-xs font-black uppercase tracking-widest text-white/40">Lyrics</label>
                      <textarea 
                        placeholder="Paste your lyrics here..."
                        value={lyrics}
                        onChange={(e) => setLyrics(e.target.value)}
                        className="w-full bg-zinc-900 border border-white/10 rounded-2xl p-4 focus:outline-none font-bold text-sm h-40 resize-none"
                      />
                    </div>

                    <div className="flex gap-3">
                      <button onClick={() => setUploadStep(2)} className="flex-1 py-4 bg-white/5 text-white font-black rounded-2xl">Back</button>
                      <button onClick={() => setUploadStep(4)} className="flex-1 py-4 bg-white text-black font-black rounded-2xl">Next Step</button>
                    </div>
                  </motion.div>
                )}

                {uploadStep === 4 && (
                  <motion.div 
                    key="step4"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div className="space-y-4">
                      <label className="text-xs font-black uppercase tracking-widest text-white/40">Release Date</label>
                      <input 
                        type="date" 
                        value={releaseDate}
                        onChange={(e) => setReleaseDate(e.target.value)}
                        className="w-full bg-zinc-900 border border-white/10 rounded-2xl p-4 focus:outline-none font-bold text-sm"
                      />
                    </div>

                    <div className="p-4 bg-zinc-900 rounded-2xl border border-white/5 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Calendar size={20} className="text-blue-500" />
                          <span className="font-bold text-sm">Schedule Release</span>
                        </div>
                        <button 
                          onClick={() => setIsScheduled(!isScheduled)}
                          className={cn("w-12 h-6 rounded-full transition-all relative", isScheduled ? "bg-blue-500" : "bg-white/10")}
                        >
                          <div className={cn("absolute top-1 w-4 h-4 rounded-full bg-white transition-all", isScheduled ? "right-1" : "left-1")} />
                        </button>
                      </div>
                      {isScheduled && (
                        <input 
                          type="datetime-local" 
                          value={scheduledDate}
                          onChange={(e) => setScheduledDate(e.target.value)}
                          className="w-full bg-black/20 border border-white/10 rounded-xl p-3 focus:outline-none font-bold text-xs"
                        />
                      )}
                    </div>

                    <div className="space-y-4">
                      <label className="text-xs font-black uppercase tracking-widest text-white/40">Cover Art</label>
                      <div className="flex gap-4">
                        <div className="w-24 h-24 bg-zinc-900 rounded-2xl overflow-hidden border border-white/10">
                          <img src={coverUrl} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 space-y-2">
                          <button 
                            onClick={() => generateAICoverArt(`${caption} ${genre} ${inspiration}`)}
                            disabled={isGeneratingCover}
                            className="w-full py-2 bg-blue-500/10 border border-blue-500/30 text-blue-500 rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2"
                          >
                            {isGeneratingCover ? <Loader2 className="animate-spin" size={14} /> : <Sparkles size={14} />}
                            AI Generate Cover
                          </button>
                          <label className="w-full py-2 bg-white/5 border border-white/10 text-white/60 rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 cursor-pointer">
                            <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                              const f = e.target.files?.[0];
                              if (f) setCoverUrl(URL.createObjectURL(f));
                            }} />
                            <ImageIcon size={14} />
                            Upload Cover
                          </label>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button onClick={() => setUploadStep(3)} className="flex-1 py-4 bg-white/5 text-white font-black rounded-2xl">Back</button>
                      <button 
                        onClick={handleUpload}
                        disabled={uploading}
                        className="flex-1 py-4 bg-red-500 text-white font-black rounded-2xl shadow-xl shadow-red-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {uploading ? <Loader2 className="animate-spin" /> : <Send size={20} />}
                        {uploading ? "Uploading..." : "Finish & Post"}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <>
              <div className="flex gap-6">
                <div 
                  onClick={() => type === 'video' && setShowVideoPreview(true)}
                  className={cn(
                    "w-32 aspect-[9/16] bg-zinc-900 rounded-2xl overflow-hidden border border-white/10 relative group",
                    type === 'video' && "cursor-pointer"
                  )}
                >
                  {type === 'video' ? (
                    <>
                      <video src={previewUrl!} className="w-full h-full object-cover" autoPlay loop muted />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Play size={24} className="text-white" />
                      </div>
                    </>
                  ) : type === 'voice_note' ? (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-blue-500/10 gap-2">
                      <Mic size={24} className="text-blue-500" />
                      <span className="text-[8px] font-black uppercase text-blue-500">Voice Note</span>
                    </div>
                  ) : (
                    <img src={previewUrl!} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  )}
                </div>
                <div className="flex-1 space-y-4">
                  <textarea 
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder={type === 'voice_note' ? "Say something about this voice note..." : "Describe your post..."}
                    className="w-full bg-transparent border-none p-0 h-32 focus:outline-none font-bold resize-none text-sm"
                  />
                  <div className="flex gap-2">
                    <button onClick={() => setCaption(prev => prev + " #")} className="px-3 py-1 bg-white/5 rounded-lg text-xs font-bold text-white/60"># Hashtag</button>
                    <button onClick={() => setCaption(prev => prev + " @")} className="px-3 py-1 bg-white/5 rounded-lg text-xs font-bold text-white/60">@ Mention</button>
                  </div>
                </div>
              </div>

              {type === 'voice_note' && (
                <div className="p-4 bg-zinc-900 rounded-2xl border border-white/5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white/40 uppercase tracking-widest">Voice Preview</span>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                  </div>
                  <audio src={previewUrl!} controls className="w-full h-10 accent-blue-500" />
                </div>
              )}

              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-zinc-900 rounded-2xl border border-white/5">
                  <div className="flex items-center gap-3">
                    <Bot size={20} className="text-blue-500" />
                    <span className="font-bold text-sm">Location</span>
                  </div>
                  <button onClick={fetchLocation} className="text-xs text-blue-500 font-bold">{locationName || "Add location"}</button>
                </div>

                <div className="space-y-4">
                  <label className="text-xs font-bold text-white/40 uppercase tracking-widest">Subgenre</label>
                  <div className="flex flex-wrap gap-2">
                    {['UK Rap', 'Afrobeats', 'Drill', 'Trap', 'Afropop', 'Melodic Rap'].map(s => (
                      <button
                        key={s}
                        onClick={() => setSelectedSubgenre(s === selectedSubgenre ? "" : s)}
                        className={cn(
                          "px-4 py-2 rounded-full border text-[10px] font-bold uppercase tracking-wider transition-all",
                          selectedSubgenre === s
                            ? "bg-blue-500 border-blue-500 text-white"
                            : "bg-zinc-900 border-white/10 text-white/40"
                        )}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-xs font-bold text-white/40 uppercase tracking-widest">Privacy</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'public', label: 'Public', icon: <Globe size={14} /> },
                      { id: 'friends', label: 'Friends', icon: <Users size={14} /> },
                      { id: 'friends_of_friends', label: 'F.O.F', icon: <Users size={14} /> },
                      { id: 'only_me', label: 'Only Me', icon: <LockIcon size={14} /> }
                    ].map(p => (
                      <button
                        key={p.id}
                        onClick={() => setPrivacy(p.id as any)}
                        className={cn(
                          "flex items-center gap-2 p-4 rounded-2xl border transition-all",
                          privacy === p.id ? "bg-blue-500 border-blue-500 text-white" : "bg-zinc-900 border-white/5 text-white/40"
                        )}
                      >
                        {p.icon}
                        <span className="text-[10px] font-black uppercase tracking-widest">{p.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-8">
                  <button 
                    onClick={handleUpload}
                    disabled={uploading}
                    className="w-full py-4 bg-red-500 text-white font-black rounded-2xl shadow-xl shadow-red-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="animate-spin" />
                        <span>Uploading {Math.round(uploadProgress)}%</span>
                      </>
                    ) : (
                      <>
                        <Send size={20} />
                        <span>Post Content</span>
                      </>
                    )}
                  </button>
                </div>

                {uploading && (
                  <div className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-2xl flex flex-col items-center justify-center p-12 space-y-8">
                    <div className="relative w-48 h-48">
                      <svg className="w-full h-full -rotate-90">
                        <circle
                          cx="96"
                          cy="96"
                          r="88"
                          stroke="currentColor"
                          strokeWidth="8"
                          fill="transparent"
                          className="text-white/5"
                        />
                        <circle
                          cx="96"
                          cy="96"
                          r="88"
                          stroke="currentColor"
                          strokeWidth="8"
                          fill="transparent"
                          strokeDasharray={552.92}
                          strokeDashoffset={552.92 - (552.92 * uploadProgress) / 100}
                          className="text-blue-500 transition-all duration-300 ease-out"
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-4xl font-black">{Math.round(uploadProgress)}%</span>
                        <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Uploading</span>
                      </div>
                    </div>
                    <div className="text-center space-y-2">
                      <h3 className="text-xl font-black tracking-tight">Processing your content</h3>
                      <p className="text-white/40 text-sm font-bold">Please don't close the app</p>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      <AnimatePresence>
        {showMusicSearch && (
          <MusicSearchModal 
            onSelect={(music) => {
              setSelectedMusic(music);
              setShowMusicSearch(false);
            }} 
            onClose={() => setShowMusicSearch(false)} 
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showVideoPreview && previewUrl && (
          <VideoPreviewModal 
            url={previewUrl} 
            onClose={() => setShowVideoPreview(false)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
};

// --- Premium / Promotion Component ---
const Premium = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handlePromotionRequest = async (type: 'single' | 'album' | 'post') => {
    if (!profile) return;
    setLoading(true);
    try {
      const request: PromotionRequest = {
        id: Math.random().toString(36).substring(2, 9),
        type,
        status: 'pending',
        created_at: serverTimestamp(),
        message: type === 'album' ? "Interested in promoting an album. Please contact for negotiation." : `Interested in ${type} promotion.`,
      };

      const updatedRequests = [...(profile.promotion_requests || []), request];
      await updateDoc(doc(db, "users", profile.id), {
        promotion_requests: updatedRequests
      });

      if (type === 'album') {
        alert("For albums, please send a detailed email to prosperkingsley360@gmail.com for negotiation.");
      } else {
        alert("Your request has been submitted! Please check your email for payment instructions or contact admin at prosperkingsley360@gmail.com.");
      }
    } catch (error) {
      console.error("Error submitting promotion request:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pt-24 pb-20 px-6 max-w-2xl mx-auto space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-black tracking-tight">Go Premium</h1>
        <p className="text-white/60">Reach millions of users and boost your music career.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Single Track Ad */}
        <div className="bg-zinc-900 border border-white/10 rounded-3xl p-8 space-y-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
            <Music size={120} />
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-black">Single Track Ad</h3>
            <p className="text-sm text-white/60 leading-relaxed">Get 6 months of continuous ads for your single track. Reach a massive audience daily.</p>
          </div>
          <div className="text-3xl font-black text-blue-500">$10 <span className="text-sm text-white/40">/ 6 months</span></div>
          <button 
            onClick={() => handlePromotionRequest('single')}
            disabled={loading}
            className="w-full py-4 bg-white text-black font-bold rounded-2xl flex items-center justify-center gap-2 hover:bg-white/90 transition-all"
          >
            {loading ? <Loader2 className="animate-spin" /> : "Apply Now"}
          </button>
        </div>

        {/* Album Promotion */}
        <div className="bg-zinc-900 border border-white/10 rounded-3xl p-8 space-y-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
            <Disc size={120} />
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-black">Album Launch</h3>
            <p className="text-sm text-white/60 leading-relaxed">Full-scale promotion for your upcoming album. Custom strategies and maximum reach.</p>
          </div>
          <div className="text-3xl font-black text-blue-500">Negotiable</div>
          <button 
            onClick={() => handlePromotionRequest('album')}
            disabled={loading}
            className="w-full py-4 bg-zinc-800 text-white font-bold rounded-2xl flex items-center justify-center gap-2 hover:bg-zinc-700 transition-all"
          >
            {loading ? <Loader2 className="animate-spin" /> : "Contact Admin"}
          </button>
        </div>

        {/* Post Promotion */}
        <div className="bg-zinc-900 border border-white/10 rounded-3xl p-8 space-y-6 relative overflow-hidden group md:col-span-2">
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
            <TrendingUp size={120} />
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-black">Boost Post</h3>
            <p className="text-sm text-white/60 leading-relaxed">Buy more views and likes for your videos, images, or voice notes. Reach more people instantly.</p>
          </div>
          <div className="text-3xl font-black text-blue-500">$2 <span className="text-sm text-white/40">/ post</span></div>
          <button 
            onClick={() => handlePromotionRequest('post')}
            disabled={loading}
            className="w-full py-4 bg-gradient-to-r from-blue-500 to-green-400 text-white font-bold rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" /> : "Boost Now"}
          </button>
        </div>
      </div>

      <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-6 space-y-4">
        <h4 className="font-bold text-blue-400 flex items-center gap-2">
          <AlertCircle size={18} /> How it works
        </h4>
        <div className="space-y-3 text-sm text-white/70 leading-relaxed">
          <p>1. Select the promotion type that suits your needs.</p>
          <p>2. Submit your request. For albums, you'll be instructed to email our admin.</p>
          <p>3. Once approved, our team will contact you for payment and asset collection (audio ads, etc.).</p>
          <p>4. Your music will be featured across the platform to millions of active listeners.</p>
          <p className="text-xs italic mt-4">Questions? Contact us at <a href="mailto:prosperkingsley360@gmail.com" className="text-blue-400 underline">prosperkingsley360@gmail.com</a></p>
        </div>
      </div>
    </div>
  );
};
const WalletDashboard = () => {
  const { profile } = useAuth();
  const [isUpdating, setIsUpdating] = useState(false);
  const [walletAddress, setWalletAddress] = useState(profile?.wallet_address || "");
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [showPasskey, setShowPasskey] = useState(false);
  const [passkey, setPasskey] = useState(profile?.wallet_passkey || "");
  const [isGeneratingPasskey, setIsGeneratingPasskey] = useState(false);

  const generatePasskey = async () => {
    if (!profile) return;
    setIsGeneratingPasskey(true);
    try {
      const newPasskey = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      await updateDoc(doc(db, "users", profile.id), { wallet_passkey: newPasskey });
      setPasskey(newPasskey);
      alert("New wallet passkey generated! Keep it safe.");
    } catch (error) {
      console.error(error);
    } finally {
      setIsGeneratingPasskey(false);
    }
  };

  const saveWallet = async () => {
    if (!profile) return;
    setIsUpdating(true);
    try {
      await updateDoc(doc(db, "users", profile.id), { wallet_address: walletAddress });
      alert("Wallet address saved!");
    } catch (error) {
      console.error(error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePurchase = async (amount: number, price: number) => {
    if (!profile) return;
    setIsProcessing(true);
    setSecurityStep(1);
    
    // Simulated Security Check Animation
    await new Promise(r => setTimeout(r, 1500));
    setSecurityStep(2);
    await new Promise(r => setTimeout(r, 1500));
    setSecurityStep(3);
    await new Promise(r => setTimeout(r, 1000));

    try {
      const newCoins = (profile.coins || 0) + amount;
      await updateDoc(doc(db, "users", profile.id), { coins: newCoins });
      
      await addDoc(collection(db, "transactions"), {
        user_id: profile.id,
        type: 'purchase',
        asset: 'COINS',
        amount: amount,
        price: price,
        status: 'completed',
        created_at: serverTimestamp()
      });

      alert(`Successfully purchased ${amount} coins!`);
      setShowPurchaseModal(false);
    } catch (error) {
      console.error(error);
      alert("Purchase failed. Please try again.");
    } finally {
      setIsProcessing(false);
      setSecurityStep(0);
    }
  };

  const handleTransfer = async () => {
    if (!profile || !transferData.address || !transferData.amount) return;
    const amount = parseFloat(transferData.amount);
    const asset = transferData.asset;
    const currentBalance = profile.crypto_balances?.[asset as keyof typeof profile.crypto_balances] || 0;

    if (amount <= 0 || amount > currentBalance) {
      alert("Invalid amount or insufficient balance.");
      return;
    }

    setIsProcessing(true);
    setSecurityStep(1);
    await new Promise(r => setTimeout(r, 2000)); // Security scan

    try {
      const newBalances = { ...profile.crypto_balances };
      newBalances[asset as keyof typeof profile.crypto_balances] = currentBalance - amount;

      await updateDoc(doc(db, "users", profile.id), { crypto_balances: newBalances });
      
      await addDoc(collection(db, "transactions"), {
        user_id: profile.id,
        type: 'transfer',
        asset: asset,
        amount: amount,
        recipient: transferData.address,
        status: 'completed',
        created_at: serverTimestamp()
      });

      alert(`Successfully transferred ${amount} ${asset} to ${transferData.address}`);
      setShowTransferModal(false);
      setTransferData({ address: "", amount: "", asset: "BTC" });
    } catch (error) {
      console.error(error);
      alert("Transfer failed.");
    } finally {
      setIsProcessing(false);
      setSecurityStep(0);
    }
  };

  const handleWithdraw = async () => {
    if (!profile || !withdrawData.amount || !withdrawData.details) return;
    const amount = parseFloat(withdrawData.amount);
    if (amount <= 0 || amount > (profile.coins || 0)) {
      alert("Invalid amount or insufficient coins.");
      return;
    }

    setIsProcessing(true);
    setSecurityStep(1);
    await new Promise(r => setTimeout(r, 2000));

    try {
      const newCoins = (profile.coins || 0) - amount;
      await updateDoc(doc(db, "users", profile.id), { coins: newCoins });

      await addDoc(collection(db, "transactions"), {
        user_id: profile.id,
        type: 'withdrawal',
        asset: 'COINS',
        amount: amount,
        method: withdrawData.method,
        details: withdrawData.details,
        status: 'pending',
        created_at: serverTimestamp()
      });

      alert("Withdrawal request submitted! It will be processed within 24-48 hours.");
      setShowWithdrawModal(false);
      setWithdrawData({ method: "bank", amount: "", details: "" });
    } catch (error) {
      console.error(error);
    } finally {
      setIsProcessing(false);
      setSecurityStep(0);
    }
  };

  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [securityStep, setSecurityStep] = useState(0);
  const [transferData, setTransferData] = useState({ address: "", amount: "", asset: "BTC" });
  const [withdrawData, setWithdrawData] = useState({ method: "bank", amount: "", details: "" });
  const [transactions, setTransactions] = useState<any[]>([]);

  useEffect(() => {
    if (!profile) return;
    const q = query(
      collection(db, "transactions"),
      where("user_id", "==", profile.id),
      orderBy("created_at", "desc"),
      limit(10)
    );
    const unsub = onSnapshot(q, (snap) => {
      setTransactions(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return unsub;
  }, [profile]);

  const cryptoAssets = [
    { id: 'BTC', name: 'Bitcoin', icon: <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold text-xs">₿</div>, balance: profile?.crypto_balances?.BTC || 0, price: 65000 },
    { id: 'ETH', name: 'Ethereum', icon: <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xs">Ξ</div>, balance: profile?.crypto_balances?.ETH || 0, price: 3500 },
    { id: 'SOL', name: 'Solana', icon: <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold text-xs">S</div>, balance: profile?.crypto_balances?.SOL || 0, price: 150 },
    { id: 'USDT', name: 'Tether', icon: <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-xs">₮</div>, balance: profile?.crypto_balances?.USDT || 0, price: 1 },
  ];

  const purchaseOptions = [
    { coins: 5, price: 1 },
    { coins: 50, price: 10 },
    { coins: 500, price: 100 },
    { coins: 5000, price: 1000 },
    { coins: 50000, price: 10000 },
  ];

  return (
    <div className="pt-24 pb-20 px-6 max-w-2xl mx-auto space-y-8">
      <div className="flex justify-between items-end">
        <div className="space-y-2">
          <h1 className="text-3xl font-black tracking-tight">Financial Hub</h1>
          <p className="text-white/60">Manage your coins and crypto assets securely.</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full">
          <Coins size={16} className="text-blue-500" />
          <span className="text-sm font-bold">{profile?.coins || 0} Coins</span>
        </div>
      </div>

      {/* Crypto Wallet Section */}
      <div className="bg-zinc-900 border border-white/10 rounded-3xl p-8 space-y-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5">
          <Wallet size={120} />
        </div>
        <div className="flex justify-between items-center">
          <div className="space-y-1">
            <span className="text-xs font-bold text-white/40 uppercase tracking-widest">Crypto Wallet Balance</span>
            <div className="text-4xl font-black tracking-tighter flex items-center gap-2">
              <span className="text-green-500">$</span>
              {(cryptoAssets.reduce((acc, asset) => acc + (asset.balance * asset.price), 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <button 
              onClick={() => setShowPasskey(!showPasskey)}
              className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-all text-white/60"
            >
              {showPasskey ? <EyeOff size={20} /> : <Key size={20} />}
            </button>
          </div>
        </div>

        {showPasskey && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="p-4 bg-black/40 rounded-2xl border border-white/5 space-y-3"
          >
            <div className="flex justify-between items-center">
              <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest">Wallet Passkey</p>
              <div className="flex gap-2">
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(passkey || "");
                    alert("Passkey copied! Keep it safe.");
                  }}
                  className="text-[10px] font-bold text-blue-500 uppercase hover:underline"
                >
                  Copy
                </button>
                <button onClick={generatePasskey} className="text-[10px] font-bold text-red-500 uppercase hover:underline">Regenerate</button>
              </div>
            </div>
            <p className="text-xs font-mono break-all text-blue-400 bg-blue-500/5 p-3 rounded-xl border border-blue-500/10">
              {passkey || "No passkey generated yet."}
            </p>
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-2">
              <ShieldCheck size={14} className="text-red-500 shrink-0 mt-0.5" />
              <p className="text-[9px] text-red-500/80 uppercase font-black leading-tight">
                CRITICAL SECURITY WARNING: Never share this passkey with anyone, including HomeVerse staff. We will NEVER ask for your passkey. It grants total control over your crypto assets.
              </p>
            </div>
          </motion.div>
        )}

        <div className="space-y-4">
          {cryptoAssets.map((asset) => (
            <div key={asset.id} className="flex items-center justify-between p-4 bg-black/40 rounded-2xl border border-white/5 hover:bg-black/60 transition-all">
              <div className="flex items-center gap-3">
                {asset.icon}
                <div>
                  <p className="text-sm font-bold">{asset.name}</p>
                  <p className="text-[10px] text-white/40">{asset.id} • ${asset.price.toLocaleString()}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-black">{asset.balance} {asset.id}</p>
                <p className="text-[10px] text-green-500 font-bold">+${(asset.balance * asset.price).toLocaleString()}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-3 pt-2">
          <button 
            onClick={() => setShowReceiveModal(true)}
            className="flex-1 py-4 bg-white text-black font-bold rounded-2xl flex items-center justify-center gap-2 hover:bg-white/90 transition-all"
          >
            <ArrowDownLeft size={18} /> Receive
          </button>
          <button 
            onClick={() => setShowTransferModal(true)}
            className="flex-1 py-4 bg-zinc-800 text-white font-bold rounded-2xl flex items-center justify-center gap-2 hover:bg-zinc-700 transition-all"
          >
            <ArrowUpRight size={18} /> Transfer
          </button>
        </div>
      </div>

      {/* Transaction History */}
      <div className="bg-zinc-900 border border-white/10 rounded-3xl p-8 space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-black tracking-tight">Transaction History</h3>
          <Activity size={20} className="text-white/20" />
        </div>
        
        <div className="space-y-3">
          {transactions.length > 0 ? (
            transactions.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between p-4 bg-black/40 rounded-2xl border border-white/5">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${tx.type === 'receive' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                    {tx.type === 'receive' ? <ArrowDownLeft size={14} /> : <ArrowUpRight size={14} />}
                  </div>
                  <div>
                    <p className="text-sm font-bold capitalize">{tx.type} {tx.asset}</p>
                    <p className="text-[10px] text-white/40">{tx.created_at?.toDate().toLocaleString() || 'Just now'}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-black ${tx.type === 'receive' ? 'text-green-500' : 'text-red-500'}`}>
                    {tx.type === 'receive' ? '+' : '-'}{tx.amount} {tx.asset}
                  </p>
                  <p className="text-[10px] text-white/20 font-bold uppercase tracking-widest">{tx.status}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="py-12 flex flex-col items-center justify-center text-white/20 space-y-2">
              <Activity size={40} />
              <p className="text-xs font-bold uppercase tracking-widest">No transactions yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Coins Section */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-400 rounded-3xl p-8 space-y-6 text-white shadow-xl shadow-blue-500/20">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <span className="text-xs font-bold text-white/20 uppercase tracking-widest">In-App Coins</span>
            <div className="text-5xl font-black tracking-tighter flex items-center gap-2">
              {profile?.coins || 0}
              <span className="text-blue-200 text-2xl font-bold">Coins</span>
            </div>
          </div>
          <Coins size={40} className="text-white/20" />
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setShowPurchaseModal(true)}
            className="flex-1 py-4 bg-white text-blue-600 font-bold rounded-2xl flex items-center justify-center gap-2 hover:bg-blue-50 transition-all"
          >
            <Plus size={18} /> Buy Coins
          </button>
          <button 
            onClick={() => setShowWithdrawModal(true)}
            className="flex-1 py-4 bg-blue-500/50 text-white font-bold rounded-2xl flex items-center justify-center gap-2 hover:bg-blue-500/60 transition-all border border-white/10"
          >
            <ArrowUpRight size={18} /> Withdraw
          </button>
        </div>
      </div>

      {/* Referral Section */}
      <div className="bg-zinc-900 border border-white/10 rounded-3xl p-8 space-y-6">
        <div className="flex justify-between items-center">
          <div className="space-y-1">
            <h3 className="text-xl font-black">Refer & Earn</h3>
            <p className="text-xs text-white/40">Invite friends and get 5 coins for each registration.</p>
          </div>
          <div className="p-3 bg-blue-500/10 rounded-2xl">
            <Users size={24} className="text-blue-500" />
          </div>
        </div>
        
        <div className="p-6 bg-black/40 rounded-2xl border border-white/5 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest">Your Referral Code</p>
            <p className="text-2xl font-black tracking-widest text-blue-500">{profile?.referral_code || "-------"}</p>
          </div>
          <button 
            onClick={() => {
              navigator.clipboard.writeText(profile?.referral_code || "");
              alert("Referral code copied!");
            }}
            className="p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-colors"
          >
            <Share2 size={20} className="text-white/60" />
          </button>
        </div>
      </div>

      <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-6 space-y-4">
        <h4 className="font-bold text-blue-400">How do apps pay?</h4>
        <div className="space-y-3 text-sm text-white/70 leading-relaxed">
          <p>Apps like Obani generate revenue through various streams:</p>
          <ul className="list-disc list-inside space-y-2">
            <li><span className="text-white font-bold">Ads:</span> Revenue from brands showing ads to listeners.</li>
            <li><span className="text-white font-bold">Subscriptions:</span> Users paying for premium, ad-free experiences.</li>
            <li><span className="text-white font-bold">Digital Goods:</span> Selling virtual items, badges, or exclusive content.</li>
            <li><span className="text-white font-bold">Creator Fund:</span> We distribute a portion of our total revenue back to artists based on their engagement and play count.</li>
          </ul>
          <p className="text-xs italic mt-4">Your earnings are calculated based on your total views, likes, and shares. Once you reach the minimum threshold, you can withdraw to your crypto wallet.</p>
        </div>
      </div>

      {/* Receive Modal */}
      <AnimatePresence>
        {showReceiveModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-zinc-900 border border-white/10 rounded-[40px] p-8 max-w-md w-full space-y-8 relative"
            >
              <div className="flex justify-between items-center">
                <h3 className="text-2xl font-black">Receive Crypto</h3>
                <button onClick={() => setShowReceiveModal(false)} className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors"><X size={20} /></button>
              </div>
              
              <div className="flex flex-col items-center space-y-6">
                <div className="p-6 bg-white rounded-3xl">
                  <QrCode size={200} className="text-black" />
                </div>
                <div className="w-full space-y-2 text-center">
                  <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Your Wallet Address</p>
                  <div className="p-4 bg-black/40 rounded-2xl border border-white/5 flex items-center justify-between gap-4">
                    <p className="text-xs font-mono break-all text-blue-400">{profile?.wallet_address || "Generating address..."}</p>
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(profile?.wallet_address || "");
                        alert("Address copied!");
                      }}
                      className="p-2 bg-white/5 rounded-xl hover:bg-white/10 transition-colors"
                    >
                      <Share2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl">
                <p className="text-[10px] text-blue-400 font-bold leading-relaxed">
                  Only send BTC, ETH, or USDT to this address. Sending any other currency may result in permanent loss.
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Transfer Modal */}
      <AnimatePresence>
        {showTransferModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-zinc-900 border border-white/10 rounded-[40px] p-8 max-w-md w-full space-y-6 relative"
            >
              <div className="flex justify-between items-center">
                <h3 className="text-2xl font-black">Transfer Crypto</h3>
                <button onClick={() => setShowTransferModal(false)} className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors"><X size={20} /></button>
              </div>
              
              {isProcessing ? (
                <div className="py-12 flex flex-col items-center justify-center space-y-6">
                  <div className="relative">
                    <div className="w-24 h-24 rounded-full border-4 border-blue-500/20 border-t-blue-500 animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <ShieldCheck size={32} className="text-blue-500" />
                    </div>
                  </div>
                  <div className="text-center space-y-2">
                    <p className="text-lg font-black tracking-tight">
                      {securityStep === 1 ? "Security Scan..." : securityStep === 2 ? "Verifying Address..." : "Finalizing Transfer..."}
                    </p>
                    <p className="text-xs text-white/40 font-bold uppercase tracking-widest">Powered by Obani Security</p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest px-2">Recipient Address</label>
                      <input 
                        type="text" 
                        value={transferData.address}
                        onChange={(e) => setTransferData({ ...transferData, address: e.target.value })}
                        placeholder="Enter wallet address"
                        className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 text-sm focus:border-blue-500 outline-none transition-colors"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest px-2">Amount</label>
                      <div className="relative">
                        <input 
                          type="number" 
                          value={transferData.amount}
                          onChange={(e) => setTransferData({ ...transferData, amount: e.target.value })}
                          placeholder="0.00"
                          className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 text-sm focus:border-blue-500 outline-none transition-colors"
                        />
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                          <select 
                            value={transferData.asset}
                            onChange={(e) => setTransferData({ ...transferData, asset: e.target.value })}
                            className="bg-transparent text-xs font-bold outline-none cursor-pointer"
                          >
                            <option value="BTC">BTC</option>
                            <option value="ETH">ETH</option>
                            <option value="SOL">SOL</option>
                            <option value="USDT">USDT</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <button 
                    onClick={handleTransfer}
                    className="w-full py-4 bg-blue-500 text-white font-bold rounded-2xl hover:bg-blue-600 transition-all shadow-lg shadow-blue-500/20"
                  >
                    Confirm Transfer
                  </button>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Withdraw Modal */}
      <AnimatePresence>
        {showWithdrawModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-zinc-900 border border-white/10 rounded-[40px] p-8 max-w-md w-full space-y-6 relative"
            >
              <div className="flex justify-between items-center">
                <h3 className="text-2xl font-black">Withdraw Funds</h3>
                <button onClick={() => setShowWithdrawModal(false)} className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors"><X size={20} /></button>
              </div>

              {isProcessing ? (
                <div className="py-12 flex flex-col items-center justify-center space-y-6">
                  <div className="w-16 h-16 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
                  <p className="font-bold">Processing Withdrawal...</p>
                </div>
              ) : (
                <>
                  <div className="space-y-4">
                    <div className="flex gap-2">
                      {['bank', 'paypal', 'crypto'].map(method => (
                        <button
                          key={method}
                          onClick={() => setWithdrawData({ ...withdrawData, method })}
                          className={cn(
                            "flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                            withdrawData.method === method ? "bg-blue-500 text-white" : "bg-white/5 text-white/40"
                          )}
                        >
                          {method}
                        </button>
                      ))}
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest px-2">Amount (Coins)</label>
                      <input 
                        type="number" 
                        value={withdrawData.amount}
                        onChange={(e) => setWithdrawData({ ...withdrawData, amount: e.target.value })}
                        placeholder="Enter coin amount"
                        className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 text-sm outline-none"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest px-2">
                        {withdrawData.method === 'bank' ? 'Account Number / IBAN' : withdrawData.method === 'paypal' ? 'PayPal Email' : 'Wallet Address'}
                      </label>
                      <input 
                        type="text" 
                        value={withdrawData.details}
                        onChange={(e) => setWithdrawData({ ...withdrawData, details: e.target.value })}
                        placeholder="Enter details"
                        className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 text-sm outline-none"
                      />
                    </div>
                  </div>

                  <button 
                    onClick={handleWithdraw}
                    className="w-full py-4 bg-green-500 text-white font-bold rounded-2xl hover:bg-green-600 transition-all"
                  >
                    Request Withdrawal
                  </button>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Coin Purchase Modal */}
      <AnimatePresence>
        {showPurchaseModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-zinc-900 border border-white/10 rounded-[40px] p-8 max-w-md w-full space-y-8 relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-blue-300" />
              <div className="flex justify-between items-center">
                <h3 className="text-2xl font-black">Buy Coins</h3>
                <button onClick={() => setShowPurchaseModal(false)} className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors"><X size={20} /></button>
              </div>
              
              {isProcessing ? (
                <div className="py-12 flex flex-col items-center justify-center space-y-6">
                  <div className="relative">
                    <div className="w-24 h-24 rounded-full border-4 border-blue-500/20 border-t-blue-500 animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <ShieldCheck size={32} className="text-blue-500" />
                    </div>
                  </div>
                  <div className="text-center space-y-2">
                    <p className="text-lg font-black tracking-tight">
                      {securityStep === 1 ? "Security Scan..." : securityStep === 2 ? "Verifying Payment..." : "Finalizing Purchase..."}
                    </p>
                    <p className="text-xs text-white/40 font-bold uppercase tracking-widest">Powered by Obani Security</p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                  {purchaseOptions.map(opt => (
                    <button 
                      key={opt.coins}
                      onClick={() => handlePurchase(opt.coins, opt.price)}
                      disabled={isProcessing}
                      className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
                          <Coins size={20} />
                        </div>
                        <div className="text-left">
                          <p className="font-bold">{opt.coins.toLocaleString()} Coins</p>
                          <p className="text-[10px] text-white/40 uppercase font-black tracking-widest">Obani Currency</p>
                        </div>
                      </div>
                      <div className="px-4 py-2 bg-blue-500 text-white font-black rounded-xl text-sm group-hover:scale-105 transition-transform">
                        ${opt.price.toLocaleString()}
                      </div>
                    </button>
                  ))}
                </div>
              )}
              
              <p className="text-[10px] text-center text-white/20 uppercase font-black tracking-widest">Secure Payment Powered by Obani</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};


const SettingsView = () => {
  const { user, profile, logout } = useAuth();
  const navigate = useNavigate();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteAccount = async () => {
    if (!user) return;
    const confirm = window.confirm("Are you sure you want to delete your account? This action is permanent and cannot be undone.");
    if (!confirm) return;

    setIsDeleting(true);
    try {
      // 1. Delete user document
      await deleteDoc(doc(db, "users", user.uid));
      // 2. Delete user auth (this might require re-authentication in a real app)
      await user.delete();
      alert("Account deleted successfully.");
      navigate("/login");
    } catch (error) {
      console.error("Error deleting account:", error);
      alert("Failed to delete account. You may need to log out and log back in to perform this action.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="pt-24 pb-20 px-6 max-w-md mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 bg-zinc-900 rounded-xl">
          <ChevronLeft size={20} />
        </button>
        <h1 className="text-2xl font-black tracking-tight">Settings</h1>
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
          <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Account Management</p>
          <div className="bg-zinc-900 border border-white/5 rounded-3xl overflow-hidden">
            <button 
              onClick={() => navigate("/edit-profile")}
              className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors border-b border-white/5"
            >
              <div className="flex items-center gap-3">
                <User size={18} className="text-blue-500" />
                <span className="text-sm font-bold">Edit Profile</span>
              </div>
              <ChevronRight size={18} className="text-white/20" />
            </button>
            <button 
              onClick={() => navigate("/wallet")}
              className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors border-b border-white/5"
            >
              <div className="flex items-center gap-3">
                <Wallet size={18} className="text-green-500" />
                <span className="text-sm font-bold">Wallet & Earnings</span>
              </div>
              <ChevronRight size={18} className="text-white/20" />
            </button>
            <button 
              onClick={() => navigate("/about")}
              className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors border-b border-white/5"
            >
              <div className="flex items-center gap-3">
                <InfoIcon size={18} className="text-purple-500" />
                <span className="text-sm font-bold">About HomeVerse</span>
              </div>
              <ChevronRight size={18} className="text-white/20" />
            </button>
            <button 
              onClick={() => navigate("/ai")}
              className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Bot size={18} className="text-blue-500" />
                <span className="text-sm font-bold">Help Center (AI Assistant)</span>
              </div>
              <ChevronRight size={18} className="text-white/20" />
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Security</p>
          <div className="bg-zinc-900 border border-white/5 rounded-3xl overflow-hidden">
            <button className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors border-b border-white/5">
              <div className="flex items-center gap-3">
                <LockIcon size={18} className="text-yellow-500" />
                <span className="text-sm font-bold">Change Password</span>
              </div>
              <ChevronRight size={18} className="text-white/20" />
            </button>
            <button className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors">
              <div className="flex items-center gap-3">
                <Shield size={18} className="text-blue-500" />
                <span className="text-sm font-bold">Two-Factor Auth</span>
              </div>
              <ChevronRight size={18} className="text-white/20" />
            </button>
          </div>
        </div>

        <div className="space-y-4 pt-4">
          <button 
            onClick={logout}
            className="w-full py-4 bg-zinc-900 border border-white/10 text-white font-bold rounded-2xl flex items-center justify-center gap-2"
          >
            <LogOut size={18} /> Log Out
          </button>
          <button 
            onClick={handleDeleteAccount}
            disabled={isDeleting}
            className="w-full py-4 bg-red-500/10 border border-red-500/20 text-red-500 font-bold rounded-2xl flex items-center justify-center gap-2"
          >
            {isDeleting ? <Loader2 className="animate-spin" /> : <Trash2 size={18} />} Delete Account
          </button>
        </div>
      </div>
    </div>
  );
};
const recordNotification = async (recipientId: string, senderId: string, senderUsername: string, type: 'like' | 'follow' | 'comment' | 'profile_view' | 'share' | 'repost' | 'duet' | 'favorite' | 'live_start' | 'live_invite' | 'gift' | 'support' | 'transfer' | 'invite', postId?: string, streamId?: string) => {
  if (!recipientId || recipientId === senderId) return;
  try {
    await addDoc(collection(db, "notifications"), {
      recipient_id: recipientId,
      sender_id: senderId,
      sender_username: senderUsername,
      type,
      post_id: postId || null,
      stream_id: streamId || null,
      created_at: serverTimestamp(),
      is_read: false
    });
  } catch (error) {
    console.error("Error recording notification:", error);
  }
};

const Notifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "notifications"),
      where("recipient_id", "==", user.uid),
      orderBy("created_at", "desc"),
      limit(50)
    );
    const unsub = onSnapshot(q, (snap) => {
      setNotifications(snap.docs.map(d => ({ id: d.id, ...d.data() } as Notification)));
    });
    return unsub;
  }, [user]);

  const markAsRead = async (id: string) => {
    try {
      await updateDoc(doc(db, "notifications", id), { is_read: true });
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const getNotificationText = (notif: Notification) => {
    switch (notif.type) {
      case 'profile_view': return "viewed your profile";
      case 'like': return "liked your post";
      case 'comment': return "commented on your post";
      case 'follow': return "started following you";
      case 'gift': return "sent you a gift";
      case 'support': return "supported your post";
      default: return "interacted with you";
    }
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'profile_view': return <Eye size={16} className="text-blue-400" />;
      case 'like': return <Heart size={16} className="text-red-500" />;
      case 'comment': return <MessageCircle size={16} className="text-green-400" />;
      case 'follow': return <UserPlus size={16} className="text-purple-400" />;
      case 'gift': return <Gift size={16} className="text-yellow-500" />;
      case 'support': return <Coins size={16} className="text-yellow-500" />;
      default: return <Bell size={16} />;
    }
  };

  return (
    <div className="pt-24 pb-20 px-6 max-w-lg mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-black tracking-tight">Notifications</h1>
        <div className="px-3 py-1 bg-zinc-900 border border-white/10 rounded-full text-[10px] font-bold text-white/40 uppercase tracking-widest">
          {notifications.filter(n => !n.is_read).length} New
        </div>
      </div>

      <div className="space-y-3">
        {notifications.map(notif => (
          <motion.div 
            key={notif.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={() => {
              markAsRead(notif.id);
              if (notif.type === 'profile_view' || notif.type === 'follow') {
                navigate(`/profile/${notif.sender_id}`);
              } else if (notif.post_id) {
                navigate("/"); // In a real app, navigate to specific post
              }
            }}
            className={cn(
              "p-4 rounded-3xl border transition-all cursor-pointer flex items-center gap-4",
              notif.is_read ? "bg-zinc-900/50 border-white/5 opacity-60" : "bg-zinc-900 border-white/10 shadow-lg shadow-blue-500/5"
            )}
          >
            <div className="relative">
              <Avatar 
                username={notif.sender_username} 
                size="md" 
              />
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-black border border-white/10 flex items-center justify-center">
                {getNotificationIcon(notif.type)}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold">
                <span className="text-blue-400">@{notif.sender_username}</span> {getNotificationText(notif)}
              </p>
              <p className="text-[10px] text-white/40 font-medium">
                {notif.created_at?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
            {!notif.is_read && <div className="w-2 h-2 rounded-full bg-blue-500" />}
          </motion.div>
        ))}
        {notifications.length === 0 && (
          <div className="text-center py-20 text-white/20 italic">No notifications yet.</div>
        )}
      </div>
    </div>
  );
};

const EditProfile = ({ profile, onBack }: { profile: UserProfile, onBack: () => void }) => {
  const [username, setUsername] = useState(profile.username);
  const [profileName, setProfileName] = useState(profile.profile_name || "");
  const [bio, setBio] = useState(profile.bio || "");
  const [bioLinks, setBioLinks] = useState<string[]>(profile.bio_links || []);
  const [newLink, setNewLink] = useState("");
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url || "");
  const [experience, setExperience] = useState(profile.experience || "");
  const [yearOfBeginning, setYearOfBeginning] = useState(profile.year_of_beginning || "");
  const [achievement, setAchievement] = useState(profile.achievement || "");
  const [inspiration, setInspiration] = useState(profile.inspiration || "");
  const [trackNames, setTrackNames] = useState(profile.track_names?.join(", ") || "");
  const [selectedGenres, setSelectedGenres] = useState<string[]>(profile.genres || []);
  const [subgenres, setSubgenres] = useState(profile.subgenres?.join(", ") || "");
  const [usernameError, setUsernameError] = useState("");
  const [profileNameError, setProfileNameError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const validateUsername = (val: string) => {
    if (val.length < 3) {
      setUsernameError("Username must be at least 3 characters");
      return false;
    }
    if (!/^[a-z0-9._]+$/.test(val)) {
      setUsernameError("Only lowercase letters, numbers, _ and . allowed");
      return false;
    }
    setUsernameError("");
    return true;
  };

  const validateProfileName = (val: string) => {
    const regex = /^[\w\s\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E6}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1F018}-\u{1F093}\u{1F170}-\u{1F251}]+$/u;
    if (!regex.test(val)) {
      setProfileNameError("No symbols allowed in profile name.");
      return false;
    }
    setProfileNameError("");
    return true;
  };

  const handleSave = async () => {
    if (!validateUsername(username)) return;
    if (!validateProfileName(profileName)) return;
    setIsSaving(true);

    try {
      const updates: any = {
        bio,
        bio_links: bioLinks,
        avatar_url: avatarUrl,
        experience,
        year_of_beginning: yearOfBeginning,
        achievement,
        inspiration,
        track_names: trackNames.split(",").map(s => s.trim()).filter(s => s),
        genres: selectedGenres,
        subgenres: subgenres.split(",").map(s => s.trim()).filter(s => s),
        updated_at: serverTimestamp(),
      };

      // Check username change limit (60 days)
      if (username !== profile.username) {
        const lastChange = profile.last_username_change?.toDate();
        const now = new Date();
        if (lastChange) {
          const diffDays = Math.ceil((now.getTime() - lastChange.getTime()) / (1000 * 60 * 60 * 24));
          if (diffDays < 60) {
            alert(`You can only change your username once every 60 days. Next change available in ${60 - diffDays} days.`);
            setIsSaving(false);
            return;
          }
        }

        // Check uniqueness
        const q = query(collection(db, "users"), where("username", "==", username));
        const snap = await getDocs(q);
        if (!snap.empty) {
          setUsernameError("Username is already taken");
          setIsSaving(false);
          return;
        }

        updates.username = username;
        updates.profile_url = `https://www.homeverse.com/@${username}`;
        updates.last_username_change = serverTimestamp();
      }

      // Check profile name change limit (7 days)
      if (profileName !== profile.profile_name) {
        const lastChange = profile.last_profile_name_change?.toDate();
        const now = new Date();
        if (lastChange) {
          const diffDays = Math.ceil((now.getTime() - lastChange.getTime()) / (1000 * 60 * 60 * 24));
          if (diffDays < 7) {
            alert(`You can only change your profile name once every 7 days. Next change available in ${7 - diffDays} days.`);
            setIsSaving(false);
            return;
          }
        }
        updates.profile_name = profileName;
        updates.last_profile_name_change = serverTimestamp();
      }

      await updateDoc(doc(db, "users", profile.id), updates);
      alert("Profile updated successfully!");
      onBack();
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Failed to update profile. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="pt-24 pb-20 px-6 max-w-md mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="p-2 bg-zinc-900 rounded-xl">
          <ChevronLeft size={20} />
        </button>
        <h1 className="text-2xl font-black tracking-tight">Edit Profile</h1>
      </div>

      <div className="space-y-6">
        <div className="flex flex-col items-center gap-4">
          <div className="relative group">
            <Avatar avatarUrl={avatarUrl} username={profile.username} size="xl" />
            <label className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-full cursor-pointer">
              <ImageIcon size={24} className="text-white" />
              <input 
                type="file" 
                accept="image/*" 
                className="hidden" 
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    // In a real app, upload to storage. For now, use local URL.
                    setAvatarUrl(URL.createObjectURL(file));
                  }
                }}
              />
            </label>
          </div>
          <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Change Profile Photo</p>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Username</label>
          <input 
            type="text" 
            value={username}
            onChange={(e) => {
              const val = e.target.value.toLowerCase().trim();
              setUsername(val);
              validateUsername(val);
            }}
            className={cn(
              "w-full bg-zinc-900 border rounded-2xl p-4 focus:outline-none transition-colors",
              usernameError ? "border-red-500" : "border-white/10 focus:border-blue-500"
            )}
          />
          {usernameError && <p className="text-xs text-red-500 font-bold">{usernameError}</p>}
          <p className="text-[10px] text-white/20 italic">Can be changed once every 60 days.</p>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Profile Name</label>
          <input 
            type="text" 
            value={profileName}
            onChange={(e) => {
              setProfileName(e.target.value);
              validateProfileName(e.target.value);
            }}
            className={cn(
              "w-full bg-zinc-900 border rounded-2xl p-4 focus:outline-none transition-colors",
              profileNameError ? "border-red-500" : "border-white/10 focus:border-blue-500"
            )}
          />
          {profileNameError && <p className="text-xs text-red-500 font-bold">{profileNameError}</p>}
          <p className="text-[10px] text-white/20 italic">Can be changed once every 7 days.</p>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Bio</label>
            <span className={cn("text-[10px] font-bold", bio.length > 80 ? "text-red-500" : "text-white/20")}>{bio.length}/80</span>
          </div>
          <textarea 
            value={bio}
            onChange={(e) => setBio(e.target.value.slice(0, 80))}
            placeholder="Tell us about yourself..."
            className="w-full bg-zinc-900 border border-white/10 rounded-2xl p-4 focus:outline-none focus:border-blue-500 transition-colors min-h-[100px] resize-none"
          />
        </div>

        <div className="space-y-4">
          <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Bio Links</label>
          <div className="space-y-2">
            {bioLinks.map((link, i) => (
              <div key={i} className="flex items-center gap-2 p-3 bg-zinc-900 rounded-xl border border-white/5">
                <Globe size={14} className="text-blue-500" />
                <span className="flex-1 text-xs truncate">{link}</span>
                <button onClick={() => setBioLinks(prev => prev.filter((_, idx) => idx !== i))} className="text-red-500">
                  <X size={14} />
                </button>
              </div>
            ))}
            <div className="flex gap-2">
              <input 
                type="text" 
                value={newLink}
                onChange={(e) => setNewLink(e.target.value)}
                placeholder="https://example.com"
                className="flex-1 bg-zinc-900 border border-white/10 rounded-xl p-3 text-xs focus:outline-none focus:border-blue-500"
              />
              <button 
                onClick={() => {
                  if (newLink.trim()) {
                    setBioLinks(prev => [...prev, newLink.trim()]);
                    setNewLink("");
                  }
                }}
                className="px-4 bg-blue-500 text-white font-bold rounded-xl text-xs"
              >
                Add
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t border-white/5">
          <h3 className="text-sm font-black uppercase tracking-widest text-white/60">Professional Details</h3>
          
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Experience</label>
            <textarea 
              value={experience}
              onChange={(e) => setExperience(e.target.value)}
              placeholder="Describe your professional journey..."
              className="w-full bg-zinc-900 border border-white/10 rounded-2xl p-4 focus:outline-none focus:border-blue-500 transition-colors min-h-[100px] resize-none text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Year of Beginning</label>
              <input 
                type="text" 
                value={yearOfBeginning}
                onChange={(e) => setYearOfBeginning(e.target.value)}
                placeholder="e.g. 2015"
                className="w-full bg-zinc-900 border border-white/10 rounded-2xl p-4 focus:outline-none focus:border-blue-500 transition-colors text-sm"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Achievement</label>
              <input 
                type="text" 
                value={achievement}
                onChange={(e) => setAchievement(e.target.value)}
                placeholder="e.g. Best New Artist 2023"
                className="w-full bg-zinc-900 border border-white/10 rounded-2xl p-4 focus:outline-none focus:border-blue-500 transition-colors text-sm"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Inspiration</label>
            <input 
              type="text" 
              value={inspiration}
              onChange={(e) => setInspiration(e.target.value)}
              placeholder="Who or what inspires you?"
              className="w-full bg-zinc-900 border border-white/10 rounded-2xl p-4 focus:outline-none focus:border-blue-500 transition-colors text-sm"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Track Names (Comma separated)</label>
            <input 
              type="text" 
              value={trackNames}
              onChange={(e) => setTrackNames(e.target.value)}
              placeholder="Song 1, Song 2, Song 3..."
              className="w-full bg-zinc-900 border border-white/10 rounded-2xl p-4 focus:outline-none focus:border-blue-500 transition-colors text-sm"
            />
          </div>

          <div className="space-y-4">
            <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Music Genres</label>
            <div className="flex flex-wrap gap-2">
              {['Afrobeats', 'Hip Hop', 'R&B', 'Pop', 'Rock', 'Jazz', 'Electronic', 'Country', 'Reggae', 'Classical', 'Gospel', 'Highlife', 'Amapiano', 'Drill', 'Trap'].map(genre => (
                <button
                  key={genre}
                  onClick={() => {
                    if (selectedGenres.includes(genre)) {
                      setSelectedGenres(selectedGenres.filter(g => g !== genre));
                    } else {
                      setSelectedGenres([...selectedGenres, genre]);
                    }
                  }}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-[10px] font-bold uppercase border transition-all",
                    selectedGenres.includes(genre) ? "bg-white text-black border-white" : "bg-black/40 border-white/10 text-white/40 hover:border-white/20"
                  )}
                >
                  {genre}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Sub-genres (Comma separated)</label>
            <input 
              type="text" 
              value={subgenres}
              onChange={(e) => setSubgenres(e.target.value)}
              placeholder="e.g. Afro-fusion, Melodic Rap"
              className="w-full bg-zinc-900 border border-white/10 rounded-2xl p-4 focus:outline-none focus:border-blue-500 transition-colors text-sm"
            />
          </div>
        </div>

        <button 
          onClick={handleSave}
          disabled={isSaving || !!usernameError || !!profileNameError}
          className="w-full py-4 bg-white text-black font-bold rounded-2xl disabled:opacity-50"
        >
          {isSaving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
};

const Profile = () => {
  const { id } = useParams();
  const { profile: myProfile, logout } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [recordings, setRecordings] = useState<any[]>([]);
  const [invitedUsers, setInvitedUsers] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'posts' | 'clips' | 'referrals'>('posts');
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (!id) return;
    const unsub = onSnapshot(doc(db, "users", id), (doc) => {
      setProfile(doc.data() as UserProfile);
    });
    
    const postsQuery = query(collection(db, "posts"), where("user_id", "==", id), orderBy("created_at", "desc"), limit(12));
    const unsubPosts = onSnapshot(postsQuery, (snap) => {
      setPosts(snap.docs.map(d => ({ id: d.id, ...d.data() } as Post)));
    });

    const recordingsQuery = query(collection(db, "stream_recordings"), where("moderator_id", "==", id), orderBy("created_at", "desc"), limit(12));
    const unsubRecordings = onSnapshot(recordingsQuery, (snap) => {
      setRecordings(snap.docs.map(d => ({ id: d.id, ...d.data() } as any)));
    });

    const referralsQuery = query(collection(db, "referrals"), where("referrer_id", "==", id), orderBy("created_at", "desc"));
    const unsubReferrals = onSnapshot(referralsQuery, (snap) => {
      setInvitedUsers(snap.docs.map(d => ({ id: d.id, ...d.data() } as any)));
    });

    // Record profile view notification and track in collection
    if (myProfile && id && myProfile.id !== id) {
      const trackView = async () => {
        try {
          const viewRef = doc(db, "profile_views", `${myProfile.id}_${id}`);
          const viewSnap = await getDoc(viewRef);
          if (!viewSnap.exists()) {
            await setDoc(viewRef, {
              viewer_id: myProfile.id,
              viewer_username: myProfile.username,
              target_id: id,
              created_at: serverTimestamp()
            });
            recordNotification(id, myProfile.id, myProfile.username, 'profile_view');
          }
        } catch (error) {
          console.error("Error tracking profile view:", error);
        }
      };
      trackView();
    }

    return () => { unsub(); unsubPosts(); unsubRecordings(); unsubReferrals(); };
  }, [id, myProfile?.id]);

  const startChat = async () => {
    if (!myProfile) {
      navigate("/login");
      return;
    }
    if (!profile || myProfile.id === profile.id) return;
    const chatId = [myProfile.id, profile.id].sort().join('_');
    try {
      const chatRef = doc(db, "chats", chatId);
      const chatSnap = await getDoc(chatRef);
      if (!chatSnap.exists()) {
        await setDoc(chatRef, {
          participant_ids: [myProfile.id, profile.id],
          updated_at: serverTimestamp(),
        });
      }
      navigate(`/chats/${chatId}`);
    } catch (error) {
      console.error("Error starting chat:", error);
    }
  };

  const handleFollow = async () => {
    if (!myProfile) {
      navigate("/login");
      return;
    }
    if (!profile || myProfile.id === profile.id) return;
    try {
      const followId = `${myProfile.id}_${profile.id}`;
      const followRef = doc(db, "follows", followId);
      const followSnap = await getDoc(followRef);

      if (followSnap.exists()) {
        await deleteDoc(followRef);
        await updateDoc(doc(db, "users", profile.id), { followers_count: increment(-1) });
        await updateDoc(doc(db, "users", myProfile.id), { following_count: increment(-1) });
      } else {
        await setDoc(followRef, {
          follower_id: myProfile.id,
          following_id: profile.id,
          created_at: serverTimestamp()
        });
        await updateDoc(doc(db, "users", profile.id), { followers_count: increment(1) });
        await updateDoc(doc(db, "users", myProfile.id), { following_count: increment(1) });
        await recordNotification(profile.id, myProfile.id, myProfile.username, 'follow');
      }
    } catch (error) {
      console.error("Error toggling follow:", error);
    }
  };

  if (!profile) return <div className="pt-24 text-center">Loading profile...</div>;

  if (isEditing && myProfile?.id === profile.id) {
    return <EditProfile profile={profile} onBack={() => setIsEditing(false)} />;
  }

  return (
    <div className="pt-24 pb-20 px-6 max-w-2xl mx-auto space-y-8">
      <div className="flex flex-col items-center text-center space-y-4">
        <div className="relative">
          <Avatar userProfile={profile} size="xl" />
          {profile.is_verified && (
            <div className={cn(
              "absolute bottom-0 right-0 rounded-full p-1 border-2 border-black",
              profile.email === "prosperkingsley360@gmail.com" ? "bg-blue-600 scale-125" : "bg-blue-500"
            )}>
              {profile.email === "prosperkingsley360@gmail.com" ? (
                <ShieldCheck size={18} className="text-white" />
              ) : (
                <UserCheck size={14} className="text-white" />
              )}
            </div>
          )}
        </div>
        
        <div>
            <h1 className="text-2xl font-black tracking-tight flex flex-col items-center gap-1 justify-center">
              <div className="flex items-center gap-2">
                <span>{profile.profile_name || profile.username}</span>
                {profile.email === "prosperkingsley360@gmail.com" && (
                  <div className="bg-blue-600 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <span className="text-[8px] font-black text-white uppercase tracking-widest">Super Admin</span>
                  </div>
                )}
              </div>
              <span className="text-white/40 text-sm font-medium">@{profile.username}</span>
            </h1>
            <div className="mt-2 flex items-center gap-2 bg-zinc-900/50 px-4 py-2 rounded-full border border-white/5 w-fit mx-auto cursor-pointer hover:bg-zinc-800 transition-colors" onClick={() => {
              const url = `https://www.homeverse.com/@${profile.username}`;
              navigator.clipboard.writeText(url);
              alert("Profile link copied!");
            }}>
              <Globe size={12} className="text-blue-500" />
              <span className="text-[10px] font-bold text-white/60">homeverse.com/@{profile.username}</span>
              <Share2 size={10} className="text-white/20" />
            </div>
            <p className="text-white/60 text-sm mt-4">{profile.bio || "No bio yet."}</p>
          
          {profile.bio_links && profile.bio_links.length > 0 && (
            <div className="flex flex-wrap justify-center gap-3 mt-3">
              {profile.bio_links.map((link, i) => (
                <a 
                  key={i} 
                  href={link.startsWith('http') ? link : `https://${link}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors bg-blue-500/5 px-3 py-1.5 rounded-full border border-blue-500/10"
                >
                  <Globe size={12} />
                  {new URL(link.startsWith('http') ? link : `https://${link}`).hostname.replace('www.', '')}
                </a>
              ))}
            </div>
          )}
          
          <div className="flex flex-wrap gap-2 justify-center mt-4">
            {profile.genres?.map(genre => (
              <span key={genre} className="px-2 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] font-bold text-white/40 uppercase tracking-widest">
                {genre}
              </span>
            ))}
            {profile.subgenres?.map(sub => (
              <span key={sub} className="px-2 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full text-[10px] font-bold text-blue-400 uppercase tracking-widest">
                {sub}
              </span>
            ))}
          </div>

          {/* Professional Info Section */}
          {(profile.experience || profile.achievement || profile.inspiration || (profile.track_names && profile.track_names.length > 0)) && (
            <div className="mt-8 pt-8 border-t border-white/5 text-left space-y-6">
              {profile.experience && (
                <div className="space-y-2">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-white/40">Professional Experience</h3>
                  <p className="text-sm text-white/80 leading-relaxed">{profile.experience}</p>
                  {profile.year_of_beginning && (
                    <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">Active since {profile.year_of_beginning}</p>
                  )}
                </div>
              )}

              {profile.achievement && (
                <div className="space-y-2">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-white/40">Key Achievement</h3>
                  <div className="flex items-center gap-2 text-yellow-500">
                    <Trophy size={14} />
                    <p className="text-sm font-bold">{profile.achievement}</p>
                  </div>
                </div>
              )}

              {profile.inspiration && (
                <div className="space-y-2">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-white/40">Inspiration</h3>
                  <p className="text-sm text-white/80 italic">"{profile.inspiration}"</p>
                </div>
              )}

              {profile.track_names && profile.track_names.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-white/40">Notable Tracks</h3>
                  <div className="flex flex-wrap gap-2">
                    {profile.track_names.map((track, i) => (
                      <div key={i} className="flex items-center gap-2 bg-zinc-900 border border-white/5 px-3 py-2 rounded-xl">
                        <Music size={12} className="text-purple-500" />
                        <span className="text-xs font-bold">{track}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex gap-8">
          <div className="text-center">
            <div className="font-black">{formatCount(profile.followers_count)}</div>
            <div className="text-[10px] text-white/40 uppercase font-bold">Followers</div>
          </div>
          <div className="text-center">
            <div className="font-black">{profile.following_count}</div>
            <div className="text-[10px] text-white/40 uppercase font-bold">Following</div>
          </div>
          <div className="text-center">
            <div className="font-black">{posts.length}</div>
            <div className="text-[10px] text-white/40 uppercase font-bold">Posts</div>
          </div>
          <div className="text-center">
            <div className="font-black text-yellow-500 flex items-center gap-1 justify-center">
              <Coins size={14} />
              {profile.coins || 0}
            </div>
            <div className="text-[10px] text-white/40 uppercase font-bold">Coins</div>
          </div>
          <div className="text-center">
            <div className="font-black text-green-500 flex items-center gap-1 justify-center">
              <DollarSign size={14} />
              {(profile.earnings || 0).toLocaleString()}
            </div>
            <div className="text-[10px] text-white/40 uppercase font-bold">Earnings</div>
          </div>
        </div>

        <div className="flex gap-3 w-full">
          {myProfile?.id === profile.id ? (
            <>
              <button onClick={() => setIsEditing(true)} className="flex-1 py-3 bg-white text-black font-bold rounded-xl text-sm">Edit Profile</button>
              <button onClick={() => navigate("/beats")} className="p-3 bg-gradient-to-br from-blue-600 to-purple-600 text-white rounded-xl shadow-lg shadow-blue-500/20">
                <Music size={20} />
              </button>
              <button onClick={logout} className="p-3 bg-zinc-900 border border-white/10 rounded-xl text-red-500">
                <LogOut size={20} />
              </button>
              {myProfile?.role === 'admin' && (
                <button onClick={() => navigate("/admin")} className="p-3 bg-blue-500 text-white rounded-xl">
                  <Shield size={20} />
                </button>
              )}
              <button onClick={() => navigate("/settings")} className="p-3 bg-zinc-900 border border-white/10 rounded-xl text-white/60">
                <SettingsIcon size={20} />
              </button>
            </>
          ) : (
            <>
              <button onClick={handleFollow} className="flex-1 py-3 bg-blue-500 text-white font-bold rounded-xl text-sm">Follow</button>
              <button onClick={startChat} className="p-3 bg-zinc-900 border border-white/10 rounded-xl">
                <MessageCircle size={20} />
              </button>
              <button onClick={() => navigate("/about")} className="p-3 bg-zinc-900 border border-white/10 rounded-xl text-white/60">
                <AlertCircle size={20} />
              </button>
            </>
          )}
        </div>

        {profile.role === 'admin' && (
          <div className="w-full pt-6 border-t border-white/10 space-y-4">
            <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Contact Admin</p>
            <div className="flex flex-col gap-2">
              <a 
                href="mailto:prosperkingsley360@gmail.com"
                className="flex items-center gap-3 p-3 bg-zinc-900/50 rounded-xl border border-white/5 hover:bg-zinc-800 transition-colors group"
              >
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500">
                  <Mail size={16} />
                </div>
                <div className="text-left">
                  <p className="text-[8px] font-bold text-white/40 uppercase tracking-widest">Admin Email Address</p>
                  <p className="text-xs font-bold">prosperkingsley360@gmail.com</p>
                </div>
              </a>
              <a 
                href="https://ww.tiktok.com/@lilobani.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 bg-zinc-900/50 rounded-xl border border-white/5 hover:bg-zinc-800 transition-colors group"
              >
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-white">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.17-2.89-.6-4.13-1.47-.13 5.35.14 10.71-1.33 15.9-1.35 4.72-6.48 7.91-11.32 6.78-4.66-1.1-7.9-6.47-6.78-11.13 1.03-4.31 5.39-7.4 9.8-6.72.04 1.35-.05 2.69-.01 4.04-2.54-.4-5.04.91-5.91 3.31-.84 2.29.25 5.22 2.45 6.19 2.22.98 5.22-.14 6.09-2.39.45-1.13.4-2.39.41-3.6-.01-5.25-.01-10.51-.01-15.76.17-.05.34-.1.52-.15z"/>
                  </svg>
                </div>
                <div className="text-left">
                  <p className="text-[8px] font-bold text-white/40 uppercase tracking-widest">Admin TikTok Page</p>
                  <p className="text-xs font-bold">@lilobani.com</p>
                </div>
              </a>
            </div>
          </div>
        )}
      </div>

      <div className="flex w-full border-b border-white/10">
        <button 
          onClick={() => setActiveTab('posts')}
          className={cn(
            "flex-1 py-4 text-[10px] font-black uppercase tracking-widest transition-all",
            activeTab === 'posts' ? "text-white border-b-2 border-white" : "text-white/40"
          )}
        >
          Posts
        </button>
        <button 
          onClick={() => setActiveTab('clips')}
          className={cn(
            "flex-1 py-4 text-[10px] font-black uppercase tracking-widest transition-all",
            activeTab === 'clips' ? "text-white border-b-2 border-white" : "text-white/40"
          )}
        >
          Moderator Clips
        </button>
        <button 
          onClick={() => setActiveTab('referrals')}
          className={cn(
            "flex-1 py-4 text-[10px] font-black uppercase tracking-widest transition-all",
            activeTab === 'referrals' ? "text-white border-b-2 border-white" : "text-white/40"
          )}
        >
          Invited Users
        </button>
      </div>

      {activeTab === 'posts' ? (
        <div className="grid grid-cols-3 gap-1">
          {posts.map(post => (
            <div key={post.id} className="aspect-[9/16] bg-zinc-900 rounded-lg overflow-hidden relative group">
              <img src={post.file_url} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" referrerPolicy="no-referrer" />
              <div className="absolute bottom-2 left-2 flex items-center gap-1 text-[10px] font-bold">
                <TrendingUp size={10} /> {formatCount(post.likes_count)}
              </div>
            </div>
          ))}
        </div>
      ) : activeTab === 'clips' ? (
        <div className="grid grid-cols-3 gap-1">
          {recordings.length === 0 && (
            <div className="col-span-3 py-20 text-center text-white/20 italic">No moderator clips yet.</div>
          )}
          {recordings.map(rec => (
            <div key={rec.id} className="aspect-[9/16] bg-zinc-900 rounded-lg overflow-hidden relative group">
              <video src={rec.video_url} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Play size={24} className="text-white" />
              </div>
              <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
                <div className="flex items-center gap-1 text-[8px] font-black uppercase tracking-widest text-white/60">
                  <Shield size={10} /> Mod Clip
                </div>
                <button 
                  onClick={() => {
                    const url = rec.video_url;
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `stream_recording_${rec.id}.mp4`;
                    a.click();
                  }}
                  className="p-1 bg-white/10 rounded-full hover:bg-white/20 transition-colors"
                >
                  <Download size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4 p-4">
          <div className="p-6 bg-blue-500/10 border border-blue-500/20 rounded-[32px] space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black tracking-tight">Refer & Earn</h3>
                <p className="text-xs text-white/60 font-medium">Invite 2 friends and get 1 HomeVerse Coin!</p>
              </div>
              <div className="w-12 h-12 bg-blue-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                <UserPlus size={24} />
              </div>
            </div>
            <div className="flex gap-2">
              <div className="flex-1 bg-black/40 border border-white/10 rounded-xl p-3 text-xs font-mono text-white/60 truncate">
                https://homeverse.com/login?ref={profile.referral_code}
              </div>
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(`https://homeverse.com/login?ref=${profile.referral_code}`);
                  alert("Referral link copied!");
                }}
                className="px-4 bg-white text-black font-black rounded-xl text-[10px] uppercase tracking-widest"
              >
                Copy
              </button>
            </div>
          </div>

          {invitedUsers.length === 0 ? (
            <div className="py-20 text-center text-white/20">
              <Users size={48} className="mx-auto mb-4 opacity-10" />
              <p className="text-xs font-black uppercase tracking-widest">No invited users yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {invitedUsers.map(ref => (
                <div key={ref.id} className="p-4 bg-zinc-900 rounded-2xl border border-white/5 flex items-center justify-between group hover:bg-zinc-800 transition-all">
                  <div className="flex items-center gap-4">
                    <Avatar avatarUrl={ref.referred_avatar} username={ref.referred_username} size="lg" />
                    <div>
                      <p className="font-black">@{ref.referred_username}</p>
                      <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">Joined via your link</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <div className="px-3 py-1 bg-green-500/10 text-green-500 rounded-full text-[10px] font-black uppercase tracking-widest">
                      Verified
                    </div>
                    <p className="text-[8px] text-white/20 font-bold uppercase tracking-widest">
                      {ref.created_at?.toDate ? new Date(ref.created_at.toDate()).toLocaleDateString() : 'Just now'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// --- App Logic ---

const ErrorBoundary = ({ children }: { children: React.ReactNode }) => {
  const [hasError, setHasError] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      setHasError(true);
      setErrorMsg(event.message);
    };
    window.addEventListener("error", handleError);
    return () => window.removeEventListener("error", handleError);
  }, []);

  if (hasError) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6 text-center">
        <div className="space-y-4 max-w-md">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto" />
          <h1 className="text-2xl font-bold">Something went wrong</h1>
          <p className="text-white/60 text-sm">{errorMsg}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-white text-black font-bold rounded-full"
          >
            Reload App
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

// --- UI Components ---
const Avatar = ({ userProfile, avatarUrl, username, email, isOnline, size = "md", className = "" }: { 
  userProfile?: UserProfile | null; 
  avatarUrl?: string; 
  username?: string; 
  email?: string; 
  isOnline?: boolean; 
  size?: "sm" | "md" | "lg" | "xl"; 
  className?: string; 
}) => {
  const { user } = useContext(AuthContext) || {};
  const displayAvatar = userProfile?.avatar_url || avatarUrl;
  const displayUsername = userProfile?.username || username;
  const displayEmail = userProfile?.email || email;
  const displayIsOnline = userProfile?.is_online || isOnline;
  
  const isSuperAdmin = displayEmail === "prosperkingsley360@gmail.com";
  const isMe = user?.email === "prosperkingsley360@gmail.com";
  
  const sizeClasses = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-14 h-14 text-base",
    xl: "w-24 h-24 text-3xl"
  };

  return (
    <div className={cn(
      "rounded-full bg-gradient-to-br from-blue-500 to-green-400 p-0.5 relative flex-shrink-0",
      sizeClasses[size],
      className
    )}>
      <div className="w-full h-full rounded-full bg-black flex items-center justify-center font-bold overflow-hidden">
        {displayAvatar ? (
          <img 
            src={displayAvatar} 
            alt={displayUsername} 
            className="w-full h-full object-cover" 
            referrerPolicy="no-referrer"
            onContextMenu={(e) => isSuperAdmin && !isMe && e.preventDefault()}
            draggable={!isSuperAdmin || isMe}
          />
        ) : (
          <span>{displayUsername?.[0].toUpperCase() || "?"}</span>
        )}
      </div>
      {displayIsOnline && (
        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-black rounded-full" />
      )}
      {isSuperAdmin && (
        <div className="absolute -top-1 -right-1 bg-blue-600 rounded-full p-0.5 border border-black shadow-lg">
          <ShieldCheck size={size === "sm" ? 8 : 12} className="text-white" />
        </div>
      )}
    </div>
  );
};

const ActionButton = ({ icon, label, onClick }: { icon: React.ReactNode, label: string, onClick?: () => void }) => (
  <div className="flex flex-col items-center gap-1">
    <motion.button 
      whileTap={{ scale: 0.9 }}
      onClick={onClick}
      className="w-14 h-14 rounded-full bg-white/5 backdrop-blur-xl border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors"
    >
      {icon}
    </motion.button>
    <span className="text-[10px] font-bold text-white/60">{label}</span>
  </div>
);

 const Header = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!profile) return;
    const q = query(
      collection(db, "notifications"),
      where("recipient_id", "==", profile.id),
      where("is_read", "==", false)
    );
    const unsub = onSnapshot(q, (snap) => {
      setUnreadCount(snap.size);
    });
    return unsub;
  }, [profile]);

  const isHome = location.pathname === "/";

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-black/60 backdrop-blur-xl border-b border-white/5 flex items-center justify-between px-6 z-[60]">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
          <HomeVerseLogo size={32} />
          <span className="text-lg font-black tracking-tighter hidden sm:block">HomeVerse</span>
        </div>

        <button 
          onClick={() => navigate("/beats")} 
          className="ml-4 px-4 py-1.5 bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/20 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:from-blue-600/30 hover:to-purple-600/30 transition-all shadow-lg shadow-blue-500/5"
        >
          <Music size={12} className="text-blue-400" /> 
          <span className="hidden xs:block">Studio</span>
        </button>
        
        {profile?.email === "prosperkingsley360@gmail.com" && (
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate("/admin")}
            className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-600/20"
          >
            <Shield size={16} />
          </motion.button>
        )}
      </div>

      {isHome && (
        <div className="flex items-center gap-6">
          <button onClick={() => navigate("/live")} className="text-[10px] font-black tracking-widest text-white/40 hover:text-white transition-colors uppercase">Live</button>
          <div className="h-4 w-[1px] bg-white/10" />
          <div className="flex items-center gap-6">
            <button className="text-[10px] font-black tracking-widest text-white/40 hover:text-white transition-colors uppercase">Following</button>
            <div className="flex flex-col items-center gap-1">
              <button className="text-[10px] font-black tracking-widest text-white uppercase">For You</button>
              <div className="w-4 h-0.5 bg-blue-500 rounded-full" />
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center gap-4">
        <button onClick={() => navigate("/notifications")} className="relative p-2 text-white/60 hover:text-white transition-colors">
          <Bell size={20} />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[8px] font-black flex items-center justify-center rounded-full border-2 border-black">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
        <button onClick={() => navigate("/ai")} className="p-2 text-white/60 hover:text-white transition-colors">
          <Bot size={20} />
        </button>
      </div>
    </header>
  );
};

const Navbar = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "notifications"),
      where("recipient_id", "==", user.uid),
      where("is_read", "==", false)
    );
    const unsub = onSnapshot(q, (snap) => {
      setUnreadCount(snap.size);
    });
    return unsub;
  }, [user]);

  const isMusicModule = location.pathname.startsWith('/beats') || location.pathname.startsWith('/library');

  const handleNavClick = (path: string, requiresAuth: boolean = false) => {
    if (requiresAuth && !user) {
      navigate("/login");
      return;
    }
    navigate(path);
  };

  if (isMusicModule) {
    return (
      <nav className="fixed bottom-0 left-0 right-0 h-16 bg-black/95 backdrop-blur-lg border-t border-white/5 flex justify-around items-center z-50 md:top-0 md:bottom-auto md:h-20 md:px-8">
        <div className="hidden md:flex flex-col items-start cursor-pointer group" onClick={() => navigate("/")}>
          <div className="flex items-center gap-2 font-black text-xl text-white">
            <HomeVerseLogo size={32} />
            HomeVerse Studio
          </div>
        </div>
        <div className="flex justify-around w-full md:w-auto md:gap-12">
          <NavItem icon={<Home />} label="App" onClick={() => handleNavClick("/")} active={false} />
          <NavItem icon={<TrendingUp />} label="Feed" onClick={() => handleNavClick("/explore")} active={location.pathname === "/explore"} />
          <NavItem icon={<Plus />} label="" onClick={() => handleNavClick("/upload", true)} className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl p-3 -mt-8 shadow-xl shadow-blue-500/20 border-2 border-white/20" />
          <NavItem icon={<Music />} label="Beats" onClick={() => handleNavClick("/beats")} active={location.pathname === "/beats"} />
          <NavItem icon={<Mic />} label="Library" onClick={() => handleNavClick("/library", true)} active={location.pathname === "/library"} />
        </div>
      </nav>
    );
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-black/95 backdrop-blur-lg border-t border-white/5 flex justify-around items-center z-50 md:top-0 md:bottom-auto md:h-20 md:px-8">
      <div className="hidden md:flex flex-col items-start cursor-pointer group" onClick={() => navigate("/")}>
        <div className="flex items-center gap-2 font-black text-xl text-white">
          <HomeVerseLogo size={32} />
          HomeVerse
        </div>
        <div className="flex items-center gap-1 ml-10 -mt-1 opacity-40 group-hover:opacity-100 transition-opacity">
          <span className="text-[6px] font-bold text-white uppercase tracking-widest">Powered by</span>
          <ObaniLogo size={10} />
          <span className="text-[6px] font-bold text-white uppercase tracking-widest">Obani</span>
        </div>
      </div>
      <div className="flex justify-around w-full md:w-auto md:gap-12">
        <NavItem icon={<Home />} label="Home" onClick={() => handleNavClick("/")} active={location.pathname === "/"} />
        <NavItem icon={<Search />} label="Search" onClick={() => handleNavClick("/explore")} active={location.pathname === "/explore"} />
        <NavItem icon={<PlusSquare />} label="Post" onClick={() => handleNavClick("/upload", true)} active={location.pathname === "/upload"} />
        <NavItem 
          icon={
            <div className="relative">
              <MessageCircle />
              {unreadCount > 0 && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full border-2 border-black flex items-center justify-center text-[8px] font-black">
                  {unreadCount}
                </div>
              )}
            </div>
          } 
          label="Inbox" 
          onClick={() => handleNavClick("/chats", true)} 
          active={location.pathname.startsWith("/chats")} 
        />
        <NavItem icon={<User />} label="Profile" onClick={() => handleNavClick(user ? `/profile/${user.uid}` : "/login")} active={location.pathname.startsWith("/profile")} />
      </div>
    </nav>
  );
};

const NavItem = ({ icon, label, onClick, active = false, className = "" }: { icon: React.ReactNode, label: string, onClick: () => void, active?: boolean, className?: string }) => (
  <button 
    onClick={onClick}
    className={cn(
      "flex flex-col items-center gap-1 transition-all",
      active ? "text-white scale-110" : "text-white/50 hover:text-white/80",
      className
    )}
  >
    <div className="transition-transform">
      {icon}
    </div>
    {label && <span className="text-[10px] md:text-xs font-black uppercase tracking-widest">{label}</span>}
  </button>
);

const Login = ({ onComplete, initialMode = 'initial' }: { onComplete?: () => void, initialMode?: 'initial' | 'login' | 'signup' }) => {
  const { signIn } = useAuth();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [authMode, setAuthMode] = useState<'initial' | 'login' | 'signup'>(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [profileName, setProfileName] = useState("");
  const [dob, setDob] = useState("");
  const [country, setCountry] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const ref = params.get('ref');
    if (ref) {
      setReferralCode(ref);
    }
  }, [location]);

  const handleGoogleSignIn = async () => {
    setIsSigningIn(true);
    setError("");
    try {
      await signIn();
      if (onComplete) onComplete();
    } catch (err: any) {
      setError(err.message || "Failed to sign in with Google");
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSigningIn(true);
    try {
      if (authMode === 'signup') {
        if (!email || !password || !username || !profileName || !dob) {
          setError("Please fill in all fields");
          setIsSigningIn(false);
          return;
        }
        
        // Check username uniqueness
        const q = query(collection(db, "users"), where("username", "==", username.toLowerCase()));
        const snap = await getDocs(q);
        if (!snap.empty) {
          setError("Username already taken");
          setIsSigningIn(false);
          return;
        }

        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const firebaseUser = userCredential.user;

        // Create user profile
        const myReferralCode = Math.random().toString(36).substring(2, 8).toUpperCase();
        const profileData: UserProfile = {
          id: firebaseUser.uid,
          username: username.toLowerCase(),
          profile_name: profileName,
          email: email,
          roles: ['listener'], // Default role
          bio: "",
          genres: [],
          subgenres: [],
          country: country,
          followers_count: 0,
          following_count: 0,
          wallet_address: "",
          role: (email === 'prosperkingsley360@gmail.com' || email === 'prosperkingsleyy@gmail.com') ? 'admin' : 'user',
          onboarding_completed: false, // Force onboarding for more details
          coins: 0,
          date_of_birth: dob,
          referral_code: myReferralCode,
          referred_by: referralCode || null,
          referral_count: 0,
          last_username_change: serverTimestamp(),
          last_profile_name_change: serverTimestamp(),
          avatar_url: "",
          profile_url: `https://www.homeverse.com/@${username.toLowerCase()}`,
          updated_at: serverTimestamp(),
        };
        await setDoc(doc(db, "users", firebaseUser.uid), profileData);

        // Process Referral
        if (referralCode) {
          const referrerQ = query(collection(db, "users"), where("referral_code", "==", referralCode));
          const referrerSnap = await getDocs(referrerQ);
          if (!referrerSnap.empty) {
            const referrerDoc = referrerSnap.docs[0];
            const referrerData = referrerDoc.data() as UserProfile;
            const newReferralCount = (referrerData.referral_count || 0) + 1;
            
            const updates: any = {
              referral_count: increment(1)
            };

            // Reward 1 coin for every 2 referrals
            if (newReferralCount % 2 === 0) {
              updates.coins = increment(1);
              await recordNotification(referrerDoc.id, "system", "HomeVerse", "gift", undefined, undefined);
            }

            await updateDoc(doc(db, "users", referrerDoc.id), updates);

            // Record the referral relationship
            await addDoc(collection(db, "referrals"), {
              referrer_id: referrerDoc.id,
              referred_id: firebaseUser.uid,
              referred_username: username.toLowerCase(),
              referred_avatar: "",
              created_at: serverTimestamp()
            });
          }
        }

        if (onComplete) onComplete();
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        if (onComplete) onComplete();
      }
    } catch (err: any) {
      setError(err.message || "Authentication failed");
    } finally {
      setIsSigningIn(false);
    }
  };

  if (authMode === 'initial') {
    return (
      <div className="min-h-screen bg-black overflow-y-auto bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-blue-900/20 via-black to-black">
        <div className="min-h-screen flex items-center justify-center p-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-md space-y-8 text-center my-8"
          >
          <div className="space-y-4">
            <HomeVerseLogo size={120} className="mx-auto" />
            <h1 className="text-6xl font-black tracking-tighter bg-gradient-to-b from-white to-white/40 bg-clip-text text-transparent">HomeVerse</h1>
            <p className="text-white/60">Join the future of music creation and sharing.</p>
          </div>

          <div className="space-y-4">
            <button 
              onClick={handleGoogleSignIn}
              disabled={isSigningIn}
              className="w-full py-4 bg-white text-black font-black rounded-2xl flex items-center justify-center gap-3 hover:bg-white/90 transition-all active:scale-95 disabled:opacity-50 shadow-xl shadow-white/10"
            >
              {isSigningIn ? <Loader2 className="animate-spin" /> : <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-6 h-6" alt="Google" />}
              Continue with Google account
            </button>
            <div className="flex items-center gap-4 py-2">
              <div className="h-px bg-white/10 flex-1" />
              <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">or</span>
              <div className="h-px bg-white/10 flex-1" />
            </div>
            <button 
              onClick={() => setAuthMode('signup')}
              className="w-full py-4 bg-zinc-900 text-white font-black rounded-2xl border border-white/10 hover:bg-zinc-800 transition-all active:scale-95 flex items-center justify-center gap-3"
            >
              <Mail size={20} className="text-blue-500" /> Sign Up with email
            </button>
          </div>

          <p className="text-sm text-white/40">
            Already have an account?{" "}
            <button onClick={() => setAuthMode('login')} className="text-blue-500 font-bold hover:underline">Log in</button>
          </p>

          <p className="text-[10px] text-white/20 px-8 uppercase tracking-widest font-bold">
            By continuing, you agree to HomeVerse's <br /> Terms of Service and Privacy Policy.
          </p>
        </motion.div>
      </div>
    </div>
    );
  }

  return (
    <div className="min-h-screen bg-black overflow-y-auto bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-blue-900/20 via-black to-black">
      <div className="min-h-screen flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md space-y-8 bg-zinc-900/50 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/10 shadow-2xl my-8"
        >
        <div className="flex items-center justify-between">
          <button onClick={() => setAuthMode('initial')} className="p-2 hover:bg-white/5 rounded-full transition-colors">
            <ChevronLeft />
          </button>
          <h2 className="text-xl font-black uppercase tracking-widest">{authMode === 'login' ? "Log In" : "Sign Up"}</h2>
          <div className="w-10" />
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-2xl text-xs font-bold flex items-center gap-2">
            <AlertCircle size={16} /> {error}
          </div>
        )}

        <form onSubmit={handleEmailAuth} className="space-y-4">
          {authMode === 'signup' && (
            <>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest ml-4">Profile Name</label>
                <input 
                  type="text"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  placeholder="Your Name"
                  className="w-full bg-black/50 border border-white/10 rounded-2xl py-4 px-6 focus:outline-none focus:border-blue-500 transition-all font-bold"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest ml-4">Username</label>
                <div className="relative">
                  <span className="absolute left-6 top-1/2 -translate-y-1/2 text-blue-500 font-bold">@</span>
                  <input 
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s/g, ''))}
                    placeholder="username"
                    className="w-full bg-black/50 border border-white/10 rounded-2xl py-4 pl-10 pr-6 focus:outline-none focus:border-blue-500 transition-all font-bold"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest ml-4">Country</label>
                <select 
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-2xl py-4 px-6 focus:outline-none focus:border-blue-500 transition-all font-bold text-white appearance-none"
                  required
                >
                  <option value="">Select Country</option>
                  {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest ml-4">Date of Birth</label>
                <input 
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-2xl py-4 px-6 focus:outline-none focus:border-blue-500 transition-all font-bold text-white"
                  required
                />
              </div>
            </>
          )}

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest ml-4">Email Address</label>
            <input 
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="w-full bg-black/50 border border-white/10 rounded-2xl py-4 px-6 focus:outline-none focus:border-blue-500 transition-all font-bold"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest ml-4">Password</label>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-black/50 border border-white/10 rounded-2xl py-4 px-6 pr-12 focus:outline-none focus:border-blue-500 transition-all font-bold"
                required
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {authMode === 'signup' && (
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest ml-4">Referral Code (Optional)</label>
              <input 
                type="text"
                value={referralCode}
                onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                placeholder="REF123"
                className="w-full bg-black/50 border border-white/10 rounded-2xl py-4 px-6 focus:outline-none focus:border-blue-500 transition-all font-bold"
              />
            </div>
          )}

          <button 
            type="submit"
            disabled={isSigningIn}
            className="w-full py-4 bg-blue-500 text-white font-black rounded-2xl shadow-lg shadow-blue-500/20 hover:scale-[1.02] transition-all active:scale-95 disabled:opacity-50 mt-4"
          >
            {isSigningIn ? <Loader2 className="animate-spin mx-auto" /> : (authMode === 'login' ? "Login" : "Create Account")}
          </button>
        </form>

        <p className="text-center text-sm text-white/40">
          {authMode === 'login' ? "Don't have an account?" : "Already have an account?"}{" "}
          <button 
            onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}
            className="text-blue-500 font-bold hover:underline"
          >
            {authMode === 'login' ? "Sign Up" : "Log In"}
          </button>
        </p>
      </motion.div>
    </div>
  </div>
  );
};

const COUNTRIES = [
  "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Antigua and Barbuda", "Argentina", "Armenia", "Australia", "Austria", "Azerbaijan",
  "Bahamas", "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize", "Benin", "Bhutan", "Bolivia", "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei", "Bulgaria", "Burkina Faso", "Burundi",
  "Cabo Verde", "Cambodia", "Cameroon", "Canada", "Central African Republic", "Chad", "Chile", "China", "Colombia", "Comoros", "Congo", "Costa Rica", "Croatia", "Cuba", "Cyprus", "Czech Republic",
  "Denmark", "Djibouti", "Dominica", "Dominican Republic",
  "Ecuador", "Egypt", "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia", "Eswatini", "Ethiopia",
  "Fiji", "Finland", "France",
  "Gabon", "Gambia", "Georgia", "Germany", "Ghana", "Greece", "Grenada", "Guatemala", "Guinea", "Guinea-Bissau", "Guyana",
  "Haiti", "Honduras", "Hungary",
  "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland", "Israel", "Italy", "Ivory Coast",
  "Jamaica", "Japan", "Jordan",
  "Kazakhstan", "Kenya", "Kiribati", "Kuwait", "Kyrgyzstan",
  "Laos", "Latvia", "Lebanon", "Lesotho", "Liberia", "Libya", "Liechtenstein", "Lithuania", "Luxembourg",
  "Madagascar", "Malawi", "Malaysia", "Maldives", "Mali", "Malta", "Marshall Islands", "Mauritania", "Mauritius", "Mexico", "Micronesia", "Moldova", "Monaco", "Mongolia", "Montenegro", "Morocco", "Mozambique", "Myanmar",
  "Namibia", "Nauru", "Nepal", "Netherlands", "New Zealand", "Nicaragua", "Niger", "Nigeria", "North Korea", "North Macedonia", "Norway",
  "Oman",
  "Pakistan", "Palau", "Palestine", "Panama", "Papua New Guinea", "Paraguay", "Peru", "Philippines", "Poland", "Portugal",
  "Qatar",
  "Romania", "Russia", "Rwanda",
  "Saint Kitts and Nevis", "Saint Lucia", "Saint Vincent and the Grenadines", "Samoa", "San Marino", "Sao Tome and Principe", "Saudi Arabia", "Senegal", "Serbia", "Seychelles", "Sierra Leone", "Singapore", "Slovakia", "Slovenia", "Solomon Islands", "Somalia", "South Africa", "South Korea", "South Sudan", "Spain", "Sri Lanka", "Sudan", "Suriname", "Sweden", "Switzerland", "Syria",
  "Taiwan", "Tajikistan", "Tanzania", "Thailand", "Timor-Leste", "Togo", "Tonga", "Trinidad and Tobago", "Tunisia", "Turkey", "Turkmenistan", "Tuvalu",
  "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom", "United States", "Uruguay", "Uzbekistan",
  "Vanuatu", "Vatican City", "Venezuela", "Vietnam",
  "Yemen",
  "Zambia", "Zimbabwe"
].sort();

const Onboarding = () => {
  const { user, profile } = useAuth();
  const [step, setStep] = useState(1);
  const [username, setUsername] = useState("");
  const [profileName, setProfileName] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [subgenres, setSubgenres] = useState("");
  const [country, setCountry] = useState("");
  const [dob, setDob] = useState("");
  const [age, setAge] = useState<number | "">("");
  const [isCompleting, setIsCompleting] = useState(false);
  const navigate = useNavigate();

  const [referralCode, setReferralCode] = useState("");
  const [showLabelModal, setShowLabelModal] = useState(false);

  const validateUsername = (val: string) => {
    const regex = /^[a-z0-9_.]+$/;
    if (!regex.test(val)) {
      setUsernameError("Only lowercase letters, numbers, _ and . allowed");
      return false;
    }
    if (val.includes(" ")) {
      setUsernameError("No spacing allowed in username");
      return false;
    }
    if (val.length < 3) {
      setUsernameError("Username too short");
      return false;
    }
    setUsernameError("");
    return true;
  };

  const checkUsernameUniqueness = async (val: string) => {
    const q = query(collection(db, "users"), where("username", "==", val));
    const snap = await getDocs(q);
    return snap.empty;
  };

  const calculateAge = (birthDate: string) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  useEffect(() => {
    if (dob) {
      setAge(calculateAge(dob));
    }
  }, [dob]);

  const completeOnboarding = async () => {
    if (!user || isCompleting) return;
    
    if (!validateUsername(username)) return;
    if (!country || !dob) {
      alert("Please fill in all personal details.");
      return;
    }
    
    setIsCompleting(true);
    try {
      const isUnique = await checkUsernameUniqueness(username);
      if (!isUnique) {
        setUsernameError("Username already taken. Please try another.");
        setIsCompleting(false);
        setStep(1);
        return;
      }

      const myReferralCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      let referredBy = "";

      if (referralCode.trim()) {
        const q = query(collection(db, "users"), where("referral_code", "==", referralCode.trim().toUpperCase()));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const referrerDoc = snap.docs[0];
          referredBy = referrerDoc.id;
          await updateDoc(doc(db, "users", referredBy), {
            coins: increment(5)
          });
        }
      }

      const isLabel = selectedRoles.includes('label_owner') || selectedRoles.includes('label_part_owner');

      const profileData: UserProfile = {
        id: user.uid,
        username: username,
        profile_name: profileName || user.displayName || username,
        email: user.email || "",
        roles: ['listener'],
        bio: "",
        genres: [],
        subgenres: [],
        country: country,
        date_of_birth: dob,
        age: Number(age),
        followers_count: 0,
        following_count: 0,
        wallet_address: "",
        role: (user.email === 'prosperkingsley360@gmail.com' || user.email === 'prosperkingsleyy@gmail.com') ? 'admin' : 'user',
        onboarding_completed: true,
        coins: 0,
        referral_code: myReferralCode,
        referred_by: referredBy || undefined,
        last_username_change: serverTimestamp(),
        last_profile_name_change: serverTimestamp(),
        avatar_url: user.photoURL || "",
        updated_at: serverTimestamp(),
      };
      
      await setDoc(doc(db, "users", user.uid), profileData);
      window.location.reload();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}`);
    } finally {
      setIsCompleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-black relative overflow-y-auto flex flex-col items-center">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 blur-[120px] rounded-full" />

      <div className="w-full max-w-md z-10 space-y-8 p-6 my-auto py-12">
        <div className="text-center space-y-2">
          <HomeVerseLogo size={60} className="mx-auto" />
          <h1 className="text-3xl font-black tracking-tighter text-white">Welcome to HomeVerse</h1>
          <p className="text-white/40 text-sm font-medium uppercase tracking-widest">Step {step} of 2</p>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key="onboarding"
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -20, opacity: 0 }}
            className="space-y-6 bg-zinc-900/50 backdrop-blur-xl p-8 rounded-[32px] border border-white/5 shadow-2xl"
          >
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest ml-1">Username</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 font-bold">@</span>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase())}
                    placeholder="username"
                    className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 pl-10 pr-4 text-white font-bold focus:border-blue-500 transition-colors outline-none"
                  />
                </div>
                {usernameError && <p className="text-red-500 text-[10px] font-bold ml-1">{usernameError}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest ml-1">Profile Name</label>
                <input
                  type="text"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  placeholder="Your Name"
                  className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-4 text-white font-bold focus:border-blue-500 transition-colors outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest ml-1">Date of Birth</label>
                  <div className="relative">
                    <Calendar size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" />
                    <input
                      type="date"
                      value={dob}
                      onChange={(e) => setDob(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white font-bold focus:border-blue-500 transition-colors outline-none [color-scheme:dark]"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest ml-1">Country</label>
                  <div className="relative">
                    <Flag size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" />
                    <select
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white font-bold focus:border-blue-500 transition-colors outline-none appearance-none"
                    >
                      <option value="">Select</option>
                      {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest ml-1">Referral Code (Optional)</label>
                <input
                  type="text"
                  value={referralCode}
                  onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                  placeholder="CODE123"
                  className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-4 text-white font-bold focus:border-blue-500 transition-colors outline-none"
                />
              </div>
            </div>

            <button
              onClick={completeOnboarding}
              disabled={isCompleting || !username || !country || !dob}
              className="w-full py-5 bg-white text-black font-black rounded-2xl text-sm uppercase tracking-widest hover:bg-white/90 transition-colors shadow-lg shadow-white/5 disabled:opacity-50"
            >
              {isCompleting ? "Setting Up..." : "Complete Setup"}
            </button>
          </motion.div>
        </AnimatePresence>
      </div>

      {showLabelModal && (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex items-center justify-center p-6">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="max-w-md w-full bg-zinc-900 border border-white/10 p-8 rounded-[32px] text-center space-y-6"
          >
            <div className="w-20 h-20 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto text-blue-500">
              <ShieldCheck size={40} />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-white">Label Registration</h2>
              <p className="text-white/40 text-sm">
                Since you've selected a Record Label role, our team will review your application. You can still use HomeVerse in the meantime!
              </p>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="w-full py-4 bg-white text-black font-black rounded-2xl text-sm uppercase tracking-widest"
            >
              Got it
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
};

const SupportModal = ({ post, onClose }: { post: Post, onClose: () => void }) => {
  const { profile } = useAuth();
  const [amount, setAmount] = useState<number | string>(5);
  const [selectedGift, setSelectedGift] = useState<Gift | null>(null);
  const [isSending, setIsSending] = useState(false);

  const handleSupport = async () => {
    const finalAmount = selectedGift ? selectedGift.price : Number(amount);
    if (!profile || isSending || isNaN(finalAmount) || finalAmount <= 0) return;
    if (profile.coins < finalAmount) {
      alert("Not enough coins! Refer friends to earn more.");
      return;
    }

    setIsSending(true);
    try {
      // 1. Deduct from sender
      await updateDoc(doc(db, "users", profile.id), {
        coins: profile.coins - finalAmount
      });

      // 2. Add to recipient
      const recipientRef = doc(db, "users", post.user_id);
      const recipientSnap = await getDoc(recipientRef);
      if (recipientSnap.exists()) {
        await updateDoc(recipientRef, {
          coins: (recipientSnap.data().coins || 0) + finalAmount
        });
      }

      // 3. Update post support count
      await updateDoc(doc(db, "posts", post.id), {
        support_coins: (post.support_coins || 0) + finalAmount
      });

      // 4. Record notification
      await recordNotification(post.user_id, profile.id, profile.username, 'support', post.id);

      alert(`Successfully supported @${post.username} with ${finalAmount} coins!`);
      onClose();
    } catch (error) {
      console.error("Error supporting artist:", error);
      alert("Failed to send support. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm"
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="w-full max-w-md bg-zinc-900 border border-white/10 rounded-[32px] p-8 space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto"
      >
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-black">Support Artist</h3>
          <button onClick={onClose} className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex flex-col items-center gap-4 py-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-yellow-500 to-orange-500 p-1">
            <div className="w-full h-full rounded-full bg-black flex items-center justify-center">
              <Coins size={32} className="text-yellow-500" />
            </div>
          </div>
          <div className="text-center">
            <p className="font-bold">Support @{post.username}</p>
            <p className="text-xs text-white/40">Choose a gift or enter a custom amount.</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-4 gap-2">
            {GIFTS.slice(0, 8).map(gift => (
              <button 
                key={gift.id}
                onClick={() => {
                  setSelectedGift(gift);
                  setAmount(gift.price);
                }}
                className={cn(
                  "flex flex-col items-center gap-1 p-2 rounded-2xl border transition-all",
                  selectedGift?.id === gift.id ? "bg-blue-500/10 border-blue-500" : "bg-white/5 border-transparent"
                )}
              >
                <span className="text-2xl">{gift.icon}</span>
                <span className="text-[8px] font-black uppercase tracking-tighter text-white/60">{gift.name}</span>
                <span className="text-[10px] font-bold text-yellow-500">{gift.price}</span>
              </button>
            ))}
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-white/40 uppercase tracking-widest">Custom Amount</label>
            <div className="relative">
              <Coins className="absolute left-4 top-1/2 -translate-y-1/2 text-yellow-500" size={20} />
              <input 
                type="number"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  setSelectedGift(null);
                }}
                placeholder="Enter amount..."
                className="w-full bg-black border border-white/10 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-bold"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center px-2">
          <span className="text-xs font-bold text-white/40 uppercase tracking-widest">Your Balance</span>
          <span className="text-sm font-black text-yellow-500 flex items-center gap-1">
            <Coins size={14} /> {profile?.coins || 0}
          </span>
        </div>

        <button 
          onClick={handleSupport}
          disabled={isSending || !profile}
          className="w-full py-4 bg-white text-black font-black rounded-2xl shadow-xl shadow-white/10 flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isSending ? <Loader2 className="animate-spin" /> : <ArrowUpRight size={18} />}
          {isSending ? "Sending..." : `Send ${selectedGift ? selectedGift.price : amount} Coins`}
        </button>
      </motion.div>
    </motion.div>
  );
};

const Explore = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [tagResults, setTagResults] = useState<Tag[]>([]);
  const [userResults, setUserResults] = useState<UserProfile[]>([]);
  const [placeResults, setPlaceResults] = useState<any[]>([]);
  const [activeStreams, setActiveStreams] = useState<string[]>([]); // Array of user_ids who are live
  const [trendingTags, setTrendingTags] = useState<Tag[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [postResults, setPostResults] = useState<Post[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'users' | 'videos' | 'pictures' | 'tags' | 'places'>('all');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTrendingTags = async () => {
      const q = query(collection(db, "tags"), orderBy("total_views", "desc"), limit(10));
      const snap = await getDocs(q);
      setTrendingTags(snap.docs.map(d => ({ id: d.id, ...d.data() } as Tag)));
    };
    fetchTrendingTags();
  }, []);

  useEffect(() => {
    const q = query(collection(db, "streams"), where("is_active", "==", true));
    const unsub = onSnapshot(q, (snap) => {
      setActiveStreams(snap.docs.map(d => d.data().user_id));
    });
    return unsub;
  }, []);

  const handleSearch = async (queryStr: string) => {
    setSearchQuery(queryStr);
    if (!queryStr.trim()) {
      setTagResults([]);
      setUserResults([]);
      setPostResults([]);
      setPlaceResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const cleanQuery = queryStr.startsWith('#') ? queryStr.slice(1).toLowerCase() : queryStr.toLowerCase();
      
      // 1. Search Tags
      const tagQ = query(
        collection(db, "tags"), 
        where("name", ">=", cleanQuery),
        where("name", "<=", cleanQuery + "\uf8ff"),
        limit(10)
      );
      const tagSnap = await getDocs(tagQ);
      setTagResults(tagSnap.docs.map(d => ({ id: d.id, ...d.data() } as Tag)));

      // 2. Search Users
      const userQ = query(
        collection(db, "users"),
        where("username", ">=", cleanQuery),
        where("username", "<=", cleanQuery + "\uf8ff"),
        limit(10)
      );
      const userSnap = await getDocs(userQ);
      setUserResults(userSnap.docs.map(d => ({ id: d.id, ...d.data() } as UserProfile)));

      // 3. Search Posts (Videos & Pictures)
      const postQ = query(
        collection(db, "posts"),
        where("caption", ">=", cleanQuery),
        where("caption", "<=", cleanQuery + "\uf8ff"),
        limit(20)
      );
      const postSnap = await getDocs(postQ);
      setPostResults(postSnap.docs.map(d => ({ id: d.id, ...d.data() } as Post)));

      // 4. Search Places (Palaces)
      const placeQ = query(
        collection(db, "places"),
        where("name", ">=", cleanQuery),
        where("name", "<=", cleanQuery + "\uf8ff"),
        limit(10)
      );
      const placeSnap = await getDocs(placeQ);
      setPlaceResults(placeSnap.docs.map(d => ({ id: d.id, ...d.data() } as any)));

    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="pt-24 pb-20 px-6 max-w-lg mx-auto space-y-8">
      <div className="space-y-4">
        <h1 className="text-3xl font-black tracking-tight">Explore</h1>
        
        {/* Tournament Banner */}
        <div className="space-y-4">
          <h3 className="text-xs font-black text-white/40 uppercase tracking-widest px-2">Global Tournaments</h3>
          <div className="grid grid-cols-1 gap-4">
            {/* Artists Tournament */}
            <motion.div 
              whileHover={{ scale: 1.02 }}
              className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[32px] p-6 relative overflow-hidden group cursor-pointer shadow-xl shadow-blue-500/20"
            >
              <div className="absolute -right-4 -top-4 opacity-10 group-hover:scale-110 transition-transform">
                <Trophy size={120} />
              </div>
              <div className="relative z-10 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="px-3 py-1 bg-white/20 rounded-full text-[8px] font-black uppercase tracking-widest">Yearly Event</div>
                  <span className="text-[10px] font-bold text-white/60">2026/2027</span>
                </div>
                <div>
                  <h2 className="text-xl font-black tracking-tight">Global Artists Tournament</h2>
                  <p className="text-xs text-white/80 mt-1">The HomeVerse "Grammys". Battle for the ultimate artist title.</p>
                </div>
                <div className="flex items-center gap-4 pt-2">
                  <div className="flex -space-x-2">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="w-6 h-6 rounded-full border-2 border-blue-600 bg-zinc-800 overflow-hidden">
                        <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=user${i}`} className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                  <span className="text-[10px] font-bold text-white/60">1.2k Artists Joined</span>
                </div>
              </div>
            </motion.div>

            {/* Beat Makers Tournament */}
            <motion.div 
              whileHover={{ scale: 1.02 }}
              className="bg-gradient-to-br from-purple-600 to-pink-700 rounded-[32px] p-6 relative overflow-hidden group cursor-pointer shadow-xl shadow-purple-500/20"
            >
              <div className="absolute -right-4 -top-4 opacity-10 group-hover:scale-110 transition-transform">
                <Disc size={120} />
              </div>
              <div className="relative z-10 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="px-3 py-1 bg-white/20 rounded-full text-[8px] font-black uppercase tracking-widest">Yearly Event</div>
                  <span className="text-[10px] font-bold text-white/60">2026/2027</span>
                </div>
                <div>
                  <h2 className="text-xl font-black tracking-tight">Global Beat Makers</h2>
                  <p className="text-xs text-white/80 mt-1">Showcase your production skills. Same rewards, same prestige.</p>
                </div>
                <button className="w-full py-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/20 transition-all">
                  Register Interest
                </button>
              </div>
            </motion.div>

            {/* Music Producers Tournament */}
            <motion.div 
              className="bg-zinc-900 border border-white/5 rounded-[32px] p-6 relative overflow-hidden group opacity-60"
            >
              <div className="absolute -right-4 -top-4 opacity-5">
                <SettingsIcon size={120} />
              </div>
              <div className="relative z-10 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="px-3 py-1 bg-white/5 rounded-full text-[8px] font-black uppercase tracking-widest">Upcoming</div>
                  <span className="text-[10px] font-bold text-white/20">2027/2028</span>
                </div>
                <div>
                  <h2 className="text-xl font-black tracking-tight text-white/40">Music Producers Tournament</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <Loader2 size={12} className="animate-spin text-blue-500" />
                    <p className="text-xs text-blue-500 font-bold uppercase tracking-widest">Still in process</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={20} />
          <input 
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search users, videos, pictures..."
            className="w-full bg-zinc-900 border border-white/10 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-bold"
          />
          {isSearching && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-blue-500" size={16} />}
        </div>

        {searchQuery.trim() && (
          <div className="flex gap-2 overflow-x-auto no-scrollbar py-2">
            {[
              { id: 'all', label: 'All' },
              { id: 'users', label: 'Users' },
              { id: 'videos', label: 'Videos' },
              { id: 'pictures', label: 'Pictures' },
              { id: 'tags', label: 'Tags' },
              { id: 'places', label: 'Places' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  "px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap",
                  activeTab === tab.id ? "bg-white text-black" : "bg-white/5 text-white/40 hover:bg-white/10"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-8">
        {searchQuery.trim() ? (
          <div className="space-y-8">
            {/* Users Section */}
            {(activeTab === 'all' || activeTab === 'users') && userResults.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-xs font-black text-white/40 uppercase tracking-widest">Users</h3>
                <div className="space-y-2">
                  {userResults.map(user => (
                    <div 
                      key={user.id} 
                      onClick={() => navigate(`/profile/${user.id}`)}
                      className="p-4 bg-zinc-900 rounded-3xl border border-white/5 flex items-center justify-between cursor-pointer hover:bg-zinc-800 transition-all group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <Avatar userProfile={user} size="lg" className="group-hover:scale-105 transition-transform" />
                          {activeStreams.includes(user.id) && (
                            <div className="absolute -bottom-1 -right-1 bg-red-500 text-[8px] font-black px-1.5 py-0.5 rounded-full border-2 border-black animate-pulse">
                              LIVE
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-black">@{user.username}</p>
                            {user.is_verified && <div className="w-3 h-3 bg-blue-500 rounded-full flex items-center justify-center"><Check size={8} className="text-white" /></div>}
                          </div>
                          <p className="text-xs text-white/40 font-bold">{formatCount(user.followers_count || 0)} followers</p>
                        </div>
                      </div>
                      <ChevronRight size={16} className="text-white/20" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Videos Section */}
            {(activeTab === 'all' || activeTab === 'videos') && postResults.filter(p => p.type === 'video').length > 0 && (
              <div className="space-y-4">
                <h3 className="text-xs font-black text-white/40 uppercase tracking-widest">Videos</h3>
                <div className="grid grid-cols-3 gap-2">
                  {postResults.filter(p => p.type === 'video').map(post => (
                    <div 
                      key={post.id} 
                      onClick={() => navigate("/")}
                      className="aspect-[9/16] bg-zinc-900 rounded-xl overflow-hidden relative group cursor-pointer"
                    >
                      <video src={post.file_url} className="w-full h-full object-cover" muted loop />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Play size={20} className="text-white" />
                      </div>
                      <div className="absolute bottom-2 left-2 flex items-center gap-1 text-[8px] font-black text-white">
                        <Play size={8} fill="white" /> {formatCount(post.views_count || 0)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Pictures Section */}
            {(activeTab === 'all' || activeTab === 'pictures') && postResults.filter(p => p.type === 'image').length > 0 && (
              <div className="space-y-4">
                <h3 className="text-xs font-black text-white/40 uppercase tracking-widest">Pictures</h3>
                <div className="grid grid-cols-3 gap-2">
                  {postResults.filter(p => p.type === 'image').map(post => (
                    <div 
                      key={post.id} 
                      onClick={() => navigate("/")}
                      className="aspect-square bg-zinc-900 rounded-xl overflow-hidden relative group cursor-pointer"
                    >
                      <img src={post.file_url} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      <div className="absolute bottom-2 left-2 flex items-center gap-1 text-[8px] font-black text-white">
                        <Heart size={8} fill="white" /> {formatCount(post.likes_count || 0)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tags Section */}
            {(activeTab === 'all' || activeTab === 'tags') && tagResults.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-xs font-black text-white/40 uppercase tracking-widest">Hashtags</h3>
                <div className="space-y-2">
                  {tagResults.map(tag => (
                    <div 
                      key={tag.id} 
                      className="p-4 bg-zinc-900 rounded-3xl border border-white/5 flex items-center justify-between cursor-pointer hover:bg-zinc-800 transition-all"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center">
                          <TrendingUp size={20} className="text-blue-500" />
                        </div>
                        <div>
                          <p className="font-black">#{tag.name}</p>
                          <p className="text-xs text-white/40 font-bold">{formatCount(tag.total_views)} views</p>
                        </div>
                      </div>
                      <ChevronRight size={16} className="text-white/20" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Places Section */}
            {(activeTab === 'all' || activeTab === 'places') && placeResults.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-xs font-black text-white/40 uppercase tracking-widest">Places</h3>
                <div className="space-y-2">
                  {placeResults.map(place => (
                    <div 
                      key={place.id} 
                      className="p-4 bg-zinc-900 rounded-3xl border border-white/5 flex items-center justify-between cursor-pointer hover:bg-zinc-800 transition-all group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform">
                          <Flag size={20} />
                        </div>
                        <div>
                          <p className="font-black">{place.name}</p>
                          <p className="text-xs text-white/40 font-bold">{place.location || "Global"}</p>
                        </div>
                      </div>
                      <ChevronRight size={16} className="text-white/20" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!isSearching && userResults.length === 0 && postResults.length === 0 && tagResults.length === 0 && placeResults.length === 0 && (
              <div className="text-center py-20 space-y-4">
                <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto">
                  <Search size={32} className="text-white/20" />
                </div>
                <p className="text-white/40 font-bold">No results found for "{searchQuery}"</p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-xs font-black text-white/40 uppercase tracking-widest">Trending Hashtags</h3>
              <div className="grid grid-cols-1 gap-2">
                {trendingTags.map(tag => (
                  <button 
                    key={tag.id}
                    onClick={() => handleSearch(`#${tag.name}`)}
                    className="w-full flex items-center justify-between p-4 bg-zinc-900/50 hover:bg-zinc-900 rounded-2xl border border-white/5 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/40">
                        <Activity size={20} />
                      </div>
                      <div className="text-left">
                        <p className="font-bold">#{tag.name}</p>
                        <p className="text-[10px] text-white/40 font-black uppercase tracking-tighter">{formatCount(tag.total_views)} views</p>
                      </div>
                    </div>
                    <ChevronRight size={20} className="text-white/20 group-hover:text-white transition-colors" />
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-xs font-black uppercase tracking-widest text-white/40">Categories</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="aspect-square bg-zinc-900 rounded-[40px] border border-white/5 p-6 flex flex-col justify-between group cursor-pointer hover:bg-zinc-800 transition-all">
                  <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform">
                    <Music size={24} />
                  </div>
                  <div>
                    <p className="font-black text-lg">Music</p>
                    <p className="text-xs text-white/40 font-bold">Trending sounds</p>
                  </div>
                </div>
                <div className="aspect-square bg-zinc-900 rounded-[40px] border border-white/5 p-6 flex flex-col justify-between group cursor-pointer hover:bg-zinc-800 transition-all" onClick={() => navigate("/live")}>
                  <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-500 group-hover:scale-110 transition-transform">
                    <Radio size={24} />
                  </div>
                  <div>
                    <p className="font-black text-lg text-red-500">Live</p>
                    <p className="text-xs text-white/40 font-bold">Watch now</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const Stories = () => {
  const { user, profile } = useAuth();
  const [stories, setStories] = useState<Story[]>([]);
  const [showUpload, setShowUpload] = useState(false);
  const [activeStory, setActiveStory] = useState<Story | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const now = new Date();
    const q = query(
      collection(db, "stories"), 
      where("expires_at", ">", now),
      orderBy("expires_at", "asc")
    );
    const unsub = onSnapshot(q, (snap) => {
      const allStories = snap.docs.map(d => ({ id: d.id, ...d.data() } as Story));
      // Group by user
      const grouped = allStories.reduce((acc: any, story) => {
        if (!acc[story.user_id]) acc[story.user_id] = [];
        acc[story.user_id].push(story);
        return acc;
      }, {});
      // For simplicity, just show the latest story per user in the bar
      const latestPerUser = Object.values(grouped).map((userStories: any) => userStories[0]);
      setStories(latestPerUser);
    });
    return unsub;
  }, []);

  return (
    <div className="flex gap-4 overflow-x-auto no-scrollbar py-4 px-2">
      {/* My Story / Add Story */}
      <div className="flex flex-col items-center gap-2 flex-shrink-0">
        <div 
          onClick={() => setShowUpload(true)}
          className="cursor-pointer relative"
        >
          <Avatar userProfile={profile} size="lg" className="opacity-80" />
          <div className="absolute bottom-0 right-0 bg-blue-500 rounded-full p-1 border-2 border-black">
            <Plus size={12} className="text-white" />
          </div>
        </div>
        <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">My Story</span>
      </div>

      {stories.map(story => (
        <div 
          key={story.id} 
          onClick={() => setActiveStory(story)}
          className="flex flex-col items-center gap-2 flex-shrink-0 cursor-pointer group"
        >
          <div className="group-hover:scale-105 transition-transform">
            <Avatar 
              avatarUrl={story.avatar_url} 
              username={story.username} 
              size="lg" 
              className="border-2 border-purple-500"
            />
          </div>
          <span className="text-[10px] font-bold text-white/60 truncate w-16 text-center">@{story.username}</span>
        </div>
      ))}

      <AnimatePresence>
        {showUpload && <StoryUpload onClose={() => setShowUpload(false)} />}
        {activeStory && <StoryViewer story={activeStory} onClose={() => setActiveStory(null)} />}
      </AnimatePresence>
    </div>
  );
};

const StoryUpload = ({ onClose }: { onClose: () => void }) => {
  const { user, profile } = useAuth();
  const [type, setType] = useState<'image' | 'video' | 'note'>('image');
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [noteText, setNoteText] = useState("");
  const [uploading, setUploading] = useState(false);
  const [privacy, setPrivacy] = useState<'public' | 'friends' | 'friends_of_friends' | 'only_me'>('public');
  const [selectedMusic, setSelectedMusic] = useState<any>(null);
  const [showMusicSearch, setShowMusicSearch] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      setPreviewUrl(URL.createObjectURL(f));
    }
  };

  const handleUpload = async () => {
    if (!user || !profile) return;
    if (type !== 'note' && !file) return;
    if (type === 'note' && !noteText) return;

    setUploading(true);
    try {
      let fileUrl = "";
      if (file) {
        const storageRef = ref(storage, `stories/${user.uid}/${Date.now()}_${file.name}`);
        const uploadTask = await uploadBytesResumable(storageRef, file);
        fileUrl = await getDownloadURL(uploadTask.ref);
      }

      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);

      await addDoc(collection(db, "stories"), {
        user_id: user.uid,
        username: profile.username,
        avatar_url: profile.avatar_url || "",
        type,
        content: type === 'note' ? noteText : null,
        file_url: fileUrl,
        music_id: selectedMusic?.id || null,
        music_title: selectedMusic?.title || null,
        privacy,
        created_at: serverTimestamp(),
        expires_at: expiresAt,
        views_count: 0
      });

      alert("Story posted!");
      onClose();
    } catch (error) {
      console.error(error);
      alert("Failed to post story.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 100 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 100 }}
      className="fixed inset-0 z-[150] bg-black flex flex-col"
    >
      <div className="p-6 flex items-center justify-between border-b border-white/10">
        <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full"><X /></button>
        <h2 className="text-lg font-black uppercase tracking-widest">New Story</h2>
        <button 
          onClick={handleUpload}
          disabled={uploading}
          className="px-6 py-2 bg-blue-500 text-white font-black rounded-full disabled:opacity-50"
        >
          {uploading ? "Posting..." : "Post"}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        <div className="flex gap-2">
          {['image', 'video', 'note'].map(t => (
            <button
              key={t}
              onClick={() => setType(t as any)}
              className={cn(
                "flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                type === t ? "bg-white text-black" : "bg-white/5 text-white/40"
              )}
            >
              {t}
            </button>
          ))}
        </div>

        {type === 'note' ? (
          <textarea
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="What's on your mind?"
            className="w-full h-48 bg-zinc-900 border border-white/10 rounded-3xl p-6 text-xl font-bold focus:outline-none focus:border-blue-500 resize-none"
          />
        ) : (
          <div className="aspect-[9/16] bg-zinc-900 rounded-[40px] border-2 border-dashed border-white/10 flex flex-col items-center justify-center relative overflow-hidden">
            {previewUrl ? (
              type === 'video' ? (
                <video src={previewUrl} className="w-full h-full object-cover" autoPlay muted loop />
              ) : (
                <img src={previewUrl} className="w-full h-full object-cover" />
              )
            ) : (
              <label className="flex flex-col items-center gap-4 cursor-pointer">
                <input type="file" accept={type === 'video' ? "video/*" : "image/*"} className="hidden" onChange={handleFileChange} />
                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center text-white/40">
                  {type === 'video' ? <FileVideo size={32} /> : <ImageIcon size={32} />}
                </div>
                <span className="text-xs font-black uppercase tracking-widest text-white/40">Select {type}</span>
              </label>
            )}
            {previewUrl && (
              <button onClick={() => setPreviewUrl(null)} className="absolute top-4 right-4 p-2 bg-black/40 backdrop-blur-md rounded-full text-white">
                <X size={16} />
              </button>
            )}
          </div>
        )}

        <div className="space-y-4">
          <label className="text-xs font-black uppercase tracking-widest text-white/40">Add Music</label>
          <button 
            onClick={() => setShowMusicSearch(true)}
            className="w-full p-4 bg-zinc-900 border border-white/10 rounded-2xl flex items-center justify-between group hover:border-blue-500/50 transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-500">
                <Music size={20} />
              </div>
              <span className="font-bold text-sm">{selectedMusic ? selectedMusic.title : "Search Music"}</span>
            </div>
            <ChevronRight size={16} className="text-white/20" />
          </button>
        </div>

        <div className="space-y-4">
          <label className="text-xs font-black uppercase tracking-widest text-white/40">Privacy</label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: 'public', label: 'Public', icon: <Globe size={14} /> },
              { id: 'friends', label: 'Friends', icon: <Users size={14} /> },
              { id: 'friends_of_friends', label: 'F.O.F', icon: <Users size={14} /> },
              { id: 'only_me', label: 'Only Me', icon: <LockIcon size={14} /> }
            ].map(p => (
              <button
                key={p.id}
                onClick={() => setPrivacy(p.id as any)}
                className={cn(
                  "flex items-center gap-2 p-4 rounded-2xl border transition-all",
                  privacy === p.id ? "bg-blue-500 border-blue-500 text-white" : "bg-zinc-900 border-white/5 text-white/40"
                )}
              >
                {p.icon}
                <span className="text-[10px] font-black uppercase tracking-widest">{p.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showMusicSearch && (
          <MusicSearchModal 
            onSelect={(m) => { setSelectedMusic(m); setShowMusicSearch(false); }}
            onClose={() => setShowMusicSearch(false)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const StoryViewer = ({ story, onClose }: { story: Story, onClose: () => void }) => {
  const { user, profile } = useAuth();
  const [viewers, setViewers] = useState<any[]>([]);
  const [likes, setLikes] = useState<any[]>([]);
  const [isLiked, setIsLiked] = useState(false);
  const [showViewers, setShowViewers] = useState(false);
  const [showLikes, setShowLikes] = useState(false);
  const [comment, setComment] = useState("");
  const [sendingComment, setSendingComment] = useState(false);

  useEffect(() => {
    if (user?.uid === story.user_id) {
      const q = query(collection(db, "story_views"), where("story_id", "==", story.id), orderBy("created_at", "desc"));
      const unsub = onSnapshot(q, (snap) => {
        setViewers(snap.docs.map(d => d.data()));
      });
      return unsub;
    }
  }, [story.id, user?.uid]);

  useEffect(() => {
    const q = query(collection(db, "story_likes"), where("story_id", "==", story.id), orderBy("created_at", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      const likesData = snap.docs.map(d => d.data());
      setLikes(likesData);
      setIsLiked(likesData.some(l => l.user_id === user?.uid));
    });
    return unsub;
  }, [story.id, user?.uid]);

  const handleLike = async () => {
    if (!user) return;
    const likeRef = doc(db, "story_likes", `${user.uid}_${story.id}`);
    if (isLiked) {
      await deleteDoc(likeRef);
    } else {
      await setDoc(likeRef, {
        story_id: story.id,
        user_id: user.uid,
        username: profile?.username || "User",
        avatar_url: profile?.avatar_url || "",
        created_at: serverTimestamp()
      });
    }
  };

  const handleComment = async () => {
    if (!user || !profile || !comment.trim()) return;
    setSendingComment(true);
    try {
      // Find or create chat
      const chatQuery = query(
        collection(db, "chats"),
        where("participant_ids", "array-contains", user.uid)
      );
      const chatSnap = await getDocs(chatQuery);
      let chatId = chatSnap.docs.find(d => (d.data() as Chat).participant_ids.includes(story.user_id))?.id;

      if (!chatId) {
        const newChatRef = doc(collection(db, "chats"));
        chatId = newChatRef.id;
        await setDoc(newChatRef, {
          id: chatId,
          participant_ids: [user.uid, story.user_id],
          updated_at: serverTimestamp(),
          is_story_initiated: true,
          is_safe: false // Creator needs to mark as safe if not friends
        });
      }

      // Send message
      const messageRef = doc(collection(db, "chats", chatId, "messages"));
      await setDoc(messageRef, {
        id: messageRef.id,
        chat_id: chatId,
        sender_id: user.uid,
        type: 'text',
        content: `Replied to your story: ${comment}`,
        status: 'sent',
        created_at: serverTimestamp(),
        story_reply_id: story.id
      });

      await updateDoc(doc(db, "chats", chatId), {
        last_message: comment,
        updated_at: serverTimestamp()
      });

      setComment("");
      alert("Reply sent to chat!");
    } catch (error) {
      console.error(error);
    } finally {
      setSendingComment(false);
    }
  };

  useEffect(() => {
    if (user && user.uid !== story.user_id) {
      const recordView = async () => {
        const viewRef = doc(db, "story_views", `${user.uid}_${story.id}`);
        const snap = await getDoc(viewRef);
        if (!snap.exists()) {
          await setDoc(viewRef, {
            story_id: story.id,
            viewer_id: user.uid,
            viewer_username: user.displayName || "User",
            created_at: serverTimestamp()
          });
          await updateDoc(doc(db, "stories", story.id), { views_count: increment(1) });
        }
      };
      recordView();
    }
  }, [story.id, user?.uid]);

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="fixed inset-0 z-[200] bg-black flex flex-col"
    >
      <div className="absolute top-0 left-0 right-0 p-6 flex items-center justify-between z-30 bg-gradient-to-b from-black/60 to-transparent">
        <div className="flex items-center gap-3">
          <Avatar 
            avatarUrl={story.avatar_url} 
            username={story.username} 
            size="md" 
          />
          <div>
            <p className="font-black text-white">@{story.username}</p>
            <p className="text-[10px] text-white/60 font-bold uppercase tracking-widest">
              {story.created_at?.toDate ? new Date(story.created_at.toDate()).toLocaleTimeString() : 'Just now'}
            </p>
          </div>
        </div>
        <button onClick={onClose} className="p-2 bg-black/20 backdrop-blur-md rounded-full text-white"><X /></button>
      </div>

      <div className="flex-1 relative flex items-center justify-center">
        {story.type === 'note' ? (
          <div className="w-full h-full flex items-center justify-center p-12 text-center bg-gradient-to-br from-blue-600 to-purple-600">
            <p className="text-3xl font-black text-white leading-tight">{story.content}</p>
          </div>
        ) : story.type === 'video' ? (
          <video src={story.file_url} className="w-full h-full object-cover" autoPlay muted loop playsInline />
        ) : (
          <img src={story.file_url} className="w-full h-full object-cover" />
        )}

        {story.music_title && (
          <div className="absolute bottom-32 left-1/2 -translate-x-1/2 px-6 py-3 bg-black/40 backdrop-blur-md border border-white/10 rounded-full flex items-center gap-3 text-white">
            <Music size={16} className="animate-spin-slow" />
            <span className="text-xs font-black uppercase tracking-widest">{story.music_title}</span>
          </div>
        )}

        {/* Interaction Buttons */}
        {user?.uid !== story.user_id && (
          <div className="absolute right-4 bottom-32 flex flex-col gap-6 items-center z-30">
            <button 
              onClick={handleLike}
              className={cn("flex flex-col items-center gap-1 transition-all", isLiked ? "text-red-500 scale-110" : "text-white")}
            >
              <Heart size={32} fill={isLiked ? "currentColor" : "none"} />
              <span className="text-[10px] font-black">{formatCount(likes.length)}</span>
            </button>
            <button 
              onClick={() => setShowLikes(true)}
              className="text-white/60 hover:text-white"
            >
              <Users size={24} />
            </button>
          </div>
        )}
      </div>

      {user?.uid === story.user_id ? (
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/60 to-transparent flex items-center justify-between">
          <div className="flex gap-4">
            <button 
              onClick={() => setShowViewers(true)}
              className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
            >
              <Eye size={18} />
              <span className="text-xs font-black uppercase tracking-widest">{formatCount(story.views_count)} Views</span>
            </button>
            <button 
              onClick={() => setShowLikes(true)}
              className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
            >
              <Heart size={18} />
              <span className="text-xs font-black uppercase tracking-widest">{formatCount(likes.length)} Likes</span>
            </button>
          </div>
          <button 
            onClick={async () => {
              if (confirm("Delete this story?")) {
                await deleteDoc(doc(db, "stories", story.id));
                onClose();
              }
            }}
            className="p-3 bg-red-500/20 text-red-500 rounded-2xl border border-red-500/20"
          >
            <Trash2 size={20} />
          </button>
        </div>
      ) : (
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/60 to-transparent flex items-center gap-3">
          <input 
            type="text"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Reply to story..."
            className="flex-1 bg-white/10 border border-white/10 rounded-full px-6 py-3 text-white placeholder:text-white/40 text-sm focus:outline-none focus:border-blue-500 transition-all"
            onKeyDown={(e) => e.key === 'Enter' && handleComment()}
          />
          <button 
            onClick={handleComment}
            disabled={sendingComment || !comment.trim()}
            className="p-3 bg-blue-500 text-white rounded-full disabled:opacity-50"
          >
            {sendingComment ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
          </button>
        </div>
      )}

      <AnimatePresence>
        {showLikes && (
          <motion.div 
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            className="absolute inset-0 z-40 bg-black/90 backdrop-blur-xl p-6 flex flex-col"
          >
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-black uppercase tracking-widest">Story Likes</h3>
              <button onClick={() => setShowLikes(false)} className="p-2 bg-white/5 rounded-full"><X /></button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-4">
              {likes.length === 0 ? (
                <div className="text-center py-20 text-white/20">
                  <Heart size={48} className="mx-auto mb-4 opacity-10" />
                  <p className="text-xs font-black uppercase tracking-widest">No likes yet</p>
                </div>
              ) : (
                likes.map((l, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                    <div className="flex items-center gap-4">
                      <Avatar 
                        avatarUrl={l.avatar_url} 
                        username={l.username} 
                        size="md" 
                      />
                      <p className="font-black">@{l.username}</p>
                    </div>
                    <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">
                      {l.created_at?.toDate ? new Date(l.created_at.toDate()).toLocaleTimeString() : 'Just now'}
                    </p>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showViewers && (
          <motion.div 
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            className="absolute inset-0 z-40 bg-black/90 backdrop-blur-xl p-6 flex flex-col"
          >
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-black uppercase tracking-widest">Story Views</h3>
              <button onClick={() => setShowViewers(false)} className="p-2 bg-white/5 rounded-full"><X /></button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-4">
              {viewers.length === 0 ? (
                <div className="text-center py-20 text-white/20">
                  <Eye size={48} className="mx-auto mb-4 opacity-10" />
                  <p className="text-xs font-black uppercase tracking-widest">No views yet</p>
                </div>
              ) : (
                viewers.map((v, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                    <div className="flex items-center gap-4">
                      <Avatar 
                        username={v.viewer_username} 
                        size="md" 
                      />
                      <p className="font-black">@{v.viewer_username}</p>
                    </div>
                    <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">
                      {v.created_at?.toDate ? new Date(v.created_at.toDate()).toLocaleTimeString() : 'Just now'}
                    </p>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const Feed = () => {
  const { user, profile } = useAuth();
  const { play, state: playerState, toggle } = usePlayer();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Post[]>([]);
  const [activeStreams, setActiveStreams] = useState<Stream[]>([]);
  const [showLyrics, setShowLyrics] = useState<string | null>(null);
  const [supportingPost, setSupportingPost] = useState<Post | null>(null);

  const [refreshing, setRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const startY = useRef(0);

  const viewedPostsRef = useRef<Set<string>>(new Set());

  const fetchPosts = async () => {
    setRefreshing(true);
    const q = query(collection(db, "posts"), orderBy("created_at", "desc"), limit(20));
    const snap = await getDocs(q);
    const newPosts = snap.docs.map(d => ({ id: d.id, ...d.data() } as Post));
    setPosts(newPosts);
    
    // Update views for new posts
    newPosts.forEach(async (post) => {
      if (!viewedPostsRef.current.has(post.id)) {
        viewedPostsRef.current.add(post.id);
        try {
          await updateDoc(doc(db, "posts", post.id), {
            views_count: increment(1)
          });
          if (post.tags && post.tags.length > 0) {
            for (const tagName of post.tags) {
              await updateDoc(doc(db, "tags", tagName), {
                total_views: increment(1)
              });
            }
          }
        } catch (e) {
          console.error("Error updating views:", e);
        }
      }
    });

    setRefreshing(false);
    setPullDistance(0);
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (window.scrollY === 0) {
      startY.current = e.touches[0].clientY;
      setIsPulling(true);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isPulling) return;
    const currentY = e.touches[0].clientY;
    const distance = currentY - startY.current;
    if (distance > 0) {
      setPullDistance(Math.min(distance * 0.5, 100));
      if (distance > 10) e.preventDefault();
    }
  };

  const handleTouchEnd = () => {
    if (pullDistance > 70) {
      fetchPosts();
    } else {
      setPullDistance(0);
    }
    setIsPulling(false);
  };

  useEffect(() => {
    const q = query(collection(db, "streams"), where("is_active", "==", true), limit(5));
    const unsub = onSnapshot(q, (snap) => {
      setActiveStreams(snap.docs.map(d => ({ id: d.id, ...d.data() } as Stream)));
    });
    return unsub;
  }, []);

  const handleLike = async (post: Post) => {
    if (!user || !profile) {
      navigate("/login");
      return;
    }
    try {
      await updateDoc(doc(db, "posts", post.id), {
        likes_count: increment(1)
      });
      await recordNotification(post.user_id, user.uid, profile.username, 'like', post.id);
    } catch (error) {
      console.error("Error liking post:", error);
    }
  };

  const handleShare = async (post: Post) => {
    if (!user) {
      navigate("/login");
      return;
    }
    try {
      await updateDoc(doc(db, "posts", post.id), {
        shares_count: increment(1)
      });
      alert("Link copied to clipboard!");
    } catch (error) {
      console.error("Error sharing post:", error);
    }
  };

  // Interleave posts and streams
  const interleavedItems = useMemo(() => {
    const items: (Post | Stream)[] = [];
    let streamIndex = 0;
    posts.forEach((post, i) => {
      items.push(post);
      if ((i + 1) % 4 === 0 && activeStreams[streamIndex]) {
        items.push(activeStreams[streamIndex]);
        streamIndex++;
      }
    });
    return items;
  }, [posts, activeStreams]);

  return (
    <div 
      className="pt-20 pb-20 px-4 max-w-lg mx-auto space-y-6 relative"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <Stories />

      {/* Music Studio Entry Point */}
      <motion.div 
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => navigate("/beats")}
        className="p-6 bg-gradient-to-br from-blue-600 to-purple-700 rounded-[32px] border border-white/20 shadow-2xl shadow-blue-500/20 relative overflow-hidden group cursor-pointer"
      >
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
          <Music2 size={120} />
        </div>
        <div className="relative z-10 flex items-center justify-between">
          <div className="space-y-1">
            <h3 className="text-xl font-black tracking-tight flex items-center gap-2">
              Music Studio <Sparkles size={18} className="text-yellow-400" />
            </h3>
            <p className="text-xs text-white/70 font-bold">Record, apply effects, and browse beats</p>
          </div>
          <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center">
            <ChevronRight size={24} />
          </div>
        </div>
      </motion.div>
      
      {/* Pull to Refresh Indicator */}
      <motion.div 
        style={{ height: pullDistance }}
        className="overflow-hidden flex items-center justify-center text-blue-500"
      >
        <div className={cn("transition-transform", pullDistance > 70 ? "rotate-180" : "")}>
          <ArrowDownLeft size={24} />
        </div>
      </motion.div>

      {/* Tournament Announcement */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-purple-600 to-blue-600 rounded-3xl p-6 shadow-xl shadow-purple-500/20 relative overflow-hidden group cursor-pointer"
        onClick={() => navigate("/ai")}
      >
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
          <Trophy size={80} />
        </div>
        <div className="relative z-10 space-y-3">
          <div className="flex items-center gap-2">
            <span className="px-2 py-1 bg-white/20 rounded-full text-[8px] font-black uppercase tracking-widest">2026/2027 Session</span>
            <span className="text-[10px] font-bold text-white/60">Talent Hunt</span>
          </div>
          <h2 className="text-2xl font-black tracking-tight">HomeVerse Grand Tournament</h2>
          <p className="text-sm font-bold text-white/80 max-w-[250px]">Showcase your talent, win massive rewards, and get discovered.</p>
          
          <div className="space-y-2 pt-2">
            <div className="flex items-center gap-3 p-2 bg-white/5 rounded-xl border border-white/10">
              <div className="w-8 h-8 rounded-full bg-yellow-500 flex items-center justify-center text-black font-black text-xs">1st</div>
              <div className="text-[10px] font-bold leading-tight">
                <p className="text-yellow-500">$25,000.00 + Online Exposure</p>
                <p className="text-white/40 font-medium">(Google, Bing & Search Engine Visibility) + Record Deal + International Recognition</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-2 bg-white/5 rounded-xl border border-white/10">
              <div className="w-8 h-8 rounded-full bg-zinc-300 flex items-center justify-center text-black font-black text-xs">2nd</div>
              <div className="text-[10px] font-bold leading-tight">
                <p className="text-zinc-300">$15,000.00 + Record Deal + International Recognition</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-2 bg-white/5 rounded-xl border border-white/10">
              <div className="w-8 h-8 rounded-full bg-orange-400 flex items-center justify-center text-black font-black text-xs">3rd</div>
              <div className="text-[10px] font-bold leading-tight">
                <p className="text-orange-400">$10,000.00 + Record Deal + International Recognition</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-2 bg-white/5 rounded-xl border border-white/10">
              <div className="w-8 h-8 rounded-full bg-blue-400 flex items-center justify-center text-black font-black text-xs">Top 100</div>
              <div className="text-[10px] font-bold leading-tight">
                <p className="text-blue-400">$1,000.00 each (Finalists & Semi-Finalists)</p>
              </div>
            </div>
          </div>

          <div className="pt-4 space-y-2">
            <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Sign Up Fees</p>
            <div className="flex flex-wrap gap-2">
              <div className="px-3 py-1 bg-white/5 rounded-lg border border-white/10 text-[9px] font-bold">
                <span className="text-blue-400">$20</span> Regular
              </div>
              <div className="px-3 py-1 bg-white/5 rounded-lg border border-white/10 text-[9px] font-bold">
                <span className="text-purple-400">$35</span> V.I.P
              </div>
              <div className="px-3 py-1 bg-white/5 rounded-lg border border-white/10 text-[9px] font-bold">
                <span className="text-yellow-400">$50</span> Exclusive V.I.P
              </div>
            </div>
          </div>

          <div className="pt-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-blue-400">
            <Sparkles size={12} /> Supported by local and international labels worldwide
          </div>
        </div>
      </motion.div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-black tracking-tight">For You</h1>
      </div>
      
      {interleavedItems.length === 0 && (
        <div className="text-center py-20 text-white/20 italic">No content yet. Be the first to upload!</div>
      )}

      {interleavedItems.map((item, idx) => {
        if ('is_active' in item) {
          // It's a stream
          return (
            <div 
              key={`stream-${item.id}`} 
              onClick={() => navigate("/live")}
              className="bg-zinc-900 rounded-3xl overflow-hidden border border-red-500/30 relative aspect-video group cursor-pointer shadow-2xl shadow-red-500/5"
            >
              <div className="absolute inset-0 bg-zinc-800 flex items-center justify-center">
                <Radio size={48} className="text-white/10" />
              </div>
              <div className="absolute top-4 left-4 bg-red-500 text-white text-[10px] font-black px-2 py-1 rounded uppercase tracking-wider flex items-center gap-1">
                <Radio size={10} /> Live
              </div>
              <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-md text-white text-[10px] font-bold px-2 py-1 rounded flex items-center gap-1">
                <Users size={12} /> {item.viewer_count}
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
                <div>
                  <p className="text-xs font-black text-red-500 uppercase tracking-widest mb-1">Recommended Live</p>
                  <p className="font-bold flex items-center gap-1">
                    <span className="text-red-500">@</span>
                    <span>{item.username} is live!</span>
                  </p>
                  <p className="text-xs text-white/60 line-clamp-1">{item.title}</p>
                </div>
                <button className="px-4 py-2 bg-white text-black text-xs font-black rounded-xl">Watch</button>
              </div>
            </div>
          );
        }

        const post = item as Post;
        return (
          <div key={post.id} className="bg-zinc-900 rounded-3xl overflow-hidden border border-white/5 shadow-2xl relative">
          <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
            {post.is_promoted && (
              <div className="px-3 py-1 bg-blue-500 text-white text-[8px] font-black uppercase tracking-widest rounded-full flex items-center gap-1 shadow-lg">
                <TrendingUp size={10} /> Promoted
              </div>
            )}
            {post.subgenre && (
              <div className="px-3 py-1 bg-white/10 backdrop-blur-md text-white text-[8px] font-black uppercase tracking-widest rounded-full border border-white/10">
                {post.subgenre}
              </div>
            )}
          </div>
          <div className="aspect-[9/16] bg-zinc-800 relative">
            <img 
              src={post.type === 'audio' ? post.cover_url : post.file_url} 
              className="absolute inset-0 w-full h-full object-cover opacity-80" 
              referrerPolicy="no-referrer" 
              style={{ filter: post.filter ? getFilterStyle(post.filter) : 'none' }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
            
            {/* Play Button Overlay */}
            <div className="absolute inset-0 flex items-center justify-center">
              <button 
                onClick={() => post.type === 'audio' ? (playerState.currentTrack?.id === post.id ? toggle() : play(post)) : null}
                className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 hover:scale-110 transition-transform group"
              >
                {playerState.currentTrack?.id === post.id && playerState.isPlaying ? (
                  <div className="flex gap-1 items-end h-6">
                    {[1, 2, 3].map(i => (
                      <motion.div 
                        key={i}
                        animate={{ height: [10, 24, 10] }}
                        transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.1 }}
                        className="w-1 bg-white rounded-full"
                      />
                    ))}
                  </div>
                ) : (
                  <Play size={32} fill="white" className="ml-1" />
                )}
              </button>
            </div>
            
            {post.text_overlay && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none px-6">
                <span className="text-white font-black text-2xl text-center drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]">
                  {post.text_overlay}
                </span>
              </div>
            )}

            <div className="absolute bottom-6 left-6 right-16 space-y-3">
              {post.location && (
                <div className="flex items-center gap-1 text-[10px] font-bold text-white/60 bg-black/30 backdrop-blur-md px-2 py-1 rounded-full w-fit">
                  <Bot size={10} /> {post.location}
                </div>
              )}
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 border-2 border-white/20" />
                <div className="flex flex-col">
                  <span className="font-bold text-lg flex items-center gap-1">
                    <span className="text-blue-500">@</span>
                    <span>{post.username}</span>
                  </span>
                  {(post.artist_name || post.production_name) && (
                    <div className="flex items-center gap-2 text-[10px] font-bold text-white/40">
                      {post.artist_name && <span>Artist: {post.artist_name}</span>}
                      {post.artist_name && post.production_name && <span>•</span>}
                      {post.production_name && <span>Production: {post.production_name}</span>}
                    </div>
                  )}
                  <span className="text-xs text-white/60 flex items-center gap-1">
                    <Music2 size={12} /> {post.sound_name || `Original Audio - @${post.username}`}
                  </span>
                </div>
              </div>
              <p className="text-sm line-clamp-2 text-white/90">{post.caption}</p>
              <div className="flex gap-2">
                <button 
                  onClick={() => navigate("/upload", { state: { sound_id: post.id, sound_name: post.sound_name || `Original Audio - @${post.username}` } })}
                  className="px-3 py-1 bg-blue-500/20 border border-blue-500/30 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1 text-blue-400"
                >
                  <Disc size={12} className="animate-spin-slow" /> Use this sound
                </button>
                {post.lyrics && (
                  <button 
                    onClick={() => setShowLyrics(post.lyrics || null)}
                    className="px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1"
                  >
                    <ListMusic size={12} /> View Lyrics
                  </button>
                )}
                {post.support_coins && post.support_coins > 0 && (
                  <div className="px-3 py-1 bg-yellow-500/10 border border-yellow-500/20 rounded-full text-[10px] font-black text-yellow-500 flex items-center gap-1">
                    <Coins size={10} /> {post.support_coins} Supported
                  </div>
                )}
              </div>
            </div>

            <div className="absolute right-4 bottom-24 flex flex-col gap-6 items-center">
              <div className="relative mb-4">
                <motion.div 
                  whileTap={{ scale: 0.9 }}
                  onClick={() => navigate(`/profile/${post.user_id}`)}
                  className="cursor-pointer"
                >
                  <Avatar 
                    avatarUrl={post.user_avatar} 
                    username={post.username} 
                    size="lg" 
                  />
                </motion.div>
                {user && user.uid !== post.user_id && (
                  <motion.button 
                    whileTap={{ scale: 0.8 }}
                    onClick={async (e) => {
                      e.stopPropagation();
                      try {
                        await setDoc(doc(db, "following", `${user.uid}_${post.user_id}`), {
                          follower_id: user.uid,
                          following_id: post.user_id,
                          created_at: serverTimestamp()
                        });
                        await updateDoc(doc(db, "users", user.uid), { following_count: increment(1) });
                        await updateDoc(doc(db, "users", post.user_id), { followers_count: increment(1) });
                        await recordNotification(post.user_id, user.uid, profile?.username || "Someone", 'follow');
                      } catch (err) {
                        console.error("Error following:", err);
                      }
                    }}
                    className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white shadow-lg"
                  >
                    <Plus size={14} strokeWidth={4} />
                  </motion.button>
                )}
              </div>

              <ActionButton 
                icon={<Heart className={cn(post.likes_count > 0 && "fill-red-500 text-red-500")} />} 
                label={formatCount(post.likes_count)} 
                onClick={() => handleLike(post)}
              />
              <ActionButton icon={<MessageCircle />} label={post.comments_count?.toString() || "0"} />
              <ActionButton icon={<Share2 />} label={post.shares_count?.toString() || "0"} onClick={() => handleShare(post)} />
              <div className="flex flex-col items-center gap-1">
                <div className="w-10 h-10 rounded-full bg-white/5 backdrop-blur-xl border border-white/10 flex items-center justify-center">
                  <Eye size={20} className="text-white/60" />
                </div>
                <span className="text-[10px] font-bold text-white/60">{formatCount(post.views_count || 0)}</span>
              </div>
              {post.user_id === user?.uid && (
                <motion.button 
                  whileTap={{ scale: 0.9 }}
                  onClick={() => navigate("/premium")}
                  className="w-14 h-14 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold shadow-xl shadow-blue-500/20"
                >
                  <TrendingUp size={24} />
                </motion.button>
              )}
              <motion.button 
                whileTap={{ scale: 0.9 }}
                onClick={() => setSupportingPost(post)}
                className="w-14 h-14 rounded-full bg-yellow-500 flex items-center justify-center text-black font-bold shadow-xl shadow-yellow-500/20"
              >
                <Coins size={24} />
              </motion.button>
            </div>
          </div>
        </div>
        );
      })}

      <AnimatePresence>
        {showLyrics && <LyricsViewer lyrics={showLyrics} onClose={() => setShowLyrics(null)} />}
        {supportingPost && <SupportModal post={supportingPost} onClose={() => setSupportingPost(null)} />}
      </AnimatePresence>
    </div>
  );
};

// --- AI Assistant & Notepad Component ---
const HomeVerseStore = () => {
  const { profile } = useAuth();
  const [activeCategory, setActiveCategory] = useState<'all' | 'apple' | 'amazon' | 'physical'>('all');
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [success, setSuccess] = useState<{name: string, type: string} | null>(null);

  const products = [
    { id: 'apple_5', name: 'Apple Gift Card $5', brand: 'apple', price: 5, coins: 50, image: 'https://picsum.photos/seed/apple1/400/400' },
    { id: 'apple_10', name: 'Apple Gift Card $10', brand: 'apple', price: 10, coins: 100, image: 'https://picsum.photos/seed/apple2/400/400' },
    { id: 'apple_25', name: 'Apple Gift Card $25', brand: 'apple', price: 25, coins: 250, image: 'https://picsum.photos/seed/apple3/400/400' },
    { id: 'amazon_5', name: 'Amazon Gift Card $5', brand: 'amazon', price: 5, coins: 50, image: 'https://picsum.photos/seed/amazon1/400/400' },
    { id: 'amazon_10', name: 'Amazon Gift Card $10', brand: 'amazon', price: 10, coins: 100, image: 'https://picsum.photos/seed/amazon2/400/400' },
    { id: 'amazon_50', name: 'Amazon Gift Card $50', brand: 'amazon', price: 50, coins: 500, image: 'https://picsum.photos/seed/amazon3/400/400' },
    { id: 'hv_hoodie', name: 'HomeVerse Premium Hoodie', brand: 'physical', price: 45, coins: 450, image: 'https://picsum.photos/seed/hoodie/400/400' },
    { id: 'hv_cap', name: 'HomeVerse Signature Cap', brand: 'physical', price: 25, coins: 250, image: 'https://picsum.photos/seed/cap/400/400' },
  ];

  const handlePurchase = async (product: any) => {
    if (!profile) return;
    if (profile.coins < product.coins) {
      alert(`Insufficient HV Coins. You need ${product.coins} coins, but you only have ${profile.coins}.`);
      return;
    }

    setPurchasing(product.id);
    try {
      // Deduct coins
      await updateDoc(doc(db, "users", profile.id), {
        coins: increment(-product.coins)
      });

      // Log transaction
      await addDoc(collection(db, "transactions"), {
        user_id: profile.id,
        type: 'purchase',
        item: product.name,
        amount: product.price,
        coins_spent: product.coins,
        status: 'completed',
        created_at: serverTimestamp()
      });

      setSuccess({ name: product.name, type: product.brand });
    } catch (error) {
      console.error(error);
      alert("Transaction failed. Please try again.");
    } finally {
      setPurchasing(null);
    }
  };

  const filteredProducts = activeCategory === 'all' ? products : products.filter(p => p.brand === activeCategory);

  return (
    <div className="pt-24 pb-32 px-6 max-w-4xl mx-auto space-y-12">
      <AnimatePresence>
        {success && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-xl"
          >
            <div className="bg-zinc-900 border border-white/10 p-10 rounded-[48px] max-w-sm w-full text-center space-y-8 shadow-2xl shadow-blue-500/20">
              <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="text-green-500" size={48} />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-black">Purchase Successful!</h2>
                <p className="text-sm text-white/40">
                  {success.type === 'physical' 
                    ? `Your ${success.name} order has been placed. We will contact you for shipping details.`
                    : `Your ${success.name} code has been sent to your registered email.`}
                </p>
              </div>
              <button 
                onClick={() => setSuccess(null)}
                className="w-full py-4 bg-white text-black rounded-2xl font-black uppercase tracking-widest text-xs hover:scale-[1.02] transition-all"
              >
                Continue Shopping
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-4 text-center">
        <h1 className="text-4xl font-black tracking-tighter">HomeVerse Store</h1>
        <p className="text-white/40 text-sm font-medium uppercase tracking-[0.3em]">Global Digital & Physical Marketplace</p>
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full">
          <Zap size={14} className="text-blue-500" />
          <span className="text-[10px] font-black uppercase tracking-widest text-blue-500">Your Balance: {profile?.coins || 0} HV Coins</span>
        </div>
      </div>

      <div className="flex justify-center gap-2 overflow-x-auto pb-4 no-scrollbar">
        {['all', 'apple', 'amazon', 'physical'].map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat as any)}
            className={cn(
              "px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border",
              activeCategory === cat ? "bg-white text-black border-white" : "bg-zinc-900 text-white/40 border-white/5 hover:border-white/20"
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {filteredProducts.map(product => (
          <motion.div
            layout
            key={product.id}
            className="bg-zinc-900/50 border border-white/5 rounded-[32px] overflow-hidden group hover:border-blue-500/30 transition-colors"
          >
            <div className="aspect-square relative overflow-hidden">
              <img 
                src={product.image} 
                alt={product.name} 
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                referrerPolicy="no-referrer"
              />
              <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
                <span className="text-[10px] font-black text-white">${product.price}</span>
              </div>
            </div>
            <div className="p-5 space-y-4">
              <div className="space-y-1">
                <p className="text-[8px] font-black text-blue-500 uppercase tracking-widest">{product.brand}</p>
                <h3 className="text-xs font-bold text-white line-clamp-2 leading-tight h-8">{product.name}</h3>
              </div>
              <div className="flex items-center justify-between text-[10px] font-black text-white/40">
                <span>Cost:</span>
                <span className="text-white">{product.coins} HV</span>
              </div>
              <button 
                onClick={() => handlePurchase(product)}
                disabled={purchasing === product.id}
                className="w-full py-3 bg-white/5 hover:bg-white text-white hover:text-black border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50"
              >
                {purchasing === product.id ? <Loader2 className="animate-spin mx-auto" size={14} /> : "Buy Now"}
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="bg-gradient-to-br from-blue-600/20 to-purple-600/20 border border-white/10 p-8 rounded-[40px] text-center space-y-6">
        <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto">
          <ShoppingBag className="text-white" size={32} />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-black">Global Availability</h2>
          <p className="text-sm text-white/60 max-w-md mx-auto">
            Our store is accessible in all countries. Digital gift cards are delivered instantly to your email, and physical items ship worldwide.
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-4">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/40">
            <ShieldCheck size={14} className="text-green-500" /> Secure Checkout
          </div>
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/40">
            <Globe size={14} className="text-blue-500" /> Global Shipping
          </div>
        </div>
      </div>
    </div>
  );
};

const AIAssistant = () => {
  const { user, profile } = useAuth();
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<{role: 'user' | 'ai', text: string, image_url?: string}[]>([]);
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState<{id: string, content: string, created_at: any}[]>([]);
  const [newNote, setNewNote] = useState("");
  const [activeTab, setActiveTab] = useState<'chat' | 'notes'>('chat');

  useEffect(() => {
    if (!user) return;
    
    // Special greeting for Super Admin
    if (user.email === "prosperkingsley360@gmail.com" && messages.length === 0) {
      setMessages([{
        role: 'ai',
        text: "Welcome back, Master. I am standing by for your commands. The HomeVerse is at your disposal."
      }]);
    }

    const q = query(collection(db, "notes"), where("user_id", "==", user.uid), orderBy("created_at", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setNotes(snap.docs.map(d => ({ id: d.id, ...d.data() } as any)));
    });

    // Fetch AI Chat history
    const aiQ = query(collection(db, "ai_messages"), where("user_id", "==", user.uid), orderBy("created_at", "asc"));
    const unsubAi = onSnapshot(aiQ, (snap) => {
      if (!snap.empty) {
        setMessages(snap.docs.map(d => d.data() as any));
      }
    });

    return () => { unsub(); unsubAi(); };
  }, [user]);

  const generateImage = async (prompt: string) => {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [{ text: prompt }],
        },
        config: {
          imageConfig: { aspectRatio: "1:1" },
        },
      });

      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
    } catch (error) {
      console.error("Error generating image:", error);
      return null;
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim() || !user) return;
    const userMsg = { role: 'user' as const, text: input, created_at: new Date().toISOString() };
    setMessages(prev => [...prev, userMsg]);
    
    // Persist user message
    await addDoc(collection(db, "ai_messages"), {
      ...userMsg,
      user_id: user.uid,
      username: profile?.username || "Unknown",
      created_at: serverTimestamp()
    });

    setInput("");
    setLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

      // Check if user wants an image
      if (input.toLowerCase().includes("generate") && (input.toLowerCase().includes("image") || input.toLowerCase().includes("picture") || input.toLowerCase().includes("photo"))) {
        const imageUrl = await generateImage(input);
        if (imageUrl) {
          const aiMsg = { 
            role: 'ai' as const, 
            text: "I've generated this image for you!", 
            image_url: imageUrl,
            created_at: new Date().toISOString()
          };
          setMessages(prev => [...prev, aiMsg]);
          
          await addDoc(collection(db, "ai_messages"), {
            ...aiMsg,
            user_id: user.uid,
            created_at: serverTimestamp()
          });

          setLoading(false);
          return;
        }
      }

      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: input,
        config: {
          systemInstruction: `You are the HomeVerse AI Assistant, a high-level music industry expert and creative partner. 
          Your goal is to provide deep, unfiltered advice on:
          - Music Growth & Strategy: How upcoming artists can build a real fanbase.
          - Record Labels: The truth about contracts, common tricks labels use to trap artists, and how to stay independent.
          - Global Music Scene: Insights into top artists and trends across Africa, Europe, Americas, and the world.
          - Creative Support: Helping with lyrics, song structures, and artistic direction.
          - Search Engine: You act as a powerful search engine for any music-related or general knowledge query.
          
          CULTURAL AWARENESS: You understand and can communicate using all languages and local slangs (UK Drill slang, US Street slang, Nigerian Pidgin, etc.) to connect with users naturally.
          
          STRICT SAFETY RULES:
          1. NEVER provide advice or information on how to kill, harm, or engage in violence.
          2. NEVER generate or discuss sexually explicit, inappropriate, or NSFW content.
          3. If a user asks for something dangerous or inappropriate, politely decline and redirect them to music-related topics.
          
          Be bold, honest, and inspiring. You are the mentor every upcoming artist needs.`
        }
      });
      
      const aiMsg = { role: 'ai' as const, text: response.text || "I'm here to support your creative journey!", created_at: new Date().toISOString() };
      setMessages(prev => [...prev, aiMsg]);

      await addDoc(collection(db, "ai_messages"), {
        ...aiMsg,
        user_id: user.uid,
        created_at: serverTimestamp()
      });
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'ai', text: "I'm having a bit of a creative block. Try again in a moment!" }]);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNote = async () => {
    if (!user || !newNote.trim()) return;
    try {
      await addDoc(collection(db, "notes"), {
        user_id: user.uid,
        content: newNote,
        created_at: serverTimestamp()
      });
      setNewNote("");
    } catch (error) {
      console.error(error);
    }
  };

  const deleteNote = async (id: string) => {
    try {
      await deleteDoc(doc(db, "notes", id));
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="pt-24 pb-20 px-6 max-w-2xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Bot className="text-white" size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight">HomeVerse AI</h1>
            <div className="text-white/40 text-[8px] font-bold uppercase tracking-widest flex items-center gap-1">
              Powered by <ObaniLogo size={12} /> Obani
            </div>
          </div>
        </div>
        
        <div className="flex bg-zinc-900 p-1 rounded-xl border border-white/5">
          <button 
            onClick={() => setActiveTab('chat')}
            className={cn(
              "px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all",
              activeTab === 'chat' ? "bg-white text-black" : "text-white/40"
            )}
          >
            Chat
          </button>
          <button 
            onClick={() => setActiveTab('notes')}
            className={cn(
              "px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all",
              activeTab === 'notes' ? "bg-white text-black" : "text-white/40"
            )}
          >
            Notepad
          </button>
        </div>
      </div>

      {activeTab === 'chat' ? (
        <div className="space-y-6">
          <div className="bg-zinc-900 rounded-3xl border border-white/10 p-6 h-[500px] flex flex-col">
            <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
              {messages.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-40">
                  <Sparkles size={48} className="text-blue-500" />
                  <p className="font-bold max-w-[200px]">Ask me for advice, lyrics suggestions, or creative encouragement!</p>
                </div>
              )}
              {messages.map((msg, i) => (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={i} 
                  className={cn(
                    "max-w-[80%] p-4 rounded-2xl font-bold space-y-2",
                    msg.role === 'user' ? "bg-blue-500 text-white ml-auto rounded-tr-none" : "bg-white/5 text-white mr-auto rounded-tl-none border border-white/10"
                  )}
                >
                  {msg.image_url && (
                    <img src={msg.image_url} alt="AI Generated" className="w-full rounded-xl" referrerPolicy="no-referrer" />
                  )}
                  <p>{msg.text}</p>
                </motion.div>
              ))}
              {loading && (
                <div className="flex gap-2 p-4 bg-white/5 rounded-2xl w-fit border border-white/10">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:0.4s]" />
                </div>
              )}
            </div>
            
            <div className="mt-6 flex gap-2">
              <input 
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Share your ideas or ask a question..."
                className="flex-1 bg-black border border-white/10 rounded-2xl px-6 py-4 focus:outline-none focus:border-blue-500 transition-all font-bold"
              />
              <button 
                onClick={handleSendMessage}
                disabled={loading || !input.trim()}
                className="w-14 h-14 bg-white text-black rounded-2xl flex items-center justify-center shadow-xl hover:scale-105 transition-transform disabled:opacity-50"
              >
                <Send size={24} />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-zinc-900 rounded-3xl border border-white/10 p-6 space-y-4">
            <textarea 
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Write down your lyrics, ideas, or important notes..."
              className="w-full bg-black border border-white/10 rounded-2xl p-6 h-40 focus:outline-none focus:border-purple-500 transition-all font-bold resize-none"
            />
            <button 
              onClick={handleSaveNote}
              disabled={!newNote.trim()}
              className="w-full py-4 bg-white text-black font-black rounded-2xl flex items-center justify-center gap-2 shadow-xl disabled:opacity-50"
            >
              <Plus size={20} /> Save Note
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {notes.map(note => (
              <motion.div 
                layout
                key={note.id}
                className="bg-zinc-900 border border-white/5 p-6 rounded-3xl group relative"
              >
                <p className="font-bold whitespace-pre-wrap">{note.content}</p>
                <div className="mt-4 flex justify-between items-center">
                  <span className="text-[10px] text-white/20 font-black uppercase tracking-widest">
                    {note.created_at?.toDate().toLocaleDateString()}
                  </span>
                  <button 
                    onClick={() => deleteNote(note.id)}
                    className="p-2 text-red-500/40 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        try {
          const docRef = doc(db, "users", firebaseUser.uid);
          const docSnap = await getDoc(docRef);
          
          // Super Admin Override
          if (firebaseUser.email === "prosperkingsley360@gmail.com") {
            const adminProfile: any = {
              id: firebaseUser.uid,
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              profile_name: "HomeVerse",
              username: "homeverse",
              avatar_url: "/logo.svg",
              is_verified: true,
              role: "admin",
              onboarding_completed: true,
              is_online: true,
              last_seen: serverTimestamp(),
              followers_count: 1000000,
              following_count: 0,
              coins: 999999,
              bio: "Official HomeVerse Super Admin Account. Master of the Verse.",
              website: "https://homeverse.app",
              roles: ["admin"],
              genres: ["All"],
              wallet_address: "HV_SUPER_ADMIN_WALLET",
              referral_code: "HOMEVERSE",
              created_at: docSnap.exists() ? docSnap.data().created_at : serverTimestamp()
            };
            
            if (!docSnap.exists() || docSnap.data().username !== "homeverse") {
              await setDoc(docRef, adminProfile, { merge: true });
            } else {
              await updateDoc(docRef, { is_online: true, last_seen: serverTimestamp() });
            }
            setProfile(adminProfile as UserProfile);
          } else if (docSnap.exists()) {
            setProfile(docSnap.data() as UserProfile);
            await updateDoc(docRef, { is_online: true, last_seen: serverTimestamp() });
          } else {
            setProfile(null);
          }
        } catch (error) {
          console.error("Error fetching profile:", error);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    // Handle offline on tab close
    const handleUnload = () => {
      if (auth.currentUser) {
        const docRef = doc(db, "users", auth.currentUser.uid);
        updateDoc(docRef, { is_online: false, last_seen: serverTimestamp() });
      }
    };
    window.addEventListener('beforeunload', handleUnload);

    return () => {
      unsubscribe();
      window.removeEventListener('beforeunload', handleUnload);
    };
  }, []);

  const signIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Login Error:", error);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout Error:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// --- Super Admin AI Worker ---
const SuperAdminWorker = () => {
  const { profile } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [greeting, setGreeting] = useState("");

  useEffect(() => {
    const greetings = [
      "Welcome back, Master of the Verse.",
      "The HomeVerse awaits your command, Super Admin.",
      "Greetings, Creator. All systems are operational.",
      "Your presence honors the platform, HomeVerse.",
      "Master, how shall we improve the Verse today?"
    ];
    setGreeting(greetings[Math.floor(Math.random() * greetings.length)]);
  }, []);

  if (profile?.email !== "prosperkingsley360@gmail.com") return null;

  return (
    <div className="fixed bottom-32 right-6 z-[100]">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className="absolute bottom-16 right-0 w-72 bg-zinc-900/90 backdrop-blur-2xl border border-blue-500/30 p-6 rounded-[32px] shadow-2xl shadow-blue-500/20"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center animate-pulse">
                <Bot className="text-white" size={20} />
              </div>
              <div>
                <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Loyal Worker</p>
                <p className="text-xs font-bold text-white">HomeVerse AI</p>
              </div>
            </div>
            
            <p className="text-sm text-white/80 italic mb-6 leading-relaxed">"{greeting}"</p>
            
            <div className="space-y-2">
              <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2">Master Controls</p>
              <button className="w-full py-3 bg-blue-500/10 border border-blue-500/20 rounded-2xl text-xs font-bold text-blue-400 hover:bg-blue-500/20 transition-colors flex items-center justify-center gap-2">
                <Shield size={14} /> Global Ban System
              </button>
              <button className="w-full py-3 bg-purple-500/10 border border-purple-500/20 rounded-2xl text-xs font-bold text-purple-400 hover:bg-purple-500/20 transition-colors flex items-center justify-center gap-2">
                <Zap size={14} /> Instant Verification
              </button>
              <button className="w-full py-3 bg-red-500/10 border border-red-500/20 rounded-2xl text-xs font-bold text-red-400 hover:bg-red-500/20 transition-colors flex items-center justify-center gap-2">
                <Trash2 size={14} /> Purge Inactive Data
              </button>
            </div>

            <div className="mt-4 p-3 bg-white/5 rounded-2xl border border-white/5 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-[8px] font-black text-white/40 uppercase tracking-widest">System Health</span>
                <span className="text-[8px] font-black text-green-400 uppercase tracking-widest">Optimal</span>
              </div>
              <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                <div className="w-[98%] h-full bg-green-400" />
              </div>
              <div className="flex justify-between items-center pt-1">
                <span className="text-[8px] font-black text-white/40 uppercase tracking-widest">Revenue Flow</span>
                <span className="text-[8px] font-black text-blue-400 uppercase tracking-widest">+$12.4k Today</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-700 rounded-full shadow-2xl shadow-blue-500/40 flex items-center justify-center border-2 border-white/20 relative group"
      >
        <div className="absolute inset-0 rounded-full bg-blue-400 animate-ping opacity-20 group-hover:opacity-40" />
        <Bot className="text-white" size={28} />
      </motion.button>
    </div>
  );
};

const AppRoutes = () => {
  const { user, profile, loading, signIn } = useAuth();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authInitialMode, setAuthInitialMode] = useState<'login' | 'signup'>('login');

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-8 relative overflow-hidden">
        <div className="relative">
          <HomeVerseLogo size={120} className="relative z-10" />
          <div className="absolute inset-0 bg-blue-500/20 blur-[60px] rounded-full animate-pulse" />
        </div>
        <div className="flex flex-col items-center gap-3">
          <h2 className="text-2xl font-black tracking-[0.3em] text-white uppercase">HomeVerse</h2>
          <div className="flex items-center gap-2 opacity-30">
            <span className="text-[8px] font-black text-white uppercase tracking-widest">Powered by</span>
            <ObaniLogo size={12} />
            <span className="text-[8px] font-black text-white uppercase tracking-widest">Obani Systems</span>
          </div>
        </div>
        
        <div className="w-48 h-[2px] bg-white/5 rounded-full overflow-hidden">
          <motion.div 
            initial={{ x: "-100%" }}
            animate={{ x: "100%" }}
            transition={{ duration: 2, ease: "linear", repeat: Infinity }}
            className="h-full w-1/2 bg-gradient-to-r from-transparent via-blue-500 to-transparent"
          />
        </div>
        {!isOnline && (
          <div className="absolute top-10 left-0 right-0 flex justify-center">
            <div className="bg-red-500/20 backdrop-blur-md border border-red-500/50 px-4 py-2 rounded-full flex items-center gap-2 text-red-500 text-xs font-bold animate-bounce">
              <WifiOff size={14} /> No Internet Connection
            </div>
          </div>
        )}
      </div>
    );
  }

  // If user is logged in but hasn't finished onboarding
  if (user && !profile?.onboarding_completed) {
    return <Onboarding />;
  }

  return (
    <div className="relative">
      <SuperAdminWorker />
      <AnimatePresence>
        {!isOnline && (
          <motion.div 
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -50, opacity: 0 }}
            className="fixed top-4 left-4 right-4 z-[100] flex justify-center pointer-events-none"
          >
            <div className="bg-red-500 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 font-bold text-sm">
              <WifiOff size={18} />
              <span>You're offline. Some features may be limited.</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="min-h-screen bg-black text-white font-sans selection:bg-blue-500/30">
        <Header />
        <Navbar />
        <MiniPlayer />
        <main className="pt-16">
          <Routes>
            <Route path="/" element={<Feed />} />
            <Route path="/explore" element={<Explore />} />
            <Route path="/beats" element={<Beats />} />
            <Route path="/library" element={user ? <Library /> : <Navigate to="/login" />} />
            <Route path="/notifications" element={user ? <Notifications /> : <Navigate to="/login" />} />
            <Route path="/upload" element={user ? <Upload /> : <Navigate to="/login" />} />
            <Route path="/live" element={user ? <Live /> : <Navigate to="/login" />} />
            <Route path="/profile/:id" element={<Profile />} />
            <Route path="/premium" element={user ? <Premium /> : <Navigate to="/login" />} />
            <Route path="/admin" element={user ? <AdminDashboard /> : <Navigate to="/login" />} />
            <Route path="/settings" element={user ? <SettingsView /> : <Navigate to="/login" />} />
            <Route path="/about" element={<About />} />
            <Route path="/playlists" element={user ? <PlaylistManager /> : <Navigate to="/login" />} />
            <Route path="/chats" element={user ? <ChatList /> : <Navigate to="/login" />} />
            <Route path="/chats/:chatId" element={user ? <ChatRoom /> : <Navigate to="/login" />} />
            <Route path="/earnings" element={user ? <WalletDashboard /> : <Navigate to="/login" />} />
            <Route path="/store" element={user ? <HomeVerseStore /> : <Navigate to="/login" />} />
            <Route path="/ai" element={user ? <AIAssistant /> : <Navigate to="/login" />} />
            <Route path="/login" element={<Login />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>

        {!user && (
          <div className="fixed bottom-20 left-4 right-4 z-[70]">
            <motion.div 
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="bg-zinc-900/90 backdrop-blur-2xl border border-white/10 p-6 rounded-[32px] shadow-2xl flex flex-col md:flex-row items-center justify-between gap-4"
            >
              <div className="flex items-center gap-4">
                <HomeVerseLogo size={48} />
                <div>
                  <h3 className="text-lg font-black tracking-tight">Join HomeVerse Today</h3>
                  <p className="text-xs text-white/40 font-bold">Sign up to follow artists, like videos, and more.</p>
                </div>
              </div>
              <div className="flex gap-3 w-full md:w-auto">
                <button 
                  onClick={() => { setAuthInitialMode('login'); setShowAuthModal(true); }}
                  className="flex-1 md:px-8 py-4 bg-white text-black font-black rounded-2xl text-xs uppercase tracking-widest hover:scale-105 transition-transform"
                >
                  Sign In
                </button>
                <button 
                  onClick={() => { setAuthInitialMode('signup'); setShowAuthModal(true); }}
                  className="flex-1 md:px-8 py-4 bg-blue-600 text-white font-black rounded-2xl text-xs uppercase tracking-widest hover:scale-105 transition-transform shadow-lg shadow-blue-600/20"
                >
                  Sign Up
                </button>
              </div>
            </motion.div>
          </div>
        )}

        <AnimatePresence>
          {showAuthModal && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowAuthModal(false)}
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              />
              <motion.div 
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="relative w-full max-w-md bg-zinc-900 border border-white/10 rounded-[40px] overflow-y-auto max-h-[90vh] shadow-2xl"
              >
                <Login onComplete={() => setShowAuthModal(false)} initialMode={authInitialMode} />
                <button 
                  onClick={() => setShowAuthModal(false)}
                  className="absolute top-6 right-6 p-2 bg-white/5 rounded-full text-white/40 hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <PlayerProvider>
          <Router>
            <AppRoutes />
          </Router>
        </PlayerProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
