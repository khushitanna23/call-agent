import {
  LayoutDashboard,
  Bot,
  PlusCircle,
  PhoneCall,
  Users,
  Calendar,
  BookOpen,
  Send,
  Zap,
  Boxes,
  Smartphone,
  BarChart3,
  Building2,
  CreditCard,
  Settings,
} from 'lucide-react';

/**
 * CANONICAL NAVIGATION SPECIFICATION
 * Both Client Dashboard and Admin Dashboard must strictly render
 * these exact same modules in this exact order with matching labels and icons.
 */
export const CANONICAL_NAV_SECTIONS = [
  {
    group: 'Overview',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, segment: 'dashboard' },
    ],
  },
  {
    group: 'AI Employees',
    items: [
      { id: 'agents', label: 'My Agents', icon: Bot, segment: 'agents' },
      { id: 'create-agent', label: 'Create Agent', icon: PlusCircle, segment: 'agents/new', badge: 'Wizard' },
    ],
  },
  {
    group: 'Communications',
    items: [
      { id: 'calls', label: 'Calls & Transcripts', icon: PhoneCall, segment: 'calls' },
      { id: 'leads', label: 'Leads CRM', icon: Users, segment: 'leads' },
      { id: 'appointments', label: 'Appointments', icon: Calendar, segment: 'appointments' },
      { id: 'knowledge', label: 'Knowledge Base', icon: BookOpen, segment: 'knowledge' },
    ],
  },
  {
    group: 'Operations',
    items: [
      { id: 'campaigns', label: 'Campaigns', icon: Send, segment: 'campaigns' },
      { id: 'automations', label: 'Automations', icon: Zap, segment: 'automations' },
      { id: 'integrations', label: 'Integrations', icon: Boxes, segment: 'integrations' },
      { id: 'phone-numbers', label: 'Phone Numbers', icon: Smartphone, segment: 'phone-numbers' },
      { id: 'analytics', label: 'Analytics', icon: BarChart3, segment: 'analytics' },
    ],
  },
  {
    group: 'Management & Account',
    items: [
      { id: 'clients', label: 'Client Management', icon: Building2, segment: 'clients' },
      { id: 'billing', label: 'Billing & Plans', icon: CreditCard, segment: 'billing' },
      { id: 'settings', label: 'Settings', icon: Settings, segment: 'settings' },
    ],
  },
];

/**
 * Helper to build navigation sections for either /client or /admin prefix.
 * @param {'client' | 'admin'} rolePrefix
 */
export const getNavSections = (rolePrefix = 'client') => {
  const prefix = rolePrefix === 'admin' ? '/admin' : '/client';
  return CANONICAL_NAV_SECTIONS.map((section) => ({
    group: section.group,
    items: section.items.map((item) => ({
      ...item,
      path: `${prefix}/${item.segment}`,
    })),
  }));
};
