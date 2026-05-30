import { lazy, type ComponentType, type LazyExoticComponent } from 'react';
import {
  Braces,
  KeyRound,
  Binary,
  Clock,
  Hash,
  Regex,
  Fingerprint,
  GitCompare,
  Clipboard,
  Pipette,
  Camera,
  type LucideIcon,
} from 'lucide-react';

export type ToolCategory = 'encoders' | 'generators' | 'testers' | 'qa' | 'design';

export interface ToolDefinition {
  id: string;
  nameKey: string;
  descriptionKey: string;
  route: string;
  icon: LucideIcon;
  category: ToolCategory;
  isPro: boolean;
  component: LazyExoticComponent<ComponentType>;
}

const Placeholder = lazy(() => import('./_placeholder/Placeholder'));
const JsonTool = lazy(() => import('./json'));
const JwtTool = lazy(() => import('./jwt'));

export const TOOLS: ToolDefinition[] = [
  {
    id: 'json',
    nameKey: 'tools:json.name',
    descriptionKey: 'tools:json.description',
    route: '/tools/json',
    icon: Braces,
    category: 'encoders',
    isPro: false,
    component: JsonTool,
  },
  {
    id: 'jwt',
    nameKey: 'tools:jwt.name',
    descriptionKey: 'tools:jwt.description',
    route: '/tools/jwt',
    icon: KeyRound,
    category: 'encoders',
    isPro: false,
    component: JwtTool,
  },
  {
    id: 'encoders',
    nameKey: 'tools:encoders.name',
    descriptionKey: 'tools:encoders.description',
    route: '/tools/encoders',
    icon: Binary,
    category: 'encoders',
    isPro: false,
    component: Placeholder,
  },
  {
    id: 'timestamp',
    nameKey: 'tools:timestamp.name',
    descriptionKey: 'tools:timestamp.description',
    route: '/tools/timestamp',
    icon: Clock,
    category: 'encoders',
    isPro: false,
    component: Placeholder,
  },
  {
    id: 'uuid',
    nameKey: 'tools:uuid.name',
    descriptionKey: 'tools:uuid.description',
    route: '/tools/uuid',
    icon: Fingerprint,
    category: 'generators',
    isPro: false,
    component: Placeholder,
  },
  {
    id: 'regex',
    nameKey: 'tools:regex.name',
    descriptionKey: 'tools:regex.description',
    route: '/tools/regex',
    icon: Regex,
    category: 'testers',
    isPro: false,
    component: Placeholder,
  },
  {
    id: 'hash',
    nameKey: 'tools:hash.name',
    descriptionKey: 'tools:hash.description',
    route: '/tools/hash',
    icon: Hash,
    category: 'encoders',
    isPro: false,
    component: Placeholder,
  },
  {
    id: 'diff',
    nameKey: 'tools:diff.name',
    descriptionKey: 'tools:diff.description',
    route: '/tools/diff',
    icon: GitCompare,
    category: 'testers',
    isPro: false,
    component: Placeholder,
  },
  {
    id: 'clipboard',
    nameKey: 'tools:clipboard.name',
    descriptionKey: 'tools:clipboard.description',
    route: '/tools/clipboard',
    icon: Clipboard,
    category: 'qa',
    isPro: false,
    component: Placeholder,
  },
  {
    id: 'colorpicker',
    nameKey: 'tools:colorpicker.name',
    descriptionKey: 'tools:colorpicker.description',
    route: '/tools/colorpicker',
    icon: Pipette,
    category: 'design',
    isPro: false,
    component: Placeholder,
  },
  {
    id: 'screenshot',
    nameKey: 'tools:screenshot.name',
    descriptionKey: 'tools:screenshot.description',
    route: '/tools/screenshot',
    icon: Camera,
    category: 'qa',
    isPro: false,
    component: Placeholder,
  },
];

export const CATEGORY_ORDER: ToolCategory[] = ['encoders', 'generators', 'testers', 'qa', 'design'];
