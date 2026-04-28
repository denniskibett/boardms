// app/dashboard/page.tsx (Complete Role-Based with Proper Access Control)
import type { Metadata } from "next";
import React from "react";
import RecentMemos from "@/components/dashboard/RecentMemos";
import UpcomingMeetings from "@/components/meetings/UpcomingMeetings";
import ActionItems from "@/components/dashboard/ActionItems";
import WorkflowChart from "@/components/dashboard/WorkflowChart";
import WelcomeBanner from "@/components/users/WelcomeBanner";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from 'next/navigation';
import { supabaseServer } from "@/lib/supabase/server";
import {
  Gavel,
  CalendarDays,
  FileSignature,
  Users,
  ClipboardList,
  Building2,
  RotateCcw,
  FileText,
  CheckSquare,
  Scale,
  FileCheck,
  PenTool,
  Briefcase,
  FolderOpen,
  Rocket,
  BarChart3,
  Settings,
  Activity,
  Database,
  Shield,
  UserCog,
  LayoutDashboard,
  TrendingUp,
  Clock,
  Send,
  GitPullRequest,
  ListChecks,
  HardDrive,
  Heart,
  UserPlus,
  Timer,
  MapPin,
  BookOpen,
  FileStack,
  MessageSquare,
  Megaphone,
  Target,
  AlertCircle,
  CheckCircle,
  XCircle,
  PlayCircle,
  Star,
  Award,
  Crown,
  UserCheck,
  Mail,
  Phone,
  Globe,
  Link,
  MoreHorizontal,
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  Trash2,
  Edit,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Key,
  Bell,
  BellOff,
  Settings2,
  UserMinus,
  UserPlus as UserPlusIcon,
  ShieldCheck,
  ShieldAlert,
  ShieldOff,
  Server,
  Cloud,
  Wifi,
  WifiOff,
  Signal,
  Battery,
  BatteryCharging,
  Power,
  PowerOff,
  RefreshCw,
  Save,
  Printer,
  Copy,
  Cut,
  Paste,
  Undo,
  Redo,
  ZoomIn,
  ZoomOut,
  Maximize,
  Minimize,
  X,
  Menu,
  Home,
  Inbox,
  Archive,
  Trash,
  Folder,
  FolderPlus,
  File,
  FilePlus,
  FileText as FileTextIcon,
  FileSearch,
  FileCheck as FileCheckIcon,
  FileX,
  FileWarning,
  FileCode,
  FileJson,
  FileSpreadsheet,
  FileImage,
  FileVideo,
  FileAudio,
  FileArchive,
  FileKey,
  FileLock,
  FileHeart,
  FileMinus,
  FileOutput,
  FileInput,
  FileSymlink,
  FileBadge,
  FileClock,
  FileDiff,
  FileDigit,
  FileBarChart,
  FilePieChart,
  FileLineChart,
  FileStack as FileStackIcon,
  FileSpreadsheet as FileSpreadsheetIcon,
  FileTerminal,
  FileUser,
  FileVolume,
  FileWarning as FileWarningIcon,
  Files,
  FolderTree,
  FolderKanban,
  FolderCheck,
  FolderClock,
  FolderClosed,
  FolderOpen as FolderOpenIcon,
  FolderSearch,
  FolderSymlink,
  FolderX,
  Folders,
  GitBranch,
  GitCommit,
  GitFork,
  GitMerge,
  GitPullRequestArrow,
  GitPullRequestClosed,
  GitPullRequestCreate,
  GitPullRequestCreateArrow,
  GitPullRequestDraft,
  Github,
  Gitlab,
  Grip,
  GripHorizontal,
  GripVertical,
  Group,
  Hammer,
  Hand,
  HandMetal,
  HardDrive as HardDriveIcon,
  HardHat,
  Hash,
  Headphones,
  Headset,
  Heart as HeartIcon,
  HeartCrack,
  HeartHandshake,
  HeartOff,
  HeartPulse,
  HelpCircle,
  HelpingHand,
  Hexagon,
  Highlighter,
  History,
  Home as HomeIcon,
  Hospital,
  Hotel,
  Hourglass,
  House,
  IceCream,
  Image,
  Images,
  Import,
  Indent,
  IndianRupee,
  Infinity,
  Info,
  Inspect,
  Instagram,
  Italic,
  IterationCcw,
  IterationCw,
  JapaneseYen,
  Joystick,
  Key as KeyIcon,
  Keyboard,
  Laptop,
  Lasso,
  LassoSelect,
  Layers,
  Layout,
  LayoutDashboard as LayoutDashboardIcon,
  LayoutGrid,
  LayoutList,
  LayoutPanelLeft,
  LayoutPanelTop,
  LayoutTemplate,
  Leaf,
  Library,
  LifeBuoy,
  Ligature,
  Lightbulb,
  LineChart,
  Link2,
  Link2Off,
  Linkedin,
  List,
  ListChecks as ListChecksIcon,
  ListCollapse,
  ListEnd,
  ListFilter,
  ListMinus,
  ListMusic,
  ListOrdered,
  ListPlus,
  ListRestart,
  ListStart,
  ListTodo,
  ListTree,
  ListVideo,
  ListX,
  Loader,
  Loader2,
  Locate,
  LocateFixed,
  LocateOff,
  Lock as LockIcon,
  LockKeyhole,
  LockOpen,
  LogIn,
  LogOut,
  Luggage,
  Magnet,
  Mail as MailIcon,
  MailCheck,
  MailMinus,
  MailOpen,
  MailPlus,
  MailQuestion,
  MailSearch,
  MailWarning,
  MailX,
  Map,
  MapPin as MapPinIcon,
  MapPinOff,
  MapPinned,
  Maximize2,
  Maximize as MaximizeIcon,
  Medal,
  Megaphone as MegaphoneIcon,
  Meh,
  MemoryStick,
  Menu as MenuIcon,
  Merge,
  MessageCircle,
  MessageCircleCode,
  MessageCircleHeart,
  MessageCircleMore,
  MessageCircleOff,
  MessageCircleQuestion,
  MessageCircleReply,
  MessageCircleWarning,
  MessageCircleX,
  MessageSquare as MessageSquareIcon,
  MessageSquareCode,
  MessageSquareDiff,
  MessageSquareDashed,
  MessageSquareHeart,
  MessageSquareMore,
  MessageSquareOff,
  MessageSquarePlus,
  MessageSquareQuote,
  MessageSquareReply,
  MessageSquareShare,
  MessageSquareText,
  MessageSquareWarning,
  MessageSquareX,
  MessagesSquare,
  Mic,
  MicOff,
  Microscope,
  Milestone,
  Milk,
  Minimize as MinimizeIcon,
  Minimize2,
  Minus,
  Monitor,
  MonitorCheck,
  MonitorDot,
  MonitorDown,
  MonitorOff,
  MonitorPause,
  MonitorPlay,
  MonitorSmartphone,
  MonitorSpeaker,
  MonitorStop,
  MonitorUp,
  MonitorX,
  Moon,
  MoreHorizontal as MoreHorizontalIcon,
  MoreVertical,
  Mountain,
  Mouse,
  MousePointer,
  MousePointer2,
  MousePointerBan,
  MousePointerClick,
  Move,
  Move3d,
  MoveDiagonal,
  MoveDiagonal2,
  MoveDown,
  MoveDownLeft,
  MoveDownRight,
  MoveHorizontal,
  MoveLeft,
  MoveRight,
  MoveUp,
  MoveUpLeft,
  MoveUpRight,
  MoveVertical,
  Music,
  Music2,
  Music3,
  Music4,
  Navigation,
  Navigation2,
  Navigation2Off,
  NavigationOff,
  Network,
  Newspaper,
  Nfc,
  Notebook,
  NotebookPen,
  NotebookTabs,
  NotebookText,
  NotepadText,
  Nut,
  NutOff,
  Disc,
  Diamond,
  Dice1,
  Dice2,
  Dice3,
  Dice4,
  Dice5,
  Dice6,
  Dices,
  Diff,
  Disc2,
  Disc3,
  Divide,
  Dna,
  Dock,
  Dog,
  DollarSign,
  DoorClosed,
  DoorOpen,
  Dot,
  DotSquare,
  Download as DownloadIcon,
  DownloadCloud,
  DraftingCompass,
  Drama,
  Dribbble,
  Drill,
  Droplet,
  Droplets,
  Drum,
  Drumstick,
  Dumbbell,
  Ear,
  EarOff,
  Earth,
  EarthLock,
  Eclipse,
  Edit as EditIcon,
  Edit2,
  Edit3,
  Egg,
  EggFried,
  Equal,
  EqualNot,
  Eraser,
  Euro,
  Expand,
  ExternalLink,
  Eye as EyeIcon,
  EyeOff as EyeOffIcon,
  Facebook,
  Factory,
  Fan,
  FastForward,
  Feather,
  FerrisWheel,
  Figma,
  FileArchive as FileArchiveIcon,
  FileAudio as FileAudioIcon,
  FileBadge as FileBadgeIcon,
  FileBarChart as FileBarChartIcon,
  FileBox,
  FileCheck2,
  FileClock as FileClockIcon,
  FileCode as FileCodeIcon,
  FileCode2,
  FileDigit as FileDigitIcon,
  FileDown,
  FileHeart as FileHeartIcon,
  FileImage as FileImageIcon,
  FileInput as FileInputIcon,
  FileJson as FileJsonIcon,
  FileKey as FileKeyIcon,
  FileLock as FileLockIcon,
  FileMinus as FileMinusIcon,
  FileOutput as FileOutputIcon,
  FilePieChart as FilePieChartIcon,
  FilePlus as FilePlusIcon,
  FileQuestion,
  FileScan,
  FileSearch as FileSearchIcon,
  FileSignature as FileSignatureIcon,
  FileSpreadsheet as FileSpreadsheetIcon2,
  FileSymlink as FileSymlinkIcon,
  FileTerminal as FileTerminalIcon,
  FileText as FileTextIcon2,
  FileType,
  FileType2,
  FileUser as FileUserIcon,
  FileVideo as FileVideoIcon,
  FileVolume as FileVolumeIcon,
  FileWarning as FileWarningIcon2,
  FileX as FileXIcon,
  FileX2,
  Filename,
  Files as FilesIcon,
  Film,
  Filter as FilterIcon,
  FilterX,
  Fingerprint,
  FireExtinguisher,
  Fish,
  FishOff,
  Flag,
  FlagOff,
  FlagTriangleLeft,
  FlagTriangleRight,
  Flame,
  Flashlight,
  FlaskConical,
  FlaskRound,
  FlipHorizontal,
  FlipHorizontal2,
  FlipVertical,
  FlipVertical2,
  Flower,
  Flower2,
  Focus,
  FoldHorizontal,
  FoldVertical,
  Folder as FolderIcon,
  FolderArchive,
  FolderCheck as FolderCheckIcon,
  FolderClock as FolderClockIcon,
  FolderClosed as FolderClosedIcon,
  FolderCode,
  FolderDot,
  FolderDown,
  FolderGit,
  FolderGit2,
  FolderHeart,
  FolderInput,
  FolderKanban as FolderKanbanIcon,
  FolderKey,
  FolderLock,
  FolderMinus,
  FolderOpen as FolderOpenIcon2,
  FolderOutput,
  FolderPlus as FolderPlusIcon,
  FolderSearch as FolderSearchIcon,
  FolderSymlink as FolderSymlinkIcon,
  FolderSync,
  FolderTree as FolderTreeIcon,
  FolderUp,
  FolderX as FolderXIcon,
  Folders as FoldersIcon,
  Footprints,
  Forklift,
  FormInput,
  Forward,
  Frame,
  Framer,
  Frown,
  Fuel,
  FunctionSquare,
  Gamepad,
  Gamepad2,
  GanttChart,
  Gauge,
  Gavel as GavelIcon,
  Gem,
  Ghost,
  Gift,
  GitBranch as GitBranchIcon,
  GitBranchPlus,
  GitCommit as GitCommitIcon,
  GitCompare,
  GitCompareArrows,
  GitFork as GitForkIcon,
  GitGraph,
  GitMerge as GitMergeIcon,
  GitPullRequest as GitPullRequestIcon,
  GitPullRequestArrow as GitPullRequestArrowIcon,
  GitPullRequestClosed as GitPullRequestClosedIcon,
  GitPullRequestCreate as GitPullRequestCreateIcon,
  GitPullRequestCreateArrow as GitPullRequestCreateArrowIcon,
  GitPullRequestDraft as GitPullRequestDraftIcon,
  Globe as GlobeIcon,
  Globe2,
  Goal,
  Grab,
  GraduationCap,
  Grape,
  Grid,
  Grid2x2,
  Grid2x2Check,
  Grid2x2Plus,
  Grid2x2X,
  Grid3x3,
  Grip as GripIcon,
  GripHorizontal as GripHorizontalIcon,
  GripVertical as GripVerticalIcon,
  Group as GroupIcon,
  Languages,
  Laptop2,
  LassoSelect as LassoSelectIcon,
  Laugh,
  Layers2,
  Layers3,
  LayoutPanelLeft as LayoutPanelLeftIcon,
  LayoutPanelTop as LayoutPanelTopIcon,
  LayoutTemplate as LayoutTemplateIcon,
  Library as LibraryIcon,
  LibraryBig,
  LifeBuoy as LifeBuoyIcon,
  Lightbulb as LightbulbIcon,
  LineChart as LineChartIcon,
  Link,
  Link2 as Link2Icon,
  ListChecks as ListChecksIcon2,
  ListFilter as ListFilterIcon,
  ListMinus as ListMinusIcon,
  ListPlus as ListPlusIcon,
  ListTodo as ListTodoIcon,
  ListTree as ListTreeIcon,
  ListVideo as ListVideoIcon,
  ListX as ListXIcon,
  LoaderCircle,
  LoaderPinwheel,
  Locate as LocateIcon,
  LockKeyhole as LockKeyholeIcon,
  LockOpen as LockOpenIcon,
  LogIn as LogInIcon,
  LogOut as LogOutIcon,
  LucideIcon,
  LucideProps,
  LucideRef,
  Luggage as LuggageIcon,
  Magnet as MagnetIcon,
  Mail as MailIcon2,
  MailCheck as MailCheckIcon,
  MailMinus as MailMinusIcon,
  MailOpen as MailOpenIcon,
  MailPlus as MailPlusIcon,
  MailQuestion as MailQuestionIcon,
  MailSearch as MailSearchIcon,
  MailWarning as MailWarningIcon,
  MailX as MailXIcon,
  Map as MapIcon,
  MapPin as MapPinIcon2,
  MapPinOff as MapPinOffIcon,
  MapPinned as MapPinnedIcon,
  Medal as MedalIcon,
  MemoryStick as MemoryStickIcon,
  Menu as MenuIcon2,
  MenuSquare,
  MessageCircle as MessageCircleIcon,
  MessageSquare as MessageSquareIcon2,
  Microwave,
  Milestone as MilestoneIcon,
  Milk as MilkIcon,
  Minus as MinusIcon,
  MinusCircle,
  MinusSquare,
  Monitor as MonitorIcon,
  MousePointer2 as MousePointer2Icon,
  Move as MoveIcon,
  MoveDown as MoveDownIcon,
  MoveHorizontal as MoveHorizontalIcon,
  MoveLeft as MoveLeftIcon,
  MoveRight as MoveRightIcon,
  MoveUp as MoveUpIcon,
  MoveVertical as MoveVerticalIcon,
  Music as MusicIcon,
  Navigation as NavigationIcon,
  Network as NetworkIcon,
  Newspaper as NewspaperIcon,
  Octagon,
  Option,
  Orbit,
  Package,
  Package2,
  PackageCheck,
  PackageMinus,
  PackageOpen,
  PackagePlus,
  PackageSearch,
  PackageX,
  PaintBucket,
  PaintRoller,
  Palette,
  PanelsTopLeft,
  PanelsTopRight,
  Paperclip,
  Parentheses,
  ParkingCircle,
  ParkingMeter,
  ParkingSquare,
  PartyPopper,
  Pause,
  PauseCircle,
  PauseOctagon,
  PawPrint,
  PcCase,
  Pen,
  PenBox,
  PenLine,
  Pencil,
  PencilLine,
  PencilRuler,
  Pentagon,
  Percent,
  PersonStanding,
  Phone,
  PhoneCall,
  PhoneForwarded,
  PhoneIncoming,
  PhoneMissed,
  PhoneOff,
  PhoneOutgoing,
  Pi,
  Piano,
  Pickaxe,
  PictureInPicture,
  PictureInPicture2,
  PieChart,
  PiggyBank,
  Pilcrow,
  PilcrowLeft,
  PilcrowRight,
  Pill,
  PillBottle,
  Pin,
  PinOff,
  Pipette,
  Pizza,
  Plane,
  PlaneLanding,
  PlaneTakeoff,
  Play,
  PlayCircle as PlayCircleIcon,
  PlaySquare,
  Plug,
  Plug2,
  PlugZap,
  Plus as PlusIcon,
  PlusCircle,
  PlusSquare,
  Pocket,
  PocketKnife,
  Podcast,
  Pointer,
  PointerOff,
  Popcorn,
  Popsicle,
  PoundSterling,
  Power as PowerIcon,
  PowerCircle,
  PowerOff as PowerOffIcon,
  PowerSquare,
  Presentation,
  Printer as PrinterIcon,
  Projector,
  Puzzle,
  Pyramid,
  QrCode,
  Quote,
  Rabbit,
  Radar,
  Radiation,
  Radio,
  RadioReceiver,
  RadioTower,
  Radius,
  RailSymbol,
  Rainbow,
  Rat,
  Ratio,
  Receipt,
  ReceiptCent,
  ReceiptEuro,
  ReceiptIndianRupee,
  ReceiptJapaneseYen,
  ReceiptPoundSterling,
  ReceiptRussianRuble,
  ReceiptSwissFranc,
  ReceiptText,
  RectangleEllipsis,
  RectangleHorizontal,
  RectangleVertical,
  Recycle,
  Redo as RedoIcon,
  Redo2,
  RedoDot,
  RefreshCcw,
  RefreshCcwDot,
  RefreshCw as RefreshCwIcon,
  Refrigerator,
  Regex,
  RemoveFormatting,
  Repeat,
  Repeat1,
  Repeat2,
  Reply,
  ReplyAll,
  Rewind,
  Ribbon,
  Rocket as RocketIcon,
  RockingChair,
  RollerCoaster,
  Rotate3d,
  RotateCcw as RotateCcwIcon,
  RotateCw,
  Route,
  Router,
  Rows,
  Rss,
  Ruler,
  RussianRuble,
  Sailboat,
  Salad,
  Sandwich,
  Satellite,
  SatelliteDish,
  Save as SaveIcon,
  SaveAll,
  SaveOff,
  Scale as ScaleIcon,
  Scale3d,
  Scaling,
  Scan,
  ScanBarcode,
  ScanEye,
  ScanFace,
  ScanHeart,
  ScanLine,
  ScanSearch,
  ScanText,
  ScatterChart,
  School,
  Scissors,
  ScissorsLineDashed,
  ScreenShare,
  ScreenShareOff,
  Scroll,
  ScrollText,
  Search as SearchIcon,
  SearchCheck,
  SearchCode,
  SearchSlash,
  SearchX,
  Section,
  Send as SendIcon,
  SendHorizontal,
  SendToBack,
  SeparatorHorizontal,
  SeparatorVertical,
  Server as ServerIcon,
  ServerCog,
  ServerCrash,
  ServerOff,
  Settings as SettingsIcon,
  Settings2 as Settings2Icon,
  Shapes,
  Share,
  Share2,
  Sheet,
  Shell,
  Shield as ShieldIcon,
  ShieldAlert as ShieldAlertIcon,
  ShieldBan,
  ShieldCheck as ShieldCheckIcon,
  ShieldClose,
  ShieldEllipsis,
  ShieldHalf,
  ShieldMinus,
  ShieldOff as ShieldOffIcon,
  ShieldPlus,
  ShieldQuestion,
  ShieldX,
  Ship,
  ShipWheel,
  Shirt,
  ShoppingBag,
  ShoppingBasket,
  ShoppingCart,
  Shovel,
  ShowerHead,
  Shrink,
  Shrub,
  Shuffle,
  Sigma,
  Signal as SignalIcon,
  SignalHigh,
  SignalLow,
  SignalMedium,
  SignalZero,
  Signature,
  Signpost,
  SignpostBig,
  Siren,
  SkipBack,
  SkipForward,
  Skull,
  Slack,
  Slash,
  Slice,
  Sliders,
  SlidersHorizontal,
  Smartphone,
  SmartphoneCharging,
  SmartphoneNfc,
  Smile,
  SmilePlus,
  Snail,
  Snowflake,
  Sofa,
  SortAsc,
  SortDesc,
  Soup,
  Space,
  Spade,
  Sparkle,
  Sparkles,
  Speaker,
  Speech,
  SpellCheck,
  SpellCheck2,
  Spline,
  Split,
  SplitSquareHorizontal,
  SplitSquareVertical,
  SprayCan,
  Sprout,
  Square,
  SquareArrowDown,
  SquareArrowDownLeft,
  SquareArrowDownRight,
  SquareArrowLeft,
  SquareArrowOutBottomLeft,
  SquareArrowOutBottomRight,
  SquareArrowOutTopLeft,
  SquareArrowOutTopRight,
  SquareArrowRight,
  SquareArrowUp,
  SquareArrowUpLeft,
  SquareArrowUpRight,
  SquareAsterisk,
  SquareBottomDashedScissors,
  SquareChartGantt,
  SquareCheck,
  SquareCheckBig,
  SquareCode,
  SquareDashedBottom,
  SquareDashedBottomCode,
  SquareDashedMousePointer,
  SquareDivide,
  SquareDot,
  SquareEqual,
  SquareFunction,
  SquareGantt,
  SquareKanban,
  SquareLibrary,
  SquareM,
  SquareMenu,
  SquareMousePointer,
  SquareParking,
  SquareParkingOff,
  SquarePen,
  SquarePercent,
  SquarePi,
  SquarePilcrow,
  SquarePlay,
  SquarePlus,
  SquarePower,
  SquareRadical,
  SquareScissors,
  SquareSigma,
  SquareSlash,
  SquareSplitHorizontal,
  SquareSplitVertical,
  SquareSquare,
  SquareStack,
  SquareTerminal,
  SquareUser,
  SquareUserRound,
  SquareX,
  Squircle,
  Squirrel,
  Stamp,
  Star as StarIcon,
  StarHalf,
  StarOff,
  StepBack,
  StepForward,
  Stethoscope,
  Sticker,
  StickyNote,
  StopCircle,
  Store,
  StretchHorizontal,
  StretchVertical,
  Strikethrough,
  Subscript,
  Subtitles,
  Sun,
  SunDim,
  SunMedium,
  SunMoon,
  SunSnow,
  Sunrise,
  Sunset,
  Superscript,
  SwatchBook,
  SwissFranc,
  SwitchCamera,
  Sword,
  Swords,
  Syringe,
  Table,
  Table2,
  TableCellsMerge,
  TableCellsSplit,
  TableColumnsSplit,
  TableOfContents,
  TableProperties,
  TableRowsSplit,
  Tablet,
  TabletSmartphone,
  Tablets,
  Tag,
  Tags,
  Tally1,
  Tally2,
  Tally3,
  Tally4,
  Tally5,
  Tangent,
  Target as TargetIcon,
  Tent,
  TentTree,
  Terminal,
  TerminalSquare,
  TestTube,
  TestTube2,
  TestTubes,
  Text,
  TextCursor,
  TextCursorInput,
  TextQuote,
  TextSearch,
  TextSelect,
  Theater,
  Thermometer,
  ThermometerSnowflake,
  ThermometerSun,
  ThumbsDown,
  ThumbsUp,
  Ticket,
  TicketCheck,
  TicketMinus,
  TicketPercent,
  TicketPlus,
  TicketSlash,
  TicketX,
  Timer as TimerIcon,
  TimerOff,
  TimerReset,
  ToggleLeft,
  ToggleRight,
  Tornado,
  Torus,
  Touchpad,
  TouchpadOff,
  TowerControl,
  ToyBrick,
  Tractor,
  TrafficCone,
  Train,
  TrainFront,
  TrainFrontTunnel,
  TrainTrack,
  TramFront,
  Transgender,
  Trash as TrashIcon,
  Trash2 as Trash2Icon,
  TreeDeciduous,
  TreePalm,
  TreePine,
  Trees,
  Trello,
  TrendingDown,
  TrendingUp as TrendingUpIcon,
  Triangle,
  TriangleAlert,
  TriangleRight,
  Trophy,
  Truck,
  Turtle,
  Tv,
  Tv2,
  Twitch,
  Twitter,
  Type,
  TypeOutline,
  Umbrella,
  Underline,
  Undo as UndoIcon,
  Undo2,
  UndoDot,
  UnfoldHorizontal,
  UnfoldVertical,
  Ungroup,
  University,
  Unlink,
  Unlink2,
  Unlock as UnlockIcon,
  Unplug,
  Upload as UploadIcon,
  UploadCloud,
  Usb,
  User,
  User2,
  UserCheck as UserCheckIcon,
  UserCog as UserCogIcon,
  UserMinus as UserMinusIcon,
  UserPlus as UserPlusIcon2,
  UserRound,
  UserRoundCheck,
  UserRoundCog,
  UserRoundMinus,
  UserRoundPlus,
  UserRoundSearch,
  UserRoundX,
  UserSearch,
  UserX,
  Users as UsersIcon,
  UsersRound,
  Utensils,
  UtensilsCrossed,
  UtilityPole,
  Variable,
  Vault,
  Vegan,
  VenetianMask,
  Vibrate,
  VibrateOff,
  Video,
  VideoOff,
  Videotape,
  View,
  Voicemail,
  Volume,
  Volume1,
  Volume2,
  VolumeX,
  Vote,
  Wallet,
  Wallet2,
  WalletCards,
  WalletMinimal,
  WalletMinimal2,
  Wallpaper,
  Wand,
  Wand2,
  Warehouse,
  WashingMachine,
  Watch,
  Waves,
  Waypoints,
  Webcam,
  Webhook,
  Weight,
  Wheat,
  WheatOff,
  WholeWord,
  Wifi as WifiIcon,
  WifiOff as WifiOffIcon,
  Wind,
  Wine,
  WineOff,
  Workflow,
  Worm,
  WrapText,
  Wrench,
  X as XIcon,
  XCircle,
  XOctagon,
  XSquare,
  Youtube,
  Zap,
  ZapOff,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon
} from "lucide-react";

// Role-based access configuration - COMPLETE HIERARCHY
const roleAccessConfig = {
  // Executive Level
  president: {
    canSeeWelcomeBanner: true,
    canSeeMetrics: true,
    canSeeCabinetMeetings: true,
    canSeeCommitteeMeetings: false,  // President only sees cabinet meetings
    canSeeWorkflow: false,           // Too granular for president
    canSeeRecentMemos: false,        // Delegated to secretariat
    canSeeActionItems: false,        // Execution-level tasks
    canSeeAdminPanel: false,
    canSeeSecretariatPanel: false,
    canSeeLegalPanel: false,
    canSeeSystemPanel: false,
    meetingTypes: ['cabinet'],
    memoAccess: 'none',
    metricsType: 'presidential',
  },
  deputy_president: {
    canSeeWelcomeBanner: true,
    canSeeMetrics: true,
    canSeeCabinetMeetings: true,
    canSeeCommitteeMeetings: true,
    canSeeWorkflow: false,
    canSeeRecentMemos: false,
    canSeeActionItems: false,
    canSeeAdminPanel: false,
    canSeeSecretariatPanel: false,
    canSeeLegalPanel: false,
    canSeeSystemPanel: false,
    meetingTypes: ['cabinet', 'committee'],
    memoAccess: 'none',
    metricsType: 'deputy_presidential',
  },
  prime_cabinet_secretary: {
    canSeeWelcomeBanner: true,
    canSeeMetrics: true,
    canSeeCabinetMeetings: true,
    canSeeCommitteeMeetings: true,
    canSeeWorkflow: false,
    canSeeRecentMemos: true,
    canSeeActionItems: false,
    canSeeAdminPanel: false,
    canSeeSecretariatPanel: true,
    canSeeLegalPanel: false,
    canSeeSystemPanel: false,
    meetingTypes: ['cabinet', 'committee'],
    memoAccess: 'coordination',
    metricsType: 'coordination',
  },
  
  // Administrative Level
  cabinet_secretariat: {
    canSeeWelcomeBanner: true,
    canSeeMetrics: true,
    canSeeCabinetMeetings: true,
    canSeeCommitteeMeetings: true,
    canSeeWorkflow: true,
    canSeeRecentMemos: true,
    canSeeActionItems: true,
    canSeeAdminPanel: false,
    canSeeSecretariatPanel: true,
    canSeeLegalPanel: false,
    canSeeSystemPanel: false,
    meetingTypes: ['cabinet', 'committee'],
    memoAccess: 'manage',
    metricsType: 'secretariat',
  },
  attorney_general: {
    canSeeWelcomeBanner: true,
    canSeeMetrics: true,
    canSeeCabinetMeetings: true,
    canSeeCommitteeMeetings: true,
    canSeeWorkflow: false,
    canSeeRecentMemos: true,
    canSeeActionItems: false,
    canSeeAdminPanel: false,
    canSeeSecretariatPanel: false,
    canSeeLegalPanel: true,
    canSeeSystemPanel: false,
    meetingTypes: ['cabinet', 'committee'],
    memoAccess: 'legal_review',
    metricsType: 'legal',
  },
  
  // Ministry Level
  cabinet_secretary: {
    canSeeWelcomeBanner: true,
    canSeeMetrics: true,
    canSeeCabinetMeetings: true,
    canSeeCommitteeMeetings: true,
    canSeeWorkflow: true,
    canSeeRecentMemos: true,
    canSeeActionItems: true,
    canSeeAdminPanel: false,
    canSeeSecretariatPanel: false,
    canSeeLegalPanel: false,
    canSeeSystemPanel: false,
    meetingTypes: ['cabinet', 'committee'],
    memoAccess: 'ministry_only',
    metricsType: 'ministry',
  },
  principal_secretary: {
    canSeeWelcomeBanner: true,
    canSeeMetrics: true,
    canSeeCabinetMeetings: true,
    canSeeCommitteeMeetings: true,
    canSeeWorkflow: true,
    canSeeRecentMemos: true,
    canSeeActionItems: true,
    canSeeAdminPanel: false,
    canSeeSecretariatPanel: false,
    canSeeLegalPanel: false,
    canSeeSystemPanel: false,
    meetingTypes: ['cabinet', 'committee'],
    memoAccess: 'department_only',
    metricsType: 'department',
  },
  
  // Department Level
  director: {
    canSeeWelcomeBanner: true,
    canSeeMetrics: false,
    canSeeCabinetMeetings: false,
    canSeeCommitteeMeetings: true,
    canSeeWorkflow: false,
    canSeeRecentMemos: true,
    canSeeActionItems: true,
    canSeeAdminPanel: false,
    canSeeSecretariatPanel: false,
    canSeeLegalPanel: false,
    canSeeSystemPanel: false,
    meetingTypes: ['committee'],
    memoAccess: 'department_only',
    metricsType: 'none',
  },
  assistant_director: {
    canSeeWelcomeBanner: true,
    canSeeMetrics: false,
    canSeeCabinetMeetings: false,
    canSeeCommitteeMeetings: true,
    canSeeWorkflow: false,
    canSeeRecentMemos: true,
    canSeeActionItems: false,
    canSeeAdminPanel: false,
    canSeeSecretariatPanel: false,
    canSeeLegalPanel: false,
    canSeeSystemPanel: false,
    meetingTypes: ['committee'],
    memoAccess: 'department_only',
    metricsType: 'none',
  },
  
  // Operations Level
  co_officer: {
    canSeeWelcomeBanner: true,
    canSeeMetrics: true,
    canSeeCabinetMeetings: true,
    canSeeCommitteeMeetings: true,
    canSeeWorkflow: false,
    canSeeRecentMemos: true,
    canSeeActionItems: true,
    canSeeAdminPanel: false,
    canSeeSecretariatPanel: true,
    canSeeLegalPanel: false,
    canSeeSystemPanel: false,
    meetingTypes: ['cabinet', 'committee'],
    memoAccess: 'coordination',
    metricsType: 'operations',
  },
  
  // System Level
  sysadmin: {
    canSeeWelcomeBanner: true,
    canSeeMetrics: true,
    canSeeCabinetMeetings: false,
    canSeeCommitteeMeetings: false,
    canSeeWorkflow: false,
    canSeeRecentMemos: false,
    canSeeActionItems: false,
    canSeeAdminPanel: true,
    canSeeSecretariatPanel: false,
    canSeeLegalPanel: false,
    canSeeSystemPanel: true,
    meetingTypes: [],
    memoAccess: 'none',
    metricsType: 'system',
  },
  admin: {
    canSeeWelcomeBanner: true,
    canSeeMetrics: true,
    canSeeCabinetMeetings: false,
    canSeeCommitteeMeetings: false,
    canSeeWorkflow: false,
    canSeeRecentMemos: false,
    canSeeActionItems: false,
    canSeeAdminPanel: true,
    canSeeSecretariatPanel: false,
    canSeeLegalPanel: false,
    canSeeSystemPanel: false,
    meetingTypes: [],
    memoAccess: 'none',
    metricsType: 'business',
  },
};

// Role-specific dashboard headers
const roleHeaders = {
  president: {
    title: "Presidential Dashboard",
    description: "Overview of cabinet activities and presidential decisions",
    gradient: "from-purple-500 to-purple-600",
    icon: Crown,
  },
  deputy_president: {
    title: "Deputy Presidential Dashboard",
    description: "Committee oversight and decision review",
    gradient: "from-indigo-500 to-indigo-600",
    icon: UserCheck,
  },
  prime_cabinet_secretary: {
    title: "Cabinet Coordination Center",
    description: "Inter-ministerial coordination and cabinet workflow",
    gradient: "from-blue-500 to-blue-600",
    icon: GitPullRequest,
  },
  cabinet_secretariat: {
    title: "Cabinet Secretariat",
    description: "Workflow management and cabinet administration",
    gradient: "from-cyan-500 to-cyan-600",
    icon: Building2,
  },
  attorney_general: {
    title: "Attorney General's Chambers",
    description: "Legal review and constitutional compliance",
    gradient: "from-emerald-500 to-emerald-600",
    icon: Scale,
  },
  cabinet_secretary: {
    title: "Ministry Dashboard",
    description: "Your ministry's cabinet submissions and decisions",
    gradient: "from-green-500 to-green-600",
    icon: Briefcase,
  },
  principal_secretary: {
    title: "Department Dashboard",
    description: "Technical oversight and implementation tracking",
    gradient: "from-teal-500 to-teal-600",
    icon: FolderOpen,
  },
  director: {
    title: "Director's Dashboard",
    description: "Document preparation and technical review",
    gradient: "from-yellow-500 to-yellow-600",
    icon: FileText,
  },
  assistant_director: {
    title: "Assistant Director's Dashboard",
    description: "Document drafting and committee support",
    gradient: "from-orange-500 to-orange-600",
    icon: PenTool,
  },
  co_officer: {
    title: "Cabinet Operations",
    description: "Document coordination and meeting management",
    gradient: "from-amber-500 to-amber-600",
    icon: ClipboardList,
  },
  sysadmin: {
    title: "System Administration",
    description: "Technical system management and security",
    gradient: "from-red-500 to-red-600",
    icon: Server,
  },
  admin: {
    title: "Business Administration",
    description: "User management and system configuration",
    gradient: "from-rose-500 to-rose-600",
    icon: UserCog,
  },
};

// Role-specific metrics component
async function RoleMetrics({ userRole, ministryId, user }: { userRole: string; ministryId?: string; user: any }) {
  const supabase = supabaseServer();
  
  const metricsConfig: Record<string, any> = {
    presidential: async () => {
      const [pendingApprovals, cabinetMeetings, decisionsToSign] = await Promise.all([
        supabase.from('memos').select('id', { count: 'exact', head: true }).eq('status', 'pending_presidential_approval'),
        supabase.from('meetings').select('id', { count: 'exact', head: true }).eq('type', 'cabinet').gte('date', new Date().toISOString()),
        supabase.from('decisions').select('id', { count: 'exact', head: true }).eq('status', 'awaiting_signature'),
      ]);
      return [
        { label: "Pending Approvals", value: pendingApprovals.count || 0, icon: Gavel, color: "text-purple-600" },
        { label: "Cabinet Meetings", value: cabinetMeetings.count || 0, icon: CalendarDays, color: "text-purple-600" },
        { label: "Awaiting Signature", value: decisionsToSign.count || 0, icon: FileSignature, color: "text-purple-600" },
      ];
    },
    deputy_presidential: async () => {
      const [committeeMeetings, pendingReviews, activeCommittees] = await Promise.all([
        supabase.from('meetings').select('id', { count: 'exact', head: true }).eq('type', 'committee').gte('date', new Date().toISOString()),
        supabase.from('memos').select('id', { count: 'exact', head: true }).eq('status', 'pending_deputy_review'),
        supabase.from('committees').select('id', { count: 'exact', head: true }).eq('status', 'active'),
      ]);
      return [
        { label: "Committee Meetings", value: committeeMeetings.count || 0, icon: Users, color: "text-indigo-600" },
        { label: "Pending Reviews", value: pendingReviews.count || 0, icon: ClipboardList, color: "text-indigo-600" },
        { label: "Active Committees", value: activeCommittees.count || 0, icon: Building2, color: "text-indigo-600" },
      ];
    },
    coordination: async () => {
      const [cabinetMeetings, pendingCoordination, agendaItems] = await Promise.all([
        supabase.from('meetings').select('id', { count: 'exact', head: true }).eq('type', 'cabinet').gte('date', new Date().toISOString()),
        supabase.from('memos').select('id', { count: 'exact', head: true }).eq('status', 'needs_coordination'),
        supabase.from('agenda_items').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      ]);
      return [
        { label: "Cabinet Meetings", value: cabinetMeetings.count || 0, icon: CalendarDays, color: "text-blue-600" },
        { label: "Needs Coordination", value: pendingCoordination.count || 0, icon: RotateCcw, color: "text-blue-600" },
        { label: "Agenda Items", value: agendaItems.count || 0, icon: FileText, color: "text-blue-600" },
      ];
    },
    secretariat: async () => {
      const [queueLength, upcomingMeetings, pendingActions] = await Promise.all([
        supabase.from('memos').select('id', { count: 'exact', head: true }).in('status', ['submitted', 'pending_assignment']),
        supabase.from('meetings').select('id', { count: 'exact', head: true }).gte('date', new Date().toISOString()).lte('date', new Date(Date.now() + 7 * 86400000).toISOString()),
        supabase.from('action_letters').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      ]);
      return [
        { label: "Queue Length", value: queueLength.count || 0, icon: ListChecks, color: "text-cyan-600" },
        { label: "Upcoming Meetings", value: upcomingMeetings.count || 0, icon: CalendarDays, color: "text-cyan-600" },
        { label: "Pending Actions", value: pendingActions.count || 0, icon: CheckSquare, color: "text-cyan-600" },
      ];
    },
    legal: async () => {
      const [legalReviews, decisionsToCertify, opinionsDrafted] = await Promise.all([
        supabase.from('memos').select('id', { count: 'exact', head: true }).eq('requires_legal_review', true).eq('legal_review_status', 'pending'),
        supabase.from('decisions').select('id', { count: 'exact', head: true }).eq('requires_certification', true).eq('certification_status', 'pending'),
        supabase.from('legal_opinions').select('id', { count: 'exact', head: true }).eq('status', 'draft'),
      ]);
      return [
        { label: "Legal Reviews", value: legalReviews.count || 0, icon: Scale, color: "text-emerald-600" },
        { label: "To Certify", value: decisionsToCertify.count || 0, icon: FileCheck, color: "text-emerald-600" },
        { label: "Opinions Drafted", value: opinionsDrafted.count || 0, icon: PenTool, color: "text-emerald-600" },
      ];
    },
    ministry: async () => {
      const [ministryMemos, pendingActions, committeeMeetings] = await Promise.all([
        supabase.from('memos').select('id', { count: 'exact', head: true }).eq('ministry_id', ministryId),
        supabase.from('action_letters').select('id', { count: 'exact', head: true }).eq('ministry_id', ministryId).eq('status', 'pending'),
        supabase.from('meetings').select('id', { count: 'exact', head: true }).eq('type', 'committee').gte('date', new Date().toISOString()),
      ]);
      return [
        { label: "Ministry Memos", value: ministryMemos.count || 0, icon: FileText, color: "text-green-600" },
        { label: "Pending Actions", value: pendingActions.count || 0, icon: Clock, color: "text-green-600" },
        { label: "Committee Meetings", value: committeeMeetings.count || 0, icon: Users, color: "text-green-600" },
      ];
    },
    department: async () => {
      const [departmentMemos, activeProjects, reportsDue] = await Promise.all([
        supabase.from('memos').select('id', { count: 'exact', head: true }).eq('department_id', ministryId),
        supabase.from('projects').select('id', { count: 'exact', head: true }).eq('department_id', ministryId).eq('status', 'active'),
        supabase.from('reports').select('id', { count: 'exact', head: true }).eq('department_id', ministryId).eq('status', 'pending'),
      ]);
      return [
        { label: "Department Memos", value: departmentMemos.count || 0, icon: FolderOpen, color: "text-teal-600" },
        { label: "Active Projects", value: activeProjects.count || 0, icon: Rocket, color: "text-teal-600" },
        { label: "Reports Due", value: reportsDue.count || 0, icon: BarChart3, color: "text-teal-600" },
      ];
    },
    operations: async () => {
      const [documentsToProcess, meetingsToCoordinate, actionsToTrack] = await Promise.all([
        supabase.from('memos').select('id', { count: 'exact', head: true }).eq('status', 'pending_processing'),
        supabase.from('meetings').select('id', { count: 'exact', head: true }).eq('coordination_status', 'pending'),
        supabase.from('action_letters').select('id', { count: 'exact', head: true }).eq('tracking_status', 'in_progress'),
      ]);
      return [
        { label: "To Process", value: documentsToProcess.count || 0, icon: Settings, color: "text-amber-600" },
        { label: "To Coordinate", value: meetingsToCoordinate.count || 0, icon: RotateCcw, color: "text-amber-600" },
        { label: "Active Tracking", value: actionsToTrack.count || 0, icon: Activity, color: "text-amber-600" },
      ];
    },
    system: async () => {
      const [totalUsers, activeSessions, systemHealth] = await Promise.all([
        supabase.from('users').select('id', { count: 'exact', head: true }),
        supabase.from('sessions').select('id', { count: 'exact', head: true }).gte('expires', new Date().toISOString()),
        Promise.resolve({ count: 99.9 }),
      ]);
      return [
        { label: "Total Users", value: totalUsers.count || 0, icon: Users, color: "text-red-600" },
        { label: "Active Sessions", value: activeSessions.count || 0, icon: Activity, color: "text-red-600" },
        { label: "System Health", value: "99.9%", icon: Heart, color: "text-red-600" },
      ];
    },
    business: async () => {
      const [totalUsers, activeOrgs, pendingApprovals] = await Promise.all([
        supabase.from('users').select('id', { count: 'exact', head: true }),
        supabase.from('organizations').select('id', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('approvals').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      ]);
      return [
        { label: "Total Users", value: totalUsers.count || 0, icon: UserPlus, color: "text-rose-600" },
        { label: "Active Orgs", value: activeOrgs.count || 0, icon: Building2, color: "text-rose-600" },
        { label: "Pending Approvals", value: pendingApprovals.count || 0, icon: Timer, color: "text-rose-600" },
      ];
    },
  };

  const metricsFunction = metricsConfig[roleAccessConfig[userRole as keyof typeof roleAccessConfig]?.metricsType || 'none'];
  if (!metricsFunction) return null;
  
  const metrics = await metricsFunction();
  
  return (
    <div className="col-span-12 grid grid-cols-1 md:grid-cols-3 gap-4">
      {metrics.map((metric: any, idx: number) => (
        <div key={idx} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-2">
            {metric.icon && <metric.icon className={`w-8 h-8 ${metric.color}`} />}
            <div className={`text-3xl font-bold ${metric.color}`}>{metric.value}</div>
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">{metric.label}</div>
        </div>
      ))}
    </div>
  );
}

export default async function Dashboard() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect('/auth/signin');
  }

  const supabase = supabaseServer();
  
  // Fetch user data
  const { data: userData } = await supabase
    .from('users')
    .select('*')
    .eq('email', session.user.email)
    .single();

  // Fetch ministry data if applicable
  let ministryData = null;
  if (userData?.ministry_id) {
    const { data: ministry } = await supabase
      .from('ministries')
      .select('id, name, acronym')
      .eq('id', userData.ministry_id)
      .single();
    ministryData = ministry;
  }

  const user = userData || {
    id: session.user.id,
    name: session.user.name || session.user.email?.split('@')[0] || 'User',
    email: session.user.email,
    role: session.user.role || 'User',
    status: 'active',
  };

  const userRole = user.role?.toLowerCase().replace(/\s+/g, '_');
  const access = roleAccessConfig[userRole as keyof typeof roleAccessConfig] || roleAccessConfig.director;
  const header = roleHeaders[userRole as keyof typeof roleHeaders] || roleHeaders.director;
  const HeaderIcon = header.icon;

  return (
    <div className="p-6 space-y-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Welcome Banner */}
      <WelcomeBanner user={user} ministry={ministryData} />

      {/* Role-specific Header */}
      <div className={`bg-gradient-to-r ${header.gradient} rounded-xl p-6 text-white shadow-lg`}>
        <div className="flex items-center gap-3 mb-2">
          {HeaderIcon && <HeaderIcon className="w-8 h-8" />}
          <h2 className="text-2xl font-bold">{header.title}</h2>
        </div>
        <p className="opacity-90">{header.description}</p>
        {ministryData && (
          <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 bg-white/20 rounded-full text-sm">
            <Building2 className="w-4 h-4" />
            {ministryData.name} {ministryData.acronym ? `(${ministryData.acronym})` : ''}
          </div>
        )}
      </div>

      <div className="grid grid-cols-12 gap-4 md:gap-6">
        {/* Role-specific Metrics */}
        {access.canSeeMetrics && (
          <RoleMetrics userRole={userRole} ministryId={userData?.ministry_id} user={user} />
        )}

        {/* Meetings Section */}
        {(access.canSeeCabinetMeetings || access.canSeeCommitteeMeetings) && (
          <div className="col-span-12 xl:col-span-12">
            <UpcomingMeetings 
              meetingTypes={access.meetingTypes}
              userRole={userRole}
            />
          </div>
        )}

        {/* Workflow Chart - Only for administrative roles */}
        {access.canSeeWorkflow && (
          <div className="col-span-12 xl:col-span-12">
            <WorkflowChart userRole={userRole} />
          </div>
        )}

        {/* Recent Memos */}
        {access.canSeeRecentMemos && (
          <div className={`col-span-12 ${access.canSeeActionItems ? 'lg:col-span-7' : 'lg:col-span-12'}`}>
            <RecentMemos 
              accessLevel={access.memoAccess}
              ministryId={userData?.ministry_id}
              userRole={userRole}
            />
          </div>
        )}

        {/* Action Items */}
        {access.canSeeActionItems && (
          <div className="col-span-12 lg:col-span-5">
            <ActionItems 
              userRole={userRole}
              ministryId={userData?.ministry_id}
            />
          </div>
        )}

        {/* Legal Panel - Attorney General specific */}
        {access.canSeeLegalPanel && (
          <div className="col-span-12">
            <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <Scale className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                <h3 className="text-lg font-semibold text-emerald-900 dark:text-emerald-100">
                  Legal Advisory Panel
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <a href="/legal/reviews" className="group flex items-start gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg hover:shadow-md transition-all">
                  <FileSearch className="w-5 h-5 text-emerald-600 mt-0.5 group-hover:scale-110 transition-transform" />
                  <div>
                    <div className="font-medium text-gray-900 dark:text-gray-100">Legal Reviews</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Review pending legal matters</div>
                  </div>
                </a>
                <a href="/legal/certifications" className="group flex items-start gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg hover:shadow-md transition-all">
                  <FileCheck className="w-5 h-5 text-emerald-600 mt-0.5 group-hover:scale-110 transition-transform" />
                  <div>
                    <div className="font-medium">Certifications</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Legal certification required</div>
                  </div>
                </a>
                <a href="/legal/opinions" className="group flex items-start gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg hover:shadow-md transition-all">
                  <PenTool className="w-5 h-5 text-emerald-600 mt-0.5 group-hover:scale-110 transition-transform" />
                  <div>
                    <div className="font-medium">Legal Opinions</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Draft legal opinions</div>
                  </div>
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Secretariat Panel */}
        {access.canSeeSecretariatPanel && (
          <div className="col-span-12">
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <Building2 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100">
                  Secretariat Operations
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <a href="/meetings/schedule" className="group flex items-start gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg hover:shadow-md transition-all">
                  <CalendarDays className="w-5 h-5 text-blue-600 mt-0.5 group-hover:scale-110 transition-transform" />
                  <div>
                    <div className="font-medium">Schedule Meeting</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Create new cabinet meeting</div>
                  </div>
                </a>
                <a href="/memos/queue" className="group flex items-start gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg hover:shadow-md transition-all">
                  <ListChecks className="w-5 h-5 text-blue-600 mt-0.5 group-hover:scale-110 transition-transform" />
                  <div>
                    <div className="font-medium">Manage Queue</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Assign and track memos</div>
                  </div>
                </a>
                <a href="/committees" className="group flex items-start gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg hover:shadow-md transition-all">
                  <Users className="w-5 h-5 text-blue-600 mt-0.5 group-hover:scale-110 transition-transform" />
                  <div>
                    <div className="font-medium">Committees</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Oversee committees</div>
                  </div>
                </a>
                <a href="/reports" className="group flex items-start gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg hover:shadow-md transition-all">
                  <BarChart3 className="w-5 h-5 text-blue-600 mt-0.5 group-hover:scale-110 transition-transform" />
                  <div>
                    <div className="font-medium">Reports</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Generate activity reports</div>
                  </div>
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Admin Panel */}
        {access.canSeeAdminPanel && (
          <div className="col-span-12">
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <Settings className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                <h3 className="text-lg font-semibold text-yellow-900 dark:text-yellow-100">
                  Administration Panel
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <a href="/admin/users" className="group flex items-start gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg hover:shadow-md transition-all">
                  <Users className="w-5 h-5 text-yellow-600 mt-0.5 group-hover:scale-110 transition-transform" />
                  <div>
                    <div className="font-medium">User Management</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Manage system users and roles</div>
                  </div>
                </a>
                <a href="/admin/settings" className="group flex items-start gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg hover:shadow-md transition-all">
                  <Settings2 className="w-5 h-5 text-yellow-600 mt-0.5 group-hover:scale-110 transition-transform" />
                  <div>
                    <div className="font-medium">System Settings</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Configure system parameters</div>
                  </div>
                </a>
                <a href="/admin/audit" className="group flex items-start gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg hover:shadow-md transition-all">
                  <Activity className="w-5 h-5 text-yellow-600 mt-0.5 group-hover:scale-110 transition-transform" />
                  <div>
                    <div className="font-medium">Audit Logs</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">View system activity logs</div>
                  </div>
                </a>
              </div>
            </div>
          </div>
        )}

        {/* System Panel - Sysadmin only */}
        {access.canSeeSystemPanel && (
          <div className="col-span-12">
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <Server className="w-6 h-6 text-red-600 dark:text-red-400" />
                <h3 className="text-lg font-semibold text-red-900 dark:text-red-100">
                  System Administration
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <a href="/system/health" className="group flex items-start gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg hover:shadow-md transition-all">
                  <Heart className="w-5 h-5 text-red-600 mt-0.5 group-hover:scale-110 transition-transform" />
                  <div>
                    <div className="font-medium">System Health</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Monitor system status</div>
                  </div>
                </a>
                <a href="/system/backup" className="group flex items-start gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg hover:shadow-md transition-all">
                  <Database className="w-5 h-5 text-red-600 mt-0.5 group-hover:scale-110 transition-transform" />
                  <div>
                    <div className="font-medium">Backup</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Database backup management</div>
                  </div>
                </a>
                <a href="/system/logs" className="group flex items-start gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg hover:shadow-md transition-all">
                  <FileText className="w-5 h-5 text-red-600 mt-0.5 group-hover:scale-110 transition-transform" />
                  <div>
                    <div className="font-medium">System Logs</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">View detailed logs</div>
                  </div>
                </a>
                <a href="/system/security" className="group flex items-start gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg hover:shadow-md transition-all">
                  <Shield className="w-5 h-5 text-red-600 mt-0.5 group-hover:scale-110 transition-transform" />
                  <div>
                    <div className="font-medium">Security</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Security configurations</div>
                  </div>
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}