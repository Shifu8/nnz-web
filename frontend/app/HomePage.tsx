/**
 * Autor: Brandon Medina
 * Fecha: 2026
 * Descripción: Homepage NENEZ - Futuristic Luxury Monochrome Redesign
 */

"use client";

import Image from "next/image";
import type { CSSProperties } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BadgeCheck,
  Calendar,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  KeyRound,
  LockKeyhole,
  MapPin,
  MessageCircle,
  ShieldCheck,
  Ticket,
  X,
  Share2,
  User,
  PlusCircle,
  ArrowLeft,
  LayoutDashboard,
  Search,
  SlidersHorizontal,
  Sparkles,
  Wine,
  CreditCard,
  Upload,
  Key,
  Settings,
  LogOut,
  Bell,
  BellRing,
  Music,
  Music2,
  Zap,
  MapPinned,
  Home,
  Compass,
  ShoppingBag,
  HelpCircle,
  Play,
  Heart,
  Volume2,
  VolumeX,
  Mic,
  Building2,
  UserCheck,
  Users,
  Check,
  ImagePlus,
  Clock,
  Trash2,
  Plus,
} from "lucide-react";
import { AnimatePresence, motion, useDragControls } from "framer-motion";
import Atmosphere from "@/frontend/components/Atmosphere";
import AIChatbot from "@/frontend/components/AIChatbot";
import PurchaseFarewell from "@/frontend/components/PurchaseFarewell";
import AccessDrop, { type AccessDropHandle } from "@/frontend/features/access-drop/AccessDrop";
import TicketRecoveryModal from "@/frontend/components/TicketRecoveryModal";
import OutfitBuilderSection from "@/frontend/features/merch/OutfitBuilderSection";
import StaffModal from "@/frontend/features/staff/StaffModal";
import BoxOfficeSalesModal from "@/frontend/features/staff/BoxOfficeSalesModal";
import DrinksSalesModal from "@/frontend/features/staff/DrinksSalesModal";
import PublishEventModal from "@/frontend/components/PublishEventModal";
import OrganizerPublishScreen from "@/frontend/features/organizer/OrganizerPublishScreen";
import VkFest3DCylinderCarousel from "@/frontend/components/VkFest3DCylinderCarousel";
import EventTicketCarousel, { CAROUSEL_EVENTS } from "@/frontend/components/EventTicketCarousel";
import EventDetailOverlay from "@/frontend/features/events/EventDetailOverlay";
import ReservationCheckoutModal from "@/frontend/components/ReservationCheckoutModal";
import EventPurchaseCheckoutModal from "@/frontend/components/EventPurchaseCheckoutModal";
import InstallApp from "@/frontend/components/InstallApp";
import MobileDock from "@/frontend/components/MobileDock";
import Footer from "@/components/Footer";
import OrganizerProfileOverlay, { ORGANIZER_DATA } from "@/frontend/features/organizer/OrganizerProfileOverlay";
import { QuickPreviewModal } from "@/frontend/components/QuickPreviewModal";
import DrinksMenuModal from "@/frontend/components/DrinksMenuModal";
import StoryLinesHeader, { type StoryScreen } from "@/frontend/components/StoryLinesHeader";
import AlienIcon from "@/frontend/components/AlienIcon";
import { events as fallbackEvents } from "@/frontend/services/nenezData";
import { useHomepageConfig } from "@/frontend/hooks/useHomepageConfig";
import OrganizerOnboardingModal from "@/frontend/components/OrganizerOnboardingModal";
import CoOrganizerModal from "@/frontend/components/CoOrganizerModal";
import LocationPickerModal from "@/frontend/components/LocationPickerModal";
import MyAccountDashboardModal from "@/frontend/features/account/MyAccountDashboardModal";
import type { ThemeColors } from "@/lib/homepage-config/themes";
import type { HomepageConfig } from "@/lib/homepage-config/types";
import type { Event } from "@/frontend/types/domain";
import { getOnlineSalesStatus } from "@/frontend/utils/cutoff";

const HOME_NAV_ITEMS = [
  { id: "home", label: "Home" },
  { id: "explore", label: "Shows" },
  { id: "merch", label: "Merch" },
  { id: "access", label: "Passes" },
];

export interface SearchProfile {
  id: string;
  name: string;
  type: "Organizador" | "Discoteca / Club Nocturno";
  avatar?: string;
  instagramUrl?: string;
}

export const SEARCH_PROFILES: SearchProfile[] = Object.values(ORGANIZER_DATA).map((item) => ({
  id: item.id,
  name: item.name,
  type: item.type,
  avatar: item.logo,
  instagramUrl: item.instagramUrl,
}));

type HomeNavId = (typeof HOME_NAV_ITEMS)[number]["id"];

// Segmented control / pill tabs for content filtering
const FILTER_TABS = [
  { id: "inicio", label: "HOME" },
  { id: "all", label: "Todo" },
  { id: "fiestas", label: "Fiestas" },
  { id: "conciertos", label: "Conciertos" },
] as const;

type FilterTabId = (typeof FILTER_TABS)[number]["id"] | "ciudad" | "publish";

interface HomePageProps {
  initialConfig: HomepageConfig;
  initialEventSlug?: string;
  initialLoggedIn?: boolean;
}

function TypewriterText({ text }: { text: string }) {
  const [displayedCount, setDisplayedCount] = useState(0);
  const textLength = text.length;

  useEffect(() => {
    setDisplayedCount(0);
    const timer = setInterval(() => {
      setDisplayedCount((prev) => {
        if (prev >= textLength) {
          clearInterval(timer);
          return textLength;
        }
        return prev + 1;
      });
    }, 28);
    return () => clearInterval(timer);
  }, []);

  const isFinished = displayedCount >= textLength;

  return (
    <span className="font-mono tracking-wider inline-flex items-center justify-center">
      <span>{isFinished ? text : text.slice(0, displayedCount)}</span>
      <span className="inline-block w-1.5 h-3 ml-1 bg-white/80 animate-pulse align-middle" />
    </span>
  );
}

export default function HomePage({ initialConfig, initialEventSlug, initialLoggedIn }: HomePageProps) {
  const router = useRouter();
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const manualActiveUntil = useRef(0);

  const [events, setEvents] = useState<Event[]>(fallbackEvents);
  const [activeSection, setActiveSection] = useState<HomeNavId>("home");
  const [activeFilterTab, setActiveFilterTab] = useState<FilterTabId>("inicio");
  const [showHiddenMenu, setShowHiddenMenu] = useState(false);
  const [merchSlideIndex, setMerchSlideIndex] = useState(0);

  const MERCH_SHOWCASE_IMAGES = [
    { src: "/images/nenez_merch_official_couch_hero.png", title: "4GO x NENEZ Official Merch" },
  ];

  useEffect(() => {
    // Static photo - no slide rotation
  }, []);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isOrganizerOnboardingOpen, setIsOrganizerOnboardingOpen] = useState(false);
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [isPosModalOpen, setIsPosModalOpen] = useState(false);
  const [isDrinksPosModalOpen, setIsDrinksPosModalOpen] = useState(false);
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [showAuthModalForFavorites, setShowAuthModalForFavorites] = useState(false);

  const [isMounted, setIsMounted] = useState(false);
  const [userLoggedIn, setUserLoggedIn] = useState<boolean>(() => {
    if (initialLoggedIn) return true;
    if (typeof window !== "undefined") {
      try {
        const token = localStorage.getItem("organizer_token");
        const profile = localStorage.getItem("organizer_profile");
        if (token && profile) {
          document.cookie = "organizer_logged_in=1; path=/; max-age=31536000; SameSite=Lax";
          return true;
        }
      } catch {
        return false;
      }
    }
    return false;
  });
  const [userProfile, setUserProfile] = useState<{ id: string; name: string; email: string; avatar?: string; type?: string; venueName?: string; city?: string; instagram?: string; address?: string; openingHours?: string; openingDays?: string[]; hasCompletedOnboarding?: boolean } | null>(() => {
    if (typeof window !== "undefined") {
      try {
        const profile = localStorage.getItem("organizer_profile");
        if (profile) {
          const parsed = JSON.parse(profile);
          if (parsed && parsed.email) {
            const cleanEmail = parsed.email.trim().toLowerCase();
            const isMaster = cleanEmail === "brandon.medina@unl.edu.ec" || cleanEmail === "master@4go.live";
            const isCubic = cleanEmail === "mrshifu879@gmail.com";
            if (isMaster) {
              parsed.id = "master_admin";
              parsed.venueName = parsed.venueName && !parsed.venueName.includes("Master Headquarters") ? parsed.venueName : "4GO";
              parsed.type = "Organizador";
              parsed.avatar = parsed.avatar && !parsed.avatar.includes("presentation") ? parsed.avatar : "/images/logo_4go_black_white.png";
              parsed.hasCompletedOnboarding = true;
            } else if (isCubic) {
              parsed.id = "cubic";
              parsed.venueName = parsed.venueName || "CUBIC LOJA";
              parsed.type = parsed.type || "Discoteca / Club Nocturno";
              parsed.avatar = parsed.avatar || "/images/cubic-official-logo.png";
              parsed.hasCompletedOnboarding = true;
            }
            return parsed;
          }
        }
      } catch {
        return null;
      }
    }
    return null;
  });
  const [organizerSubView, setOrganizerSubView] = useState<'menu' | 'profile' | 'create_event' | 'published' | 'my_events' | 'favorites'>('menu');
  const [lastPublishedEvent, setLastPublishedEvent] = useState<any>(null);
  const [showEventPublishedToast, setShowEventPublishedToast] = useState(false);

  useEffect(() => {
    if (showEventPublishedToast) {
      const timer = setTimeout(() => {
        setShowEventPublishedToast(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [showEventPublishedToast]);

  const [newEventPoster, setNewEventPoster] = useState('');
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventSubtitle, setNewEventSubtitle] = useState('');
  const [newEventDate, setNewEventDate] = useState('');
  const [newEventDoorsOpen, setNewEventDoorsOpen] = useState('22:00');
  const [newEventCategory, setNewEventCategory] = useState('Electronic / House');
  const [newEventCity, setNewEventCity] = useState('Loja');
  const [newEventPresales, setNewEventPresales] = useState<{ id: number; name: string; price: string; duration?: string; customEndDate?: string; capacity?: string }[]>([
    { id: 1, name: 'Preventa 1', price: '5', duration: '1_semana', customEndDate: '', capacity: '' },
  ]);
  const [newEventDescription, setNewEventDescription] = useState('');
  const [newEventAgeRestriction, setNewEventAgeRestriction] = useState('+18 Años (Cédula de identidad física obligatoria)');
  const [newEventPolicies, setNewEventPolicies] = useState<string[]>([
    'Cédula o documento físico obligatorio',
    'Prohibido ingreso de bebidas y alimentos',
    'Derecho de admisión reservado',
  ]);
  const [newEventVenueName, setNewEventVenueName] = useState('');
  const [newEventVenueAddress, setNewEventVenueAddress] = useState('');
  const [newEventCoOrganizers, setNewEventCoOrganizers] = useState<string[]>([]);
  const [isAccountDashboardOpen, setIsAccountDashboardOpen] = useState(false);
  const [accountDashboardInitialTab, setAccountDashboardInitialTab] = useState<any>(undefined);
  const [isMasterDashboardOpen, setIsMasterDashboardOpen] = useState(false);
  const isMasterUser = Boolean(
    userProfile &&
    (userProfile.type === "Master Admin" ||
     userProfile.type === "master" ||
     userProfile.email?.toLowerCase().trim() === "brandon.medina@unl.edu.ec" ||
     userProfile.email?.toLowerCase().trim() === "master@4go.live")
  );
  const [isOnboardingSaving, setIsOnboardingSaving] = useState(false);
  const [isCoOrganizerModalOpen, setIsCoOrganizerModalOpen] = useState(false);
  const [isLocationPickerOpen, setIsLocationPickerOpen] = useState(false);
  const [agreeFiscal, setAgreeFiscal] = useState(false);
  const [agreeMunicipal, setAgreeMunicipal] = useState(false);

  const [orgType, setOrgType] = useState('Discoteca / Club');
  const [orgName, setOrgName] = useState('');
  const [orgCity, setOrgCity] = useState('Loja');
  const [brandLogoUrl, setBrandLogoUrl] = useState('');
  const [instagramHandle, setInstagramHandle] = useState('');
  const [clubAddress, setClubAddress] = useState('');
  const [openingHours, setOpeningHours] = useState('21:00 - 04:00');
  const [openTime, setOpenTime] = useState('21:00');
  const [closeTime, setCloseTime] = useState('04:00');
  const [openingDays, setOpeningDays] = useState<string[]>(['Jueves', 'Viernes', 'Sábado']);

  useEffect(() => {
    if (userProfile) {
      if (userProfile.avatar) setBrandLogoUrl(userProfile.avatar);
      const mainOrg = userProfile.venueName || userProfile.name || "";
      if (mainOrg) {
        setOrgName(mainOrg);
        setNewEventVenueName((prev) => (!prev || prev === "Cubic Club" ? (userProfile.venueName || userProfile.name || "") : prev));
        setNewEventCoOrganizers([mainOrg]);
      }
      if (userProfile.type) setOrgType(userProfile.type);
      if (userProfile.instagram) setInstagramHandle(userProfile.instagram.replace(/^@/, ''));
      if (userProfile.address) {
        setClubAddress(userProfile.address);
        setNewEventVenueAddress((prev) => (!prev || prev.includes("Salvador Bustamante") ? (userProfile.address || "") : prev));
      }
      if (userProfile.city) setOrgCity(userProfile.city);
      if (userProfile.openingDays && userProfile.openingDays.length > 0) setOpeningDays(userProfile.openingDays);
    }
  }, [userProfile]);

  useEffect(() => {
    setIsMounted(true);
    if (typeof window !== "undefined") {
      // Helper function to build dynamic profile for any logged in email
      const resolveProfileForEmail = (
        email: string,
        name?: string,
        avatar?: string,
        sub?: string
      ) => {
        const cleanEmail = (email || "").trim().toLowerCase();
        const isMaster = cleanEmail === "brandon.medina@unl.edu.ec" || cleanEmail === "master@4go.live";
        const isCubic = cleanEmail === "mrshifu879@gmail.com";

        let savedPerEmail: any = null;
        try {
          const stored = localStorage.getItem(`organizer_profile_${cleanEmail}`);
          if (stored) savedPerEmail = JSON.parse(stored);
        } catch { }

        if (isMaster) {
          return {
            id: "master_admin",
            name: name || "Brandon Medina (4GO)",
            email: cleanEmail,
            avatar: "/images/logo_4go_black_white.png",
            type: "Organizador",
            venueName: "4GO",
            city: "Loja",
            hasCompletedOnboarding: true,
          };
        }

        if (isCubic) {
          return {
            id: "cubic",
            name: name || "Brandon Medina",
            email: cleanEmail,
            avatar: "/images/cubic-official-logo.png",
            type: "Discoteca / Club Nocturno",
            venueName: "CUBIC LOJA",
            city: "Loja",
            hasCompletedOnboarding: true,
          };
        }

        if (savedPerEmail && savedPerEmail.hasCompletedOnboarding) {
          return {
            ...savedPerEmail,
            email: cleanEmail,
            name: savedPerEmail.name || name || cleanEmail.split("@")[0],
            avatar: savedPerEmail.avatar || avatar || "",
            hasCompletedOnboarding: true,
          };
        }

        const fallbackName = cleanEmail ? cleanEmail.split("@")[0] : "Usuario";
        return {
          id: sub ? `usr_${sub}` : `usr_${Date.now()}`,
          name: name || fallbackName,
          email: cleanEmail,
          avatar: avatar || "",
          type: "Usuario",
          venueName: "",
          city: "Loja",
          hasCompletedOnboarding: false,
        };
      };

      // 1. Detect Google OAuth Callback (hash: id_token / access_token or url query: code)
      const hash = window.location.hash ? window.location.hash.replace(/^#/, '') : '';
      const hashParams = new URLSearchParams(hash);
      const idToken = hashParams.get("id_token");
      const accessToken = hashParams.get("access_token");

      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get("code");

      if (idToken || accessToken || code) {
        window.history.replaceState({}, document.title, window.location.pathname);

        let userEmail = "";
        let userName = "";
        let userAvatar = "";
        let userSub = "";

        if (idToken) {
          try {
            const base64Url = idToken.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(
              atob(base64)
                .split('')
                .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                .join('')
            );
            const parsedToken = JSON.parse(jsonPayload);
            userEmail = (parsedToken.email || "").trim().toLowerCase();
            userName = parsedToken.name || parsedToken.given_name || "";
            userAvatar = parsedToken.picture || "";
            userSub = parsedToken.sub || "";
          } catch (e) {
            console.error("Error decoding id_token:", e);
          }
        }

        const completeLogin = (email: string, name: string, avatar: string, sub: string) => {
          if (!email) return;
          const userObj = resolveProfileForEmail(email, name, avatar, sub);

          localStorage.setItem("organizer_token", `google-auth-${email}-${Date.now()}`);
          localStorage.setItem("organizer_profile", JSON.stringify(userObj));
          localStorage.setItem(`organizer_profile_${email}`, JSON.stringify(userObj));
          if (typeof document !== "undefined") {
            document.cookie = "organizer_logged_in=1; path=/; max-age=31536000; SameSite=Lax";
          }

          setUserProfile(userObj);
          setUserLoggedIn(true);
          setOrganizerSubView("menu");
          setShowAuthModalForFavorites(false);
          setShowUserMenu(false);

          fetch("/api/users/sync", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email,
              name: userObj.name,
              avatar: userObj.avatar,
              provider: "google",
              providerId: sub,
              type: userObj.type,
              venueName: userObj.venueName,
              city: userObj.city,
            }),
          }).catch((err) => console.error("Error syncing user to DB:", err));
        };

        if (accessToken) {
          fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
            headers: { Authorization: `Bearer ${accessToken}` },
          })
            .then((res) => (res.ok ? res.json() : null))
            .then((info) => {
              if (info && info.email) {
                completeLogin(
                  info.email,
                  info.name || userName,
                  info.picture || userAvatar,
                  info.sub || userSub
                );
              } else if (userEmail) {
                completeLogin(userEmail, userName, userAvatar, userSub);
              }
            })
            .catch(() => {
              if (userEmail) {
                completeLogin(userEmail, userName, userAvatar, userSub);
              }
            });
        } else if (userEmail) {
          completeLogin(userEmail, userName, userAvatar, userSub);
        }
      } else {
        // 2. Normal LocalStorage Session Restore
        const token = localStorage.getItem("organizer_token");
        const profile = localStorage.getItem("organizer_profile");
        if (token && profile) {
          try {
            const parsed = JSON.parse(profile);
            if (parsed && parsed.email) {
              const cleanEmail = parsed.email.trim().toLowerCase();
              const isMaster = cleanEmail === "brandon.medina@unl.edu.ec" || cleanEmail === "master@4go.live";
              const isCubic = cleanEmail === "mrshifu879@gmail.com";

              if (isMaster) {
                parsed.id = "master_admin";
                parsed.venueName = parsed.venueName && !parsed.venueName.includes("Master Headquarters") ? parsed.venueName : "4GO";
                parsed.type = "Organizador";
                parsed.avatar = parsed.avatar && !parsed.avatar.includes("presentation") ? parsed.avatar : "/images/logo_4go_black_white.png";
                parsed.hasCompletedOnboarding = true;
              } else if (isCubic) {
                parsed.id = "cubic";
                parsed.venueName = parsed.venueName || "CUBIC LOJA";
                parsed.type = parsed.type || "Discoteca / Club Nocturno";
                parsed.avatar = parsed.avatar || "/images/cubic-official-logo.png";
                parsed.hasCompletedOnboarding = true;
              }

              if (typeof document !== "undefined") {
                document.cookie = "organizer_logged_in=1; path=/; max-age=31536000; SameSite=Lax";
              }
              setUserProfile(parsed);
              setUserLoggedIn(true);
            }
          } catch {
            if (typeof document !== "undefined") {
              document.cookie = "organizer_logged_in=; path=/; max-age=0; SameSite=Lax";
            }
            localStorage.removeItem("organizer_token");
            localStorage.removeItem("organizer_profile");
          }
        }
      }

      // Check if routed from /cuenta to publish event
      const currentParams = new URLSearchParams(window.location.search);
      if (currentParams.get("action") === "create_event") {
        setActiveStoryScreen(0);
        setOrganizerSubView("create_event");
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, []);

  const [isAppleAuthModalOpen, setIsAppleAuthModalOpen] = useState(false);
  const [appleInputEmail, setAppleInputEmail] = useState('brandon.medina@icloud.com');
  const [appleInputName, setAppleInputName] = useState('Brandon Medina');

  const handleConfirmAppleLogin = () => {
    if (!appleInputEmail.trim()) return;
    const cleanEmail = appleInputEmail.trim().toLowerCase();
    const isMaster = cleanEmail === "brandon.medina@unl.edu.ec" || cleanEmail === "master@4go.live";
    const isCubic = cleanEmail === "mrshifu879@gmail.com";
    const mockProfile = {
      id: isMaster ? "master_admin" : isCubic ? "cubic" : `usr_${Date.now()}`,
      name: appleInputName.trim() || cleanEmail.split('@')[0] || (isMaster ? "Brandon Medina (4GO)" : "Usuario Apple"),
      email: cleanEmail,
      type: isMaster ? "Organizador" : isCubic ? "Discoteca / Club Nocturno" : "Usuario",
      venueName: isMaster ? "4GO" : isCubic ? "CUBIC LOJA" : "",
      avatar: isMaster ? "/images/logo_4go_black_white.png" : isCubic ? "/images/cubic-official-logo.png" : "",
      city: "Loja",
      hasCompletedOnboarding: isMaster || isCubic,
    };
    localStorage.setItem("organizer_token", `apple-token-${cleanEmail}-${Date.now()}`);
    localStorage.setItem("organizer_profile", JSON.stringify(mockProfile));
    localStorage.setItem(`organizer_profile_${cleanEmail}`, JSON.stringify(mockProfile));
    if (typeof document !== "undefined") {
      document.cookie = "organizer_logged_in=1; path=/; max-age=31536000; SameSite=Lax";
    }
    setUserLoggedIn(true);
    setUserProfile(mockProfile);
    setOrganizerSubView("menu");
    setIsAppleAuthModalOpen(false);
  };

  const handleQuickSocialLogin = (provider: 'google' | 'apple') => {
    if (provider === 'google') {
      setShowAuthModalForFavorites(false);
      setShowUserMenu(false);

      const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '461941866446-kfh7r6aqq5p3g09g0iau4m597eppv69i.apps.googleusercontent.com';
      const redirectUri = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
      const nonce = Math.random().toString(36).substring(2);
      const googleOAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=token%20id_token&scope=email%20profile%20openid&prompt=select_account&nonce=${encodeURIComponent(nonce)}`;

      if (typeof window !== 'undefined') {
        window.location.href = googleOAuthUrl;
      }
      return;
    }
    setIsAppleAuthModalOpen(true);
  };

  const handleLogout = () => {
    if (typeof document !== "undefined") {
      document.cookie = "organizer_logged_in=; path=/; max-age=0; SameSite=Lax";
    }
    localStorage.removeItem("organizer_token");
    localStorage.removeItem("organizer_profile");
    setUserLoggedIn(false);
    setUserProfile(null);
    setUserReservations({});
    setLikedEvents({});
    setSelectedDay("todos");
    setShowUserMenu(false);
    setOrganizerSubView('menu');
    if (typeof window !== "undefined") {
      window.history.replaceState({}, document.title, window.location.pathname);
      window.location.reload();
    }
  };

  const handleStartPublishEvent = () => {
    setShowUserMenu(false);
    setActiveStoryScreen(0);

    if (userProfile?.hasCompletedOnboarding) {
      setOrganizerSubView("create_event");
    } else {
      setOrganizerSubView("profile");
    }

    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleCompleteOnboarding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgName.trim() || !userProfile?.email) return;

    const email = userProfile.email.trim().toLowerCase();
    const updatedUser = {
      ...userProfile,
      venueName: orgName.trim(),
      type: orgType,
      city: orgCity,
      instagram: instagramHandle.trim(),
      address: clubAddress.trim(),
      avatar: brandLogoUrl || userProfile.avatar || "",
      hasCompletedOnboarding: true,
    };

    localStorage.setItem("organizer_token", `token-${email}-${Date.now()}`);
    localStorage.setItem("organizer_profile", JSON.stringify(updatedUser));
    localStorage.setItem(`organizer_profile_${email}`, JSON.stringify(updatedUser));

    setUserProfile(updatedUser);
    setOrganizerSubView("create_event");

    fetch("/api/users/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        name: updatedUser.name || orgName.trim(),
        avatar: updatedUser.avatar,
        provider: "google",
        type: orgType,
        venueName: orgName.trim(),
        city: orgCity,
      }),
    }).catch((err) => console.error("Error updating organizer profile:", err));
  };

  // Simulated user session (replace with real auth later)
  const [loggedUser] = useState<{ name: string; initials: string; notifications: number } | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const stored = sessionStorage.getItem("sg_user");
      return stored ? JSON.parse(stored) : null;
    } catch { return null; }
  });
  const [showFarewell, setShowFarewell] = useState(false);
  const [farewellName, setFarewellName] = useState("");
  const accessDropRef = useRef<AccessDropHandle>(null);
  const checkoutDragControls = useDragControls();
  const [isTicketPulse, setIsTicketPulse] = useState(false);
  const [isRecoveryPulse, setIsRecoveryPulse] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const [activeOverlay, setActiveOverlay] = useState<"organizer" | "event" | null>(null);
  const showDetailOverlay = activeOverlay === "event";
  const showOrganizerOverlay = activeOverlay === "organizer";
  const setShowDetailOverlay = (val: boolean) => setActiveOverlay(val ? "event" : null);
  const setShowOrganizerOverlay = (val: boolean) => setActiveOverlay(val ? "organizer" : null);
  const [selectedOrganizerSlug, setSelectedOrganizerSlug] = useState("cubic");
  const [showReservationModal, setShowReservationModal] = useState(false);
  const [reservationTargetEvent, setReservationTargetEvent] = useState<Event | null>(null);
  const [showQuickPreview, setShowQuickPreview] = useState(false);
  const [quickPreviewEvent, setQuickPreviewEvent] = useState<any>(null);
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);
  const [showDrinksModal, setShowDrinksModal] = useState(false);
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);
  const [selectedCarouselEvent, setSelectedCarouselEvent] = useState<Event>(CAROUSEL_EVENTS[0]);

  // 3D Perspective Curved Carousel state for Eventos screen
  const [featuredCarouselIndex, setFeaturedCarouselIndex] = useState(0);

  const [activeStoryScreen, setActiveStoryScreen] = useState(1);
  const [isLeftVideoMuted, setIsLeftVideoMuted] = useState(true);
  const leftVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (activeStoryScreen === 0 && leftVideoRef.current) {
      leftVideoRef.current.muted = isLeftVideoMuted;
      leftVideoRef.current.play().catch(() => {});
    } else if (leftVideoRef.current) {
      leftVideoRef.current.pause();
    }
  }, [activeStoryScreen, isLeftVideoMuted]);

  // Responsive animation state: animations disabled on mobile, enabled on PC (>= 768px)
  const [isDesktopAnimation, setIsDesktopAnimation] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const checkScreen = () => setIsDesktopAnimation(window.innerWidth >= 768);
    checkScreen();
    window.addEventListener("resize", checkScreen);
    return () => window.removeEventListener("resize", checkScreen);
  }, []);

  // Auto-play 3D Curved Carousel in Eventos screen (moving to the right)
  useEffect(() => {
    if (activeStoryScreen !== 2) return;
    const interval = setInterval(() => {
      setFeaturedCarouselIndex((prev) => (prev + 1) % Math.max(1, (events || []).length));
    }, 2800);
    return () => clearInterval(interval);
  }, [activeStoryScreen, events]);

  const storyScreens: StoryScreen[] = [
    { id: "create", label: "Sube tu evento", icon: <PlusCircle className="w-3.5 h-3.5 text-emerald-400" /> },
    { id: "home", label: "Home", icon: <Sparkles className="w-3.5 h-3.5 text-yellow-400" /> },
    { id: "eventos", label: "Cartelera", icon: <Calendar className="w-3.5 h-3.5 text-purple-400" /> },
  ];

  const handleScreenDragEnd = (_: any, info: { offset: { x: number }; velocity: { x: number } }) => {
    const swipeThreshold = 25;
    if (info.offset.x < -swipeThreshold || info.velocity.x < -100) {
      setActiveStoryScreen((prev) => Math.min(prev + 1, storyScreens.length - 1));
    } else if (info.offset.x > swipeThreshold || info.velocity.x > 100) {
      setActiveStoryScreen((prev) => Math.max(prev - 1, 0));
    }
  };

  // Native Touch, Trackpad 2-finger wheel & Keyboard Arrows navigation
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const lastSwipeTime = useRef(0);

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      if (showDetailOverlay || isTicketModalOpen || showEventModal || showHiddenMenu || showUserMenu || showAuthModalForFavorites) return;
      if (e.touches.length === 0) return;

      const touch = e.touches[0];
      const target = e.target as HTMLElement | null;

      // 0. Edge swipe check: on mobile browsers (Brave, Chrome, Safari), swipes starting near edges are native back/forward gestures
      const screenWidth = typeof window !== "undefined" ? window.innerWidth : 400;
      if (touch.clientX < 45 || touch.clientX > screenWidth - 45) {
        touchStartX.current = null;
        touchStartY.current = null;
        return;
      }

      // 1. Direct target check inside carousel or trending events section
      if (target?.closest("#trending-events-carousel, #trending-events-section, [data-carousel], .no-swipe")) {
        touchStartX.current = null;
        touchStartY.current = null;
        return;
      }

      // 2. Position check: Only allow section swipe if higher up on the screen (above the carousel section)
      const carouselSection = document.getElementById("trending-events-section");
      if (carouselSection) {
        const rect = carouselSection.getBoundingClientRect();
        // If touch starts at or below the top of the carousel section, ignore section swipe!
        if (touch.clientY >= rect.top - 20) {
          touchStartX.current = null;
          touchStartY.current = null;
          return;
        }
      }

      touchStartX.current = touch.clientX;
      touchStartY.current = touch.clientY;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (showDetailOverlay || isTicketModalOpen || showEventModal || showHiddenMenu || showUserMenu || showAuthModalForFavorites) return;
      if (touchStartX.current === null || touchStartY.current === null) return;
      if (!e.changedTouches || e.changedTouches.length === 0) return;

      const touch = e.changedTouches[0];
      const target = e.target as HTMLElement | null;

      if (target?.closest("#trending-events-carousel, #trending-events-section, [data-carousel], .no-swipe")) {
        touchStartX.current = null;
        touchStartY.current = null;
        return;
      }

      const carouselSection = document.getElementById("trending-events-section");
      if (carouselSection) {
        const rect = carouselSection.getBoundingClientRect();
        if (touch.clientY >= rect.top - 20) {
          touchStartX.current = null;
          touchStartY.current = null;
          return;
        }
      }

      const now = Date.now();
      if (now - lastSwipeTime.current < 750) {
        touchStartX.current = null;
        touchStartY.current = null;
        return;
      }

      const touchEndX = touch.clientX;
      const touchEndY = touch.clientY;

      const diffX = touchEndX - touchStartX.current;
      const diffY = touchEndY - touchStartY.current;

      // Ensure horizontal swipe is dominant and above 80px threshold
      if (Math.abs(diffX) > 80 && Math.abs(diffX) > Math.abs(diffY) * 1.5) {
        if (diffX < -80) {
          setActiveStoryScreen((prev) => Math.min(prev + 1, storyScreens.length - 1));
          lastSwipeTime.current = now;
        } else if (diffX > 80) {
          setActiveStoryScreen((prev) => Math.max(prev - 1, 0));
          lastSwipeTime.current = now;
        }
      }

      touchStartX.current = null;
      touchStartY.current = null;
    };

    const handleWheel = (e: WheelEvent) => {
      if (showDetailOverlay || isTicketModalOpen || showEventModal || showHiddenMenu || showUserMenu || showAuthModalForFavorites) return;

      const target = e.target as HTMLElement | null;
      if (target?.closest("#trending-events-carousel, #trending-events-section, [data-carousel], .no-swipe")) {
        return;
      }

      const carouselSection = document.getElementById("trending-events-section");
      if (carouselSection) {
        const rect = carouselSection.getBoundingClientRect();
        if (e.clientY >= rect.top - 20) {
          return;
        }
      }

      const now = Date.now();
      if (now - lastSwipeTime.current < 750) return;

      // Trackpad 2-finger horizontal scroll detection (deltaX)
      if (Math.abs(e.deltaX) > 20 && Math.abs(e.deltaX) > Math.abs(e.deltaY) * 1.5) {
        if (e.deltaX > 20) {
          setActiveStoryScreen((prev) => Math.min(prev + 1, storyScreens.length - 1));
          lastSwipeTime.current = now;
        } else if (e.deltaX < -20) {
          setActiveStoryScreen((prev) => Math.max(prev - 1, 0));
          lastSwipeTime.current = now;
        }
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = (document.activeElement?.tagName || "").toUpperCase();
      if (["INPUT", "TEXTAREA"].includes(activeTag)) return;
      if (showDetailOverlay || isTicketModalOpen || showEventModal || showHiddenMenu || showUserMenu || showAuthModalForFavorites) return;

      const now = Date.now();
      if (now - lastSwipeTime.current < 400) return;

      if (e.key === "ArrowRight") {
        setActiveStoryScreen((prev) => Math.min(prev + 1, storyScreens.length - 1));
        lastSwipeTime.current = now;
      } else if (e.key === "ArrowLeft") {
        setActiveStoryScreen((prev) => Math.max(prev - 1, 0));
        lastSwipeTime.current = now;
      }
    };

    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchend", handleTouchEnd, { passive: true });
    window.addEventListener("wheel", handleWheel, { passive: true });
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchend", handleTouchEnd);
      window.removeEventListener("wheel", handleWheel);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [storyScreens.length, showDetailOverlay, isTicketModalOpen, showEventModal, showHiddenMenu, showUserMenu, showAuthModalForFavorites]);

  const isInitialRestored = useRef(false);

  // Restore active event detail overlay or reservation modal on refresh / initial mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!events || events.length === 0) return;

    const params = new URLSearchParams(window.location.search);
    const urlEventParam = params.get("event");
    const isReserveParam = params.get("reserve") === "1" || params.get("reserve") === "true";

    let savedView: { eventId?: string; eventSlug?: string; showDetail?: boolean; showReservation?: boolean } | null = null;
    try {
      const raw = sessionStorage.getItem("nnz_active_view");
      if (raw) savedView = JSON.parse(raw);
    } catch { }

    const targetIdentifier = initialEventSlug || urlEventParam || savedView?.eventSlug || savedView?.eventId;
    const shouldReserve = isReserveParam || Boolean(savedView?.showReservation);
    const shouldShowDetail = Boolean(initialEventSlug) || Boolean(urlEventParam) || Boolean(savedView?.showDetail) || shouldReserve;
    const urlOrgParam = params.get("organizer") || params.get("org");

    if (urlOrgParam) {
      setSelectedOrganizerSlug(urlOrgParam.toLowerCase().trim());
      setActiveOverlay("organizer");
    }

    if (targetIdentifier) {
      const targetSlug = String(targetIdentifier).toLowerCase();
      const match = events.find((e) => {
        if (!e) return false;
        const slugMatch = typeof (e as any).slug === "string" && (e as any).slug.toLowerCase() === targetSlug;
        const idMatch = typeof e.id === "string" && e.id.toLowerCase() === targetSlug;
        return slugMatch || idMatch;
      });

      if (match) {
        setSelectedCarouselEvent(match);
        setReservationTargetEvent(match);
        const foundIdx = events.findIndex((e) => e.id === match.id);
        if (foundIdx !== -1) setActiveIndex(foundIdx);

        if (shouldShowDetail) {
          setShowDetailOverlay(true);
        }
        if (shouldReserve) {
          setShowReservationModal(true);
        }
      }
    }

    isInitialRestored.current = true;
  }, [events, initialEventSlug]);

  // Persist active event detail overlay or reservation modal state to URL & sessionStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!isInitialRestored.current) return;

    const isCheckoutOpen = showReservationModal || isTicketModalOpen;
    const activeEvt = reservationTargetEvent || selectedCarouselEvent;

    if ((showDetailOverlay || isCheckoutOpen) && activeEvt) {
      const eventSlugOrId = (activeEvt as any).slug || activeEvt.id;

      try {
        sessionStorage.setItem(
          "nnz_active_view",
          JSON.stringify({
            eventId: activeEvt.id,
            eventSlug: (activeEvt as any).slug || activeEvt.id,
            showDetail: showDetailOverlay,
            showReservation: isCheckoutOpen,
          })
        );
      } catch { }

      const url = new URL(window.location.href);
      url.searchParams.set("event", eventSlugOrId);
      if (isCheckoutOpen) {
        url.searchParams.set("reserve", "1");
      } else {
        url.searchParams.delete("reserve");
      }
      url.searchParams.delete("organizer");
      url.searchParams.delete("org");
      window.history.replaceState({}, "", url.toString());
    } else if (activeOverlay === "organizer" && selectedOrganizerSlug) {
      const url = new URL(window.location.href);
      url.searchParams.set("organizer", selectedOrganizerSlug);
      url.searchParams.delete("event");
      url.searchParams.delete("reserve");
      window.history.replaceState({}, "", url.toString());
    } else {
      try {
        sessionStorage.removeItem("nnz_active_view");
      } catch { }

      const url = new URL(window.location.href);
      if (url.searchParams.has("event") || url.searchParams.has("reserve") || url.searchParams.has("organizer") || url.searchParams.has("org")) {
        url.searchParams.delete("event");
        url.searchParams.delete("reserve");
        url.searchParams.delete("organizer");
        url.searchParams.delete("org");
        window.history.replaceState({}, "", url.toString());
      }
    }
  }, [showDetailOverlay, showReservationModal, isTicketModalOpen, selectedCarouselEvent, reservationTargetEvent, activeOverlay, selectedOrganizerSlug]);

  // Search & Catalog Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [isHeaderSearchOpen, setIsHeaderSearchOpen] = useState(false);
  const [headerSearchQuery, setHeaderSearchQuery] = useState("");
  const headerSearchInputRef = useRef<HTMLInputElement>(null);
  const [selectedCity, setSelectedCity] = useState("Todas");
  const [selectedDay, setSelectedDay] = useState("todos");
  const [carteleraSearchQuery, setCarteleraSearchQuery] = useState("");
  const [selectedOrganizer, setSelectedOrganizer] = useState("todos");
  const [openedFromOrganizerSlug, setOpenedFromOrganizerSlug] = useState<string | null>(null);
  const [openedFromEvent, setOpenedFromEvent] = useState<Event | null>(null);
  const [mobileDockTab, setMobileDockTab] = useState("inicio");
  const [heroIndex, setHeroIndex] = useState(0);
  const [isCarouselHovered, setIsCarouselHovered] = useState(false);
  const [likedEvents, setLikedEvents] = useState<Record<string, boolean>>({});
  const [userReservations, setUserReservations] = useState<Record<string, boolean>>({});

  // Cartelera Chips Scroll Navigation State
  const carteleraChipsRef = useRef<HTMLDivElement>(null);
  const [canChipsScrollLeft, setCanChipsScrollLeft] = useState(false);
  const [canChipsScrollRight, setCanChipsScrollRight] = useState(true);

  const checkChipsScroll = () => {
    const el = carteleraChipsRef.current;
    if (el) {
      const isLeft = el.scrollLeft > 4;
      const isRight = el.scrollLeft + el.clientWidth < el.scrollWidth - 4;
      setCanChipsScrollLeft(isLeft);
      setCanChipsScrollRight(isRight);
    }
  };

  useEffect(() => {
    if (activeStoryScreen === 2) {
      setTimeout(checkChipsScroll, 100);
      window.addEventListener("resize", checkChipsScroll);
      return () => window.removeEventListener("resize", checkChipsScroll);
    }
  }, [activeStoryScreen]);

  // Listen to custom navigation & modal triggers dispatched from Footer
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleFooterNav = (e: any) => {
      setActiveStoryScreen(2); // Switches to Cartelera / Events screen
      const filter = e.detail?.filter;
      if (filter === "dj") {
        setSelectedDay("dj");
      }
    };

    const handleOrgRegister = () => {
      setShowUserMenu(true);
      setOrganizerSubView("create_event");
    };

    const handleOrgLogin = () => {
      setShowUserMenu(true);
      setOrganizerSubView("menu");
    };

    window.addEventListener("footer-navigate", handleFooterNav);
    window.addEventListener("open-organizer-register", handleOrgRegister);
    window.addEventListener("open-organizer-login", handleOrgLogin);

    return () => {
      window.removeEventListener("footer-navigate", handleFooterNav);
      window.removeEventListener("open-organizer-register", handleOrgRegister);
      window.removeEventListener("open-organizer-login", handleOrgLogin);
    };
  }, []);

  // Sync per-user favorites and reservations from localStorage & DB on login
  useEffect(() => {
    const emailToUse = userProfile?.email || (() => {
      if (typeof window === "undefined") return null;
      try {
        const stored = localStorage.getItem("organizer_profile");
        return stored ? JSON.parse(stored).email : null;
      } catch { return null; }
    })();

    if (emailToUse) {
      // 1. Load favorites from account-specific localStorage
      try {
        const favKey = `user_favorites_${emailToUse}`;
        const storedFav = localStorage.getItem(favKey) || localStorage.getItem("organizer_favorites");
        if (storedFav) {
          setLikedEvents(JSON.parse(storedFav));
        }
      } catch { }

      // 2. Load reservations from account-specific localStorage
      try {
        const resKey = `user_reservations_${emailToUse}`;
        const storedRes = localStorage.getItem(resKey) || localStorage.getItem("organizer_reservations");
        if (storedRes) {
          setUserReservations(JSON.parse(storedRes));
        }
      } catch { }

      // 3. Fetch favorites from backend DB
      fetch(`/api/users/favorites?email=${encodeURIComponent(emailToUse)}`)
        .then((res) => res.json())
        .then((data) => {
          if (data?.favorites && Array.isArray(data.favorites) && data.favorites.length > 0) {
            setLikedEvents((prev) => {
              const merged = { ...prev };
              data.favorites.forEach((id: string) => { merged[id] = true; });
              try {
                localStorage.setItem(`user_favorites_${emailToUse}`, JSON.stringify(merged));
                localStorage.setItem("organizer_favorites", JSON.stringify(merged));
              } catch { }
              return merged;
            });
          }
        })
        .catch((err) => console.error("Error loading user favorites from DB:", err));
    } else {
      // Guest is not logged in: clear all likes and reservations!
      setLikedEvents({});
      setUserReservations({});
      try {
        localStorage.removeItem("organizer_favorites");
        localStorage.removeItem("guest_favorites");
      } catch { }
    }
  }, [userProfile?.email, userLoggedIn]);

  const toggleFavorite = (eventId: string, e?: React.MouseEvent | React.TouchEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }

    // STRICT: Guest users CANNOT like events. Prompt login immediately!
    if (!userLoggedIn || !userProfile?.email) {
      setShowAuthModalForFavorites(true);
      return;
    }

    const emailToUse = userProfile.email.trim().toLowerCase();
    const nextState = !likedEvents[eventId];
    const updated = { ...likedEvents, [eventId]: nextState };
    setLikedEvents(updated);

    try {
      localStorage.setItem(`user_favorites_${emailToUse}`, JSON.stringify(updated));
    } catch { }

    if (emailToUse) {
      fetch("/api/users/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: emailToUse,
          eventId,
          isFavorite: nextState,
        }),
      }).catch((err) => console.error("Error saving favorite to DB:", err));
    }
  };

  const handleOpenReservationModal = (evt: Event, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setReservationTargetEvent(evt);
    setShowReservationModal(true);
  };

  const handleConfirmReservation = (eventId: string, tierId: string) => {
    const emailToUse = userProfile?.email || (() => {
      if (typeof window === "undefined") return null;
      try {
        const stored = localStorage.getItem("organizer_profile");
        return stored ? JSON.parse(stored).email : null;
      } catch { return null; }
    })();

    setUserReservations((prev) => {
      const updated = { ...prev, [eventId]: true };
      try {
        if (emailToUse) {
          localStorage.setItem(`user_reservations_${emailToUse}`, JSON.stringify(updated));
        }
        localStorage.setItem("organizer_reservations", JSON.stringify(updated));
      } catch { }
      return updated;
    });
  };

  const [followedProfiles, setFollowedProfiles] = useState<Record<string, boolean>>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("nnz_followed_profiles");
        return saved ? JSON.parse(saved) : {};
      } catch {
        return {};
      }
    }
    return {};
  });

  const toggleFollowProfile = (id: string) => {
    setFollowedProfiles((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      try {
        localStorage.setItem("nnz_followed_profiles", JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  // Dynamic Real-Time Cartelera Events Filter by Category / Tag & Search Query
  const filteredCarteleraEvents = useMemo(() => {
    const list = events && events.length > 0 ? events : fallbackEvents;

    return list.filter((evt) => {
      // 1. Tag / Category Filter
      let matchesCategory = true;
      if (selectedDay && selectedDay !== "todos") {
        const tag = selectedDay.toLowerCase();
        const cat = (evt.category || "").toLowerCase();
        const sub = (evt.subtitle || "").toLowerCase();
        const title = (evt.title || "").toLowerCase();
        const venue = (evt.venue || "").toLowerCase();

        if (tag === "favoritos") matchesCategory = Boolean(userLoggedIn && likedEvents[evt.id]);
        else if (tag === "mis_reservas" || tag === "reservas") matchesCategory = Boolean(userLoggedIn && userReservations[evt.id]);
        else if (tag === "dj") matchesCategory = cat.includes("dj") || sub.includes("dj") || title.includes("dj") || cat.includes("electro") || cat.includes("techno");
        else if (tag === "party" || tag === "fiesta") matchesCategory = cat.includes("fiesta") || cat.includes("party") || sub.includes("fiesta") || sub.includes("nocturno");
        else if (tag === "comedy" || tag === "comedia") matchesCategory = cat.includes("comedia") || cat.includes("comedy") || sub.includes("stand");
        else if (tag === "gigs" || tag === "conciertos") matchesCategory = cat.includes("gig") || cat.includes("concierto") || cat.includes("live") || cat.includes("banda");
        else if (tag === "food") matchesCategory = cat.includes("food") || cat.includes("drink") || cat.includes("gastro") || sub.includes("cóctel");
        else if (tag === "social") matchesCategory = cat.includes("social") || sub.includes("social") || title.includes("social");
        else if (tag === "wellbeing" || tag === "bienestar") matchesCategory = cat.includes("bienestar") || cat.includes("wellbeing") || cat.includes("yoga");
        else matchesCategory = cat.includes(tag) || sub.includes(tag) || title.includes(tag) || venue.includes(tag);
      }

      // 2. Text Search Query Filter
      let matchesSearch = true;
      if (carteleraSearchQuery.trim()) {
        const q = carteleraSearchQuery.toLowerCase().trim();
        const title = (evt.title || "").toLowerCase();
        const venue = (evt.venue || "").toLowerCase();
        const city = (evt.city || "").toLowerCase();
        const cat = (evt.category || "").toLowerCase();

        matchesSearch = title.includes(q) || venue.includes(q) || city.includes(q) || cat.includes(q);
      }

      return matchesCategory && matchesSearch;
    });
  }, [events, selectedDay, carteleraSearchQuery, likedEvents, userReservations]);

  // Dynamic search profiles merging ORGANIZER_DATA, userProfile, and distinct organizers from active events
  const allSearchProfiles = useMemo<SearchProfile[]>(() => {
    const map = new Map<string, SearchProfile>();

    // 1. Add static organizers from ORGANIZER_DATA
    Object.values(ORGANIZER_DATA).forEach((item) => {
      map.set(item.id.toLowerCase().trim(), {
        id: item.id,
        name: item.name,
        type: item.type,
        avatar: item.logo,
        instagramUrl: item.instagramUrl,
      });
    });

    // 2. Add logged-in user profile if exists
    if (userProfile && (userProfile.name || userProfile.venueName)) {
      const orgName = userProfile.venueName || userProfile.name;
      const id = (userProfile.id || orgName).toLowerCase().trim();
      const existing = map.get(id);
      const userIg = userProfile.instagram
        ? (userProfile.instagram.startsWith("http")
            ? userProfile.instagram
            : `https://www.instagram.com/${userProfile.instagram.replace(/^@/, "")}/`)
        : existing?.instagramUrl;
      map.set(id, {
        id: existing?.id || id,
        name: orgName,
        type: (userProfile.type as any) || existing?.type || "Organizador",
        avatar: userProfile.avatar || existing?.avatar || "",
        instagramUrl: userIg,
      });
    }

    // 3. Dynamically collect all organizers from loaded events
    events.forEach((evt) => {
      const orgs = [evt.organizer, ...(evt.organizers || [])].filter(Boolean) as string[];
      orgs.forEach((orgName) => {
        const raw = orgName.trim();
        if (!raw) return;
        const lower = raw.toLowerCase();

        if (lower.includes("cubic")) {
          const c = map.get("cubic");
          if (c) {
            if (!c.avatar) c.avatar = "/images/cubic-official-logo.png";
            if (!c.instagramUrl) c.instagramUrl = ORGANIZER_DATA.cubic.instagramUrl;
          }
          return;
        }
        if (lower.includes("sata")) {
          const s = map.get("sata");
          if (s) {
            if (!s.avatar) s.avatar = "/images/sata-official-logo.jpg";
            if (!s.instagramUrl) s.instagramUrl = ORGANIZER_DATA.sata.instagramUrl;
          }
          return;
        }
        if (lower.includes("prueba")) {
          const p = map.get("prueba1") || map.get(lower);
          if (p) {
            if (!p.avatar) p.avatar = "/images/logo_4go_black_white.png";
            if (!p.instagramUrl) p.instagramUrl = ORGANIZER_DATA.prueba1.instagramUrl;
          }
          return;
        }

        const resolvedAvatar = (evt as any).miniImage || evt.poster || evt.imageUrl || "";
        const fallbackIg = (evt as any).organizerInstagram || (evt as any).instagramUrl || "";
        if (!map.has(lower)) {
          map.set(lower, {
            id: lower,
            name: raw,
            type: "Organizador",
            avatar: resolvedAvatar,
            instagramUrl: fallbackIg,
          });
        } else {
          const existing = map.get(lower)!;
          if (!existing.avatar && resolvedAvatar) {
            existing.avatar = resolvedAvatar;
          }
          if (!existing.instagramUrl && fallbackIg) {
            existing.instagramUrl = fallbackIg;
          }
        }
      });
    });

    return Array.from(map.values());
  }, [events, userProfile]);

  // Matching promoter / club profiles for Cartelera search query
  const matchingCarteleraProfiles = useMemo(() => {
    const query = carteleraSearchQuery.toLowerCase().trim();
    if (!query) return [];
    return allSearchProfiles.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        p.id.toLowerCase().includes(query) ||
        p.type.toLowerCase().includes(query)
    );
  }, [carteleraSearchQuery, allSearchProfiles]);


  // Classify events by type for filter tabs (strict, non-overlapping)
  const classifyEventType = (evt: Event): "fiesta" | "concierto" | "other" => {
    const titleLower = evt.title.toLowerCase();
    const subtitleLower = (evt.subtitle || "").toLowerCase();
    const combined = titleLower + " " + subtitleLower;
    // Fiestas: trap, urban, rnb, drop, night — underground party vibes
    if (
      combined.includes("trap") ||
      combined.includes("urban") ||
      combined.includes("rnb") ||
      combined.includes("night") ||
      combined.includes("party") ||
      combined.includes("discoteca") ||
      combined.includes("fiesta") ||
      combined.includes("shots") ||
      combined.includes("cubic")
    ) {
      return "fiesta";
    }
    // Conciertos: latin, live, wave, concert — bigger show formats
    if (
      combined.includes("live") ||
      combined.includes("concert") ||
      combined.includes("latin") ||
      combined.includes("fest") ||
      combined.includes("tour") ||
      combined.includes("show")
    ) {
      return "concierto";
    }
    return "other";
  };

  const filteredCatalogEvents = events.filter((evt) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      !searchQuery ||
      evt.title.toLowerCase().includes(query) ||
      (evt.subtitle && evt.subtitle.toLowerCase().includes(query)) ||
      (evt.venue && evt.venue.toLowerCase().includes(query)) ||
      (evt.organizer && evt.organizer.toLowerCase().includes(query)) ||
      evt.city.toLowerCase().includes(query);

    const matchesCity = selectedCity === "Todas" || evt.city.toLowerCase() === selectedCity.toLowerCase();

    // Day filter
    let matchesDay = true;
    if (selectedDay !== "todos") {
      const dateText = (evt.dateLabel || "" + ((evt as any).date || "")).toLowerCase();
      if (selectedDay === "viernes") matchesDay = dateText.includes("vie") || dateText.includes("fri") || dateText.includes("15") || dateText.includes("22");
      else if (selectedDay === "sabado") matchesDay = dateText.includes("sab") || dateText.includes("sáb") || dateText.includes("sat") || dateText.includes("16") || dateText.includes("23");
      else if (selectedDay === "domingo") matchesDay = dateText.includes("dom") || dateText.includes("sun") || dateText.includes("17");
      else if (selectedDay === "lunes") matchesDay = dateText.includes("lun") || dateText.includes("mon") || dateText.includes("18");
    }

    // Organizer filter
    let matchesOrg = true;
    if (selectedOrganizer !== "todos") {
      const orgText = (evt.organizer || "" + evt.title).toLowerCase();
      if (selectedOrganizer === "cubic") matchesOrg = orgText.includes("cubic");
      else if (selectedOrganizer === "lequat") matchesOrg = orgText.includes("lequat");
      else if (selectedOrganizer === "now") matchesOrg = orgText.includes("now") || orgText.includes("4go");
    }

    return matchesSearch && matchesCity && matchesDay && matchesOrg;
  });

  // Custom states for 3D Carousel & Premium visual effects
  const [activeIndex, setActiveIndex] = useState(0);
  const [trendingIndex, setTrendingIndex] = useState(0);
  const activeEvent = events[activeIndex] || selectedCarouselEvent;
  const [isLoading, setIsLoading] = useState(false);

  // Robust page restore on mount, popstate & bfcache pageshow
  useEffect(() => {
    const handlePageRestore = () => {
      setIsLoading(false);
      if (typeof document !== "undefined") {
        document.body.style.overflow = "";
      }
      setActiveStoryScreen((prev) => (prev === 0 || prev === 1 || prev === 2 ? prev : 1));
    };

    window.addEventListener("pageshow", handlePageRestore);
    window.addEventListener("popstate", handlePageRestore);

    return () => {
      window.removeEventListener("pageshow", handlePageRestore);
      window.removeEventListener("popstate", handlePageRestore);
    };
  }, []);

  // Clear loader timer if needed
  useEffect(() => {
    if (!isLoading) return;

    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1200);

    return () => {
      clearTimeout(timer);
    };
  }, [isLoading]);

  // Listen for Escape key to close all active floating menus/modals across the website
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (showUserMenu) setShowUserMenu(false);
        if (showHiddenMenu) setShowHiddenMenu(false);
        if (showRecoveryModal) setShowRecoveryModal(false);
        if (showDrinksModal) setShowDrinksModal(false);
        if (showDetailOverlay) setShowDetailOverlay(false);
        if (isTicketModalOpen) setIsTicketModalOpen(false);
        if (isStaffModalOpen) setIsStaffModalOpen(false);
        if (isPosModalOpen) setIsPosModalOpen(false);
        if (isDrinksPosModalOpen) setIsDrinksPosModalOpen(false);
        window.dispatchEvent(new CustomEvent("close-ai-chatbot"));
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [
    showUserMenu,
    showHiddenMenu,
    showRecoveryModal,
    showDrinksModal,
    showDetailOverlay,
    isTicketModalOpen,
    isStaffModalOpen,
    isPosModalOpen,
    isDrinksPosModalOpen,
  ]);

  const [checkoutState, setCheckoutState] = useState<string>("register");

  // Auto-advance Featured Trending Presale Card every 6 seconds only when on Home screen
  useEffect(() => {
    if (activeStoryScreen !== 1 || !events.length) return;
    const timer = setInterval(() => {
      setTrendingIndex((prev) => (prev + 1) % events.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [activeStoryScreen, events.length]);

  const activeSalesStatus = getOnlineSalesStatus(activeEvent);

  // Inactive event Toast notification state
  const [toast, setToast] = useState<{
    message: string;
    type: 'coming-soon' | 'sold-out' | 'info';
    id: number;
  } | null>(null);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const triggerInactiveToast = (event: Event) => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }

    let message = "Este evento estará disponible próximamente.";
    let type: 'coming-soon' | 'sold-out' | 'info' = 'coming-soon';

    if ((event as any).customMessage) {
      message = (event as any).customMessage;
      type = "info";
    } else if (event.status === "sold-out") {
      message = "Este evento ya se encuentra agotado.";
      type = "sold-out";
    } else if (event.status === "coming-soon") {
      message = "Este evento es el próximo y sus entradas aún no están disponibles.";
      type = "coming-soon";
    } else {
      const status = getOnlineSalesStatus(event);
      if (status.isClosed) {
        message = `Las entradas online por esta web han finalizado a las ${status.cutoffTime} hs. Puedes adquirir tu entrada directamente en la puerta del evento.`;
        type = "info";
      }
    }

    setToast({
      message,
      type,
      id: Date.now()
    });

    toastTimeoutRef.current = setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    };
  }, []);



  const { config } = useHomepageConfig(initialConfig);

  // Forced Strict Monochromatic Grayscale Color Theme (Balenciaga / Apple / Stripe style)
  const theme: ThemeColors = {
    primary: "#ffffff",
    primaryLight: "#e4e4e7",
    primaryDark: "#27272a",
    bgFrom: "#000000",
    bgTo: "#050505",
    glowRgba: "rgba(255,255,255,0.02)",
    glowIntense: "rgba(255,255,255,0.05)",
    borderRgba: "rgba(255,255,255,0.08)",
    btnFrom: "#ffffff",
    btnTo: "#ffffff",
    btnShadow: "rgba(255,255,255,0.05)",
    textAccent: "#ffffff",
    badgeBg: "#27272a",
    cardBorder: "rgba(255,255,255,0.08)",
    cardShadow: "rgba(0,0,0,0.85)",
    hoverGlow: "rgba(255,255,255,0.05)",
    tagBg: "rgba(255,255,255,0.05)",
  };

  const primaryRgb = "255,255,255";
  const themeStyle = {
    "--theme-primary": theme.primary,
    "--theme-primary-rgb": primaryRgb,
    "--theme-primary-light": theme.primaryLight,
    "--theme-primary-dark": theme.primaryDark,
    "--theme-bg-tint": "rgba(255, 255, 255, 0.04)",
    "--theme-bg-glow": "rgba(255, 255, 255, 0.02)",
    "--theme-bg-glow-dark": "rgba(255, 255, 255, 0.01)",
    "--theme-bg-accent": "rgba(255, 255, 255, 0.04)",
    "--theme-bg-grid": "rgba(255, 255, 255, 0.02)",
    "--theme-btn-from": theme.btnFrom,
    "--theme-btn-to": theme.btnTo,
    "--theme-btn-shadow": theme.btnShadow,
    "--theme-glow-intense": theme.glowIntense,
    "--theme-border-accent": theme.borderRgba,
    "--theme-border-accent-light": "rgba(255, 255, 255, 0.12)",
    "--theme-border-accent-xlight": "rgba(255, 255, 255, 0.06)",
    "--theme-glow-rgba": theme.glowRgba,
    "--theme-text-accent": theme.textAccent,
    "--theme-text-rgb": primaryRgb,
    "--theme-badge-bg": theme.badgeBg,
    "--theme-card-border": theme.cardBorder,
    "--theme-card-shadow": theme.cardShadow,
    "--theme-hover-glow": theme.hoverGlow,
    "--theme-bg-pink-500": "rgba(255, 255, 255, 0.08)",
    "--theme-bg-pink-500-hover": "rgba(255, 255, 255, 0.14)",
    "--theme-tag-bg": theme.tagBg,
    background: "black",
  } as CSSProperties;

  // Loader transition trigger
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1400);
    return () => clearTimeout(timer);
  }, []);



  useEffect(() => {
    fetch("/api/events")
      .then((response) => response.json())
      .then((data) => {
        if (data.success && Array.isArray(data.events) && data.events.length > 0) {
          setEvents(data.events);

          const params = new URLSearchParams(window.location.search);
          const eventParam = params.get("event");
          if (eventParam) {
            const foundIdx = data.events.findIndex(
              (e: any) => e.id === eventParam || e.slug === eventParam
            );
            if (foundIdx !== -1) {
              setSelectedCarouselEvent(data.events[foundIdx]);
              setActiveIndex(foundIdx);
              return;
            }
          }

          setSelectedCarouselEvent(data.events[0]);
        }
      })
      .catch(() => { });
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("menu") === "access") {
      queueMicrotask(() => setShowHiddenMenu(true));
      const url = new URL(window.location.href);
      url.searchParams.delete("menu");
      window.history.replaceState({}, "", url.toString());
    }
  }, []);

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (window.performance.now() < manualActiveUntil.current) return;
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        const supportSection = document.getElementById("support");
        const isNearBottom =
          window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 120;

        if (supportSection && isNearBottom) {
          setActiveSection("support");
          return;
        }

        const showSection = document.getElementById("show");
        const exploreSection = document.getElementById("explore");
        const wearSection = document.getElementById("wear");

        const showTop = showSection ? showSection.getBoundingClientRect().top + window.scrollY : 0;
        const exploreTop = exploreSection ? exploreSection.getBoundingClientRect().top + window.scrollY : 0;
        const wearTop = wearSection ? wearSection.getBoundingClientRect().top + window.scrollY : 0;

        const scrollPosition = window.scrollY + window.innerHeight * 0.45;

        let currentSection: HomeNavId = "home";
        if (scrollPosition >= wearTop - 100) {
          currentSection = "wear";
        } else if (scrollPosition >= exploreTop - 100) {
          currentSection = "explore";
        } else {
          currentSection = "home";
        }

        setActiveSection((prev) => (prev !== currentSection ? currentSection : prev));
      });
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleTouchStart = () => {
    longPressTimer.current = setTimeout(() => {
      setShowHiddenMenu(true);
      if (navigator.vibrate) navigator.vibrate(50);
    }, 3000);
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const getNavIdForTarget = (id: string): HomeNavId =>
    HOME_NAV_ITEMS.some((item) => item.id === id) ? (id as HomeNavId) : "home";

  const scrollToSection = (
    id: string,
    block: ScrollLogicalPosition = "center",
    activeId: HomeNavId = getNavIdForTarget(id),
  ) => {
    manualActiveUntil.current = window.performance.now() + 950;
    setActiveSection(activeId);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block });
  };

  const scrollToTicketCard = () => {
    scrollToSection("tickets-stage", "center", "home");
    setIsTicketPulse(true);
    window.setTimeout(() => {
      setIsTicketPulse(false);
    }, 2500);
  };

  const scrollToRecovery = () => {
    setSelectedCarouselEvent(activeEvent);
    setShowRecoveryModal(true);
  };

  const onBuy = (event: Event) => {
    setSelectedCarouselEvent(event);
    setReservationTargetEvent(event);
    setIsTicketModalOpen(true);
  };

  const onViewDetails = (event: Event) => {
    setSelectedCarouselEvent(event);
    setShowDetailOverlay(true);
  };

  const onSelectRelatedEvent = (event: Event) => {
    setSelectedCarouselEvent(event);
    // Also update the carousel index if event exists in carousel
    const idx = events.findIndex(e => e.id === event.id);
    if (idx !== -1) setActiveIndex(idx);
  };

  // ── Events screen: events shown when a non-home tab is active ──
  const filteredTabEvents = events.filter((evt) => {
    const matchesSearch =
      !searchQuery ||
      evt.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (evt.subtitle && evt.subtitle.toLowerCase().includes(searchQuery.toLowerCase())) ||
      evt.city.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCity = selectedCity === "Todas" || evt.city.toLowerCase() === selectedCity.toLowerCase();

    let matchesTab = true;
    if (activeFilterTab === "fiestas") {
      matchesTab = classifyEventType(evt) === "fiesta";
    } else if (activeFilterTab === "conciertos") {
      matchesTab = classifyEventType(evt) === "concierto";
    }
    // "all" and "ciudad" show everything (city filter handles ciudad)
    return matchesSearch && matchesCity && matchesTab;
  });

  // Glow color per tab for the screen transition
  const TAB_GLOW: Record<string, string> = {
    all: "rgba(139,92,246,0.55)",
    fiestas: "rgba(225,0,117,0.55)",
    conciertos: "rgba(194,217,2,0.45)",
    publish: "rgba(139,92,246,0.65)",
  };
  const TAB_LABEL: Record<string, string> = {
    all: "Todo",
    fiestas: "Fiestas",
    conciertos: "Conciertos",
    publish: "Sube tu Evento",
  };
  const TAB_SUB: Record<string, string> = {
    all: "Toda la cartelera disponible",
    fiestas: "Trap · Urban · RnB · Nocturno",
    conciertos: "Latin · Live · Concerts",
    publish: "Publica y gestiona tus eventos en Ecuador",
  };

  return (
    <main
      className="relative min-h-screen overflow-x-clip bg-black text-white"
      style={themeStyle}
    >
      {/* StormGo Animated Intro Loader Splash Overlay */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            key="loader"
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            className="fixed inset-0 z-[999] flex flex-col items-center justify-center bg-black text-white select-none"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="flex flex-col items-center text-center px-4"
            >
              {/* Animated Cool Cloud Mascot Winking ("echando un ojo") - Slightly Smaller */}
              <motion.div
                animate={{
                  y: [0, -8, 0],
                  rotate: [0, -4, 4, 0],
                }}
                transition={{
                  duration: 2.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="relative w-16 h-16 sm:w-20 sm:h-20 mb-3 drop-shadow-[0_10px_22px_rgba(0,0,0,0.35)]"
              >
                <svg className="w-full h-full select-none" viewBox="0 0 128 128" fill="none" xmlns="http://www.w3.org/2000/svg">
                  {/* Left Leg & Chunky Sneaker */}
                  <path d="M 38 82 L 28 98 C 24 104, 12 108, 10 114 C 8 120, 20 124, 34 122 C 44 120, 48 110, 44 98 L 48 82 Z" fill="#ffffff" stroke="#111111" strokeWidth="6" strokeLinejoin="round" strokeLinecap="round" />
                  <path d="M 12 114 C 18 108, 30 108, 40 116" stroke="#111111" strokeWidth="4" strokeLinecap="round" />

                  {/* Right Leg & Chunky Sneaker */}
                  <path d="M 82 82 L 90 98 C 94 104, 106 108, 108 114 C 110 120, 98 124, 84 122 C 74 120, 70 110, 74 98 L 72 82 Z" fill="#ffffff" stroke="#111111" strokeWidth="6" strokeLinejoin="round" strokeLinecap="round" />
                  <path d="M 108 114 C 102 108, 90 108, 80 116" stroke="#111111" strokeWidth="4" strokeLinecap="round" />

                  {/* Main Number 4 Body Contour */}
                  <path d="M 64 12 L 22 64 L 22 76 L 70 76 L 70 94 L 88 94 L 88 76 L 102 76 L 102 58 L 88 58 L 88 12 Z" fill="#ffffff" stroke="#111111" strokeWidth="8" strokeLinejoin="round" strokeLinecap="round" />
                  <path d="M 70 28 L 70 58 L 46 58 Z" fill="#111111" stroke="#111111" strokeWidth="2" strokeLinejoin="round" />

                  {/* Winking Eyebrow Motion */}
                  <motion.path
                    d="M 30 36 L 46 33"
                    stroke="#111111"
                    strokeWidth="5"
                    strokeLinecap="round"
                    animate={{ rotate: [0, -12, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                  />
                  <path d="M 66 31 L 82 33" stroke="#111111" strokeWidth="5" strokeLinecap="round" />

                  {/* Animated Sunglasses Frame */}
                  <motion.g
                    animate={{ y: [0, 3, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <path d="M 18 44 C 18 44, 46 38, 52 47 C 58 38, 86 44, 86 44 L 80 60 C 80 60, 58 64, 52 57 C 46 64, 24 60, 24 60 Z" fill="#111111" stroke="#111111" strokeWidth="4" strokeLinejoin="round" />
                    <line x1="28" y1="47" x2="40" y2="53" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" />
                    <line x1="60" y1="47" x2="72" y2="53" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" />
                  </motion.g>
                </svg>
              </motion.div>

              {/* Sleek Progress Bar */}
              <div className="mt-2 h-1.5 w-28 bg-black/15 mx-auto overflow-hidden rounded-full border border-black/10">
                <motion.div
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 1.4, ease: "easeInOut" }}
                  className="h-full bg-black rounded-full"
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Atmosphere />

      {/* --- APPLE ARCADE FULL-BLEED TRANSPARENT TOP HEADER WITH STORIES LINES OVERLAY --- */}
      <header className={`absolute inset-x-0 top-0 ${isHeaderSearchOpen ? "z-[500]" : "z-[400]"} bg-gradient-to-b from-black/90 via-black/30 to-transparent pt-3 pb-6 transition-all duration-300 px-4 sm:px-6 lg:px-12 pointer-events-auto`}>
        <div className="w-full relative flex flex-col gap-3">
          {/* 1. TOP STORY SEGMENT LINES (Permanently mounted, never jumps when search toggles) */}
          <div className="w-full max-w-xl mx-auto">
            <StoryLinesHeader
              screens={storyScreens}
              activeScreen={activeStoryScreen}
              onSelectScreen={(idx) => setActiveStoryScreen(idx)}
            />
          </div>

          {/* 2. DYNAMIC HEADER TITLE & ACCOUNT BADGE */}
          <div className="w-full flex items-center justify-between relative gap-2">
            {/* Dynamic Header Title: Aligned gracefully with spacing on PC */}
            <div className="w-auto flex items-center justify-start text-left overflow-hidden lg:pl-4">
              <button
                type="button"
                onClick={() => {
                  setActiveStoryScreen(1);
                  if (typeof window !== "undefined") {
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }
                }}
                className="flex items-center justify-start gap-2 cursor-pointer group focus:outline-none text-left max-w-full"
              >
                <AnimatePresence mode="wait">
                  <motion.h1
                    key={`header-title-${activeStoryScreen}`}
                    initial={false}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 6 }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                    className="text-xl sm:text-4xl font-extrabold tracking-tight text-white font-sans drop-shadow-md group-hover:text-purple-300 transition-colors whitespace-nowrap text-left"
                  >
                    {storyScreens[activeStoryScreen]?.label || "Home"}
                  </motion.h1>
                </AnimatePresence>
              </button>
            </div>

            {/* Right: + Crear on Left, Buscar in Middle, Avatar on Far Right (Horizontal Glass Buttons) */}
            <div className="flex flex-row items-center gap-1.5 sm:gap-2.5 shrink-0 z-[450] relative">
              {/* + Crear Glass Pill Button (Left) */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveStoryScreen(0);
                  if (typeof window !== "undefined") {
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }
                }}
                className="h-9 sm:h-10 px-3 sm:px-4 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-xl flex items-center gap-1 sm:gap-1.5 text-white font-bold text-xs sm:text-sm shadow-lg cursor-pointer transition-all active:scale-95 whitespace-nowrap"
                aria-label="Crear Evento"
              >
                <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5]" />
                <span>Crear</span>
              </button>

              {/* Search Button with Hover Preview (Middle) */}
              <div className="relative group flex items-center justify-center">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsHeaderSearchOpen((prev) => !prev);
                    if (!isHeaderSearchOpen) {
                      setTimeout(() => headerSearchInputRef.current?.focus(), 100);
                    }
                  }}
                  className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full border backdrop-blur-xl flex items-center justify-center shadow-lg cursor-pointer transition-all active:scale-95 ${isHeaderSearchOpen
                    ? "bg-white border-white text-zinc-900 shadow-xl scale-105"
                    : "bg-white/10 border-white/20 hover:bg-white/20 text-white"
                    }`}
                  aria-label="Buscar"
                >
                  <Search className={`w-4 h-4 sm:w-5 sm:h-5 ${isHeaderSearchOpen ? "text-zinc-900" : "text-white"}`} />
                </button>
              </div>

              {/* Profile Button with Dropdown (Far Right) */}
              <div className="relative flex items-center justify-center">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!userLoggedIn) {
                      setShowAuthModalForFavorites(true);
                    } else {
                      setShowUserMenu(!showUserMenu);
                    }
                  }}
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/10 border border-white/20 backdrop-blur-xl flex items-center justify-center text-white hover:bg-white/20 shadow-lg cursor-pointer transition-all active:scale-95 overflow-hidden relative"
                  aria-label="Perfil"
                >
                  {isMounted && userLoggedIn && userProfile?.avatar ? (
                    <img
                      src={userProfile.avatar}
                      alt={userProfile.venueName || userProfile.name || "Perfil"}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                        const fallback = e.currentTarget.parentElement?.querySelector(".header-user-fallback");
                        if (fallback) fallback.classList.remove("hidden");
                      }}
                    />
                  ) : (
                    <User className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  )}
                  <User className="header-user-fallback w-4 h-4 sm:w-5 sm:h-5 text-white hidden" />
                </button>

                {/* Hover Tooltip: Perfil (only when menu closed) */}
                {!showUserMenu && (
                  <div className="absolute top-[calc(100%+8px)] left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-lg bg-zinc-950/90 border border-white/20 text-white text-[11px] font-bold uppercase tracking-wider backdrop-blur-xl shadow-2xl opacity-0 hover:opacity-100 pointer-events-none transition-all duration-200 -translate-y-1 hover:translate-y-0 whitespace-nowrap z-50">
                    Perfil
                  </div>
                )}

                {/* User Dropdown Menu */}
                <AnimatePresence>
                  {showUserMenu && userLoggedIn && (
                    <>
                      <motion.div
                        initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
                        animate={{ opacity: 1, backdropFilter: "blur(12px)" }}
                        exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 z-40 bg-black/65 backdrop-blur-md"
                        onClick={() => setShowUserMenu(false)}
                      />
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.16, ease: "easeOut" }}
                        className="absolute right-0 top-[calc(100%+10px)] w-72 sm:w-80 rounded-[28px] bg-zinc-950/70 border border-white/20 backdrop-blur-3xl shadow-[0_25px_60px_rgba(0,0,0,0.85)] p-4 z-50 text-white font-sans space-y-3"
                      >
                        {/* User Header */}
                        <div className="px-1.5 py-1 flex items-center gap-3">
                          <div className="w-11 h-11 rounded-full overflow-hidden bg-white/10 border border-white/20 shrink-0 flex items-center justify-center shadow-inner">
                            {userProfile?.avatar ? (
                              <img src={userProfile.avatar} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                              <User className="w-5 h-5 text-white" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <p className="text-sm font-black uppercase text-white truncate">{userProfile?.venueName || userProfile?.name || "Usuario"}</p>
                            </div>
                            <p className="text-[11px] text-zinc-400 font-medium truncate">{userProfile?.email}</p>
                            <span className={`inline-block mt-1 px-2.5 py-0.5 rounded-md text-[9.5px] font-black uppercase tracking-wider ${
                              isMasterUser
                                ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                                : userProfile?.type === "Discoteca / Club Nocturno"
                                ? "bg-white/10 text-white border border-white/20"
                                : "bg-white/10 text-white border border-white/20"
                            }`}>
                              {isMasterUser ? "Master Superadmin" : (userProfile?.type || "Organizador")}
                            </span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="space-y-2 font-sans">
                          {/* Regular Dashboard / My Account */}
                          <button
                            type="button"
                            onClick={() => {
                              setShowUserMenu(false);
                              setAccountDashboardInitialTab(isMasterUser ? "master_receivables" : "events");
                              setIsAccountDashboardOpen(true);
                            }}
                            className="w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-white/[0.04] hover:bg-white/[0.10] border border-white/10 hover:border-white/20 text-white transition-all active:scale-[0.98] cursor-pointer text-xs font-bold uppercase tracking-wider"
                          >
                            <span>Mi Perfil &amp; Dashboard</span>
                            <ChevronRight className="w-4 h-4 text-zinc-400" />
                          </button>

                          {/* Publish Event */}
                          <button
                            type="button"
                            onClick={() => {
                              setShowUserMenu(false);
                              setActiveStoryScreen(0);
                              setTimeout(() => {
                                document.getElementById("subir-evento-section")?.scrollIntoView({ behavior: "smooth" });
                              }, 100);
                            }}
                            className="w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-white/[0.04] hover:bg-white/[0.10] border border-white/10 hover:border-white/20 text-white transition-all active:scale-[0.98] cursor-pointer text-xs font-bold uppercase tracking-wider"
                          >
                            <span>Publicar Evento</span>
                            <ChevronRight className="w-4 h-4 text-zinc-400" />
                          </button>

                          {/* Logout */}
                          <button
                            type="button"
                            onClick={() => {
                              setShowUserMenu(false);
                              handleLogout();
                            }}
                            className="w-full flex items-center justify-between px-4 py-3 rounded-2xl text-red-400 hover:bg-red-500/10 border border-red-500/20 transition-all active:scale-[0.98] cursor-pointer text-xs font-bold uppercase tracking-wider mt-1"
                          >
                            <span>Cerrar Sesión</span>
                            <LogOut className="w-4 h-4 text-red-400" />
                          </button>
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* --- CLEAN SEARCH MODAL OVERLAY MATCHING DESIGN SCREENSHOT --- */}
      <AnimatePresence>
        {isHeaderSearchOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setIsHeaderSearchOpen(false);
                setHeaderSearchQuery("");
              }}
              className="fixed inset-0 z-[660] bg-black/60 backdrop-blur-md cursor-pointer"
            />

            <motion.div
              initial={{ opacity: 0, y: -16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -16, scale: 0.96 }}
              transition={{ type: "spring", stiffness: 450, damping: 32 }}
              className="fixed top-4 inset-x-3 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:w-[540px] z-[670] pointer-events-auto"
            >
              {/* 1. White Pill Search Bar Input */}
              <div className="relative flex items-center h-12 px-4 rounded-full bg-white border border-zinc-200 shadow-2xl text-zinc-900 w-full">
                <Search className="w-5 h-5 text-zinc-500 shrink-0 mr-3" />
                <input
                  ref={headerSearchInputRef}
                  type="text"
                  value={headerSearchQuery}
                  onChange={(e) => setHeaderSearchQuery(e.target.value)}
                  placeholder="Buscar eventos, discotecas..."
                  className="w-full bg-transparent text-zinc-900 placeholder-zinc-400 text-sm font-semibold focus:outline-none"
                  autoFocus
                />
                {headerSearchQuery ? (
                  <button
                    type="button"
                    onClick={() => setHeaderSearchQuery("")}
                    className="p-1 text-zinc-400 hover:text-zinc-800 shrink-0 ml-1 cursor-pointer rounded-full hover:bg-zinc-100 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsHeaderSearchOpen(false)}
                    className="p-1 text-zinc-400 hover:text-zinc-800 shrink-0 ml-1 cursor-pointer rounded-full hover:bg-zinc-100 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>

              {/* 2. White Card Results Dropdown Box (Only rendered when user types a search query) */}
              {headerSearchQuery.trim() !== "" && (
                <div className="mt-2.5 w-full rounded-2xl bg-white border border-zinc-200 shadow-2xl p-4 text-zinc-900 max-h-[68vh] overflow-y-auto no-scrollbar space-y-2">
                  {(() => {
                    const query = headerSearchQuery.toLowerCase().trim();
                    const matchingProfiles = allSearchProfiles.filter(
                      (p) =>
                        p.name.toLowerCase().includes(query) ||
                        p.id.toLowerCase().includes(query) ||
                        p.type.toLowerCase().includes(query)
                    );
                    const matchingEvents = events.filter((e) => {
                      const titleMatch = (e.title || "").toLowerCase().includes(query);
                      const orgMatch =
                        (e.organizer || "").toLowerCase().includes(query) ||
                        (e.organizers || []).some((o) => o.toLowerCase().includes(query));
                      const venueMatch =
                        (e.venue || "").toLowerCase().includes(query) || (e.city || "").toLowerCase().includes(query);
                      const subMatch = (e.subtitle || "").toLowerCase().includes(query);
                      const dateMatch = (e.dateLabel || "").toLowerCase().includes(query);
                      return titleMatch || orgMatch || venueMatch || subMatch || dateMatch;
                    });

                    if (matchingProfiles.length === 0 && matchingEvents.length === 0) {
                      return (
                        <div className="p-6 text-center text-xs font-semibold text-zinc-500">
                          No se encontraron resultados para &quot;<span className="text-zinc-900 font-bold">{headerSearchQuery}</span>&quot;
                        </div>
                      );
                    }

                    return (
                      <div className="space-y-2">
                        {/* Profiles List */}
                        {matchingProfiles.map((prof) => (
                          <div
                            key={`search-prof-${prof.id}`}
                            onClick={() => {
                              setSelectedOrganizerSlug(prof.id);
                              setShowOrganizerOverlay(true);
                              setIsHeaderSearchOpen(false);
                              setHeaderSearchQuery("");
                              setShowReservationModal(false);
                              setIsTicketModalOpen(false);
                            }}
                            className="flex items-center justify-between gap-3 p-2 rounded-xl hover:bg-zinc-100/80 transition-colors cursor-pointer group"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-11 h-11 rounded-full bg-zinc-800 flex items-center justify-center text-white shrink-0 overflow-hidden relative border border-zinc-200/80">
                                {prof.avatar ? (
                                  <Image src={prof.avatar} alt={prof.name} fill sizes="44px" className="object-cover" />
                                ) : (
                                  <span className="text-xs font-black uppercase text-white tracking-wider">
                                    {prof.name.slice(0, 2)}
                                  </span>
                                )}
                              </div>
                              <div className="flex-1 min-w-0 text-left">
                                <h4 className="text-sm font-extrabold text-zinc-900 leading-tight truncate group-hover:text-black">
                                  {prof.name}
                                </h4>
                                <p className="text-xs font-medium text-zinc-500 mt-0.5">
                                  {prof.type}
                                </p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                const igUrl =
                                  prof.instagramUrl ||
                                  (prof.id.toLowerCase().includes("cubic")
                                    ? "https://www.instagram.com/cubic_loja/?hl=es"
                                    : prof.id.toLowerCase().includes("sata")
                                    ? "https://www.instagram.com/sata_events/"
                                    : prof.id.toLowerCase().includes("prueba")
                                    ? "https://www.instagram.com/brandon.mdna/"
                                    : `https://www.instagram.com/${prof.name.toLowerCase().replace(/[^a-z0-9_.]/g, "") || "4gooooooooo"}/`);
                                if (typeof window !== "undefined") {
                                  window.open(igUrl, "_blank", "noopener,noreferrer");
                                }
                              }}
                              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold text-zinc-900 bg-zinc-100 hover:bg-zinc-200 border border-zinc-200/80 transition-all cursor-pointer active:scale-95 shrink-0 shadow-sm"
                              title={`Instagram de ${prof.name}`}
                            >
                              <svg className="w-3.5 h-3.5 text-[#E1306C] shrink-0" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                              </svg>
                              <span>Instagram</span>
                            </button>
                          </div>
                        ))}

                        {/* Events List */}
                        {matchingEvents.map((evt) => (
                          <div
                            key={`search-evt-${evt.id}`}
                            onClick={() => {
                              setSelectedCarouselEvent(evt);
                              setShowDetailOverlay(true);
                              setShowOrganizerOverlay(false);
                              setIsHeaderSearchOpen(false);
                              setHeaderSearchQuery("");
                              setShowReservationModal(false);
                              setIsTicketModalOpen(false);
                            }}
                            className="flex items-center gap-3 p-2 rounded-xl hover:bg-zinc-100/80 transition-colors cursor-pointer group"
                          >
                            <div className="relative w-11 h-11 sm:w-12 sm:h-12 rounded-xl overflow-hidden bg-zinc-100 shrink-0 border border-zinc-200/80">
                              <Image
                                src={evt.poster || "/images/now4go-hero-presentation-hd-v3.png"}
                                alt={evt.title}
                                fill
                                sizes="(max-width: 640px) 44px, 48px"
                                className="object-cover"
                              />
                            </div>
                            <div className="flex-1 min-w-0 text-left">
                              <h4 className="text-sm font-extrabold text-zinc-900 truncate group-hover:text-black leading-snug">
                                {evt.title}
                              </h4>
                              <p className="text-xs font-medium text-zinc-500 truncate mt-0.5">
                                {evt.dateLabel || "jue, 17 sept"}
                              </p>
                              <p className="text-xs font-medium text-zinc-400 truncate">
                                {evt.venue || "Factory Town"}, {evt.city || "Miami"}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>



      {/* --- MAIN HOME CONTENT (FULL BLEED HERO photo STARTING AT TOP:0) --- */}
      <div className="pb-0 min-h-screen bg-black text-white pt-0">
        <div className="w-full">
          <AnimatePresence initial={false}>
            {activeStoryScreen === 0 && (
              <motion.div
                key="screen-0-create-event"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
                className="relative w-full flex flex-col select-none -mt-20 sm:-mt-24 -mb-16 lg:-mb-24"
              >
                {/* --- TOP HERO ROW (30% LEFT VIDEO / 70% RIGHT AUTH FORM WITH VIDEO) --- */}
                <div className="w-full min-h-[100dvh] flex flex-col lg:flex-row items-stretch">
                  {/* 1. LEFT COLUMN (30% WIDTH): BACKGROUND VIDEO FROM DOWNLOADS WITH AUDIO */}
                  <div className="relative w-full lg:w-[30%] h-[42vh] sm:h-[48vh] lg:h-auto lg:min-h-[calc(100vh+6rem)] self-stretch bg-zinc-950 overflow-hidden flex-shrink-0">
                    <video
                      ref={leftVideoRef}
                      autoPlay
                      loop
                      muted={isLeftVideoMuted}
                      playsInline
                      poster="/videos/subir_evento_left_poster.jpg"
                      preload="auto"
                      className="absolute inset-0 w-full h-full object-cover brightness-105"
                    >
                      <source media="(min-width: 768px)" src="/videos/subir_evento_left_video.mp4" type="video/mp4" />
                      <source src="/videos/subir_evento_left_video_mobile.mp4" type="video/mp4" />
                    </video>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent opacity-90" />

                    {/* Bottom Footer: Left Copyright & Right Mute/Unmute Slider Switch */}
                    <div className="absolute bottom-3 left-4 right-4 lg:bottom-6 lg:left-5 lg:right-5 z-10 flex items-center justify-between gap-2 pointer-events-auto">
                      <span className="text-[9px] sm:text-[10px] font-semibold text-white/70 tracking-tight drop-shadow-md">
                        © 2026, all rights reserved
                      </span>

                      {/* Mute/Unmute Audio Pill Slider */}
                      <button
                        type="button"
                        onClick={() => {
                          if (leftVideoRef.current) {
                            leftVideoRef.current.muted = !isLeftVideoMuted;
                            setIsLeftVideoMuted(!isLeftVideoMuted);
                          }
                        }}
                        className="px-2.5 py-1 rounded-full bg-zinc-900/90 border border-white/20 text-white flex items-center gap-1.5 hover:bg-black transition active:scale-95 cursor-pointer shadow-lg backdrop-blur-md"
                        title={isLeftVideoMuted ? "Activar sonido" : "Silenciar"}
                      >
                        {isLeftVideoMuted ? (
                          <VolumeX className="w-3.5 h-3.5 text-zinc-400" />
                        ) : (
                          <Volume2 className="w-3.5 h-3.5 text-yellow-400" />
                        )}
                        <div className="w-6 h-1 rounded-full bg-white/30 relative overflow-hidden">
                          <div className={`h-full bg-yellow-400 transition-all duration-300 ${isLeftVideoMuted ? 'w-0' : 'w-full'}`} />
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* 2. RIGHT COLUMN (70% WIDTH): CENTERED AUTH FORM WITH DEEP BLACK BG & SOFT WHITE BLUR GLOW */}
                  <div id="subir-evento-section" className="relative w-full lg:w-[70%] flex-1 min-h-[58vh] lg:min-h-screen px-4 sm:px-8 lg:px-12 py-8 sm:py-12 lg:py-16 flex flex-col items-center justify-center bg-black text-white font-sans overflow-hidden">
                    {/* Ambient soft white/radial glow behind the card */}
                    <div className="absolute inset-0 bg-black pointer-events-none" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] sm:w-[520px] h-[340px] sm:h-[520px] bg-white/[0.05] rounded-full blur-[110px] pointer-events-none" />
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.06)_0%,transparent_70%)] pointer-events-none" />

                    {/* Centered Dark Glass Auth / Vertical Dashboard Card */}
                    {!(isMounted && userLoggedIn) ? (
                      <div className="relative z-10 w-full max-w-lg mx-auto bg-zinc-950/90 p-5 sm:p-8 lg:p-10 rounded-3xl border border-white/20 shadow-2xl space-y-4 sm:space-y-6 text-white font-sans my-auto backdrop-blur-md">
                        <div className="text-center space-y-1.5 sm:space-y-2">
                          <h1 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-white font-sans leading-tight">
                            Sube tu Evento &amp; Administra tu Cuenta 4GO
                          </h1>
                          <p className="text-xs sm:text-sm text-zinc-300 font-medium max-w-md mx-auto leading-relaxed">
                            Inicia sesión en 1 clic con tu cuenta de Google para comenzar a publicar eventos.
                          </p>
                        </div>

                        {/* Social Logins */}
                        <div className="space-y-3 pt-1">
                          <button
                            type="button"
                            onClick={() => handleQuickSocialLogin("google")}
                            className="w-full py-3.5 sm:py-4 px-6 rounded-full bg-white hover:bg-zinc-100 text-black font-black text-xs sm:text-sm uppercase tracking-wider border border-white/30 flex items-center justify-center gap-3 transition-all hover:scale-[1.01] active:scale-95 cursor-pointer shadow-xl"
                          >
                            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                            </svg>
                            <span>ENTRAR CON GOOGLE</span>
                          </button>
                        </div>
                      </div>
                    ) : (!userProfile?.hasCompletedOnboarding || organizerSubView === "profile") ? (
                      <div className="relative z-10 w-full max-w-2xl mx-auto space-y-4 sm:space-y-5 font-sans pt-4 sm:pt-8 lg:pt-28 pb-8">
                        {/* ─── STEPPER INDICATOR HEADER OUTSIDE MODAL (ORIGINAL CLEAN TEXT STYLE) ─── */}
                        <div className="flex items-center justify-center gap-3 sm:gap-6 py-2 text-xs sm:text-sm font-bold text-white tracking-wider uppercase drop-shadow-md">
                          <span className="text-white font-black">
                            Cuenta de Promotor
                          </span>
                          <span className="text-zinc-400 font-normal">→</span>
                          <span className="text-zinc-400 font-medium">
                            Crear Evento
                          </span>
                          <span className="text-zinc-400 font-normal">→</span>
                          <span className="text-zinc-400 font-medium">
                            Publicar
                          </span>
                        </div>

                        {/* ─── COMPACT WHITE CARD ONBOARDING MODAL ─── */}
                        <div className="bg-white text-zinc-900 p-6 sm:p-8 rounded-[32px] border border-zinc-200 shadow-2xl text-left font-sans flex flex-col min-h-[700px] max-h-[730px] overflow-hidden">
                          {/* Centered Hero Header with Restored Title (Pinned) */}
                          <div className="space-y-1 border-b border-zinc-100 pb-3 text-center shrink-0">
                            <h2 className="text-lg sm:text-xl font-black text-zinc-900 uppercase tracking-tight leading-snug">
                              ELEVA TU CUENTA A PARTNER 4GO
                            </h2>
                            <p className="text-[11px] sm:text-xs text-zinc-500 font-medium leading-relaxed">
                              Crea y gestiona tus eventos, vende entradas digitales y haz crecer tu audiencia.
                            </p>
                          </div>

                          {/* Scrollable Form Fields */}
                          <div className="overflow-y-auto pr-1 sm:pr-2 pt-2 space-y-4 flex-1">
                            {/* Logo / Profile Picture Uploader */}
                            <div className="space-y-2 text-center pb-2 border-b border-zinc-100">
                              <label className="text-xs font-bold uppercase tracking-wider text-zinc-700 block">
                                Foto de Perfil / Logo de la Marca
                              </label>
                              <div className="flex items-center justify-center gap-4">
                                <div className="w-14 h-14 rounded-full bg-zinc-100 border-2 border-dashed border-zinc-300 flex items-center justify-center overflow-hidden shrink-0 shadow-inner relative">
                                  {brandLogoUrl || userProfile?.avatar ? (
                                    <img
                                      src={brandLogoUrl || userProfile?.avatar}
                                      alt="Logo de Marca"
                                      className="w-full h-full object-cover"
                                      onError={(e) => {
                                        e.currentTarget.style.display = "none";
                                        const fallback = e.currentTarget.parentElement?.querySelector(".upload-fallback-icon");
                                        if (fallback) fallback.classList.remove("hidden");
                                      }}
                                    />
                                  ) : null}
                                  <Upload className={`upload-fallback-icon w-5 h-5 text-zinc-400 ${brandLogoUrl || userProfile?.avatar ? "hidden" : ""}`} />
                                </div>
                                <div className="text-left space-y-1">
                                  <input
                                    type="file"
                                    accept="image/*"
                                    id="brand-logo-file-input"
                                    className="hidden"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) {
                                        const reader = new FileReader();
                                        reader.onloadend = () => {
                                          const base64 = reader.result as string;
                                          setBrandLogoUrl(base64);
                                          if (userProfile) {
                                            const updated = { ...userProfile, avatar: base64 };
                                            setUserProfile(updated);
                                            const emailClean = (userProfile.email || "").toLowerCase();
                                            localStorage.setItem("organizer_profile", JSON.stringify(updated));
                                            if (emailClean) {
                                              localStorage.setItem(`organizer_profile_${emailClean}`, JSON.stringify(updated));
                                            }
                                          }
                                        };
                                        reader.readAsDataURL(file);
                                      }
                                    }}
                                  />
                                  <label
                                    htmlFor="brand-logo-file-input"
                                    className="inline-block px-3.5 py-1.5 rounded-xl bg-zinc-900 hover:bg-black text-white font-bold text-xs uppercase tracking-wider transition cursor-pointer shadow-md"
                                  >
                                    {brandLogoUrl || userProfile?.avatar ? "Cambiar Foto" : "Subir Foto / Logo"}
                                  </label>
                                  <p className="text-[10px] text-zinc-400 font-medium">Recomendado: Formato cuadrado 500x500px.</p>
                                </div>
                              </div>
                            </div>

                            {/* Single Brand / Venue Name Input */}
                            <div className="space-y-1">
                              <label className="text-xs font-bold uppercase tracking-wider text-zinc-700 block">
                                Nombre de la Marca / Discoteca
                              </label>
                              <input
                                type="text"
                                value={orgName || userProfile?.venueName || ""}
                                onChange={(e) => setOrgName(e.target.value)}
                                placeholder="Nombre de tu marca o establecimiento"
                                className="w-full px-3.5 py-2 rounded-xl bg-zinc-50 border border-zinc-300 text-xs sm:text-sm text-zinc-900 focus:outline-none focus:border-black focus:bg-white transition font-medium"
                              />
                              <p className="text-[10px] text-zinc-400 font-medium">El nombre público de tu marca o establecimiento.</p>
                            </div>

                            {/* Instagram Meta Graph API Handle */}
                            <div className="space-y-1">
                              <label className="text-xs font-bold uppercase tracking-wider text-zinc-700 block">
                                Instagram de la Marca (@usuario)
                              </label>
                              <div className="relative">
                                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 font-bold text-xs">@</span>
                                <input
                                  type="text"
                                  value={instagramHandle || userProfile?.instagram?.replace(/^@/, '') || ""}
                                  onChange={(e) => setInstagramHandle(e.target.value.replace(/^@/, ''))}
                                  placeholder="usuario_instagram"
                                  className="w-full pl-8 pr-3.5 py-2 rounded-xl bg-zinc-50 border border-zinc-300 text-xs sm:text-sm text-zinc-900 focus:outline-none focus:border-black focus:bg-white transition font-medium"
                                />
                              </div>
                              <p className="text-[10px] text-zinc-400 font-medium">
                                Conexión con Meta: Tus historias de Instagram se sincronizarán en 4GO.
                              </p>
                            </div>

                            {/* Grid for Partner Type & City */}
                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-1">
                                <label className="text-xs font-bold uppercase tracking-wider text-zinc-700 block">
                                  Partner type
                                </label>
                                <select
                                  value={orgType || userProfile?.type || "Discoteca / Club"}
                                  onChange={(e) => setOrgType(e.target.value)}
                                  className="w-full px-3 py-2 rounded-xl bg-zinc-50 border border-zinc-300 text-xs text-zinc-900 font-bold focus:outline-none focus:border-black focus:bg-white transition cursor-pointer"
                                >
                                  <option value="Organizador / Promotor">Organizador / Promotor</option>
                                  <option value="Discoteca / Club">Discoteca / Club</option>
                                </select>
                              </div>

                              <div className="space-y-1">
                                <label className="text-xs font-bold uppercase tracking-wider text-zinc-700 block">
                                  City
                                </label>
                                <select
                                  value="Loja"
                                  disabled
                                  className="w-full px-3 py-2 rounded-xl bg-zinc-100 border border-zinc-300 text-xs font-bold text-zinc-900 cursor-not-allowed appearance-none"
                                >
                                  <option value="Loja">Loja</option>
                                </select>
                              </div>
                            </div>

                            {/* DYNAMIC DISCOTECA FIELDS (Button-First Maps Flow, No Operating Hours) */}
                            {(orgType === "Discoteca / Club" || (!orgType && userProfile?.type === "Discoteca / Club")) && (
                              <div className="space-y-3 pt-2 border-t border-zinc-100">
                                {/* Intuitive Button-First Maps Picker */}
                                <div className="space-y-1">
                                  <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-800 block">
                                    Ubicación de la Discoteca (Loja)
                                  </label>
                                  {!(clubAddress || userProfile?.address) ? (
                                    <button
                                      type="button"
                                      onClick={() => setIsLocationPickerOpen(true)}
                                      className="w-full py-2.5 px-3.5 rounded-xl bg-zinc-900 hover:bg-black text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition cursor-pointer shadow-sm"
                                    >
                                      <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                                      <span>Seleccionar Ubicación en Maps</span>
                                    </button>
                                  ) : (
                                    <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-zinc-50 border border-zinc-300 text-xs font-medium text-zinc-900">
                                      <div className="flex items-center gap-2 truncate">
                                        <MapPin className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                        <span className="truncate font-semibold text-[11px]">{clubAddress || userProfile?.address}</span>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => setIsLocationPickerOpen(true)}
                                        className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-black text-white text-[10px] font-bold uppercase shrink-0 cursor-pointer"
                                      >
                                        Cambiar
                                      </button>
                                    </div>
                                  )}
                                </div>

                                {/* Days of Opening */}
                                <div className="space-y-1">
                                  <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-800 block">
                                    Días de Apertura
                                  </label>
                                  <div className="flex flex-wrap gap-1">
                                    {["Jueves", "Viernes", "Sábado", "Domingo", "Todos"].map((day) => {
                                      const isSelected = openingDays.includes(day);
                                      return (
                                        <button
                                          key={day}
                                          type="button"
                                          onClick={() => {
                                            if (day === "Todos") {
                                              setOpeningDays(["Jueves", "Viernes", "Sábado", "Domingo"]);
                                              return;
                                            }
                                            setOpeningDays((prev) =>
                                              isSelected ? prev.filter((d) => d !== day) : [...prev, day]
                                            );
                                          }}
                                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer border ${
                                            isSelected
                                              ? "bg-zinc-900 text-white border-zinc-900"
                                              : "bg-zinc-100 text-zinc-600 border-zinc-200 hover:bg-zinc-200"
                                          }`}
                                        >
                                          {day}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Pinned Action: Next Step Button */}
                          {(() => {
                            const currentName = orgName.trim() || userProfile?.venueName || "";
                            const currentIg = instagramHandle.trim() || userProfile?.instagram || "";
                            const currentAddr = clubAddress.trim() || userProfile?.address || "";
                            const currentType = orgType || userProfile?.type || "Discoteca / Club";

                            const isFormValid =
                              currentName.length > 0 &&
                              (currentType !== "Discoteca / Club" || (currentAddr.length > 0 && openingDays.length > 0));

                            return (
                              <div className="pt-3 shrink-0 border-t border-zinc-100">
                                <button
                                  type="button"
                                  disabled={!isFormValid || isOnboardingSaving}
                                  onClick={async () => {
                                    if (!isFormValid || isOnboardingSaving) return;
                                    setIsOnboardingSaving(true);

                                    const emailClean = (userProfile?.email || "usuario@ejemplo.com").trim().toLowerCase();
                                    const isMaster = emailClean === "brandon.medina@unl.edu.ec" || emailClean === "master@4go.live";
                                    const isCubic = emailClean === "mrshifu879@gmail.com";

                                    const updated = {
                                      id: isMaster ? "master_admin" : isCubic ? "cubic" : (userProfile?.id || `usr_${Date.now()}`),
                                      name: currentName,
                                      email: emailClean,
                                      avatar: brandLogoUrl || (userProfile?.avatar && !userProfile.avatar.includes("presentation") ? userProfile.avatar : "") || (isMaster ? "/images/logo_4go_black_white.png" : isCubic ? "/images/cubic-official-logo.png" : ""),
                                      venueName: currentName,
                                      type: isMaster ? "Organizador" : currentType,
                                      city: "Loja",
                                      instagram: currentIg ? `@${currentIg.replace(/^@/, '')}` : "",
                                      address: currentAddr,
                                      openingDays,
                                      hasCompletedOnboarding: true,
                                    };

                                    // Saving animation delay
                                    setTimeout(() => {
                                      setUserProfile(updated as any);
                                      localStorage.setItem("organizer_token", `token-${emailClean}-${Date.now()}`);
                                      localStorage.setItem("organizer_profile", JSON.stringify(updated));
                                      localStorage.setItem(`organizer_profile_${emailClean}`, JSON.stringify(updated));
                                      setIsOnboardingSaving(false);
                                      setOrganizerSubView("create_event");
                                    }, 600);

                                    fetch("/api/users/sync", {
                                      method: "POST",
                                      headers: { "Content-Type": "application/json" },
                                      body: JSON.stringify({
                                        email: emailClean,
                                        name: updated.name,
                                        avatar: updated.avatar,
                                        provider: "google",
                                        type: currentType,
                                        venueName: updated.venueName,
                                        city: "Loja",
                                      }),
                                    }).catch(() => {});
                                  }}
                                  className={`w-full py-3.5 rounded-full font-bold text-xs uppercase tracking-widest transition active:scale-95 text-center flex items-center justify-center gap-2 ${
                                    isFormValid
                                      ? "bg-black hover:bg-zinc-800 text-white cursor-pointer shadow-xl"
                                      : "bg-zinc-200 text-zinc-400 cursor-not-allowed opacity-60"
                                  }`}
                                >
                                  {isOnboardingSaving ? (
                                    <>
                                      <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                                      <span>Guardando Cuenta Partner...</span>
                                    </>
                                  ) : (
                                    <>
                                      <span>Siguiente: Crear Evento</span>
                                      <span>→</span>
                                    </>
                                  )}
                                </button>
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    ) : organizerSubView === "published" ? (
                      <div className="relative z-10 w-full max-w-2xl mx-auto space-y-5 font-sans pt-24 sm:pt-28 pb-8">
                        {/* ─── STEPPER INDICATOR HEADER (PASO 2: PUBLICAR) ─── */}
                        <div className="flex items-center justify-center gap-3 sm:gap-6 py-2 text-xs sm:text-sm font-bold text-white tracking-wider uppercase drop-shadow-md">
                          <button
                            type="button"
                            onClick={() => setOrganizerSubView("create_event")}
                            className="text-zinc-400 hover:text-white transition cursor-pointer font-medium"
                          >
                            1. Crear Evento
                          </button>
                          <span className="text-zinc-400 font-normal">→</span>
                          <span className="text-white font-black">
                            2. Publicar
                          </span>
                        </div>

                        {/* ─── PUBLISHED SUCCESS CARD ─── */}
                        <div className="bg-white text-zinc-900 p-6 sm:p-8 rounded-[32px] border border-zinc-200 shadow-2xl space-y-4 text-center font-sans flex flex-col min-h-[700px] max-h-[730px] justify-between overflow-hidden">
                          {/* Success Icon & Header */}
                          <div className="space-y-2.5">
                            <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto shadow-inner text-2xl font-black">
                              ✓
                            </div>
                            <div className="space-y-1">
                              <h2 className="text-2xl sm:text-3xl font-black text-zinc-900 uppercase tracking-tight">
                                ¡Evento Publicado Correctamente!
                              </h2>
                              <p className="text-xs sm:text-sm text-zinc-500 font-medium max-w-md mx-auto">
                                Tu evento ya se encuentra activo en la cartelera principal de 4GO y disponible para la compra de tickets.
                              </p>
                            </div>
                          </div>

                          {/* Event Summary Box */}
                          {lastPublishedEvent && (
                            <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 text-left flex flex-col sm:flex-row items-center gap-4">
                              <div className="w-20 h-24 sm:w-24 sm:h-28 rounded-xl overflow-hidden bg-black shrink-0 relative shadow-md">
                                <img
                                  src={lastPublishedEvent.poster || lastPublishedEvent.imageUrl || "/images/4go_red_girl_showcase.jpg"}
                                  alt={lastPublishedEvent.title}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div className="space-y-1.5 flex-1 min-w-0 text-center sm:text-left">
                                <h4 className="text-base sm:text-lg font-black text-zinc-900 uppercase truncate">
                                  {lastPublishedEvent.title}
                                </h4>
                                <p className="text-xs text-zinc-600 font-semibold truncate">
                                  📍 {lastPublishedEvent.venue} • {lastPublishedEvent.city || "Loja"}
                                </p>
                                <p className="text-xs text-zinc-500 font-medium">
                                  🗓️ {lastPublishedEvent.dateLabel || lastPublishedEvent.date}
                                </p>
                              </div>
                            </div>
                          )}

                          {/* Actions Buttons */}
                          <div className="space-y-3 pt-2">
                            <button
                              type="button"
                              onClick={() => {
                                setNewEventTitle("");
                                setNewEventSubtitle("");
                                setNewEventDate("");
                                setNewEventDoorsOpen("");
                                setNewEventVenueName("");
                                setNewEventVenueAddress("");
                                setOrganizerSubView("create_event");
                              }}
                              className="w-full py-4 rounded-full bg-black hover:bg-zinc-800 text-white font-black text-xs uppercase tracking-widest transition active:scale-95 text-center cursor-pointer shadow-xl flex items-center justify-center gap-2"
                            >
                              <span>+ Publicar Otro Evento</span>
                            </button>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveStoryScreen(2);
                                  if (typeof window !== "undefined") {
                                    window.scrollTo({ top: 0, behavior: "smooth" });
                                  }
                                }}
                                className="w-full py-3 px-4 rounded-2xl bg-zinc-100 hover:bg-zinc-200 text-zinc-900 font-bold text-xs uppercase tracking-wider transition cursor-pointer"
                              >
                                Ver en Cartelera →
                              </button>

                              <button
                                type="button"
                                onClick={() => router.push("/cuenta")}
                                className="w-full py-3 px-4 rounded-2xl bg-zinc-100 hover:bg-zinc-200 text-zinc-900 font-bold text-xs uppercase tracking-wider transition cursor-pointer"
                              >
                                Ir a Mi Cuenta
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="relative z-10 w-full max-w-2xl mx-auto space-y-4 sm:space-y-6 font-sans pt-4 sm:pt-8 lg:pt-28 pb-12">
                        {/* --- STEPPER INDICATOR HEADER (1. CREAR EVENTO -> 2. PUBLICAR) --- */}
                        <div className="flex items-center justify-center gap-3 sm:gap-6 py-2 text-xs sm:text-sm font-bold text-white tracking-wider uppercase drop-shadow-md">
                          <span className="text-white font-black">
                            1. Crear Evento
                          </span>
                          <span className="text-zinc-400 font-normal">→</span>
                          <button
                            type="button"
                            onClick={() => {
                              if (lastPublishedEvent) setOrganizerSubView("published");
                            }}
                            className={`transition ${
                              lastPublishedEvent
                                ? "text-zinc-400 hover:text-white cursor-pointer font-medium"
                                : "text-zinc-500 cursor-not-allowed font-medium"
                            }`}
                          >
                            2. Publicar
                          </button>
                        </div>

                        {/* --- COMPACT WHITE CARD MODAL (CREAR EVENTO DIRECTO) --- */}
                        <div className="bg-white text-zinc-900 p-6 sm:p-8 rounded-[32px] border border-zinc-200 shadow-2xl text-left font-sans flex flex-col min-h-[700px] max-h-[730px] overflow-hidden">
                          {/* Top Organizer Header inside White Modal (Pinned Header) */}
                          <div className="flex items-center justify-between border-b border-zinc-100 pb-3 shrink-0">
                            <div className="flex items-center gap-3">
                              <div className="w-11 h-11 rounded-2xl bg-zinc-900 border border-zinc-200 overflow-hidden shrink-0 flex items-center justify-center shadow-sm">
                                {userProfile?.avatar ? (
                                  <img
                                    src={userProfile.avatar}
                                    alt="Logo"
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      e.currentTarget.style.display = "none";
                                    }}
                                  />
                                ) : (
                                  <Building2 className="w-5 h-5 text-white" />
                                )}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <h3 className="text-sm sm:text-base font-black text-zinc-900 uppercase tracking-tight">
                                    {userProfile?.venueName || userProfile?.name || "PROMOTOR"}
                                  </h3>
                                  <span className="px-2 py-0.5 rounded-full bg-zinc-100 border border-zinc-200 text-zinc-700 text-[9px] font-bold uppercase tracking-wider">
                                    Partner 4GO
                                  </span>
                                </div>
                                <p className="text-[11px] text-zinc-500 font-medium truncate max-w-[170px] sm:max-w-[260px]">{userProfile?.email}</p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => router.push("/cuenta?tab=partner_profile")}
                                className="px-3.5 py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-900 text-[11px] font-bold transition active:scale-95 cursor-pointer text-center flex items-center gap-1.5 border border-zinc-200 shadow-sm"
                              >
                                <ShieldCheck className="w-3.5 h-3.5 text-zinc-700" />
                                <span>Configurar Partner</span>
                              </button>
                            </div>
                          </div>

                          {/* Scrollable Event Creation Form Fields */}
                          <div className="overflow-y-auto pr-1 sm:pr-2 pt-3 pb-2 space-y-4 flex-1">
                            <div className="space-y-0.5 border-b border-zinc-100 pb-2.5">
                              <h2 className="text-lg sm:text-xl font-black text-zinc-900 uppercase tracking-tight">
                                CREAR Y PUBLICAR EVENTO
                              </h2>
                              <p className="text-[11px] text-zinc-500 font-medium">
                                Configura los detalles oficiales de tu evento para la cartelera principal de 4GO.
                              </p>
                            </div>

                            {/* 1. Flyer / Poster del Evento Uploader (Starts empty, no forced photo) */}
                            <div className="space-y-2 pb-3 border-b border-zinc-100">
                              <label className="text-xs font-bold uppercase tracking-wider text-zinc-700 block">
                                Flyer / Poster Oficial del Evento
                              </label>
                              
                              {newEventPoster ? (
                                <div className="flex items-center gap-4 p-3 rounded-2xl bg-zinc-50 border border-zinc-200">
                                  <div className="w-16 h-20 rounded-xl bg-zinc-900 border border-zinc-300 overflow-hidden shrink-0 shadow-md">
                                    <img
                                      src={newEventPoster}
                                      alt="Preview del Flyer"
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                  <div className="space-y-1.5 text-left">
                                    <p className="text-xs font-bold text-zinc-900">Flyer cargado correctamente</p>
                                    <div className="flex items-center gap-2">
                                      <input
                                        type="file"
                                        accept="image/*"
                                        id="event-poster-file-change"
                                        className="hidden"
                                        onChange={(e) => {
                                          const file = e.target.files?.[0];
                                          if (file) {
                                            const reader = new FileReader();
                                            reader.onloadend = () => {
                                              setNewEventPoster(reader.result as string);
                                            };
                                            reader.readAsDataURL(file);
                                          }
                                        }}
                                      />
                                      <label
                                        htmlFor="event-poster-file-change"
                                        className="inline-block px-3 py-1.5 rounded-xl bg-zinc-200 hover:bg-zinc-300 text-zinc-800 font-bold text-[11px] uppercase tracking-wider transition cursor-pointer"
                                      >
                                        Cambiar Flyer
                                      </label>
                                      <button
                                        type="button"
                                        onClick={() => setNewEventPoster("")}
                                        className="px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 font-bold text-[11px] uppercase tracking-wider transition cursor-pointer"
                                      >
                                        Eliminar
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <div>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    id="event-poster-file-input"
                                    className="hidden"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) {
                                        const reader = new FileReader();
                                        reader.onloadend = () => {
                                          setNewEventPoster(reader.result as string);
                                        };
                                        reader.readAsDataURL(file);
                                      }
                                    }}
                                  />
                                  <label
                                    htmlFor="event-poster-file-input"
                                    className="w-full flex flex-col items-center justify-center p-5 rounded-2xl border-2 border-dashed border-zinc-300 hover:border-black bg-zinc-50 hover:bg-zinc-100/70 transition cursor-pointer text-center group"
                                  >
                                    <div className="w-10 h-10 rounded-xl bg-zinc-200 group-hover:bg-black group-hover:text-white text-zinc-700 flex items-center justify-center transition mb-2">
                                      <ImagePlus className="w-5 h-5" />
                                    </div>
                                    <span className="text-xs font-bold text-zinc-900 uppercase tracking-wider">
                                      Subir Flyer / Poster Oficial
                                    </span>
                                    <span className="text-[10px] text-zinc-500 font-medium mt-0.5">
                                      Formato vertical o cuadrado (JPG, PNG o WEBP)
                                    </span>
                                  </label>
                                </div>
                              )}
                            </div>

                            {/* 2. Título & Subtítulo (Venue / Sala) */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div className="space-y-1">
                                <label className="text-xs font-bold uppercase tracking-wider text-zinc-700 block">
                                  Título del Evento *
                                </label>
                                <input
                                  type="text"
                                  required
                                  value={newEventTitle}
                                  onChange={(e) => setNewEventTitle(e.target.value)}
                                  placeholder="Ej. ORIGIN // Club Night"
                                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 border border-zinc-300 text-xs sm:text-sm text-zinc-900 focus:outline-none focus:border-black focus:bg-white transition font-medium"
                                />
                              </div>

                              <div className="space-y-1">
                                <label className="text-xs font-bold uppercase tracking-wider text-zinc-700 block">
                                  Subtítulo / Sala
                                </label>
                                <input
                                  type="text"
                                  value={newEventSubtitle}
                                  onChange={(e) => setNewEventSubtitle(e.target.value)}
                                  placeholder="Ej. Sala Principal / Terraza VIP"
                                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 border border-zinc-300 text-xs sm:text-sm text-zinc-900 focus:outline-none focus:border-black focus:bg-white transition font-medium"
                                />
                              </div>
                            </div>

                            {/* 3. Fecha & Hora de Apertura Fácil & Rápida */}
                            <div className="p-3.5 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-3">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {/* Fecha con selector nativo y accesos rápidos */}
                                <div className="space-y-1.5">
                                  <div className="flex items-center justify-between">
                                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-700 block">
                                      Fecha del Evento *
                                    </label>
                                    <span className="text-[10px] text-zinc-500 font-medium">
                                      {newEventDate ? new Date(newEventDate + 'T12:00:00').toLocaleDateString('es-EC', { weekday: 'short', month: 'short', day: 'numeric' }) : 'Selecciona fecha'}
                                    </span>
                                  </div>
                                  <input
                                    type="date"
                                    required
                                    min={new Date().toISOString().split('T')[0]}
                                    value={newEventDate}
                                    onChange={(e) => setNewEventDate(e.target.value)}
                                    className="w-full px-3.5 py-2 rounded-xl bg-white border border-zinc-300 text-xs sm:text-sm text-zinc-900 focus:outline-none focus:border-black transition font-semibold cursor-pointer"
                                  />
                                  
                                  {/* Quick Date Pills */}
                                  <div className="flex flex-wrap gap-1.5 pt-1">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const d = new Date();
                                        setNewEventDate(d.toISOString().split('T')[0]);
                                      }}
                                      className="px-2 py-1 rounded-lg bg-zinc-200 hover:bg-zinc-300 text-zinc-800 text-[10px] font-bold transition cursor-pointer"
                                    >
                                      Hoy
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const d = new Date();
                                        d.setDate(d.getDate() + 1);
                                        setNewEventDate(d.toISOString().split('T')[0]);
                                      }}
                                      className="px-2 py-1 rounded-lg bg-zinc-200 hover:bg-zinc-300 text-zinc-800 text-[10px] font-bold transition cursor-pointer"
                                    >
                                      Mañana
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const d = new Date();
                                        let diff = (5 - d.getDay() + 7) % 7;
                                        if (diff === 0) diff = 7;
                                        d.setDate(d.getDate() + diff);
                                        setNewEventDate(d.toISOString().split('T')[0]);
                                      }}
                                      className="px-2 py-1 rounded-lg bg-zinc-200 hover:bg-zinc-300 text-zinc-800 text-[10px] font-bold transition cursor-pointer"
                                    >
                                      Viernes
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const d = new Date();
                                        let diff = (6 - d.getDay() + 7) % 7;
                                        if (diff === 0) diff = 7;
                                        d.setDate(d.getDate() + diff);
                                        setNewEventDate(d.toISOString().split('T')[0]);
                                      }}
                                      className="px-2 py-1 rounded-lg bg-zinc-200 hover:bg-zinc-300 text-zinc-800 text-[10px] font-bold transition cursor-pointer"
                                    >
                                      Sábado
                                    </button>
                                  </div>
                                </div>

                                {/* Hora de Apertura con selector rápido */}
                                <div className="space-y-1.5">
                                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-700 block">
                                    Hora de Apertura *
                                  </label>
                                  <input
                                    type="time"
                                    required
                                    value={newEventDoorsOpen}
                                    onChange={(e) => setNewEventDoorsOpen(e.target.value)}
                                    className="w-full px-3.5 py-2 rounded-xl bg-white border border-zinc-300 text-xs sm:text-sm text-zinc-900 focus:outline-none focus:border-black transition font-semibold cursor-pointer"
                                  />

                                  {/* Quick Time Pills */}
                                  <div className="flex flex-wrap gap-1.5 pt-1">
                                    {["20:00", "21:00", "22:00", "23:00"].map((t) => (
                                      <button
                                        key={t}
                                        type="button"
                                        onClick={() => setNewEventDoorsOpen(t)}
                                        className={`px-2 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                                          newEventDoorsOpen === t
                                            ? "bg-black text-white"
                                            : "bg-zinc-200 hover:bg-zinc-300 text-zinc-800"
                                        }`}
                                      >
                                        {t}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              </div>

                              {/* Categoría */}
                              <div className="space-y-1 pt-1 border-t border-zinc-200">
                                <label className="text-xs font-bold uppercase tracking-wider text-zinc-700 block">
                                  Categoría / Género Musical
                                </label>
                                <select
                                  value={newEventCategory}
                                  onChange={(e) => setNewEventCategory(e.target.value)}
                                  className="w-full px-3 py-2 rounded-xl bg-white border border-zinc-300 text-xs font-bold text-zinc-900 focus:outline-none focus:border-black transition cursor-pointer"
                                >
                                  <option value="Electronic / House">Electronic / House</option>
                                  <option value="Fiesta / Club">Fiesta / Club Nocturno</option>
                                  <option value="Reggaeton / Urban">Reggaeton / Urban</option>
                                  <option value="Concierto">Concierto en Vivo</option>
                                  <option value="Festival">Festival / Open Air</option>
                                  <option value="Techno / Underground">Techno / Underground</option>
                                </select>
                              </div>
                            </div>

                            {/* 4. Preventa de Entradas (Solo 1 por defecto, con opción de agregar más) */}
                            <div className="p-3.5 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-3">
                              <div className="flex items-center justify-between">
                                <div>
                                  <label className="text-xs font-black uppercase tracking-wider text-zinc-800 block">
                                    Entradas &amp; Preventas
                                  </label>
                                  <p className="text-[10px] text-zinc-500 font-medium">
                                    Define tus fases de preventa. Puedes comenzar con una y habilitar más fases luego.
                                  </p>
                                </div>
                                <span className="text-[10px] text-zinc-500 font-bold">0% de comisión</span>
                              </div>

                              <div className="space-y-3">
                                {newEventPresales.map((phase, idx) => (
                                  <div
                                    key={phase.id}
                                    className="p-3 rounded-2xl bg-white border border-zinc-200 space-y-2.5 shadow-sm"
                                  >
                                    {/* Row 1: Nombre, Precio y Eliminar */}
                                    <div className="flex items-center gap-3">
                                      <div className="flex-1 space-y-0.5">
                                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                                          Nombre de Fase
                                        </span>
                                        <input
                                          type="text"
                                          value={phase.name}
                                          onChange={(e) => {
                                            const val = e.target.value;
                                            setNewEventPresales((prev) =>
                                              prev.map((item) => (item.id === phase.id ? { ...item, name: val } : item))
                                            );
                                          }}
                                          placeholder="Ej. Preventa 1 / Early Bird"
                                          className="w-full px-3 py-1.5 rounded-xl bg-zinc-50 border border-zinc-200 text-xs font-bold text-zinc-900 focus:outline-none focus:border-black"
                                        />
                                      </div>

                                      <div className="w-28 space-y-0.5">
                                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                                          Precio ($ USD)
                                        </span>
                                        <input
                                          type="number"
                                          min="0"
                                          step="0.5"
                                          value={phase.price}
                                          onChange={(e) => {
                                            const val = e.target.value;
                                            setNewEventPresales((prev) =>
                                              prev.map((item) => (item.id === phase.id ? { ...item, price: val } : item))
                                            );
                                          }}
                                          placeholder="5.00"
                                          className="w-full px-3 py-1.5 rounded-xl bg-zinc-50 border border-zinc-200 text-xs font-black text-zinc-900 focus:outline-none focus:border-black"
                                        />
                                      </div>

                                      {newEventPresales.length > 1 && (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setNewEventPresales((prev) => prev.filter((item) => item.id !== phase.id));
                                          }}
                                          className="p-2 rounded-xl text-zinc-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer self-end mb-0.5"
                                          title="Eliminar fase"
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </button>
                                      )}
                                    </div>

                                    {/* Row 2: Programación de Duración / Vigencia */}
                                    <div className="pt-2 border-t border-zinc-100 grid grid-cols-1 sm:grid-cols-2 gap-2.5 items-center">
                                      <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-zinc-600 uppercase tracking-wider flex items-center gap-1">
                                          <Clock className="w-3 h-3 text-zinc-400" />
                                          <span>Programar Duración</span>
                                        </label>
                                        <select
                                          value={phase.duration || "1_semana"}
                                          onChange={(e) => {
                                            const val = e.target.value;
                                            setNewEventPresales((prev) =>
                                              prev.map((item) => (item.id === phase.id ? { ...item, duration: val } : item))
                                            );
                                          }}
                                          className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-50 border border-zinc-200 text-xs font-semibold text-zinc-800 focus:outline-none focus:border-black cursor-pointer"
                                        >
                                          <option value="1_semana">Dura 1 Semana (7 días)</option>
                                          <option value="2_semanas">Dura 2 Semanas (14 días)</option>
                                          <option value="3_dias">Dura 3 Días</option>
                                          <option value="hasta_evento">Hasta el día del evento</option>
                                          <option value="aforo">Hasta agotar aforo / cupos</option>
                                          <option value="fecha_custom">Fecha límite personalizada</option>
                                        </select>
                                      </div>

                                      {phase.duration === "fecha_custom" ? (
                                        <div className="space-y-1">
                                          <label className="text-[10px] font-bold text-zinc-600 uppercase tracking-wider block">
                                            Fecha Fin de Preventa
                                          </label>
                                          <input
                                            type="date"
                                            value={phase.customEndDate || ""}
                                            onChange={(e) => {
                                              const val = e.target.value;
                                              setNewEventPresales((prev) =>
                                                prev.map((item) => (item.id === phase.id ? { ...item, customEndDate: val } : item))
                                              );
                                            }}
                                            className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-50 border border-zinc-200 text-xs font-semibold text-zinc-900 focus:outline-none focus:border-black cursor-pointer"
                                          />
                                        </div>
                                      ) : (
                                        <div className="p-2 rounded-xl bg-zinc-50 border border-zinc-100 flex items-center justify-between">
                                          <span className="text-[10.5px] text-zinc-600 font-medium">
                                            {idx === 0
                                              ? "Activa desde la publicación"
                                              : `Se activa al vencer ${newEventPresales[idx - 1]?.name || 'fase previa'}`}
                                          </span>
                                          <span className="px-2 py-0.5 rounded-md bg-zinc-200 text-zinc-700 text-[9px] font-bold uppercase">
                                            {idx === 0 ? "Fase 1" : `Fase ${idx + 1}`}
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>

                              <button
                                type="button"
                                onClick={() => {
                                  setNewEventPresales((prev) => [
                                    ...prev,
                                    {
                                      id: Date.now(),
                                      name: `Preventa ${prev.length + 1}`,
                                      price: String(Number(prev[prev.length - 1]?.price || 5) + 5),
                                      duration: "1_semana",
                                      customEndDate: "",
                                      capacity: "",
                                    },
                                  ]);
                                }}
                                className="w-full py-2.5 rounded-xl bg-zinc-200/80 hover:bg-zinc-300 text-zinc-800 text-xs font-bold uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-1.5"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                <span>+ Agregar otra fase de preventa</span>
                              </button>
                            </div>

                            {/* 5. Información & Restricciones (Combo Box / Chips, sin texto libre) */}
                            <div className="space-y-3">
                              <div className="space-y-1">
                                <label className="text-xs font-bold uppercase tracking-wider text-zinc-700 block">
                                  Información / Descripción del Evento
                                </label>
                                <textarea
                                  value={newEventDescription}
                                  onChange={(e) => setNewEventDescription(e.target.value)}
                                  rows={2}
                                  placeholder="Detalla la experiencia, artistas invitados, normas de ingreso, etc."
                                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 border border-zinc-300 text-xs text-zinc-900 focus:outline-none focus:border-black focus:bg-white transition font-medium"
                                />
                              </div>

                              {/* Restricción de Edad (Combo Box Seleccionable) */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="space-y-1">
                                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-700 block">
                                    Restricción de Edad
                                  </label>
                                  <select
                                    value={newEventAgeRestriction}
                                    onChange={(e) => setNewEventAgeRestriction(e.target.value)}
                                    className="w-full px-3 py-2 rounded-xl bg-zinc-50 border border-zinc-300 text-xs font-bold text-zinc-900 focus:outline-none focus:border-black focus:bg-white transition cursor-pointer"
                                  >
                                    <option value="+18 Años (Cédula de identidad física obligatoria)">+18 Años (Cédula física requerida)</option>
                                    <option value="+21 Años (Exclusivo adultos / VIP)">+21 Años (Exclusivo adultos / VIP)</option>
                                    <option value="Todo Público / Evento Familiar">Todo Público / Evento Familiar</option>
                                    <option value="+16 Años (Con autorización o representante)">+16 Años (Con representante)</option>
                                  </select>
                                </div>

                                <div className="space-y-1">
                                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-700 block">
                                    Presentado Por
                                  </label>
                                  <input
                                    type="text"
                                    value={userProfile?.venueName ? `Presented by ${userProfile.venueName}` : "Presented by Oficial"}
                                    disabled
                                    className="w-full px-3.5 py-2 rounded-xl bg-zinc-100 border border-zinc-200 text-xs text-zinc-500 font-semibold cursor-not-allowed"
                                  />
                                </div>
                              </div>

                              {/* Normas y Restricciones Estandarizadas (Selector de Chips) */}
                              <div className="space-y-1.5">
                                <label className="text-xs font-bold uppercase tracking-wider text-zinc-700 block">
                                  Normas de Admisión Estandarizadas
                                </label>
                                <div className="flex flex-wrap gap-1.5">
                                  {[
                                    "Cédula o documento físico obligatorio",
                                    "Prohibido ingreso de bebidas y alimentos",
                                    "Código de vestimenta casual / semiformal",
                                    "Prohibido el reingreso al recinto",
                                    "Derecho de admisión reservado",
                                    "Prohibido el ingreso de objetos peligrosos",
                                  ].map((policy) => {
                                    const isSelected = newEventPolicies.includes(policy);
                                    return (
                                      <button
                                        key={policy}
                                        type="button"
                                        onClick={() => {
                                          if (isSelected) {
                                            setNewEventPolicies((prev) => prev.filter((p) => p !== policy));
                                          } else {
                                            setNewEventPolicies((prev) => [...prev, policy]);
                                          }
                                        }}
                                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition flex items-center gap-1.5 cursor-pointer ${
                                          isSelected
                                            ? "bg-black text-white"
                                            : "bg-zinc-100 hover:bg-zinc-200 text-zinc-700 border border-zinc-200"
                                        }`}
                                      >
                                        <Check className={`w-3 h-3 ${isSelected ? "text-white" : "opacity-0"}`} />
                                        <span>{policy}</span>
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>

                            {/* 6. Lugar / Ubicación (Google Maps & Selector Rápido) */}
                            <div className="p-3.5 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-2.5">
                              <div className="flex items-center justify-between">
                                <label className="text-xs font-black uppercase tracking-wider text-zinc-800 block">
                                  Lugar &amp; Ubicación del Evento
                                </label>
                                <button
                                  type="button"
                                  onClick={() => setIsLocationPickerOpen(true)}
                                  className="px-3 py-1 rounded-xl bg-black hover:bg-zinc-800 text-white text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition cursor-pointer shadow-sm"
                                >
                                  <MapPin className="w-3.5 h-3.5 text-white" />
                                  <span>Marcar en Google Maps</span>
                                </button>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="space-y-1">
                                  <span className="text-[11px] font-bold text-zinc-600 block">Establecimiento / Venue</span>
                                  <input
                                    type="text"
                                    value={newEventVenueName}
                                    onChange={(e) => setNewEventVenueName(e.target.value)}
                                    placeholder="Cubic Club"
                                    className="w-full px-3.5 py-2 rounded-xl bg-white border border-zinc-300 text-xs font-semibold text-zinc-900 focus:outline-none focus:border-black transition"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <span className="text-[11px] font-bold text-zinc-600 block">Dirección Física</span>
                                  <input
                                    type="text"
                                    value={newEventVenueAddress}
                                    onChange={(e) => setNewEventVenueAddress(e.target.value)}
                                    placeholder="Av. Salvador Bustamante Celi y Guayaquil, Loja"
                                    className="w-full px-3.5 py-2 rounded-xl bg-white border border-zinc-300 text-xs font-semibold text-zinc-900 focus:outline-none focus:border-black transition"
                                  />
                                </div>
                              </div>
                            </div>

                            {/* 7. Sección Promotor & Co-Promotores (con Enlace Único de Consentimiento) */}
                            <div className="p-3.5 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-2.5">
                              <div className="flex items-center justify-between">
                                <div>
                                  <label className="text-xs font-black uppercase tracking-wider text-zinc-800 block">
                                    Promotores del Evento
                                  </label>
                                  <p className="text-[10px] text-zinc-500 font-medium">
                                    Vincula otras marcas mediante enlace único de consentimiento oficial.
                                  </p>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => setIsCoOrganizerModalOpen(true)}
                                  className="px-3 py-1.5 rounded-xl bg-black hover:bg-zinc-800 text-white text-[11px] font-bold uppercase tracking-wider transition active:scale-95 cursor-pointer flex items-center gap-1 shadow-sm"
                                >
                                  <span>+ Vincular Co-Organizadores</span>
                                </button>
                              </div>

                              <div className="flex flex-wrap gap-2 pt-1">
                                {newEventCoOrganizers.map((coOrg, idx) => (
                                  <div
                                    key={idx}
                                    className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white border border-zinc-200 text-xs font-bold text-zinc-800 shadow-sm"
                                  >
                                    <span>{coOrg}</span>
                                    <span className="text-[9.5px] px-1.5 py-0.2 rounded bg-zinc-100 text-zinc-600 font-semibold uppercase">
                                      {idx === 0 ? "Principal" : "Co-Host"}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* ─── 8. OBLIGATORY LEGAL & FISCAL DISCLAIMERS (CHECKBOXES) ─── */}
                            <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-3 font-sans">
                              {/* Checkbox 1: Fiscal / Tributario */}
                              <label className="flex items-start justify-between gap-3 cursor-pointer select-none pb-3 border-b border-zinc-200/80">
                                <span className="text-xs font-medium text-zinc-800 leading-relaxed">
                                  Como organizador, eres responsable de cumplir con tus obligaciones fiscales según tu régimen tributario.
                                </span>
                                <input
                                  type="checkbox"
                                  checked={agreeFiscal}
                                  onChange={(e) => setAgreeFiscal(e.target.checked)}
                                  className="w-5 h-5 rounded-md border-zinc-300 text-black focus:ring-black accent-black cursor-pointer shrink-0 mt-0.5"
                                />
                              </label>

                              {/* Checkbox 2: Normativa municipal y aforo */}
                              <label className="flex items-start justify-between gap-3 cursor-pointer select-none pb-3 border-b border-zinc-200/80">
                                <span className="text-xs font-medium text-zinc-800 leading-relaxed">
                                  Como organizador, eres responsable de cumplir la normativa de cada municipio en permisos y aforo.
                                </span>
                                <input
                                  type="checkbox"
                                  checked={agreeMunicipal}
                                  onChange={(e) => setAgreeMunicipal(e.target.checked)}
                                  className="w-5 h-5 rounded-md border-zinc-300 text-black focus:ring-black accent-black cursor-pointer shrink-0 mt-0.5"
                                />
                              </label>

                              {/* Legal Note */}
                              <p className="text-[11px] text-zinc-500 font-medium pt-0.5">
                                Tu convenio estará en la sección legal una vez aprobado tu evento.
                              </p>
                            </div>
                          </div>

                          {/* Pinned Submit Button Footer */}
                          <div className="pt-3 shrink-0 border-t border-zinc-100 space-y-1.5">
                            {(!agreeFiscal || !agreeMunicipal || !newEventTitle.trim() || !newEventDate.trim()) && (
                              <p className="text-[11px] text-amber-700 bg-amber-50 px-3 py-1 rounded-xl text-center font-medium border border-amber-200">
                                Completa el título, fecha y marca ambas declaraciones legales para publicar el evento.
                              </p>
                            )}

                            <button
                              type="button"
                              disabled={!agreeFiscal || !agreeMunicipal || !newEventTitle.trim() || !newEventDate.trim()}
                              onClick={async () => {
                                if (!newEventTitle.trim() || !newEventDate.trim() || !agreeFiscal || !agreeMunicipal) return;
                                
                                const basePrice = Number(newEventPresales[0]?.price) || 5;
                                const newEvtPayload = {
                                  title: newEventTitle,
                                  subtitle: newEventSubtitle || "SALA PRINCIPAL",
                                  category: newEventCategory,
                                  city: newEventCity,
                                  price: basePrice,
                                  date: newEventDate,
                                  dateLabel: new Date(newEventDate + 'T12:00:00').toLocaleDateString('es-EC', { day: 'numeric', month: 'short', year: 'numeric' }).toUpperCase(),
                                  venue: newEventVenueName || userProfile?.venueName || "Local del Evento",
                                  poster: newEventPoster || "/images/4go_red_girl_showcase.jpg",
                                  imageUrl: newEventPoster || "/images/4go_red_girl_showcase.jpg",
                                  description: newEventDescription || `Evento oficial por ${userProfile?.venueName || userProfile?.name || "Organizador"}. Entradas con acceso instantáneo.`,
                                  lineup: newEventCoOrganizers,
                                  organizer: userProfile?.venueName || userProfile?.name || "Promotor Oficial",
                                  organizers: newEventCoOrganizers,
                                  ageRestriction: newEventAgeRestriction || "18+",
                                  presales: newEventPresales,
                                };

                                let publishedEvt: Event;
                                try {
                                  const res = await fetch("/api/events", {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify(newEvtPayload),
                                  });
                                  const data = await res.json();
                                  if (data.success && data.event) {
                                    publishedEvt = data.event;
                                    setEvents((prev) => [data.event, ...prev.filter((e) => e.id !== data.event.id)]);
                                  } else {
                                    publishedEvt = {
                                      id: `evt-${Date.now()}`,
                                      ...newEvtPayload,
                                      startsAt: new Date().toISOString(),
                                    } as any;
                                    setEvents((prev) => [publishedEvt, ...prev]);
                                  }
                                } catch {
                                  publishedEvt = {
                                    id: `evt-${Date.now()}`,
                                    ...newEvtPayload,
                                    startsAt: new Date().toISOString(),
                                  } as any;
                                  setEvents((prev) => [publishedEvt, ...prev]);
                                }

                                try {
                                  const existing = JSON.parse(localStorage.getItem("4go_created_events") || "[]");
                                  const updatedCreated = [publishedEvt, ...existing.filter((e: any) => e.id !== publishedEvt.id)];
                                  localStorage.setItem("4go_created_events", JSON.stringify(updatedCreated));
                                } catch (err) {
                                  console.error("Error saving created event:", err);
                                }

                                setLastPublishedEvent(publishedEvt);
                                setOrganizerSubView("published");
                                setShowEventPublishedToast(true);
                                setActiveStoryScreen(2);
                                if (typeof window !== "undefined") {
                                  window.scrollTo({ top: 0, behavior: "smooth" });
                                }
                              }}
                              className="w-full py-3.5 rounded-full bg-black hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black text-xs uppercase tracking-widest transition active:scale-95 text-center cursor-pointer shadow-xl"
                            >
                              Publicar Evento Ahora →
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                </div>

                {/* --- LOWER FEATURE SECTION BELOW VIDEO & LOGIN HERO (WHITE BACKGROUND WITH ANIMATED FACES) --- */}
                <div id="subir-features-section" className="w-full bg-white text-black pt-20 sm:pt-28 pb-28 sm:pb-36 px-6 sm:px-12 font-sans relative z-10">
                  <div className="max-w-xl mx-auto flex flex-col items-center text-center space-y-16 sm:space-y-24">
                    {/* Main Centered Header */}
                    <motion.div
                      initial={isDesktopAnimation ? { opacity: 0, y: 30 } : false}
                      whileInView={isDesktopAnimation ? { opacity: 1, y: 0 } : undefined}
                      viewport={isDesktopAnimation ? { once: false, amount: "some" } : undefined}
                      transition={isDesktopAnimation ? { duration: 0.55, ease: [0.22, 1, 0.36, 1] } : { duration: 0 }}
                      className="space-y-2 text-center"
                    >
                      <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black uppercase tracking-tight leading-tight text-black font-sans">
                        CREAR EVENTOS NUNCA FUE TAN FÁCIL
                      </h2>
                    </motion.div>

                    {/* Centered Scroll-Animated Feature Items with Unique Alien Faces (No zoom, pure smooth glide on PC, static on mobile) */}
                    {[
                      {
                        face: "/images/alien_face_v2_1.png",
                        title: "PUBLICA EN SEGUNDOS",
                        desc: "Configura tu evento, precios y preventas en menos tiempo del que te tomó leer esto.",
                      },
                      {
                        face: "/images/alien_face_v2_2.png",
                        title: "COBROS TRANSPARENTES",
                        desc: "Mira tus ingresos totales desde el inicio, sin comisiones sorpresa ni retrasos al liquidar.",
                      },
                      {
                        face: "/images/alien_face_v2_3.png",
                        title: "VALIDA ENTRADAS EN PUERTA",
                        desc: "Escaneo QR instantáneo desde cualquier teléfono para un ingreso rápido y sin duplicados.",
                      },
                      {
                        face: "/images/alien_face_v2_4.png",
                        title: "ALCANCE DIRECTO A TU PÚBLICO",
                        desc: "Llega a miles de personas que buscan fiestas, conciertos y planes directamente en su inicio.",
                      },
                      {
                        face: "/images/alien_face_v2_5.png",
                        title: "CONTROL TOTAL DE ZONAS VIP",
                        desc: "Administra mesas, consumos mínimos, listas de cortesía y capacidad de tu establecimiento.",
                      },
                    ].map((item) => (
                      <motion.div
                        key={item.title}
                        initial={isDesktopAnimation ? { opacity: 0, y: 20 } : false}
                        whileInView={isDesktopAnimation ? { opacity: 1, y: 0 } : undefined}
                        viewport={isDesktopAnimation ? { once: true, amount: 0.05 } : undefined}
                        transition={isDesktopAnimation ? { duration: 0.4, ease: "easeOut" } : { duration: 0 }}
                        className="flex flex-col items-center text-center space-y-3.5"
                      >
                        {/* Distinct Larger Alien Face Illustration (No zoom) */}
                        <div className="relative w-32 h-28 sm:w-40 sm:h-36 mb-1">
                          <Image
                            src={item.face}
                            alt={item.title}
                            fill
                            priority
                            unoptimized
                            sizes="(max-width: 640px) 128px, 160px"
                            className="object-contain"
                          />
                        </div>

                        {/* Title */}
                        <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-black font-sans">
                          {item.title}
                        </h3>

                        {/* Description */}
                        <p className="text-xs sm:text-sm text-zinc-600 font-medium max-w-sm sm:max-w-md mx-auto leading-relaxed">
                          {item.desc}
                        </p>
                      </motion.div>
                    ))}

                    {/* Centered CTA Button */}
                    <motion.div
                      initial={isDesktopAnimation ? { opacity: 0, y: 20 } : false}
                      whileInView={isDesktopAnimation ? { opacity: 1, y: 0 } : undefined}
                      viewport={isDesktopAnimation ? { once: false, amount: "some" } : undefined}
                      transition={isDesktopAnimation ? { duration: 0.55, ease: [0.22, 1, 0.36, 1] } : { duration: 0 }}
                      className="pt-4"
                    >
                      <button
                        type="button"
                        onClick={() => {
                          if (typeof window !== "undefined") {
                            window.scrollTo({ top: 0, behavior: "smooth" });
                          }
                        }}
                        className="px-10 py-4 rounded-full bg-black hover:bg-zinc-800 text-white font-black text-xs sm:text-sm uppercase tracking-widest transition-all shadow-xl active:scale-95 cursor-pointer"
                      >
                        ELEVA TU CUENTA A PARTNER 4GO
                      </button>
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            )}

            {(activeStoryScreen === 1 || (activeStoryScreen !== 0 && activeStoryScreen !== 2)) && (
              <motion.div
                key="screen-1-home"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
                className="bg-black text-white min-h-screen pt-0 pb-0 font-sans"
              >
                {/* --- 1. FULL-BLEED HERO SHOWCASE --- */}
                <section className="relative w-full overflow-hidden">
                  {(() => {
                    const heroSlides = [
                      {
                        id: "4go-chef-intro",
                        poster: "/images/4go_dj_green_alien_hero.png",
                        title: "",
                        line1: "You ready?",
                        line2: "Explora y vive la fiesta con 4GO",
                        event: events[0] || fallbackEvents[0],
                      },
                      ...events.map((e) => ({
                        id: e.id,
                        poster: e.poster || "/images/now4go-hero-presentation-hd-v3.png",
                        title: e.title,
                        line1: e.subtitle || e.venue,
                        line2: e.description || "Entradas oficiales disponibles",
                        event: e,
                      })),
                    ];

                    const currentSlide = heroSlides[heroIndex % heroSlides.length];

                    return (
                      <div className="relative w-full flex flex-col items-center">
                        <div
                          className="relative w-screen left-1/2 -translate-x-1/2 h-[420px] sm:h-auto sm:aspect-[2.4/1] overflow-hidden bg-black"
                        >
                          {/* Blurred backdrop for desktop side fill */}
                          <Image
                            src={currentSlide.poster}
                            alt=""
                            fill
                            priority
                            quality={100}
                            sizes="(max-width: 639px) 1px, 100vw"
                            aria-hidden="true"
                            className="hidden sm:block object-cover object-center scale-110 blur-2xl brightness-[0.4] saturate-150"
                          />

                          {/* --- HD ULTRA-CRISP RESPONSIVE PICTURE ELEMENT --- */}
                          <picture className="absolute inset-0 z-10 flex items-center justify-center w-full h-full">
                            {/* 1. Prioritize Modern WebP format with 1x & 2x Retina resolution density */}
                            <source
                              type="image/webp"
                              srcSet="/images/4go_dj_green_alien_hero_1x.webp 1x, /images/4go_dj_green_alien_hero_2k.webp 2x"
                            />
                            {/* 2. Fallback PNG 2K high-res asset */}
                            <img
                              src="/images/4go_dj_green_alien_hero_2k.png"
                              alt={currentSlide.title}
                              loading="eager"
                              decoding="async"
                              className="w-full h-full object-cover object-center sm:object-contain brightness-105"
                              style={{
                                maxWidth: "100%",
                                height: "100%",
                                imageRendering: "-webkit-optimize-contrast",
                              }}
                            />
                          </picture>
                          {/* Seamless gradient overlay fading smoothly down into solid pure black */}
                          <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-b from-transparent via-black/60 via-black/90 to-black z-10 pointer-events-none" />
                          <div className="absolute bottom-6 inset-x-0 p-6 flex flex-col items-center text-center z-10 max-w-xl mx-auto">
                            {currentSlide.title && currentSlide.title.toLowerCase() !== "4go" && (
                              <h2 className="text-4xl sm:text-6xl font-black text-white tracking-tight uppercase leading-tight drop-shadow-2xl">
                                {currentSlide.title}
                              </h2>
                            )}
                            <div className="mt-1.5 flex flex-col items-center text-center space-y-0.5">
                              <p className="text-xs sm:text-sm font-bold text-zinc-100 drop-shadow line-clamp-1">
                                {currentSlide.line1}
                              </p>
                              <p className="text-xs sm:text-sm font-medium text-zinc-300 drop-shadow line-clamp-1">
                                {currentSlide.line2}
                              </p>
                            </div>
                            <div className="mt-5 flex flex-col items-center gap-3">
                              {!isMounted && !initialLoggedIn && !userLoggedIn ? (
                                <div className="h-11 w-44 rounded-full bg-white/10 backdrop-blur-xl animate-pulse" />
                              ) : !userLoggedIn ? (
                                /* GOOGLE SOCIAL LOGIN BUTTON */
                                <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3">
                                  {/* Google Login */}
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleQuickSocialLogin("google");
                                    }}
                                    className="px-6 py-3 rounded-full bg-white hover:bg-zinc-200 text-black font-black text-xs uppercase tracking-wider shadow-xl transition-all hover:scale-105 active:scale-95 cursor-pointer flex items-center gap-2"
                                  >
                                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                                      <path
                                        fill="#4285F4"
                                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                      />
                                      <path
                                        fill="#34A853"
                                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                      />
                                      <path
                                        fill="#FBBC05"
                                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                                      />
                                      <path
                                        fill="#EA4335"
                                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                                      />
                                    </svg>
                                    <span>ENTRAR CON GOOGLE</span>
                                  </button>
                                </div>
                              ) : (
                                /* LOGGED IN: PUBLICAR EVENTO (Sleek Glassmorphism Animated Button) */
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveStoryScreen(0);
                                  }}
                                  className="px-8 py-3.5 rounded-full bg-white/20 backdrop-blur-xl border border-white/40 text-white font-black text-xs uppercase tracking-widest hover:bg-white/30 shadow-[0_10px_30px_rgba(0,0,0,0.5)] transition-all hover:scale-105 active:scale-95 cursor-pointer animate-pulse"
                                >
                                  PUBLICAR EVENTO
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </section>

                {/* --- HORIZONTAL EVENT CAROUSEL ("Trending on 4GO" FULL BLEED EDGE-TO-EDGE) --- */}
                <section id="trending-events-section" className="w-full bg-white text-black py-8 sm:py-12 relative z-20 overflow-x-hidden">
                  <div className="max-w-[1400px] mx-auto px-4 sm:px-8 mb-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-zinc-200 pb-4">
                      <div className="max-w-2xl">
                        <h2 className="text-2xl sm:text-3xl font-black text-black tracking-tight font-sans drop-shadow-sm">
                          Tendencias en 4GO
                        </h2>
                        <p className="text-xs sm:text-sm text-zinc-600 font-medium mt-1 leading-relaxed">
                          Descubre algunos de los eventos más populares en tu ciudad, desde noches de fiesta y conciertos hasta festivales y espectáculos en vivo.
                        </p>
                      </div>

                      {/* VER EVENTOS Pill Button */}
                      <div className="flex items-center gap-3 shrink-0">
                        <button
                          type="button"
                          onClick={() => setActiveStoryScreen(2)}
                          className="px-6 py-2.5 rounded-full bg-black text-white font-black text-xs uppercase tracking-wider hover:bg-zinc-800 transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-md"
                        >
                          DESCUBRE MÁS EVENTOS
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Horizontal Scroll Row (Edge-to-Edge 100% Full Bleed Screen Width) */}
                  <div
                    id="trending-events-carousel"
                    data-carousel="true"
                    onMouseEnter={() => setIsCarouselHovered(true)}
                    onMouseLeave={() => setIsCarouselHovered(false)}
                    onTouchStart={() => setIsCarouselHovered(true)}
                    onTouchEnd={() => setIsCarouselHovered(false)}
                    className="relative w-full overflow-hidden py-2 select-none touch-pan-y"
                  >
                    <style>{`
                      @keyframes marqueeLeftResponsive {
                        0% { transform: translate3d(0%, 0, 0); }
                        100% { transform: translate3d(-50%, 0, 0); }
                      }
                    `}</style>
                    <div
                      className="flex items-center gap-4 sm:gap-5 shrink-0 w-max pl-4 sm:pl-6"
                      style={{
                        animation: "marqueeLeftResponsive 240s linear infinite",
                        animationPlayState: isCarouselHovered ? "paused" : "running",
                        willChange: "transform",
                        WebkitBackfaceVisibility: "hidden",
                      }}
                    >
                      {[...events, ...events].map((evt, idx) => (
                        <div
                          key={`carousel-card-${evt.id}-${idx}`}
                          onClick={() => {
                            setSelectedCarouselEvent(evt);
                            setOpenedFromEvent(null);
                            setOpenedFromOrganizerSlug(null);
                            setActiveOverlay("event");
                          }}
                          className="w-36 sm:w-56 md:w-60 lg:w-64 shrink-0 flex flex-col space-y-2 cursor-pointer group"
                        >
                          {/* Square Artwork Container with Play & Heart Overlays */}
                          <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-zinc-900 shadow-md border border-zinc-200 group-hover:border-zinc-400 transition-colors">
                            <Image
                              src={evt.poster || "/images/now4go-hero-presentation-hd-v3.png"}
                              alt={evt.title}
                              fill
                              unoptimized
                              priority
                              className="object-cover brightness-105"
                              sizes="(max-width: 640px) 150px, 300px"
                            />
                            {/* Subtle Gradient Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

                            {/* Heart Overlay Button (Bottom Right - Snappy 0ms Mobile Tap) */}
                            <div className="absolute bottom-2 right-2 sm:bottom-2.5 sm:right-2.5 z-20 pointer-events-auto">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  e.preventDefault();
                                  if (!userLoggedIn) {
                                    setShowAuthModalForFavorites(true);
                                    return;
                                  }
                                  toggleFavorite(evt.id, e);
                                }}
                                className="w-8 h-8 sm:w-8 sm:h-8 rounded-full bg-white hover:bg-zinc-100 active:bg-zinc-200 border border-white flex items-center justify-center transition-transform active:scale-90 shadow-md cursor-pointer touch-manipulation select-none"
                                aria-label="Guardar favorito"
                              >
                                <Heart
                                  className={`w-4 h-4 transition-colors ${
                                    userLoggedIn && likedEvents[evt.id]
                                      ? "text-red-500 fill-red-500"
                                      : "text-zinc-900"
                                  }`}
                                />
                              </button>
                            </div>
                          </div>

                          {/* Event Details Text Below Artwork */}
                          <div className="flex flex-col space-y-0.5 px-0.5 pt-1 text-black">
                            <h4 className="text-xs sm:text-sm font-extrabold text-black tracking-tight leading-tight line-clamp-1 group-hover:text-purple-600 transition-colors">
                              {evt.title}
                            </h4>
                            <span className="text-[11px] sm:text-xs font-bold text-zinc-800">
                              {evt.dateLabel || "sáb, 26 sept"}
                            </span>
                            <span className="text-[11px] sm:text-xs font-semibold text-zinc-600 truncate">
                              {evt.venue || "Factory Town"}
                            </span>
                            <span className="text-[11px] sm:text-xs font-black text-black pt-0.5">
                              {evt.price === 0 ? "Desde Gratis" : `Desde ${evt.price || "52,74"} $`}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>

                {/* --- 3. FEATURE SECTION (COMPRAR ENTRADAS - WHITE BACKGROUND, HORIZONTAL ON PC, VERTICAL ON MOBILE) --- */}
                <div id="comprar-features-section" className="w-full bg-white text-black pt-16 sm:pt-24 pb-20 sm:pb-28 px-6 sm:px-12 font-sans relative z-10 border-t border-zinc-200">
                  <div className="max-w-[1200px] mx-auto text-center space-y-14 sm:space-y-16">
                    {/* Main Centered Header */}
                    <div className="space-y-2 text-center max-w-2xl mx-auto">
                      <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black uppercase tracking-tight leading-tight text-black font-sans">
                        COMPRAR ENTRADAS NUNCA FUE TAN FÁCIL
                      </h2>
                    </div>

                    {/* Feature Items (Horizontal 3-column grid on PC, vertical stack on Mobile) */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-10 lg:gap-16 items-start">
                      {[
                        {
                          face: "/images/alien_face_v2_1.png",
                          title: "COMPRA EN SEGUNDOS",
                          desc: "Obtén tus entradas oficiales en menos tiempo del que te tomó leer esto.",
                        },
                        {
                          face: "/images/alien_face_v2_2.png",
                          title: "PRECIOS TRANSPARENTES",
                          desc: "Mira el precio total desde el inicio, sin cargos ocultos ni sorpresas al pagar.",
                        },
                        {
                          face: "/images/alien_face_v2_3.png",
                          title: "RECOMENDACIONES PERSONALIZADAS",
                          desc: "Descubre los eventos hechos a tu medida directamente en tu inicio.",
                        },
                      ].map((item) => (
                        <div
                          key={item.title}
                          className="flex flex-col items-center text-center space-y-3.5"
                        >
                          {/* Distinct Larger Alien Face Illustration (No zoom) */}
                          <div className="relative w-32 h-28 sm:w-36 sm:h-32 mb-1">
                            <Image
                              src={item.face}
                              alt={item.title}
                              fill
                              priority
                              unoptimized
                              sizes="(max-width: 640px) 128px, 144px"
                              className="object-contain"
                            />
                          </div>

                          {/* Title */}
                          <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-black font-sans">
                            {item.title}
                          </h3>

                          {/* Description */}
                          <p className="text-xs sm:text-sm text-zinc-600 font-medium max-w-xs mx-auto leading-relaxed">
                            {item.desc}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* --- 4. WHITE ORGANIZER BANNER SECTION (PUBLICA TUS EVENTOS) --- */}
                <section id="organizer-banner-section" className="w-full bg-white text-black py-16 sm:py-24 relative z-20 font-sans border-t border-zinc-200">
                  <div className="max-w-[1300px] mx-auto px-6 sm:px-12">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
                      {/* Left Column: Title, Description & Action Buttons */}
                      <div className="lg:col-span-6 space-y-6 text-left">
                        <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-black tracking-tight font-sans uppercase leading-[1.05]">
                          PUBLICA TUS EVENTOS &amp; CONECTA CON TU AUDIENCIA
                        </h2>
                        <p className="text-xs sm:text-sm text-zinc-600 font-semibold leading-relaxed max-w-xl">
                          Diseñado exclusivamente para productores, creadores y clubes nocturnos. Gestiona preventas en tiempo real, validación QR ultrasónica en puerta y control total de entradas en una sola plataforma.
                        </p>

                        {/* Action Buttons */}
                        <div className="flex items-center justify-start pt-2">
                          <button
                            type="button"
                            onClick={() => setActiveStoryScreen(0)}
                            className="px-6 py-3.5 rounded-full bg-black text-white hover:bg-zinc-800 text-xs sm:text-sm font-black uppercase tracking-wider transition-all active:scale-95 shadow-xl inline-flex items-center justify-center cursor-pointer"
                          >
                            CREAR CUENTA DE ORGANIZADOR
                          </button>
                        </div>
                      </div>

                      {/* Right Column: Rounded Image Container with Red Girl Photo & Copyright watermark */}
                      <div className="lg:col-span-6 w-full flex justify-center lg:justify-end">
                        <div className="relative w-full max-w-[540px] aspect-[4/3.5] rounded-[2.5rem] overflow-hidden shadow-2xl border border-black/10 bg-zinc-950">
                          <Image
                            src="/images/4go_red_girl_showcase.jpg"
                            alt="Publica tus eventos 4GO"
                            fill
                            className="object-cover brightness-105"
                            sizes="(max-width: 768px) 100vw, 600px"
                          />
                          {/* Overlay copyright text on bottom left */}
                          <span className="absolute bottom-4 left-5 text-[10px] sm:text-[11px] font-extrabold text-white/90 tracking-wider shadow-md drop-shadow">
                            © 4GO 2026, all rights reserved
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                {/* --- 6. MERCH 4GO SECTION WITH CLEAN MINIMAL OVERLAY --- */}
                <section id="merch-4go-section" className="w-full relative z-20 font-sans py-36 sm:py-48 lg:py-56 overflow-hidden border-t border-white/10 text-white min-h-[550px] sm:min-h-[680px] lg:min-h-[850px] flex items-end justify-center pb-16 sm:pb-24 lg:pb-28">
                  {/* Full-bleed Vivid Hero Image as Section Background */}
                  <div className="absolute inset-0 z-0 overflow-hidden">
                    <Image
                      src="/images/nenez_merch_official_couch_hero.png"
                      alt="NENEZ Merch Official Couch"
                      fill
                      priority
                      quality={100}
                      className="object-cover object-[center_12%] sm:object-[center_15%] lg:object-[center_10%]"
                      sizes="100vw"
                    />
                    {/* Soft vignette gradient overlay for bottom text readability */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/20" />
                  </div>

                  {/* Clean Minimal Overlay: Title + Subtitle + White Pill Button */}
                  <div className="max-w-md mx-auto px-6 relative z-10 text-center flex flex-col items-center">
                    <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-tight drop-shadow-lg font-sans uppercase">
                      MERCH
                    </h3>
                    <p className="text-xs sm:text-sm font-bold text-white/90 tracking-normal mt-1 drop-shadow-md">
                      4GO presenta su linea de ropa urbana limitada
                    </p>

                    <button
                      type="button"
                      onClick={() => {
                        const message = "Hola 4GO, deseo comprar prendas del Merch";
                        if (typeof window !== "undefined") {
                          window.open(`https://wa.me/593988831372?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
                        }
                      }}
                      className="mt-5 px-8 py-3.5 rounded-full bg-white text-black font-black uppercase text-xs sm:text-sm tracking-wider hover:bg-zinc-100 active:scale-95 transition-all shadow-[0_10px_30px_rgba(0,0,0,0.5)] cursor-pointer"
                    >
                      COMPRAR AHORA
                    </button>
                    <p className="mt-2.5 text-[11px] text-zinc-400 font-medium">
                      Asegúrate de tener WhatsApp abierto
                    </p>
                  </div>
                </section>
              </motion.div>
            )}

            {activeStoryScreen === 2 && (
              <motion.div
                key="screen-2-cartelera"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
                className="w-full text-white min-h-screen pt-28 sm:pt-32 pb-40 px-4 sm:px-8 relative z-10 bg-black overflow-hidden"
              >
                {/* ─── ULTRA-VIVID AMBIENT POSTER COLOR BLUR (AUTHENTIC GRADIENT FADE TO DEEP BLACK) ─── */}
                <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden bg-black transform-gpu">
                  {/* Blurred Image with Smooth Mask-Image Gradient Fade to Black */}
                  <div
                    className="absolute top-0 inset-x-0 h-[85vh] max-h-[850px] overflow-hidden"
                    style={{
                      WebkitMaskImage: "linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0.9) 25%, rgba(0,0,0,0.45) 60%, rgba(0,0,0,0) 100%)",
                      maskImage: "linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0.9) 25%, rgba(0,0,0,0.45) 60%, rgba(0,0,0,0) 100%)",
                    }}
                  >
                    <Image
                      src={events[0]?.poster || "/images/alien_face_v2_1.png"}
                      alt=""
                      aria-hidden="true"
                      fill
                      loading="lazy"
                      quality={20}
                      sizes="120px"
                      className="object-cover object-top scale-125 blur-2xl opacity-60 transform-gpu"
                    />
                  </div>

                  {/* Global Smooth Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/25 via-40% to-black pointer-events-none" />
                </div>

                <div className="max-w-[1400px] mx-auto space-y-6 relative z-10">

                  {/* --- YOUTUBE-STYLE CLEAN SEARCH ON TOP & FILTER CHIPS BELOW --- */}
                  <div className="flex flex-col items-center gap-3.5 relative z-20 w-full">
                    {/* Top: Centered Search Input */}
                    <div className="relative w-full max-w-md mx-auto flex items-center">
                      <Search className="absolute left-3.5 w-4 h-4 text-white/50 pointer-events-none" />
                      <input
                        type="text"
                        value={carteleraSearchQuery}
                        onChange={(e) => {
                          setCarteleraSearchQuery(e.target.value);
                          setTimeout(checkChipsScroll, 100);
                        }}
                        placeholder="Buscar evento, promotor o club..."
                        className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-[#202020] hover:bg-[#252525] border border-white/10 text-xs font-semibold text-white placeholder:text-white/45 focus:outline-none focus:border-white/40 focus:bg-[#2b2b2b] transition-all shadow-inner"
                      />
                      {carteleraSearchQuery && (
                        <button
                          type="button"
                          onClick={() => {
                            setCarteleraSearchQuery("");
                            setTimeout(checkChipsScroll, 100);
                          }}
                          className="absolute right-3 p-1 text-white/60 hover:text-white transition cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Bottom: Chips Horizontal Carousel (Centered on PC, Scrollable on Mobile) */}
                    <div className="relative w-full max-w-5xl mx-auto flex items-center justify-center">
                      {/* Floating Left Scroll Arrow Button */}
                      <AnimatePresence>
                        {canChipsScrollLeft && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.15 }}
                            className="absolute left-0 inset-y-0 z-20 flex items-center pl-1 pr-6 bg-gradient-to-r from-black via-black/85 to-transparent pointer-events-none"
                          >
                            <button
                              type="button"
                              onClick={() => {
                                const el = carteleraChipsRef.current;
                                if (el) {
                                  el.scrollBy({ left: -220, behavior: "smooth" });
                                  setTimeout(checkChipsScroll, 250);
                                }
                              }}
                              className="pointer-events-auto w-7 h-7 rounded-full bg-[#202020] hover:bg-[#303030] text-white flex items-center justify-center transition-all active:scale-90 cursor-pointer shadow-md border border-white/15"
                              aria-label="Anterior"
                            >
                              <ChevronLeft className="w-4 h-4 text-white stroke-[2.5]" />
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <div
                        ref={carteleraChipsRef}
                        id="cartelera-chips-container"
                        onScroll={checkChipsScroll}
                        className="flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth py-1 px-8 sm:px-10 w-full justify-start md:justify-center"
                      >
                        {[
                          { id: "todos", label: "Todo" },
                          { id: "favoritos", label: "Favoritos" },
                          { id: "mis_reservas", label: "Mis Reservas" },
                          { id: "party", label: "Fiesta" },
                          { id: "comedy", label: "Comedia" },
                          { id: "gigs", label: "Gigs" },
                          { id: "food", label: "Food" },
                          { id: "social", label: "Social" },
                          { id: "wellbeing", label: "Bienestar" },
                        ].map((cat) => {
                          const isActive = selectedDay === cat.id || (cat.id === "todos" && selectedDay === "todos");
                          return (
                            <button
                              key={`chip-${cat.id}`}
                              type="button"
                              onClick={() => {
                                if (!userLoggedIn && (cat.id === "favoritos" || cat.id === "mis_reservas")) {
                                  setShowAuthModalForFavorites(true);
                                  return;
                                }
                                setSelectedDay(cat.id);
                              }}
                              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold shrink-0 transition-colors cursor-pointer select-none ${
                                isActive
                                  ? "bg-white text-black shadow-sm"
                                  : "bg-[#272727] hover:bg-[#3f3f3f] text-white/90"
                              }`}
                            >
                              {cat.label}
                            </button>
                          );
                        })}
                      </div>

                      {/* Floating Right Scroll Arrow Button */}
                      <AnimatePresence>
                        {canChipsScrollRight && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.15 }}
                            className="absolute right-0 inset-y-0 z-20 flex items-center pr-1 pl-6 bg-gradient-to-l from-black via-black/85 to-transparent pointer-events-none"
                          >
                            <button
                              type="button"
                              onClick={() => {
                                const el = carteleraChipsRef.current;
                                if (el) {
                                  el.scrollBy({ left: 220, behavior: "smooth" });
                                  setTimeout(checkChipsScroll, 250);
                                }
                              }}
                              className="pointer-events-auto w-7 h-7 rounded-full bg-[#202020] hover:bg-[#303030] text-white flex items-center justify-center transition-all active:scale-90 cursor-pointer shadow-md border border-white/15"
                              aria-label="Siguiente"
                            >
                              <ChevronRight className="w-4 h-4 text-white stroke-[2.5]" />
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  {/* MAIN CONTENT AREA: PROFILES & 2-COLUMN EVENTS GRID */}
                  <div className="w-full pt-2 space-y-6">
                    {/* Matching Organizer / Club Profile Badges ("Bolitas") */}
                    {matchingCarteleraProfiles.length > 0 && (
                      <div className="w-full flex items-center justify-center gap-2.5 overflow-x-auto no-scrollbar py-1 text-center max-w-4xl mx-auto">
                        {matchingCarteleraProfiles.map((prof) => (
                          <button
                            key={`cartelera-prof-pill-${prof.id}`}
                            type="button"
                            onClick={() => {
                              setSelectedOrganizerSlug(prof.id);
                              setOpenedFromEvent(null);
                              setOpenedFromOrganizerSlug(null);
                              setActiveOverlay("organizer");
                            }}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 backdrop-blur-xl hover:bg-white/20 hover:border-white/30 text-white transition-all cursor-pointer shadow-xl shrink-0 group active:scale-95"
                          >
                            <div className="relative w-7 h-7 rounded-full bg-zinc-800 border border-white/30 overflow-hidden flex items-center justify-center shrink-0 shadow-md">
                              {prof.avatar ? (
                                <Image src={prof.avatar} alt={prof.name} fill sizes="28px" className="object-cover" />
                              ) : (
                                <span className="text-[9px] font-black uppercase text-white tracking-wider">
                                  {prof.name.slice(0, 2)}
                                </span>
                              )}
                            </div>
                            <span className="text-xs font-black text-white group-hover:text-[#dfff28] transition-colors truncate">
                              {prof.name}
                            </span>
                            <BadgeCheck className="w-4 h-4 text-sky-400 fill-sky-400/20 shrink-0" />
                          </button>
                        ))}
                      </div>
                    )}

                    <div className="w-full">
                      {filteredCarteleraEvents.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 max-w-6xl mx-auto">
                          {filteredCarteleraEvents.map((evt) => (
                            <div
                              key={`cartelera-card-${evt.id}`}
                              onClick={() => {
                                setSelectedCarouselEvent(evt);
                                setOpenedFromEvent(null);
                                setOpenedFromOrganizerSlug(null);
                                setActiveOverlay("event");
                              }}
                              className="group flex flex-col text-left cursor-pointer space-y-3 w-full max-w-[380px] mx-auto"
                            >
                              {/* Poster Artwork Container */}
                              <div className="relative w-full aspect-square rounded-[24px] sm:rounded-[28px] overflow-hidden bg-zinc-950 border border-white/10 group-hover:border-white/30 transition-all duration-300 shadow-[0_15px_35px_rgba(0,0,0,0.7)]">
                                <Image
                                  src={evt.poster || "/images/now4go-hero-presentation-hd-v3.png"}
                                  alt={evt.title}
                                  fill
                                  className="object-cover"
                                  sizes="(max-width: 768px) 100vw, 360px"
                                />

                                {/* Heart Favorite Overlay Button (Snappy 0ms Mobile Tap) */}
                                <div className="absolute bottom-3 right-3 sm:bottom-3.5 sm:right-3.5 z-20 pointer-events-auto">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      e.preventDefault();
                                      if (!userLoggedIn) {
                                        setShowAuthModalForFavorites(true);
                                        return;
                                      }
                                      toggleFavorite(evt.id, e);
                                    }}
                                    className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-black/70 backdrop-blur-md border border-white/25 flex items-center justify-center text-white hover:scale-110 active:scale-90 transition-transform shadow-lg cursor-pointer touch-manipulation select-none"
                                    aria-label="Guardar favorito"
                                  >
                                    <Heart
                                      className={`w-4 h-4 sm:w-5 sm:h-5 transition-colors ${
                                        userLoggedIn && likedEvents[evt.id]
                                          ? "text-red-500 fill-red-500"
                                          : "text-white hover:text-red-400"
                                      }`}
                                    />
                                  </button>
                                </div>
                              </div>

                              {/* Glassmorphism Info Box Below Poster */}
                              <div className="w-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-3.5 sm:p-5 shadow-2xl space-y-2 transition-colors group-hover:border-white/20">
                                <h4 className="text-base sm:text-lg font-black text-white tracking-tight font-sans line-clamp-1">
                                  {evt.title}
                                </h4>
                                <div className="flex items-center justify-between gap-2 pt-0.5">
                                  <p className="text-xs sm:text-sm text-zinc-300 font-medium tracking-normal truncate">
                                    {evt.venue || "CUBIC LOJA"} • Desde {evt.price === 0 ? "0" : (evt.price || "10")} $
                                  </p>
                                  <button
                                    type="button"
                                    onClick={(e) => handleOpenReservationModal(evt, e)}
                                    className="px-4 py-1.5 rounded-full bg-white hover:bg-zinc-200 text-black text-[11px] font-black uppercase tracking-wider transition-all shadow-md active:scale-95 shrink-0"
                                  >
                                    {userLoggedIn && userReservations[evt.id] ? "COMPRADO ✓" : "COMPRAR"}
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="w-full py-16 text-center space-y-3 bg-white/5 border border-white/10 rounded-3xl backdrop-blur-xl p-8 max-w-2xl mx-auto my-6">
                          <p className="text-sm sm:text-base text-zinc-300 font-semibold">
                            {selectedDay === "favoritos"
                              ? "Aún no tienes eventos guardados en tus favoritos. Toca el corazón en cualquier evento para guardarlo aquí."
                              : selectedDay === "mis_reservas"
                                ? "Aún no tienes reservas activas. Explora los eventos de la cartelera y asegura tu lugar en puerta gratis."
                                : `No hay eventos que coincidan con la búsqueda "${carteleraSearchQuery || selectedDay}"`}
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedDay("todos");
                              setCarteleraSearchQuery("");
                            }}
                            className="px-6 py-3 rounded-full bg-white hover:bg-zinc-200 text-black font-black text-xs uppercase tracking-wider shadow-xl hover:scale-105 active:scale-95 transition cursor-pointer"
                          >
                            {selectedDay === "favoritos" || selectedDay === "mis_reservas" ? "Explorar todos los eventos" : "Restablecer búsqueda"}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Footer with DevEc Software Development Branding */}
          <Footer />
        </div>
      </div>

      {/* --- FLOATING BOTTOM NAVIGATION DOCK --- */}
      <MobileDock
        activeTab={mobileDockTab}
        onTabChange={(t) => {
          setMobileDockTab(t);
          if (t === "explorar") {
            const el = document.getElementById("explore");
            if (el) el.scrollIntoView({ behavior: "smooth" });
          }
        }}
      />

      {/* Solid Black Cinematic Curtain (Guarantees zero home bleed-through) */}
      <AnimatePresence>
        {Boolean(activeOverlay) && (
          <motion.div
            key="cinematic-black-curtain"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="fixed inset-0 z-[840] bg-black pointer-events-none"
          />
        )}
      </AnimatePresence>

      {/* Seamless Soft Blink Transition (Home <-> Event <-> Organizer <-> Back) */}
      <AnimatePresence>
        {activeOverlay === "organizer" && (
          <OrganizerProfileOverlay
            key={`organizer-modal-${selectedOrganizerSlug}`}
            isOpen={true}
            zIndex="z-[850]"
            onClose={() => {
              if (openedFromEvent) {
                setSelectedCarouselEvent(openedFromEvent);
                setActiveOverlay("event");
                setOpenedFromEvent(null);
              } else {
                setActiveOverlay(null);
              }
              setOpenedFromOrganizerSlug(null);
            }}
            organizerName={selectedOrganizerSlug}
            allEvents={events}
            followedProfiles={followedProfiles}
            onToggleFollow={toggleFollowProfile}
            onSelectEvent={(evt) => {
              setSelectedCarouselEvent(evt);
              setOpenedFromOrganizerSlug(selectedOrganizerSlug);
              setActiveOverlay("event");
            }}
            onBuyEvent={(evt) => {
              setSelectedCarouselEvent(evt);
              setIsTicketModalOpen(true);
            }}
          />
        )}

        {activeOverlay === "event" && selectedCarouselEvent && (
          <EventDetailOverlay
            key={`event-detail-modal-${selectedCarouselEvent.id}`}
            event={selectedCarouselEvent}
            allEvents={events}
            isOpen={true}
            zIndex="z-[850]"
            onClose={() => {
              if (openedFromOrganizerSlug) {
                setSelectedOrganizerSlug(openedFromOrganizerSlug);
                setActiveOverlay("organizer");
                setOpenedFromOrganizerSlug(null);
              } else {
                setActiveOverlay(null);
              }
              setOpenedFromEvent(null);
            }}
            onBuy={(event) => {
              setSelectedCarouselEvent(event);
              setReservationTargetEvent(event);
              setShowReservationModal(true);
            }}
            onSelectEvent={(event) => {
              setSelectedCarouselEvent(event);
            }}
            onOpenDrinks={() => setShowDrinksModal(true)}
            onOpenOrganizer={(slug) => {
              if (selectedCarouselEvent) {
                setOpenedFromEvent(selectedCarouselEvent);
              }
              setSelectedOrganizerSlug(slug || "cubic");
              setActiveOverlay("organizer");
            }}
            onOpenSearch={() => {
              setIsHeaderSearchOpen(true);
              setTimeout(() => headerSearchInputRef.current?.focus(), 100);
            }}
            onOpenProfile={() => setShowUserMenu(true)}
            onOpenCreate={() => {
              setActiveOverlay(null);
              setActiveStoryScreen(0);
              if (typeof window !== "undefined") {
                window.scrollTo({ top: 0, behavior: "smooth" });
              }
            }}
            userLoggedIn={userLoggedIn}
            userProfile={userProfile}
            isFavorite={userLoggedIn && !!likedEvents[selectedCarouselEvent?.id || ""]}
            onToggleFavorite={(eventId, e) => toggleFavorite(eventId, e)}
            onOpenAuth={() => setShowAuthModalForFavorites(true)}
            isCheckoutOpen={showReservationModal || isTicketModalOpen}
          />
        )}
      </AnimatePresence>

      {/* --- NEW COMPREHENSIVE TICKET & TABLE PURCHASE CHECKOUT MODAL (WITH OCR VERIFICATION) --- */}
      <AnimatePresence>
        {(showReservationModal || isTicketModalOpen) && (
          <EventPurchaseCheckoutModal
            isOpen={showReservationModal || isTicketModalOpen}
            onClose={() => {
              setShowReservationModal(false);
              setIsTicketModalOpen(false);
            }}
            event={reservationTargetEvent || selectedCarouselEvent}
            userProfile={userProfile}
            userLoggedIn={userLoggedIn}
            onOpenAuth={() => setShowAuthModalForFavorites(true)}
            onOpenSearch={() => {
              setIsHeaderSearchOpen(true);
              setTimeout(() => headerSearchInputRef.current?.focus(), 100);
            }}
            onOpenProfile={() => setShowUserMenu(true)}
            onOpenCreate={() => {
              setShowReservationModal(false);
              setIsTicketModalOpen(false);
              setActiveOverlay(null);
              setActiveStoryScreen(0);
              if (typeof window !== "undefined") {
                window.scrollTo({ top: 0, behavior: "smooth" });
              }
            }}
            onSuccessPurchase={(orderId) => {
              if (selectedCarouselEvent?.id) {
                handleConfirmReservation(selectedCarouselEvent.id, "general");
              }
            }}
          />
        )}
      </AnimatePresence>

      {/* Meet2Go Style Glassmorphic Quick Preview Modal */}
      <QuickPreviewModal
        event={quickPreviewEvent}
        isOpen={showQuickPreview}
        onClose={() => setShowQuickPreview(false)}
      />

      {/* Drinks & Bar Menu Modal */}
      <DrinksMenuModal
        isOpen={showDrinksModal}
        onClose={() => setShowDrinksModal(false)}
        eventName={selectedCarouselEvent?.title || activeEvent.title}
        venueName={selectedCarouselEvent?.venue || activeEvent.venue}
        drinks={selectedCarouselEvent?.drinks || activeEvent?.drinks}
      />

      {/* Ticket Recovery Modal */}
      <TicketRecoveryModal
        isOpen={showRecoveryModal}
        onClose={() => setShowRecoveryModal(false)}
        eventId={selectedCarouselEvent?.id || activeEvent.id}
        eventName={selectedCarouselEvent?.title || activeEvent.title}
        allEvents={events}
      />

      {/* Publish Event Creator Modal */}
      <PublishEventModal
        isOpen={showEventModal}
        onClose={() => setShowEventModal(false)}
      />

      {/* POS Door Ticket Sales Modal */}
      <BoxOfficeSalesModal
        isOpen={isPosModalOpen}
        onClose={() => {
          setIsPosModalOpen(false);
          setShowHiddenMenu(true);
        }}
        event={selectedCarouselEvent || activeEvent}
      />

      {/* POS Drinks Sales Modal */}
      <DrinksSalesModal
        isOpen={isDrinksPosModalOpen}
        onClose={() => {
          setIsDrinksPosModalOpen(false);
          setShowHiddenMenu(true);
        }}
        event={selectedCarouselEvent || activeEvent}
      />

      {/* Hidden agent modules menu */}
      <AnimatePresence>
        {showHiddenMenu && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/85 p-4 backdrop-blur-3xl"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.88, y: 28, filter: "blur(12px)" }}
              animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, scale: 0.88, y: 28, filter: "blur(12px)" }}
              transition={{ duration: 0.38, ease: [0.32, 0, 0.67, 0] }}
              className="relative flex w-full max-w-sm flex-col items-center rounded-[40px] border border-white/[0.1] bg-[#09090b]/90 p-8 sm:p-10 text-center shadow-[0_30px_100px_rgba(0,0,0,0.9)] backdrop-blur-2xl"
            >
              <button
                type="button"
                onClick={() => setShowHiddenMenu(false)}
                className="absolute right-5 top-5 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-zinc-400 transition hover:border-white/30 hover:bg-white/10 hover:text-white cursor-pointer"
                title="Cerrar System Access"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="mb-2 mt-4">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-zinc-300 shadow-[0_0_30px_rgba(255,255,255,0.05)]">
                  <KeyRound className="h-6 w-6" />
                </div>
              </div>

              <h2 className="text-2xl font-black uppercase tracking-[0.15em] text-white">System Access</h2>
              <p className="mb-8 mt-2 text-[9px] font-bold uppercase tracking-[0.3em] text-zinc-500">
                Selecciona el módulo
              </p>

              <div className="flex w-full flex-col gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowHiddenMenu(false);
                    setIsStaffModalOpen(true);
                  }}
                  className="flex w-full items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-4 text-[11px] font-black uppercase tracking-wider text-zinc-300 transition hover:border-white/20 hover:bg-white/5 hover:text-white cursor-pointer"
                >
                  Agente Staff
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowHiddenMenu(false);
                    setIsPosModalOpen(true);
                  }}
                  className="flex w-full items-center justify-center gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-950/20 px-5 py-4 text-[11px] font-black uppercase tracking-wider text-emerald-400 transition hover:border-emerald-500/50 hover:bg-emerald-950/40 hover:text-emerald-300 cursor-pointer"
                >
                  Ventas de Taquilla
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowHiddenMenu(false);
                    setIsDrinksPosModalOpen(true);
                  }}
                  className="flex w-full items-center justify-center gap-3 rounded-2xl border border-amber-500/30 bg-amber-950/20 px-5 py-4 text-[11px] font-black uppercase tracking-wider text-amber-400 transition hover:border-amber-500/50 hover:bg-amber-950/40 hover:text-amber-300 cursor-pointer"
                >
                  Ventas de Barra
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowHiddenMenu(false);
                    router.push("/admin");
                  }}
                  className="flex w-full items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-4 text-[11px] font-black uppercase tracking-wider text-zinc-300 transition hover:border-white/20 hover:bg-white/5 hover:text-white cursor-pointer"
                >
                  Admin
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>



      {/* Organizer / Brand Onboarding Modal */}
      <OrganizerOnboardingModal
        isOpen={isOrganizerOnboardingOpen}
        onClose={() => setIsOrganizerOnboardingOpen(false)}
        onSuccess={(updatedProfile) => {
          setUserProfile(updatedProfile);
          router.push("/organizer/register");
        }}
        currentUser={userProfile}
      />


      {/* --- APPLE ID AUTHENTICATION DIALOG (PREVENTS INVALID_CLIENT ERROR) --- */}
      <AnimatePresence>
        {isAppleAuthModalOpen && (
          <div className="fixed inset-0 z-[400] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-md bg-white text-zinc-900 rounded-3xl p-6 sm:p-8 shadow-2xl border border-zinc-200 relative overflow-hidden font-sans text-left"
            >
              {/* Close Button */}
              <button
                type="button"
                onClick={() => setIsAppleAuthModalOpen(false)}
                className="absolute top-5 right-5 w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-600 flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Apple Header Branding */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-black text-white flex items-center justify-center shrink-0 shadow-md">
                  <svg className="w-6 h-6 fill-current text-white shrink-0" viewBox="0 0 24 24">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.32c.67-.82 1.12-1.96.99-3.1-.97.04-2.16.65-2.85 1.46-.62.72-1.16 1.88-.99 3.03 1.09.08 2.2-.57 2.85-1.39z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-black text-zinc-900 leading-tight">Iniciar sesión con Apple ID</h3>
                  <p className="text-xs text-zinc-500 font-medium">Usa tu ID de Apple para ingresar a 4GO.</p>
                </div>
              </div>

              {/* Input Email & Name */}
              <div className="space-y-3.5 my-5">
                <div className="space-y-1">
                  <label className="text-xs font-black uppercase tracking-wider text-zinc-500 block">Correo de Apple ID / iCloud</label>
                  <input
                    type="email"
                    value={appleInputEmail}
                    onChange={(e) => setAppleInputEmail(e.target.value)}
                    placeholder="tu.cuenta@icloud.com"
                    className="w-full px-4 py-3 rounded-xl bg-zinc-50 border border-zinc-200 text-xs font-semibold text-zinc-900 focus:outline-none focus:border-black focus:bg-white transition"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-black uppercase tracking-wider text-zinc-500 block">Nombre del Organizador</label>
                  <input
                    type="text"
                    value={appleInputName}
                    onChange={(e) => setAppleInputName(e.target.value)}
                    placeholder="Brandon Medina / Cubic Club"
                    className="w-full px-4 py-3 rounded-xl bg-zinc-50 border border-zinc-200 text-xs font-semibold text-zinc-900 focus:outline-none focus:border-black focus:bg-white transition"
                  />
                </div>
              </div>

              {/* Action Button */}
              <button
                type="button"
                onClick={handleConfirmAppleLogin}
                disabled={!appleInputEmail.trim()}
                className="w-full py-4 rounded-full bg-black hover:bg-zinc-800 text-white font-black text-xs uppercase tracking-widest transition active:scale-95 shadow-xl disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Continuar con Apple ID</span>
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- AUTHENTICATION REQUIRED MODAL FOR FAVORITES & RESERVATIONS --- */}
      <AnimatePresence>
        {showAuthModalForFavorites && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1200] bg-black/65 backdrop-blur-md flex items-center justify-center p-4"
            onClick={() => setShowAuthModalForFavorites(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-md bg-zinc-900/60 backdrop-blur-2xl border border-white/20 rounded-[32px] p-8 pt-10 text-center text-white shadow-[0_25px_60px_rgba(0,0,0,0.7)] space-y-5 font-sans overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Top Close Button */}
              <button
                type="button"
                onClick={() => setShowAuthModalForFavorites(false)}
                className="absolute top-5 right-5 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition cursor-pointer"
                aria-label="Cerrar modal"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Title & Subtitle */}
              <div className="space-y-2">
                <h3 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white font-sans">
                  Iniciar sesión / Registrarse
                </h3>
                <p className="text-xs sm:text-sm text-zinc-300 font-medium leading-relaxed max-w-xs mx-auto">
                  Podrás guardar tus eventos favoritos, gestionar tus reservas y acceder a experiencias exclusivas.
                </p>
              </div>

              {/* Primary Action Button: Entrar con Google */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAuthModalForFavorites(false);
                    handleQuickSocialLogin("google");
                  }}
                  className="w-full py-4 rounded-full bg-white hover:bg-zinc-200 text-black font-black text-xs uppercase tracking-widest transition-colors shadow-xl cursor-pointer flex items-center justify-center gap-3"
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  <span>ENTRAR CON GOOGLE</span>
                </button>
              </div>

              {/* Clean Terms & Privacy Footer */}
              <p className="text-[11px] text-zinc-400 font-medium leading-relaxed max-w-xs mx-auto pt-3 border-t border-white/10">
                Al registrarte o iniciar sesión, aceptas nuestras <span className="underline text-white cursor-pointer hover:text-zinc-200">condiciones de uso</span> y <span className="underline text-white cursor-pointer hover:text-zinc-200">política de privacidad</span>.
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Co-Organizer Collaboration Modal (Consent & Unique Invite Link) */}
      <CoOrganizerModal
        isOpen={isCoOrganizerModalOpen}
        onClose={() => setIsCoOrganizerModalOpen(false)}
        eventTitle={newEventTitle || "Evento Oficial"}
        currentOrganizers={newEventCoOrganizers}
        onUpdateOrganizers={(updated) => setNewEventCoOrganizers(updated)}
      />

      {/* Interactive Map Location Picker Modal */}
      <LocationPickerModal
        isOpen={isLocationPickerOpen}
        onClose={() => setIsLocationPickerOpen(false)}
        initialVenue={newEventVenueName}
        initialAddress={newEventVenueAddress}
        onSelectLocation={(venue, address) => {
          setNewEventVenueName(venue);
          setNewEventVenueAddress(address);
        }}
      />

      {/* Unified My Account Dashboard Modal */}
      <MyAccountDashboardModal
        isOpen={isAccountDashboardOpen}
        onClose={() => setIsAccountDashboardOpen(false)}
        initialTab={accountDashboardInitialTab}
        userProfile={userProfile}
        onUpdateProfile={(updated) => setUserProfile(updated)}
        allEvents={events}
        onOpenEventDetail={(evt) => {
          if (evt?.id) {
            router.push(`/${evt.id}`);
          }
        }}
        onStartCreateEvent={() => {
          handleStartPublishEvent();
        }}
      />





      {/* ─── DYNAMIC GLASS PUSH NOTIFICATION TOAST (MINIMAL LUXURY APPLE STYLE) ─── */}
      <AnimatePresence>
        {showEventPublishedToast && (
          <motion.div
            initial={{ y: -80, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -80, opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 450, damping: 32 }}
            className="fixed top-6 inset-x-0 z-[1000] flex items-center justify-center px-4 pointer-events-none"
          >
            <div className="pointer-events-auto max-w-md w-full bg-zinc-950/90 backdrop-blur-2xl border border-white/15 text-white p-3.5 sm:p-4 rounded-2xl shadow-[0_25px_60px_rgba(0,0,0,0.7)] flex items-center gap-3.5 font-sans">
              <div className="w-9 h-9 rounded-xl bg-white text-black flex items-center justify-center shrink-0 shadow-md">
                <Check className="w-5 h-5 stroke-[2.5]" />
              </div>

              <div className="flex-1 min-w-0 text-left space-y-0.5">
                <h4 className="text-xs sm:text-sm font-black uppercase tracking-wider text-white truncate">
                  Evento publicado
                </h4>
                <p className="text-[11px] sm:text-xs text-zinc-300 font-medium truncate">
                  {lastPublishedEvent?.title || newEventTitle} ya está disponible en la cartelera.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowEventPublishedToast(false)}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-zinc-300 hover:text-white flex items-center justify-center shrink-0 transition cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <style dangerouslySetInnerHTML={{
        __html: `
        .theme-btn { background: #ffffff !important; color: #000000 !important; }
        .theme-btn:hover { background: #e4e4e7 !important; }
        .theme-text { color: #ffffff !important; }
        .theme-border { border-color: rgba(255,255,255,0.08) !important; }
        .theme-border-light { border-color: rgba(255,255,255,0.12) !important; }
        .theme-border-xlight { border-color: rgba(255,255,255,0.06) !important; }
        .theme-glow { box-shadow: 0 0 40px rgba(255,255,255,0.02) !important; }
        .theme-badge { background: #27272a !important; color: #ffffff !important; border: 1px solid rgba(255,255,255,0.1) !important; }
        .theme-tag { background: rgba(255,255,255,0.05) !important; color: #e4e4e7 !important; }
        .theme-glow-sm { box-shadow: 0 0 24px rgba(255,255,255,0.02); }
        .theme-ring { box-shadow: 0 0 28px rgba(255,255,255,0.05); }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </main>
  );
}
